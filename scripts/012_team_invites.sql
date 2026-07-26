-- ============================================================
-- 管理者招待の独自トークン化（Issue #8 フォローアップ）
-- Supabase Authのメール招待(inviteUserByEmail)はimplicitフローでしか
-- リンクを発行できず、アプリ全体で使っているPKCE設定のクライアントと
-- 噛み合わずセッションが確立できない不具合があったため、
-- 自前の招待トークンテーブルに切り替える。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_invites_token_idx ON public.team_invites(token);
CREATE INDEX IF NOT EXISTS team_invites_team_id_idx ON public.team_invites(team_id);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
-- anon/authenticated 向けポリシーは作成しない（service role専用）
