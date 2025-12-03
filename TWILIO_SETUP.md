# Twilio Setup Guide

## Required Environment Variables

Add these to your Vercel project settings:

1. **TWILIO_SID** - Your Twilio Account SID
   - Get it from: https://console.twilio.com/
   - Format: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **TWILIO_AUTH_TOKEN** - Your Twilio Auth Token
   - Get it from: https://console.twilio.com/
   - Found in the same place as Account SID

3. **TWILIO_VERIFY_SERVICE** - Your Twilio Verify Service SID
   - Create one at: https://console.twilio.com/us1/develop/verify/services
   - Format: `VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step-by-Step Setup

### 1. Get Twilio Account Credentials

1. Go to https://console.twilio.com/
2. Sign up or log in
3. Copy your **Account SID** and **Auth Token** from the dashboard

### 2. Create a Verify Service

1. Go to https://console.twilio.com/us1/develop/verify/services
2. Click "Create new Verify Service"
3. Give it a name (e.g., "Phone Validation API")
4. Copy the **Service SID** (starts with `VA`)

### 3. Add to Vercel

1. Go to your Vercel project → Settings → Environment Variables
2. Add these three variables:
   - `TWILIO_SID` = Your Account SID
   - `TWILIO_AUTH_TOKEN` = Your Auth Token
   - `TWILIO_VERIFY_SERVICE` = Your Verify Service SID
3. Redeploy your project

## Testing

After setup, test the SMS verification:
- Use a real phone number in E.164 format (e.g., +1234567890)
- You should receive a 6-digit code via SMS

## Troubleshooting

**"Internal server error"** usually means:
- One or more Twilio environment variables are missing
- Twilio Verify Service SID is incorrect
- Twilio credentials are invalid

**"Invalid phone number"** means:
- Phone number is not in E.164 format
- Phone number doesn't support SMS
- Number is invalid

**"Rate limit exceeded"** means:
- You've sent too many SMS (3 per phone/hour, 10 per API key/hour)
- Wait 1 hour or use a different phone number

