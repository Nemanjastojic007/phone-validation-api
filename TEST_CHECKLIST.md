# ✅ Sandbox Testing Checklist

## Quick Start - 3 Steps to Test

### Step 1: Set Environment Variables ⚙️

**Choose one option:**

#### Option A: If using Vercel (Deployed)
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add these 3 variables:
   ```
   PAYPAL_CLIENT_ID = AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
   PAYPAL_CLIENT_SECRET = EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
   PAYPAL_MODE = sandbox
   ```
4. Redeploy

#### Option B: If testing locally
1. Create `.env` file in project root
2. Add these lines:
   ```
   PAYPAL_CLIENT_ID=AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
   PAYPAL_CLIENT_SECRET=EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
   PAYPAL_MODE=sandbox
   ```

### Step 2: Create PayPal Test Account 🔐

1. Go to: https://developer.paypal.com/dashboard/accounts
2. Click **"Create Account"**
3. Choose **"Personal"** account type
4. Click **"Create"**
5. **Save the email and password** - you'll use this to test payments!

### Step 3: Test the Payment! 💳

1. Open your website (local or deployed)
2. Scroll to **"Pro" plan** card
3. Click **"Buy API Key"** button
4. PayPal checkout opens → Click **"Pay with PayPal"**
5. Log in with your **sandbox test account** (from Step 2)
6. Click **"Pay Now"**
7. ✅ **Success!** You should see:
   - Success message
   - Your API key displayed
   - Plan: Pro, Limit: 1,000 requests

## ✅ What's Already Done

- ✅ PayPal Client ID configured in code
- ✅ All API endpoints created
- ✅ Payment flow implemented
- ✅ Webhook ready to generate API keys

## 🎯 You Just Need To:

1. **Set environment variables** (Step 1 above)
2. **Create test account** (Step 2 above)  
3. **Test payment** (Step 3 above)

## 📋 Testing Checklist

- [ ] Environment variables set
- [ ] PayPal sandbox test account created
- [ ] PayPal button appears on Pro plan
- [ ] Can open PayPal checkout
- [ ] Can log in with test account
- [ ] Payment completes successfully
- [ ] API key is generated and shown
- [ ] Success message appears

## 🐛 Common Issues

**Problem:** "Failed to create PayPal order"
- **Fix:** Check environment variables are set correctly

**Problem:** PayPal button doesn't show
- **Fix:** Check browser console for errors, verify Client ID is correct

**Problem:** Payment works but no API key
- **Fix:** Check server logs, verify webhook endpoint is working

## 📚 More Details

See `SANDBOX_TESTING.md` for detailed troubleshooting and testing guide.

## 🚀 Ready to Test!

Everything is configured for sandbox mode. Just set your environment variables and you're ready to test!

