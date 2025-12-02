# Quick Start Guide - What You Need to Do

## ✅ Already Done
- PayPal Client ID is configured in `index.html`
- All API endpoints are created
- Payment flow is implemented

## 📋 What You Need to Do

### Option 1: Deploy to Vercel (Recommended)

1. **Set Environment Variables in Vercel:**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add these 3 variables:

   ```
   PAYPAL_CLIENT_ID = AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
   PAYPAL_CLIENT_SECRET = EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
   PAYPAL_MODE = sandbox
   ```

2. **Deploy your code:**
   ```bash
   git add .
   git commit -m "Add PayPal integration"
   git push
   ```
   (Vercel will automatically deploy)

3. **Test the payment flow:**
   - Visit your deployed site
   - Click "Buy API Key" on the Pro plan
   - Use PayPal sandbox test credentials

---

### Option 2: Run Locally for Testing

1. **Create a `.env` file in the project root:**
   ```bash
   touch .env
   ```

2. **Add environment variables to `.env`:**
   ```
   PAYPAL_CLIENT_ID=AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
   PAYPAL_CLIENT_SECRET=EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
   PAYPAL_MODE=sandbox
   ```

3. **Run your development server** (depending on your setup):
   - If using Vercel CLI: `vercel dev`
   - If using Node.js server: Set up a local server

---

## 🧪 Testing PayPal Payments

### Using PayPal Sandbox:

1. **Create test accounts** at: https://developer.paypal.com/dashboard/accounts
   - You'll need a "Buyer" account for testing

2. **Test the flow:**
   - Click "Buy API Key" button
   - Use your PayPal sandbox buyer account to pay
   - The payment will be processed in sandbox mode (no real money)

3. **Check for API key generation:**
   - After successful payment, you should see your API key
   - It will also be stored in `data/api-keys.json`

---

## 🔄 When Ready for Production

1. **Switch PayPal to Live Mode:**
   - Update `PAYPAL_MODE` environment variable to `live`
   - Update PayPal Client ID/Secret to your LIVE credentials (not sandbox)

2. **Test thoroughly before going live!**

---

## 📝 Files You Have

- ✅ `index.html` - Landing page with PayPal button
- ✅ `api/create-paypal-order.js` - Creates PayPal order
- ✅ `api/capture-paypal-order.js` - Captures payment
- ✅ `api/paypal-webhook.js` - Generates API key after payment
- ✅ `api/generate-key.js` - Free plan API key generation
- ✅ `api/validate.js` - Phone validation endpoint

---

## ❓ Need Help?

- Check `PAYPAL_SETUP.md` for detailed setup info
- PayPal Developer Dashboard: https://developer.paypal.com/
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

