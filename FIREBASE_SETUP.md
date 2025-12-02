# Firebase Firestore Setup Guide

## Overview

This project uses Firebase Cloud Firestore to store API keys instead of Supabase. All API keys are stored in the `api_keys` collection with payment verification.

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** or select an existing project
3. Follow the setup wizard to create your project
4. Enable **Firestore Database** when prompted

## Step 2: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select your preferred location
5. Click **"Enable"**

## Step 3: Create Service Account

1. Go to **Project Settings** (gear icon) → **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file - this is your service account key
4. **⚠️ Keep this file secure - never commit it to git!**

## Step 4: Set Up Environment Variables

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add this variable:

```
FIREBASE_SERVICE_ACCOUNT = {paste entire JSON content here}
```

**Important:** Paste the entire JSON content from the service account file as a single line string.

### For Local Development:

Create a `.env` file in your project root:

```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Note:** The JSON should be on a single line, or you can escape it properly.

## Step 5: Set Up Firestore Collection

The `api_keys` collection will be created automatically when the first API key is saved. 

**Collection Structure:**
- Collection name: `api_keys`
- Fields:
  - `key` (string) - The API key
  - `order_id` (string) - PayPal order ID
  - `paid_at` (timestamp) - Payment timestamp
  - `created_at` (timestamp) - Document creation timestamp

## Step 6: Set Up Firestore Security Rules (Recommended)

In Firebase Console → Firestore Database → Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow server-side writes (through Admin SDK)
    match /api_keys/{document} {
      allow read: if false;  // Disable client-side reads
      allow write: if false; // Only Admin SDK can write
    }
  }
}
```

This ensures only your serverless functions (using Admin SDK) can read/write API keys.

## Step 7: Install Dependencies

```bash
npm install
```

The `firebase-admin` package is already in `package.json`.

## Verification

After setup, test the flow:

1. Complete a PayPal payment
2. Check Firebase Console → Firestore Database
3. Verify `api_keys` collection is created
4. Verify API key document was saved with correct fields

## Troubleshooting

### Error: "FIREBASE_SERVICE_ACCOUNT environment variable is not set"
- Make sure you set the environment variable in Vercel
- For local: check your `.env` file exists and has the variable

### Error: "Failed to parse FIREBASE_SERVICE_ACCOUNT JSON"
- Make sure the JSON is valid and properly formatted
- In Vercel, paste the entire JSON as one line
- Check for any extra quotes or escaping issues

### Error: "Permission denied" in Firestore
- Check Firestore security rules
- Verify service account has proper permissions
- Make sure you're using the service account JSON (not client SDK config)

## Environment Variables Summary

```env
# Firebase
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# PayPal (existing)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
```

## Files Using Firebase

- `/lib/firebase.js` - Firebase initialization module
- `/api/paypal-webhook.js` - Saves API keys to Firestore
- `/api/validate.js` - Validates API keys from Firestore

