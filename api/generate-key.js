const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path to storage file
const STORAGE_PATH = path.join(process.cwd(), 'data', 'api-keys.json');

/**
 * Ensure the data directory exists
 */
function ensureDataDirectory() {
  const dataDir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Read API keys from storage
 */
function readApiKeys() {
  ensureDataDirectory();
  if (!fs.existsSync(STORAGE_PATH)) {
    return {};
  }
  try {
    const data = fs.readFileSync(STORAGE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

/**
 * Write API keys to storage
 */
function writeApiKeys(keys) {
  ensureDataDirectory();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(keys, null, 2), 'utf8');
}

/**
 * Generate a secure API key
 */
function generateApiKey() {
  return 'pk_' + crypto.randomBytes(24).toString('hex');
}

/**
 * Vercel serverless function to generate API keys
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
    // Parse request body
    const { name, email, plan } = req.body;

    // Validate required fields
    if (!name || !email || !plan) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Name, email, and plan are required'
      });
    }

    // Validate plan
    if (plan !== 'free' && plan !== 'pro') {
      return res.status(400).json({
        error: 'Invalid plan',
        details: 'Plan must be either "free" or "pro"'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Read existing keys
    const apiKeys = readApiKeys();

    // Check if email already exists
    const existingKey = Object.keys(apiKeys).find(
      key => apiKeys[key].email.toLowerCase() === email.toLowerCase()
    );

    if (existingKey) {
      // Return existing key
      return res.status(200).json({
        success: true,
        message: 'API key already exists for this email',
        apiKey: existingKey,
        plan: apiKeys[existingKey].plan,
        requestsLimit: apiKeys[existingKey].plan === 'free' ? 100 : 1000,
        requestsUsed: apiKeys[existingKey].requestsUsed || 0
      });
    }

    // Generate new API key
    const apiKey = generateApiKey();
    const requestsLimit = plan === 'free' ? 100 : 1000;

    // Store API key info
    apiKeys[apiKey] = {
      name,
      email: email.toLowerCase(),
      plan,
      requestsLimit,
      requestsUsed: 0,
      createdAt: new Date().toISOString(),
      active: true
    };

    // Save to storage
    writeApiKeys(apiKeys);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      apiKey,
      plan,
      requestsLimit,
      requestsUsed: 0
    });

  } catch (error) {
    console.error('Error generating API key:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

