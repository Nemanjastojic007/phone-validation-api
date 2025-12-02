# 🧪 Sandbox Testing Guide

## ✅ Current Setup Status

Your PayPal integration is configured for **Sandbox Mode**:
- ✅ PayPal Client ID is set in `index.html`
- ✅ Sandbox credentials are ready
- ✅ Environment variables need to be set

## 📋 Step-by-Step Testing Setup

### Step 1: Set Environment Variables

**If deploying to Vercel:**

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these 3 variables:

```
PAYPAL_CLIENT_ID = AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
PAYPAL_CLIENT_SECRET = EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
PAYPAL_MODE = sandbox
```

5. Click **Save**
6. **Redeploy** your project (or it will auto-deploy on next git push)

**If testing locally:**

1. Create a `.env` file in your project root:
   ```bash
   touch .env
   ```

2. Add these lines to `.env`:
   ```
   PAYPAL_CLIENT_ID=AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
   PAYPAL_CLIENT_SECRET=EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
   PAYPAL_MODE=sandbox
   ```

### Step 2: Create PayPal Sandbox Test Accounts

1. Go to **PayPal Developer Dashboard**: https://developer.paypal.com/
2. Log in with your PayPal account
3. Click **Dashboard** → **Sandbox** → **Accounts**
4. Click **Create Account** button
5. Create a **Personal** account (this will be your test buyer):
   - Account Type: Personal
   - Country: Select your country
   - Click **Create**
6. You'll see test account credentials:
   - Email (e.g., `sb-xxxxx@business.example.com`)
   - Password (auto-generated)
   - Note these down for testing!

### Step 3: Test the Payment Flow

1. **Open your website** (local or deployed)
2. **Scroll to the Pro plan** card
3. **Click "Buy API Key"** button
4. You should see the PayPal checkout modal
5. **Click "Pay with PayPal"**
6. **Log in with your sandbox test account**:
   - Use the email from Step 2
   - Use the password from Step 2
7. **Complete the payment**:
   - Click "Pay Now"
   - Confirm the payment
8. **Expected Result**:
   - ✅ Payment success message appears
   - ✅ API key is generated and displayed
   - ✅ API key appears in the display card

### Step 4: Verify API Key Generation

After successful payment:

1. Check the **API key display card** - it should show:
   - Your new API key
   - Plan: Pro
   - Request Limit: 1,000
   - Status: Active

2. If running locally, check `data/api-keys.json`:
   ```bash
   cat data/api-keys.json
   ```
   You should see your API key stored with payment info.

3. **Test the API key**:
   - Copy your API key
   - Try making a validation request using the examples on the page

## 🔍 Troubleshooting

### Issue: PayPal button doesn't appear
- ✅ Check browser console for errors
- ✅ Verify PayPal Client ID is correct in `index.html`
- ✅ Make sure PayPal SDK script loaded (check Network tab)

### Issue: "Failed to create PayPal order"
- ✅ Check environment variables are set correctly
- ✅ Verify `PAYPAL_CLIENT_SECRET` is set
- ✅ Check server logs for authentication errors

### Issue: Payment succeeds but no API key
- ✅ Check browser console for webhook errors
- ✅ Verify `data/` directory exists and is writable
- ✅ Check server logs for webhook processing

### Issue: "Invalid API Key" when testing
- ✅ Make sure you're using the generated API key (not the one from validate.js)
- ✅ Check API key format starts with `pk_`

## 📝 Testing Checklist

Before considering production:

- [ ] PayPal button appears on Pro plan card
- [ ] Can open PayPal checkout modal
- [ ] Can log in with sandbox test account
- [ ] Payment completes successfully
- [ ] Success message appears
- [ ] API key is generated and displayed
- [ ] API key is stored in `data/api-keys.json`
- [ ] Can use API key to validate phone numbers
- [ ] Free plan signup still works

## 🎯 Quick Test Commands

**Test API endpoint directly:**
```bash
# Test validation endpoint (replace YOUR_API_KEY with generated key)
curl -X GET "http://localhost:3000/api/validate?phone=+1234567890&country=US" \
  -H "x-api-key: YOUR_API_KEY"
```

**Check API keys file:**
```bash
cat data/api-keys.json
```

## 💡 Tips

1. **Use multiple test accounts** to test different scenarios
2. **Test cancellation** - click cancel in PayPal to see error handling
3. **Check console logs** - browser and server logs will help debug
4. **Test free plan first** - make sure basic signup works
5. **Test on mobile** - PayPal should work on mobile devices too

## 📚 Next Steps

Once sandbox testing works perfectly:
- Review `GOING_LIVE.md` for production setup
- Get your LIVE PayPal credentials
- Switch to production mode

## 🆘 Need Help?

- PayPal Sandbox Testing: https://developer.paypal.com/docs/api-basics/sandbox/
- Check server logs for detailed error messages
- Browser console (F12) shows client-side errors

