const crypto = require('crypto');
const admin = require('firebase-admin');
const { getFirestore } = require('../lib/firebase');
const { sendWelcomeEmail } = require('../lib/email');

/**
 * Generate a secure API key
 */
function generateApiKey() {
  return 'pk_' + crypto.randomBytes(24).toString('hex');
}

/**
 * Plan configuration for free plan
 */
const FREE_PLAN_CONFIG = {
  name: 'Free',
  requests: 7
};

/**
 * Check if email already has a free API key
 */
async function checkExistingFreeKey(email) {
  try {
    const db = getFirestore();
    const apiKeysRef = db.collection('api_keys');
    
    const snapshot = await apiKeysRef
      .where('email', '==', email.toLowerCase())
      .where('plan', '==', 'free')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error checking existing free key:', error);
    return null;
  }
}

/**
 * Save free API key to Firestore
 */
async function saveFreeApiKeyToFirestore(apiKey, email) {
  try {
    const db = getFirestore();
    const apiKeysRef = db.collection('api_keys');
    
    const timestamp = admin.firestore.Timestamp.now();
    const data = {
      key: apiKey,
      email: email.toLowerCase(),
      plan: 'free',
      plan_name: FREE_PLAN_CONFIG.name,
      requests_limit: FREE_PLAN_CONFIG.requests,
      requests_used: 0,
      created_at: timestamp,
      // No order_id for free plan
      order_id: null
    };

    const docRef = await apiKeysRef.add(data);
    
    return {
      id: docRef.id,
      ...data
    };
  } catch (error) {
    console.error('Error saving free API key to Firestore:', error);
    throw error;
  }
}

/**
 * Vercel serverless function to generate free API keys
 * Only requires email - no payment needed
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Check if email already has a free API key
    const existingKey = await checkExistingFreeKey(email);
    if (existingKey) {
      // Return existing key
      return res.status(200).json({
        api_key: existingKey.key,
        plan: 'free',
        requests_limit: FREE_PLAN_CONFIG.requests,
        requests_used: existingKey.requests_used || 0,
        message: 'API key already exists for this email'
      });
    }

    // Generate unique API key
    const apiKey = generateApiKey();

    // Save to Firestore
    await saveFreeApiKeyToFirestore(apiKey, email);


    // Send welcome email to user after successful API key generation
    // Email is sent to the user's email address provided in the request
    // This happens for free plan signups
    // If email sending fails, we log the error but don't break the flow
    let emailSent = false;
    let emailErrorMsg = null;
    
    console.log('=== EMAIL SENDING DEBUG ===');
    console.log('Email address:', email);
    console.log('RESEND_KEY exists:', !!process.env.RESEND_KEY);
    console.log('RESEND_KEY length:', process.env.RESEND_KEY ? process.env.RESEND_KEY.length : 0);
    console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'not set (will use default)');
    
    try {
      // Check if RESEND_KEY is configured
      if (!process.env.RESEND_KEY) {
        emailErrorMsg = 'RESEND_KEY environment variable is not set. Please configure it in Vercel to enable email sending.';
        console.error('❌ EMAIL ERROR:', emailErrorMsg);
      } else {
        console.log('✅ RESEND_KEY found, attempting to send email...');
        const emailResult = await sendWelcomeEmail(
          email,                      // User's email address
          apiKey,                     // Generated API key
          FREE_PLAN_CONFIG.name,      // Plan name ("Free")
          FREE_PLAN_CONFIG.requests, // Monthly request limit (7)
          null                        // No name for free plan
        );
        console.log('✅ Email send result:', JSON.stringify(emailResult, null, 2));
        emailSent = true;
        console.log('✅ Email sent successfully!');
      }
    } catch (emailError) {
      // Email sending failure should NOT break the flow
      // Log the error but continue to return the API key
      emailErrorMsg = emailError.message || emailError.toString() || 'Unknown error';
      console.error('❌ EMAIL SENDING FAILED');
      console.error('Error type:', emailError.constructor.name);
      console.error('Error message:', emailErrorMsg);
      console.error('Error stack:', emailError.stack);
      console.error('Full error:', JSON.stringify(emailError, Object.getOwnPropertyNames(emailError), 2));
      
      if (emailErrorMsg.includes('RESEND_KEY') || emailErrorMsg.includes('environment variable')) {
        emailErrorMsg = 'RESEND_KEY environment variable is missing. Please configure it in Vercel.';
      }
      // Continue execution - API key is still returned to the user
    }
    console.log('=== END EMAIL DEBUG ===');

    // Return API key (always return even if email sending failed)
    const response = {
      api_key: apiKey,
      plan: 'free',
      requests_limit: FREE_PLAN_CONFIG.requests,
      requests_used: 0,
      email_sent: emailSent
    };
    
    if (emailSent) {
      response.message = 'API key generated and welcome email sent successfully';
      console.log(`✅ Email sent successfully to ${email}`);
    } else {
      if (emailErrorMsg) {
        response.email_error = emailErrorMsg;
        response.message = 'API key generated successfully. Email could not be sent - see email_error for details.';
        console.error(`❌ Email failed for ${email}:`, emailErrorMsg);
      } else {
        response.message = 'API key generated successfully';
        console.log(`⚠️ Email status unknown for ${email} - email_sent is ${emailSent}`);
      }
    }
    
    console.log('Final response:', JSON.stringify(response, null, 2));
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error generating free API key:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

