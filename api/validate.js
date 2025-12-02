const { parsePhoneNumber } = require('libphonenumber-js');

/**
 * Vercel serverless function to validate phone numbers
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
module.exports = async (req, res) => {
  // Set CORS headers for API access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

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
    // Return 500 status for parsing failures
    return res.status(500).json({
      error: 'Failed to parse phone number',
      message: error.message,
      valid: false
    });
  }
};

