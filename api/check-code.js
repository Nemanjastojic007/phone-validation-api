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
 * Update OTP request status in Firestore
 */
async function updateOtpRequestStatus(phone, apiKey, status) {
  try {
    const db = getFirestore();
    const otpRequestsRef = db.collection('otp_requests');
    
    // Find the most recent sent request for this phone and API key
    const snapshot = await otpRequestsRef
      .where('phone', '==', phone)
      .where('api_key', '==', apiKey)
      .where('status', '==', 'sent')
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return false;
    }

    const doc = snapshot.docs[0];
    const timestamp = admin.firestore.Timestamp.now();

    await doc.ref.update({
      status: status,
      verified_at: status === 'verified' ? timestamp : null
    });

    return true;
  } catch (error) {
    console.error('Error updating OTP request status:', error);
    return false;
  }
}

/**
 * Vercel serverless function to verify SMS code
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

    // Extract phone number and code from request body
    const { phone, code } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: 'Missing required parameter: phone',
        message: 'Please provide a phone number in the request body'
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'Missing required parameter: code',
        message: 'Please provide a verification code in the request body'
      });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        error: 'Invalid code format',
        message: 'Verification code must be 6 digits'
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

    // Get Twilio Verify service SID
    const TWILIO_VERIFY_SERVICE = process.env.TWILIO_VERIFY_SERVICE;
    if (!TWILIO_VERIFY_SERVICE) {
      return res.status(500).json({
        error: 'Service configuration error',
        message: 'SMS verification service is not configured'
      });
    }

    // Verify code via Twilio
    const twilio = getTwilioClient();
    const verificationCheck = await twilio.verify.v2
      .services(TWILIO_VERIFY_SERVICE)
      .verificationChecks
      .create({
        to: formattedPhone,
        code: code
      });

    // Update Firestore based on verification result
    if (verificationCheck.status === 'approved') {
      await updateOtpRequestStatus(formattedPhone, apiKey, 'verified');
      
      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Verification code is correct',
        phone: formattedPhone
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid verification code',
        message: 'The verification code provided is incorrect or expired'
      });
    }

  } catch (error) {
    console.error('Error verifying code:', error);
    
    // Handle Twilio-specific errors
    if (error.code === 20404) {
      return res.status(404).json({
        error: 'Verification not found',
        message: 'No verification request found for this phone number. Please request a new code.'
      });
    }

    if (error.code === 60202) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many verification attempts. Please try again later.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify code. Please try again later.'
    });
  }
};

