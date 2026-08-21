-- ============================================================
-- リアクション機能（Issue #160）
--
-- 試合への「ナイスゲーム！」を皮切りに、選手への拍手など対象を増やす
-- 想定のため、対象ごとにテーブルを分けず target_type / target_id の
-- 縦持ちで管理する。対象の追加は CHECK 制約の変更のみで済む。
--
-- ログイン不要で押せる機能のため、重複はIPアドレスのハッシュで判定する。
-- 生のIPアドレスは保存しない（contact_rate_limits と同方針）。
--
-- 認可はRLSではなくアプリ層（service role経由）で行う方針のため、
-- 本マイグレーションでもRLSは有効化するのみでポリシーは作成しない
-- （anon/authenticated からは deny-all、service role専用）。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  -- 'game'  : 試合へのリアクション
  -- 'player': 選手へのリアクション（Issue #161 で使用）
  target_type TEXT NOT NULL CHECK (target_type IN ('game', 'player')),
  -- games.id / players.id などを指す。対象テーブルが複数になるためFKは張らず、
  -- 「対象が team_id のものか」の検証はアプリ層（lib/reactions.ts）で行う。
  target_id   UUID NOT NULL,
  -- 'nice_game': 試合への「ナイスゲーム！」
  -- 'clap'     : 選手への拍手（Issue #161 で使用）
  kind        TEXT NOT NULL CHECK (kind IN ('nice_game', 'clap')),
  ip_hash     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 対象ごとの件数集計用
CREATE INDEX IF NOT EXISTS reactions_target_idx
  ON public.reactions(target_type, target_id, kind);

-- 同一IPからの重複判定用
CREATE INDEX IF NOT EXISTS reactions_target_ip_hash_idx
  ON public.reactions(target_type, target_id, kind, ip_hash, created_at);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
-- anon/authenticated 向けポリシーは作成しない（service role専用）

-- Supabase CLI経由のマイグレーションでは新規テーブルへの権限が自動付与
-- されないため明示的にGRANTする（RLSにより anon/authenticated からは
-- 引き続きアクセスできない）
GRANT ALL ON TABLE public.reactions TO anon, authenticated, service_role;
