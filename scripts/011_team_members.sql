-- ============================================================
-- 複数管理者対応（Issue #8）
-- profiles / team_members テーブルを新設し、1チームに複数の管理者
-- （owner/admin ロール）を持てるようにする。
--
-- 認可はRLSではなくアプリ層（lib/auth.ts）で行う方針（scripts/009参照）
-- のため、本マイグレーションでもRLSは有効化するのみでポリシーは
-- 作成しない（anon/authenticated からは deny-all、service role専用）。
--
-- Supabase SQL Editorで実行してください
-- ※ 再実行可能（IF NOT EXISTS / ON CONFLICT で冪等性を確保）
-- ============================================================

-- ============================================================
-- profiles テーブル
-- auth.users の情報をアプリ側から参照するためのミラー。
-- 招待時に「既に登録済みのメールアドレスか」を判定する用途にも使う。
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- anon/authenticated 向けポリシーは作成しない（service role専用）

-- 新規ユーザー作成時に profiles を自動生成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 既存ユーザー分の profiles をバックフィル
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- team_members テーブル
-- 1チームに複数の管理者（owner/admin）を持たせるための結合テーブル。
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON public.team_members(team_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
-- anon/authenticated 向けポリシーは作成しない（service role専用）

-- 既存チームの登録者(teams.user_id)を owner として team_members に移行
INSERT INTO public.team_members (team_id, user_id, role)
SELECT id, user_id, 'owner' FROM public.teams
WHERE user_id IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;
