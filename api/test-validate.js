const { parsePhoneNumber } = require('libphonenumber-js');

// Simple in-memory rate limiter
// Maps IP address to array of request timestamps
const rateLimitStore = new Map();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests per minute

/**
 * Check if IP has exceeded rate limit
 * @param {string} ip - IP address
 * @returns {boolean} - true if rate limit exceeded, false otherwise
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimitStore.get(ip) || [];
  
  // Filter out requests older than the rate limit window
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Check if limit exceeded
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true; // Rate limit exceeded
  }
  
  // Add current request timestamp
  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);
  
  // Clean up old entries periodically (every 100 requests to avoid overhead)
  if (rateLimitStore.size > 1000) {
    // Remove entries with no recent requests
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const hasRecent = timestamps.some(ts => now - ts < RATE_LIMIT_WINDOW);
      if (!hasRecent) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  return false; // Rate limit not exceeded
}

/**
 * Get client IP address from request
 * @param {Object} req - Request object
 * @returns {string} - IP address
 */
function getClientIP(req) {
  // Check various headers for IP address (for proxies, load balancers, etc.)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Fallback to connection remote address
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

/**
 * Vercel serverless function to validate phone numbers (public test endpoint)
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
module.exports = async (req, res) => {
  // Set CORS headers for API access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // ---------- Rate Limiting ----------
  const clientIP = getClientIP(req);
  
  if (checkRateLimit(clientIP)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Please try again later.' 
    });
  }
  // -----------------------------------

  // Extract phone number and optional country from query parameters
  const { number, country } = req.query;

  // Return 400 if number parameter is missing
  if (!number) {
    return res.status(400).json({
      error: 'Missing required parameter: number',
      valid: false
    });
  }

  try {
    // Parse the phone number
    // Try parsing without country code first
    let phoneNumber;
    try {
      phoneNumber = parsePhoneNumber(number);
    } catch (firstError) {
      // If parsing fails, try with a default country code
      // Use the provided country parameter, or default to US if not provided
      const defaultCountry = country || 'US';
      
      // Only try with default country if the number looks like it could be valid
      // (contains at least 7 digits, which is reasonable for most countries)
      const digitsOnly = number.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        try {
          phoneNumber = parsePhoneNumber(number, defaultCountry);
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
    // Return 400 status for parsing failures (invalid input)
    return res.status(400).json({
      error: 'Failed to parse phone number',
      message: error.message,
      valid: false
    });
  }
};

