# PayPal Integration Setup

## Environment Variables

Set the following environment variables in your Vercel project (or local `.env` file):

```
PAYPAL_CLIENT_ID=AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
PAYPAL_CLIENT_SECRET=EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
PAYPAL_MODE=sandbox
```

Note: Change `PAYPAL_MODE` to `live` when you're ready for production.

## Payment Flow

1. User clicks "Buy API Key" button on Pro plan
2. PayPal checkout modal opens
3. User completes payment through PayPal
4. Payment is captured via `/api/capture-paypal-order`
5. Webhook `/api/paypal-webhook` is called to generate API key
6. Success message is displayed to user with API key

## Testing

For sandbox testing, use PayPal test accounts:
- Sandbox buyer account: Create one at https://developer.paypal.com/dashboard/accounts
- Use test credentials for checkout

## Files

- `index.html` - Contains PayPal button and payment handling
- `api/create-paypal-order.js` - Creates PayPal order
- `api/capture-paypal-order.js` - Captures payment after approval
- `api/paypal-webhook.js` - Generates API key after successful payment

