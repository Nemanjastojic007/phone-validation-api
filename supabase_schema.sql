-- Create api_keys table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_order_id ON api_keys(order_id);

-- Create an index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Optional: Enable Row Level Security (RLS) if you want to add security policies later
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy that allows service role to do everything
-- (Service role key bypasses RLS, but this is good practice)
CREATE POLICY IF NOT EXISTS "Service role can manage api_keys" ON api_keys
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

