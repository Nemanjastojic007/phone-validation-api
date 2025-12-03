const { parsePhoneNumber } = require('libphonenumber-js');
const { getFirestore } = require('../lib/firebase');

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
 * Vercel serverless function to validate phone numbers
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
module.exports = async (req, res) => {
  // Set CORS headers for API access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // ---------- API Key Check ----------
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key is required',
      message: 'Please provide your API key in the x-api-key header',
      valid: false 
    });
  }

  // Validate API key from Firestore
  const keyValidation = await validateApiKey(apiKey);
  
  if (!keyValidation.valid) {
    return res.status(401).json({ 
      error: 'Invalid API Key',
      message: 'The provided API key is not valid or does not exist',
      valid: false 
    });
  }
  // -----------------------------------

  // Extract phone number and optional country from query parameters
  const { phone, country } = req.query;

  // Return 400 if phone parameter is missing
  if (!phone) {
    return res.status(400).json({
      error: 'Missing required parameter: phone',
      valid: false
    });
  }

  try {
    // Parse the phone number
    // Try parsing without country code first
    let phoneNumber;
    try {
      phoneNumber = parsePhoneNumber(phone);
    } catch (firstError) {
      // If parsing fails, try with a default country code
      // Use the provided country parameter, or default to US if not provided
      const defaultCountry = country || 'US';
      
      // Only try with default country if the number looks like it could be valid
      // (contains at least 7 digits, which is reasonable for most countries)
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        try {
          phoneNumber = parsePhoneNumber(phone, defaultCountry);
        } catch (secondError) {
          // If both attempts fail, throw the original error
          throw firstError;
        }
      } else {
        // Number doesn't look like a valid phone number, throw original error
        throw firstError;
      }
    }

    // Determine if the phone number is valid
    // Use the isValid() method on the parsed phone number object
    const isValid = phoneNumber.isValid();

    // Get the formatted number (E.164 format)
    const formattedNumber = phoneNumber.format('E.164');

    // Get the ISO country code from the parsed phone number
    const detectedCountry = phoneNumber.country || 'UNKNOWN';

    // Determine the line type (mobile, landline, etc.)
    // Note: libphonenumber-js doesn't always provide type information
    // We'll use getType() if available, otherwise default to 'unknown'
    let lineType = 'unknown';
    try {
      const type = phoneNumber.getType();
      if (type) {
        // Map libphonenumber-js types to our expected values
        if (type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE') {
          lineType = 'mobile';
        } else if (type === 'FIXED_LINE') {
          lineType = 'landline';
        } else {
          lineType = 'unknown';
        }
      }
    } catch (typeError) {
      // If getType() fails, we'll keep lineType as 'unknown'
      lineType = 'unknown';
    }

    // Return successful validation response
    return res.status(200).json({
      valid: isValid,
      number: formattedNumber,
      country: detectedCountry,
      type: lineType
    });

  } catch (error) {
    // Handle parsing errors (invalid phone number format, etc.)
    // Return 400 status for invalid input
    return res.status(400).json({
      error: 'Invalid phone number format',
      message: 'Please provide a valid phone number',
      valid: false
    });
  }
};
