# 🔥 Firebase Firestore Integration

## Quick Reference

### Environment Variable Required

Set this in Vercel (Settings → Environment Variables):

```
FIREBASE_SERVICE_ACCOUNT = {paste entire service account JSON here}
```

Get your service account JSON from:
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy entire contents and paste as environment variable

### Firestore Collection

**Collection Name:** `api_keys`

**Auto-created** when first API key is saved. No manual setup needed!

**Document Structure:**
```
{
  key: "pk_abc123...",
  order_id: "5O190127TN...",
  paid_at: Timestamp,
  created_at: Timestamp
}
```

## How It Works

### `/api/paypal-webhook.js`
1. Receives `orderId` from frontend POST
2. Verifies PayPal payment
3. Checks Firestore for existing order
4. Generates API key if new order
5. Saves to Firestore `api_keys` collection
6. Returns `{ api_key: "pk_..." }`

### `/api/validate.js`
1. Gets API key from `x-api-key` header
2. Queries Firestore: `api_keys` collection where `key == apiKey`
3. Returns **401** if key not found
4. Validates phone number if key is valid
5. Returns validation results

## File Structure

```
api/
  ├── paypal-webhook.js   → Uses Firestore to save API keys
  ├── validate.js          → Uses Firestore to validate API keys
  └── ...
lib/
  └── firebase.js          → Firebase Admin SDK initialization
```

## Testing

1. **Payment Flow:**
   - Complete PayPal payment
   - Check Firestore Console → `api_keys` collection
   - Verify document created with all fields

2. **Validation:**
   - Use generated API key in request
   - Should return 401 if invalid
   - Should validate phone if valid

## Troubleshooting

**"FIREBASE_SERVICE_ACCOUNT environment variable is not set"**
→ Set it in Vercel environment variables

**"Failed to parse FIREBASE_SERVICE_ACCOUNT JSON"**
→ Make sure JSON is valid and properly formatted

**"Permission denied"**
→ Check Firestore security rules
→ Verify service account has proper permissions

