const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firestore = null;

/**
 * Initialize Firebase Admin SDK and return Firestore instance
 */
function getFirestore() {
  if (firestore) {
    return firestore;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }

    // Parse the service account JSON string
    let serviceAccount;
    try {
      serviceAccount = typeof serviceAccountJson === 'string' 
        ? JSON.parse(serviceAccountJson) 
        : serviceAccountJson;
    } catch (parseError) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ' + parseError.message);
    }

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    firestore = admin.firestore();
    return firestore;

  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

module.exports = { getFirestore };

