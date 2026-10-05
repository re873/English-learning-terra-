/*
# Remove app_config table (Adscod ad integration removal)

1. Tables Dropped
- `app_config` — stored the Adscod API key server-side. No longer needed.

2. Security
- No RLS policies to drop since the table itself is removed.
*/

DROP TABLE IF EXISTS app_config CASCADE;
