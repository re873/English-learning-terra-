/*
# Create app_config table for storing server-side secrets

1. New Tables
- `app_config`
  - `key` (text, primary key) — config key name (e.g. 'adscod_api_key')
  - `value` (text, not null) — the secret value
  - `created_at` (timestamptz)

2. Security
- RLS enabled. NO policies are created — this means only the service role
  (which bypasses RLS) can read/write. The anon and authenticated roles
  get zero rows, so the browser can never access these secrets.

3. Data
- Inserts the Adscod API key ('adscod_api_key' = 'adc_pub_58c682d5e89bd3078069b0aea061de90')
  so the serve-ad edge function can fetch it server-side.
*/

CREATE TABLE IF NOT EXISTS app_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

INSERT INTO app_config (key, value)
VALUES ('adscod_api_key', 'adc_pub_58c682d5e89bd3078069b0aea061de90')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
