const { parsePhoneNumber } = require('libphonenumber-js');
const admin = require('firebase-admin');
const { getFirestore } = require('../lib/firebase');

// Twilio client initialization
let twilioClient = null;

/**
 * Get or initialize Twilio client
 */
function getTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }

  const TWILIO_SID = process.env.TWILIO_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }

  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
}

/**
 * Check if API key exists in Firestore
 */
async function validateApiKey(apiKey) {
  try {
    if (!apiKey) {
      return { valid: false };
    }

    const db = getFirestore();
    const apiKeysRef = db.collection('api_keys');
    
    const snapshot = await apiKeysRef
      .where('key', '==', apiKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false };
    }

    return { 
      valid: true,
      doc: snapshot.docs[0].data()
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Check rate limits for OTP requests
 * @param {string} phone - Phone number (E.164 format)
 * @param {string} apiKey - API key
 * @returns {Object} - { allowed: boolean, reason?: string }
 */
async function checkRateLimit(phone, apiKey) {
  try {
    const db = getFirestore();
    const otpRequestsRef = db.collection('otp_requests');
    const now = admin.firestore.Timestamp.now();
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000);

    // Check per-phone rate limit (max 3 per hour)
    const phoneSnapshot = await otpRequestsRef
      .where('phone', '==', phone)
      .where('created_at', '>=', oneHourAgo)
      .where('status', '==', 'sent')
      .get();

    if (phoneSnapshot.size >= 3) {
      return { 
        allowed: false, 
        reason: 'Rate limit exceeded: Maximum 3 SMS requests per phone number per hour' 
      };
    }

    // Check per-API-key rate limit (max 10 per hour)
    const apiKeySnapshot = await otpRequestsRef
      .where('api_key', '==', apiKey)
      .where('created_at', '>=', oneHourAgo)
      .where('status', '==', 'sent')
      .get();

    if (apiKeySnapshot.size >= 10) {
      return { 
        allowed: false, 
        reason: 'Rate limit exceeded: Maximum 10 SMS requests per API key per hour' 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: false, reason: 'Error checking rate limits' };
  }
}

/**
 * Save OTP request to Firestore
 */
async function saveOtpRequest(phone, apiKey, verificationSid) {
  try {
    const db = getFirestore();
    const otpRequestsRef = db.collection('otp_requests');
    const timestamp = admin.firestore.Timestamp.now();

    const data = {
      phone: phone,
      api_key: apiKey,
      verification_sid: verificationSid,
      status: 'sent',
      created_at: timestamp,
      verified_at: null
    };

    const docRef = await otpRequestsRef.add(data);
    return docRef.id;
  } catch (error) {
    console.error('Error saving OTP request:', error);
    throw error;
  }
}

/**
 * Vercel serverless function to send SMS verification code
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
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
    // ---------- API Key Check ----------
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key is required',
        message: 'Please provide your API key in the x-api-key header'
      });
    }

    const keyValidation = await validateApiKey(apiKey);
    
    if (!keyValidation.valid) {
      return res.status(401).json({ 
        error: 'Invalid API Key',
        message: 'The provided API key is not valid or does not exist'
      });
    }
    // -----------------------------------

    // Extract phone number from request body
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: 'Missing required parameter: phone',
        message: 'Please provide a phone number in the request body'
      });
    }

    // Validate and parse phone number
    let phoneNumber;
    try {
      phoneNumber = parsePhoneNumber(phone);
      if (!phoneNumber.isValid()) {
        return res.status(400).json({
          error: 'Invalid phone number',
          message: 'Please provide a valid phone number'
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid phone number format',
        message: 'Please provide a valid phone number in E.164 format (e.g., +1234567890)'
      });
    }

    const formattedPhone = phoneNumber.format('E.164');

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(formattedPhone, apiKey);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: rateLimitCheck.reason
      });
    }

    // Get Twilio Verify service SID
    const TWILIO_VERIFY_SERVICE = process.env.TWILIO_VERIFY_SERVICE;
    if (!TWILIO_VERIFY_SERVICE) {
      return res.status(500).json({
        error: 'Service configuration error',
        message: 'SMS verification service is not configured'
      });
    }

    // Send verification code via Twilio
    const twilio = getTwilioClient();
    const verification = await twilio.verify.v2
      .services(TWILIO_VERIFY_SERVICE)
      .verifications
      .create({
        to: formattedPhone,
        channel: 'sms'
      });

    // Save OTP request to Firestore
    await saveOtpRequest(formattedPhone, apiKey, verification.sid);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      phone: formattedPhone,
      verification_sid: verification.sid
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    
    // Handle Twilio-specific errors
    if (error.code === 60200 || error.code === 60203) {
      return res.status(400).json({
        error: 'Invalid phone number',
        message: 'The phone number provided is not valid for SMS delivery'
      });
    }

    if (error.code === 20429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send verification code. Please try again later.'
    });
  }
};

