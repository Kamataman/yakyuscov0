-- ============================================================
-- チーム問い合わせフォームのレート制限用テーブル（Issue #132）
-- メールアドレス・氏名・問い合わせ内容は一切保存しない。
-- IPアドレスはハッシュ化して保持し、24時間経過分は送信時に削除する。
--
-- 認可はRLSではなくアプリ層（lib/rate-limit.ts、service role経由）で
-- 行う方針のため、本マイグレーションでもRLSは有効化するのみでポリシーは
-- 作成しない（anon/authenticated からは deny-all、service role専用）。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_rate_limits_team_id_created_at_idx ON public.contact_rate_limits(team_id, created_at);
CREATE INDEX IF NOT EXISTS contact_rate_limits_ip_hash_created_at_idx ON public.contact_rate_limits(ip_hash, created_at);

ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
-- anon/authenticated 向けポリシーは作成しない（service role専用）

-- Supabase CLI経由のマイグレーションでは新規テーブルへの権限が自動付与
-- されないため明示的にGRANTする（RLSにより anon/authenticated からは
-- 引き続きアクセスできない）
GRANT ALL ON TABLE public.contact_rate_limits TO anon, authenticated, service_role;
