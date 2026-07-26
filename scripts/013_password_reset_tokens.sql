-- ============================================================
-- パスワード再設定（忘れた場合）用トークンテーブル
-- 管理者招待(team_invites)と同じ自前トークン方式。
-- Supabase Authのメールリンク(implicitフロー)はPKCE設定の
-- ブラウザクライアントと噛み合わないため使わない。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON public.password_reset_tokens(user_id);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
-- anon/authenticated 向けポリシーは作成しない（service role専用）
