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
    // Use simple query without orderBy to avoid index requirement
    let phoneSnapshot;
    try {
      phoneSnapshot = await otpRequestsRef
        .where('phone', '==', phone)
        .where('status', '==', 'sent')
        .get();
      
      // Filter in memory for requests within last hour
      const recentPhoneRequests = phoneSnapshot.docs.filter(doc => {
        const createdAt = doc.data().created_at;
        if (!createdAt) return false;
        return createdAt.toMillis() >= oneHourAgo.toMillis();
      });

      if (recentPhoneRequests.length >= 3) {
        // Calculate when the oldest request will expire
        const timestamps = recentPhoneRequests.map(doc => doc.data().created_at.toMillis()).sort((a, b) => a - b);
        const oldestTimestamp = timestamps[0];
        const resetTime = new Date(oldestTimestamp + 60 * 60 * 1000);
        const minutesUntilReset = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 60000));
        return { 
          allowed: false, 
          reason: `Rate limit exceeded: Maximum 3 SMS requests per phone number per hour. You can try again in approximately ${minutesUntilReset} minute(s).` 
        };
      }
    } catch (queryError) {
      // If query fails, log but allow the request (don't block due to Firestore issues)
      console.error('Rate limit check error for phone:', queryError.message);
      // Continue with API key check
    }

    // Check per-API-key rate limit (max 10 per hour)
    // Use simple query without orderBy to avoid index requirement
    let apiKeySnapshot;
    try {
      apiKeySnapshot = await otpRequestsRef
        .where('api_key', '==', apiKey)
        .where('status', '==', 'sent')
        .get();
      
      // Filter in memory for requests within last hour
      const recentApiKeyRequests = apiKeySnapshot.docs.filter(doc => {
        const createdAt = doc.data().created_at;
        if (!createdAt) return false;
        return createdAt.toMillis() >= oneHourAgo.toMillis();
      });

      if (recentApiKeyRequests.length >= 10) {
        // Calculate when the oldest request will expire
        const timestamps = recentApiKeyRequests.map(doc => doc.data().created_at.toMillis()).sort((a, b) => a - b);
        const oldestTimestamp = timestamps[0];
        const resetTime = new Date(oldestTimestamp + 60 * 60 * 1000);
        const minutesUntilReset = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 60000));
        return { 
          allowed: false, 
          reason: `Rate limit exceeded: Maximum 10 SMS requests per API key per hour. You can try again in approximately ${minutesUntilReset} minute(s).` 
        };
      }
    } catch (queryError) {
      // If query fails, log but allow the request (don't block due to Firestore issues)
      console.error('Rate limit check error for API key:', queryError.message);
      // Allow the request if we can't check rate limits
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request (fail open) to avoid blocking legitimate users
    return { allowed: true };
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
      // Return detailed rate limit error with helpful message
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: rateLimitCheck.reason,
        retry_after: '1 hour'
      });
    }

    // Get Twilio Verify service SID
    const TWILIO_VERIFY_SERVICE = process.env.TWILIO_VERIFY_SERVICE;
    if (!TWILIO_VERIFY_SERVICE) {
      return res.status(500).json({
        error: 'Service configuration error',
        message: 'TWILIO_VERIFY_SERVICE environment variable is not configured. Please set it in Vercel.'
      });
    }

    // Check Twilio credentials
    const TWILIO_SID = process.env.TWILIO_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
      return res.status(500).json({
        error: 'Twilio configuration error',
        message: 'TWILIO_SID or TWILIO_AUTH_TOKEN environment variables are not configured. Please set them in Vercel.'
      });
    }

    // Send verification code via Twilio
    let twilio;
    try {
      twilio = getTwilioClient();
    } catch (twilioError) {
      return res.status(500).json({
        error: 'Twilio initialization error',
        message: twilioError.message || 'Failed to initialize Twilio client. Please check your Twilio credentials.'
      });
    }

    let verification;
    try {
      verification = await twilio.verify.v2
        .services(TWILIO_VERIFY_SERVICE)
        .verifications
        .create({
          to: formattedPhone,
          channel: 'sms'
        });
    } catch (twilioError) {
      console.error('Twilio API error:', twilioError);
      
      // Handle Twilio-specific errors
      if (twilioError.code === 60200 || twilioError.code === 60203) {
        return res.status(400).json({
          error: 'Invalid phone number',
          message: 'The phone number provided is not valid for SMS delivery. Please check the phone number format.'
        });
      }

      if (twilioError.code === 20429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests to Twilio. Please try again later.'
        });
      }

      if (twilioError.code === 20003) {
        return res.status(500).json({
          error: 'Twilio authentication error',
          message: 'Invalid Twilio credentials. Please check TWILIO_SID and TWILIO_AUTH_TOKEN in Vercel.'
        });
      }

      if (twilioError.code === 20404) {
        return res.status(500).json({
          error: 'Twilio service not found',
          message: `Twilio Verify Service ${TWILIO_VERIFY_SERVICE} not found. Please check TWILIO_VERIFY_SERVICE in Vercel.`
        });
      }

      return res.status(500).json({
        error: 'Twilio API error',
        message: twilioError.message || 'Failed to send verification code via Twilio. Please check your Twilio configuration.',
        code: twilioError.code
      });
    }

    // Save OTP request to Firestore
    try {
      await saveOtpRequest(formattedPhone, apiKey, verification.sid);
    } catch (firestoreError) {
      // Log Firestore error but don't fail the request since SMS was sent
      console.error('Error saving OTP request to Firestore:', firestoreError);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      phone: formattedPhone,
      verification_sid: verification.sid
    });

  } catch (error) {
    console.error('Unexpected error sending verification code:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

