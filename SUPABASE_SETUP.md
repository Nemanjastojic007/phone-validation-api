# Supabase Integration Setup

## Step 1: Create Supabase Account and Project

1. Go to https://supabase.com
2. Sign up or log in
3. Create a new project
4. Wait for the project to be fully provisioned

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (SUPABASE_URL)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY) - ⚠️ Keep this secret!

## Step 3: Create the Database Table

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `supabase_schema.sql`
4. Click **Run** to execute the SQL

The table will be created with the following structure:
- `id` (UUID) - Primary key
- `key` (TEXT) - The API key
- `order_id` (TEXT) - PayPal order ID
- `paid_at` (TIMESTAMPTZ) - Payment timestamp
- `created_at` (TIMESTAMPTZ) - Record creation timestamp

## Step 4: Set Environment Variables

Add these to your Vercel project (Settings → Environment Variables):

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ Important:** Use the **service_role** key, not the anon key, as this allows server-side operations.

## Step 5: Install Dependencies

The Supabase client is already added to `package.json`. Install it:

```bash
npm install
```

Or it will install automatically when you deploy to Vercel.

## Verification

The webhook function will:
1. ✅ Verify PayPal payment using order ID
2. ✅ Generate unique API key
3. ✅ Save to Supabase `api_keys` table
4. ✅ Return `{ api_key: '...' }` in JSON

## Security Notes

- The service_role key bypasses Row Level Security (RLS)
- Never expose the service_role key in client-side code
- Only use it in serverless functions/backend code
- The table has RLS enabled with a service role policy

