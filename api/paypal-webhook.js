const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path to storage file (reuse from generate-key)
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
 * Vercel serverless function to handle PayPal webhook events
 * This endpoint processes successful PayPal payments and generates API keys
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
    const event = req.body;
    let email, name, orderId;

    // Handle different payment data formats
    // Format 1: Direct payment capture data (from frontend)
    if (event.purchase_units && event.payer) {
      const purchaseUnit = event.purchase_units[0] || {};
      const payer = event.payer || {};
      
      // Extract custom data
      let customData = {};
      if (purchaseUnit.custom_id) {
        try {
          customData = typeof purchaseUnit.custom_id === 'string' 
            ? JSON.parse(purchaseUnit.custom_id) 
            : purchaseUnit.custom_id;
        } catch {
          // Ignore parse errors
        }
      }
      
      email = customData.email || event.email || payer.email_address || payer.email;
      name = customData.name || event.name || 
             `${payer.name?.given_name || ''} ${payer.name?.surname || ''}`.trim() || 
             'Customer';
      orderId = event.id || event.orderId;
    }
    // Format 2: Webhook event format
    else if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' || event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const paymentInfo = event.resource || {};
      const purchaseUnit = paymentInfo.purchase_units?.[0] || {};
      const payerInfo = paymentInfo.payer || {};
      
      let customData = {};
      if (purchaseUnit.custom_id) {
        try {
          customData = typeof purchaseUnit.custom_id === 'string' 
            ? JSON.parse(purchaseUnit.custom_id) 
            : purchaseUnit.custom_id;
        } catch {
          // Ignore parse errors
        }
      }
      
      email = customData.email || payerInfo.email_address;
      name = customData.name || 
             `${payerInfo.name?.given_name || ''} ${payerInfo.name?.surname || ''}`.trim() || 
             'Customer';
      orderId = paymentInfo.id || event.id;
    }
    // Format 3: Simple format with email/name directly
    else if (event.email) {
      email = event.email;
      name = event.name || 'Customer';
      orderId = event.orderId || event.id;
    }

    if (email) {

      // Read existing keys
      const apiKeys = readApiKeys();

      // Check if email already exists
      const existingKey = Object.keys(apiKeys).find(
        key => apiKeys[key].email.toLowerCase() === email.toLowerCase()
      );

      if (existingKey) {
        // Update existing key to Pro plan if needed
        if (apiKeys[existingKey].plan !== 'pro') {
          apiKeys[existingKey].plan = 'pro';
          apiKeys[existingKey].requestsLimit = 1000;
          apiKeys[existingKey].paymentId = orderId;
          apiKeys[existingKey].paidAt = new Date().toISOString();
          writeApiKeys(apiKeys);
        }
        
        return res.status(200).json({
          success: true,
          message: 'Payment processed successfully',
          apiKey: existingKey,
          existing: true,
          email
        });
      }

      // Generate new API key for Pro plan
      const apiKey = generateApiKey();

      // Store API key info
      apiKeys[apiKey] = {
        name: name || 'Customer',
        email: email.toLowerCase(),
        plan: 'pro',
        requestsLimit: 1000,
        requestsUsed: 0,
        createdAt: new Date().toISOString(),
        paymentId: orderId,
        paidAt: new Date().toISOString(),
        active: true
      };

      // Save to storage
      writeApiKeys(apiKeys);

      console.log(`API key generated for ${email}: ${apiKey}`);

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Payment processed and API key generated',
        apiKey,
        email
      });
    } else {
      // No email found
      console.error('No email found in payment data:', event);
      return res.status(400).json({ 
        error: 'Email not found in payment data',
        received: Object.keys(event)
      });
    }

  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

