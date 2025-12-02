# Going Live with PayPal - Production Setup Guide

## ⚠️ Important Difference

**SANDBOX** = Testing mode (no real money)
- Use for development and testing
- Credentials start with different values
- Payments are fake/test only

**LIVE** = Production mode (real money!)
- Use when real customers will pay
- Different credentials required
- Real money transactions

## 🔄 How to Switch to Live Mode

### Step 1: Get Your LIVE PayPal Credentials

1. Go to **PayPal Developer Dashboard**: https://developer.paypal.com/
2. Log in with your PayPal business account
3. Navigate to **My Apps & Credentials**
4. Switch from **Sandbox** to **Live** (toggle at top right)
5. Create a new app or use existing one
6. Copy your **LIVE** credentials:
   - **Client ID** (starts with different prefix)
   - **Client Secret** (different from sandbox)

### Step 2: Update Environment Variables

In your Vercel project or `.env` file, update:

```env
PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_LIVE_CLIENT_SECRET_HERE
PAYPAL_MODE=live
```

### Step 3: Update HTML File

Update `index.html` line 8 and line 791 with your **LIVE Client ID**:

```html
<!-- Line 8 - PayPal SDK -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_LIVE_CLIENT_ID&currency=USD"></script>

<!-- Line 791 - JavaScript variable -->
const PAYPAL_CLIENT_ID = 'YOUR_LIVE_CLIENT_ID';
```

### Step 4: Test Thoroughly!

**Before going live, test:**
- ✅ Payment flow works
- ✅ API keys generate correctly
- ✅ Webhook processes payments
- ✅ Error handling works
- ✅ Customer support process

## 🎯 Current Status

You currently have:
- ✅ Sandbox Client ID (in `index.html`)
- ✅ Sandbox Client Secret (set as environment variable)

To go live, you need:
- ❌ **LIVE Client ID** (different from sandbox)
- ❌ **LIVE Client Secret** (different from sandbox)
- ❌ Change `PAYPAL_MODE` to `live`

## ⚡ Quick Checklist for Going Live

- [ ] Get LIVE credentials from PayPal Developer Dashboard
- [ ] Update `PAYPAL_CLIENT_ID` in `index.html` (2 places)
- [ ] Update `PAYPAL_CLIENT_SECRET` environment variable
- [ ] Change `PAYPAL_MODE` to `live`
- [ ] Test with a small real payment first
- [ ] Monitor payments in PayPal dashboard
- [ ] Set up proper error logging
- [ ] Have a plan for customer support

## 🔐 Security Reminder

- ✅ Never commit LIVE credentials to git
- ✅ Use environment variables for secrets
- ✅ Keep sandbox and live credentials separate
- ✅ Test in sandbox before going live

## 📞 Need Help?

- PayPal Support: https://www.paypal.com/support
- PayPal Developer Docs: https://developer.paypal.com/docs/

