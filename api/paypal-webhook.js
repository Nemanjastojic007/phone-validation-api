const crypto = require('crypto');
const admin = require('firebase-admin');
const { getFirestore } = require('../lib/firebase');

/**
 * Generate a secure API key
 */
function generateApiKey() {
  return 'pk_' + crypto.randomBytes(24).toString('hex');
}

/**
 * Verify PayPal payment using order ID
 */
async function verifyPayPalPayment(orderId) {
  try {
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_MODE = process.env.PAYPAL_MODE || 'live';
    
    const paypalBaseUrl = PAYPAL_MODE === 'live' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with PayPal');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Get order details to verify payment
    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to verify PayPal order');
    }

    const orderData = await orderResponse.json();
    
    // Check if payment is completed
    if (orderData.status === 'COMPLETED' || orderData.status === 'APPROVED') {
      return {
        verified: true,
        orderData: orderData
      };
    }

    return {
      verified: false,
      status: orderData.status
    };

  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    throw error;
  }
}

/**
 * Check if order ID already exists in Firestore
 */
async function checkExistingOrder(orderId) {
  try {
    const db = getFirestore();
    const apiKeysRef = db.collection('api_keys');
    
    const snapshot = await apiKeysRef
      .where('order_id', '==', orderId)
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
    console.error('Error checking existing order:', error);
    return null;
  }
}

/**
 * Save API key to Firestore
 */
async function saveApiKeyToFirestore(apiKey, orderId, plan = 'standard') {
  try {
    const db = getFirestore();
    const apiKeysRef = db.collection('api_keys');
    
    // Plan configuration
    const plans = {
      standard: {
        name: 'Standard',
        requests: 1000
      },
      pro: {
        name: 'Pro',
        requests: 10000
      }
    };

    const selectedPlan = plans[plan] || plans.standard;
    
    const timestamp = admin.firestore.Timestamp.now();
    const data = {
      key: apiKey,
      order_id: orderId,
      plan: plan,
      plan_name: selectedPlan.name,
      requests_limit: selectedPlan.requests,
      requests_used: 0,
      paid_at: timestamp,
      created_at: timestamp
    };

    const docRef = await apiKeysRef.add(data);
    
    return {
      id: docRef.id,
      ...data
    };
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

/**
 * Vercel serverless function to handle PayPal webhook events
 * Verifies payment and generates API key stored in Firestore
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
    const { orderId, email, name, plan } = req.body;

    // Validate required fields
    if (!orderId) {
      return res.status(400).json({ 
        error: 'Order ID is required',
        received: Object.keys(req.body)
      });
    }

    // Check if we already processed this order
    const existingRecord = await checkExistingOrder(orderId);
    if (existingRecord) {
      return res.status(200).json({
        api_key: existingRecord.key
      });
    }

    // Verify PayPal payment
    const verification = await verifyPayPalPayment(orderId);
    
    if (!verification.verified) {
      return res.status(400).json({
        error: 'Payment not verified',
        status: verification.status,
        message: 'Order status is not COMPLETED or APPROVED'
      });
    }

    // Extract plan from PayPal order or use provided plan
    let finalPlan = plan || 'standard';
    try {
      const orderData = verification.orderData;
      if (orderData?.purchase_units?.[0]?.custom_id) {
        const customData = JSON.parse(orderData.purchase_units[0].custom_id);
        if (customData.plan) {
          finalPlan = customData.plan;
        }
      }
    } catch (e) {
      console.log('Could not extract plan from PayPal order, using provided/default plan');
    }

    // Generate unique API key
    const apiKey = generateApiKey();

    // Save to Firestore
    await saveApiKeyToFirestore(apiKey, orderId, finalPlan);

    console.log(`API key generated and saved for order ${orderId} (plan: ${finalPlan}): ${apiKey}`);

    // Return API key
    return res.status(200).json({
      api_key: apiKey
    });

  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
