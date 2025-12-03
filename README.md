# Phone Validation API

A production-ready Node.js API for validating phone numbers and sending SMS verification codes. Built with Vercel serverless functions, Firebase Firestore, and Twilio Verify.

## Features

- ✅ **Phone Number Validation** - Validate and format phone numbers from any country
- ✅ **SMS Verification (OTP)** - Send and verify 6-digit SMS codes using Twilio Verify
- ✅ **API Key Authentication** - Secure API key management via Firestore
- ✅ **Rate Limiting** - Built-in rate limiting for SMS verification
- ✅ **Firestore Tracking** - Complete audit trail of all API requests
- ✅ **Production Ready** - Clean error handling, input validation, and CORS support

## API Endpoints

### Phone Validation

**GET** `/api/validate`

Validates a phone number and returns formatted information.

**Headers:**
```
x-api-key: YOUR_API_KEY
```

**Query Parameters:**
- `phone` (required) - Phone number to validate
- `country` (optional) - Default country code (defaults to 'US')

**Example Request:**
```bash
curl -X GET "https://phone-validation-api.vercel.app/api/validate?phone=+1234567890&country=US" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "valid": true,
  "number": "+12345678901",
  "country": "US",
  "type": "mobile"
}
```

### SMS Verification - Send Code

**POST** `/api/send-code`

Sends a 6-digit verification code to a phone number via SMS.

**Headers:**
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

**Example Request:**
```bash
curl -X POST "https://phone-validation-api.vercel.app/api/send-code" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "phone": "+12345678901",
  "verification_sid": "VE..."
}
```

**Error Responses:**
- `400` - Invalid phone number format
- `401` - Invalid or missing API key
- `429` - Rate limit exceeded
- `500` - Internal server error

### SMS Verification - Verify Code

**POST** `/api/check-code`

Verifies a 6-digit code sent to a phone number.

**Headers:**
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+1234567890",
  "code": "123456"
}
```

**Example Request:**
```bash
curl -X POST "https://phone-validation-api.vercel.app/api/check-code" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

**Example Response (Success):**
```json
{
  "success": true,
  "verified": true,
  "message": "Verification code is correct",
  "phone": "+12345678901"
}
```

**Example Response (Failure):**
```json
{
  "success": false,
  "verified": false,
  "error": "Invalid verification code",
  "message": "The verification code provided is incorrect or expired"
}
```

**Error Responses:**
- `400` - Invalid phone number or code format
- `401` - Invalid or missing API key
- `404` - No verification request found for phone number
- `429` - Rate limit exceeded
- `500` - Internal server error

## Rate Limiting

SMS verification endpoints have the following rate limits:

- **Per Phone Number**: Maximum 3 SMS requests per hour
- **Per API Key**: Maximum 10 SMS requests per hour

When rate limit is exceeded, the API returns HTTP status `429` with an error message.

## How SMS Verification Works

1. **Send Code**: Client calls `/api/send-code` with a phone number
   - API validates the phone number format
   - Checks rate limits (per phone and per API key)
   - Sends 6-digit code via Twilio Verify
   - Records request in Firestore `otp_requests` collection

2. **Verify Code**: Client calls `/api/check-code` with phone number and code
   - API validates inputs
   - Verifies code with Twilio Verify
   - Updates Firestore record status to "verified"
   - Returns verification result

3. **Firestore Tracking**: All OTP requests are tracked with:
   - `phone` - Phone number (E.164 format)
   - `api_key` - API key used
   - `verification_sid` - Twilio verification SID
   - `status` - "sent" or "verified"
   - `created_at` - Timestamp when code was sent
   - `verified_at` - Timestamp when code was verified (null if not verified)

## Installation

```bash
npm install
```

## Dependencies

- **libphonenumber-js** - Phone number parsing and validation
- **firebase-admin** - Firebase Firestore integration
- **twilio** - Twilio Verify for SMS verification
- **resend** - Email sending service
- **axios** - HTTP client

## Environment Variables

### Required for Phone Validation

- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (stringified)

### Required for SMS Verification

- `TWILIO_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_VERIFY_SERVICE` - Twilio Verify Service SID

### Required for Email (Welcome Emails)

- `RESEND_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Sender email address (optional, defaults to onboarding@resend.dev)

### PayPal Integration (Optional)

- `PAYPAL_CLIENT_ID` - PayPal Client ID
- `PAYPAL_CLIENT_SECRET` - PayPal Client Secret
- `PAYPAL_MODE` - "live" or "sandbox" (defaults to "live")

## Vercel Configuration

Add the following environment variables in your Vercel project settings:

1. Go to your Vercel project → Settings → Environment Variables
2. Add all required variables listed above
3. For production, ensure `PAYPAL_MODE=live` and use production Twilio credentials

## Firestore Collections

### `api_keys`
Stores API keys and plan information:
- `key` - API key string
- `order_id` - PayPal order ID (null for free plan)
- `plan` - Plan type (free, starter, pro, custom)
- `plan_name` - Human-readable plan name
- `requests_limit` - Monthly request limit
- `requests_used` - Current usage count
- `created_at` - Creation timestamp
- `paid_at` - Payment timestamp (null for free plan)

### `otp_requests`
Tracks SMS verification requests:
- `phone` - Phone number (E.164 format)
- `api_key` - API key used
- `verification_sid` - Twilio verification SID
- `status` - "sent" or "verified"
- `created_at` - Request timestamp
- `verified_at` - Verification timestamp (null if not verified)

## Pricing Suggestions

### Phone Validation
- **Free Plan**: 7 validations/month
- **Starter Plan**: 250 validations/month - $12/month
- **Pro Plan**: 2,500 validations/month - $60/month
- **Custom Plan**: 5,000+ validations/month - Contact for pricing

### SMS Verification
Suggested pricing (in addition to phone validation):
- **Free Plan**: 3 SMS/month included
- **Starter Plan**: 50 SMS/month included, $0.05 per additional SMS
- **Pro Plan**: 500 SMS/month included, $0.04 per additional SMS
- **Custom Plan**: Volume pricing available

**Note**: SMS costs are typically $0.005-$0.01 per SMS via Twilio, so pricing should account for this cost plus margin.

## Code Examples

### Node.js (axios)

```javascript
const axios = require('axios');

// Send verification code
async function sendCode(phoneNumber) {
  const response = await axios.post(
    'https://phone-validation-api.vercel.app/api/send-code',
    { phone: phoneNumber },
    {
      headers: {
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Verify code
async function verifyCode(phoneNumber, code) {
  const response = await axios.post(
    'https://phone-validation-api.vercel.app/api/check-code',
    { phone: phoneNumber, code: code },
    {
      headers: {
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}
```

### JavaScript (Fetch API)

```javascript
// Send verification code
async function sendCode(phoneNumber) {
  const response = await fetch(
    'https://phone-validation-api.vercel.app/api/send-code',
    {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: phoneNumber })
    }
  );
  return await response.json();
}

// Verify code
async function verifyCode(phoneNumber, code) {
  const response = await fetch(
    'https://phone-validation-api.vercel.app/api/check-code',
    {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: phoneNumber, code: code })
    }
  );
  return await response.json();
}
```

## Development

```bash
# Run locally with Vercel CLI
npm run dev

# Or
vercel dev
```

## Production Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Ensure all environment variables are set in Vercel dashboard.

## License

ISC
