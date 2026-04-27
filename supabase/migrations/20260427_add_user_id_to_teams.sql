-- Supabase Auth への移行マイグレーション
-- teams テーブルに user_id カラムを追加し、admin_password_hash を nullable にする

ALTER TABLE teams ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE teams ALTER COLUMN admin_password_hash DROP NOT NULL;
