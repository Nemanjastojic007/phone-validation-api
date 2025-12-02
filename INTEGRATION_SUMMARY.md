# Supabase + PayPal Integration Summary

## ✅ What's Been Implemented

### 1. PayPal Webhook (`/api/paypal-webhook.js`)

**Features:**
- ✅ Verifies PayPal Sandbox payment using order ID
- ✅ Generates unique API key (`pk_` prefix + 48 hex characters)
- ✅ Saves to Supabase `api_keys` table
- ✅ Returns `{ api_key: '...' }` in JSON format
- ✅ Prevents duplicate orders (checks if order already exists)

**Request Format:**
```json
{
  "orderId": "5O190127TN364715T",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response Format:**
```json
{
  "api_key": "pk_abc123..."
}
```

### 2. Supabase Integration

**Table Schema (`supabase_schema.sql`):**
- `id` (UUID) - Primary key
- `key` (TEXT) - API key (unique)
- `order_id` (TEXT) - PayPal order ID (unique)
- `paid_at` (TIMESTAMPTZ) - Payment timestamp
- `created_at` (TIMESTAMPTZ) - Record creation time

**Indexes:**
- Index on `order_id` for fast lookups
- Index on `key` for fast lookups

**Security:**
- Row Level Security (RLS) enabled
- Service role policy configured

### 3. Frontend Updates

**Payment Flow:**
1. User completes PayPal payment
2. Payment is captured via `/api/capture-paypal-order`
3. Frontend calls `/api/paypal-webhook` with `orderId`
4. Webhook verifies payment and generates API key
5. API key is displayed in hidden div (becomes visible)
6. User can copy the API key

**API Key Display:**
- Hidden by default (`display: none`)
- Shows after successful payment and API key generation
- Displays API key, plan info, and request limits

## 📋 Setup Checklist

- [ ] Create Supabase project at https://supabase.com
- [ ] Run `supabase_schema.sql` in Supabase SQL Editor
- [ ] Get SupABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Supabase dashboard
- [ ] Add environment variables to Vercel:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Install dependencies: `npm install` (Supabase client already in package.json)
- [ ] Test the payment flow

## 🔄 Complete Payment Flow

```
1. User fills form → Name + Email
2. User clicks "Continue to Payment"
3. PayPal button appears
4. User completes PayPal payment
5. Frontend captures payment → /api/capture-paypal-order
6. Frontend calls webhook → /api/paypal-webhook
   ├─ Verifies payment with PayPal API
   ├─ Generates unique API key
   └─ Saves to Supabase api_keys table
7. Webhook returns → { api_key: "pk_..." }
8. Frontend displays API key in previously hidden div
```

## 🔐 Environment Variables Needed

```env
# PayPal
PAYPAL_CLIENT_ID=AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
PAYPAL_CLIENT_SECRET=EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
PAYPAL_MODE=sandbox

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 📁 Files Created/Updated

- ✅ `/api/paypal-webhook.js` - Updated with Supabase integration
- ✅ `supabase_schema.sql` - Database table schema
- ✅ `SUPABASE_SETUP.md` - Setup instructions
- ✅ `package.json` - Added `@supabase/supabase-js` dependency
- ✅ `index.html` - Updated frontend to fetch and display API key

## 🧪 Testing

1. Complete a test payment with PayPal sandbox
2. Check Supabase dashboard → Table Editor → `api_keys`
3. Verify the API key was saved correctly
4. Test using the API key in validation requests

## ⚠️ Important Notes

- Use **service_role** key, not anon key (for server-side operations)
- Never expose service_role key in client-side code
- Table has RLS enabled but service_role bypasses it
- Order IDs are unique - duplicate orders return existing API key

