-- ============================================================
-- Supabase セキュリティアドバイザー rls_disabled_in_public 対応
--
-- 本番DBを調査した結果、以下の2テーブルで RLS が無効化されていた:
--   - pitcher_inning_stats: 20260503122522_enable_rls_all_tables.sql の
--     対象漏れで、そもそも一度も RLS が有効化されていなかった
--   - teams: migration 履歴上は 20260427134148_supabase_auth.sql で
--     有効化済みのはずだが、本番では rowsecurity = false かつポリシーも
--     0件だった（migration外の手動操作で無効化されたと推測される）
--
-- どちらのテーブルも .from() でのアクセスは createServiceClient()
-- （service_role、RLSバイパス）経由に一本化されており、クライアントから
-- 直接読み書きする経路は存在しない。よって
-- 20260725040946_deny_all_client_rls.sql と同じ方針（RLS有効化のみ、
-- ポリシーは作成しない = deny all）で対応する。
-- ============================================================
ALTER TABLE public.pitcher_inning_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
