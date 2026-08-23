-- ============================================================
-- 試合ページの閲覧数カウンタ（Issue #162）
--
-- 集計値は games.view_count に持ち、専用の集計テーブルは作らない。
-- 試合が削除されれば行ごと消えるため、孤児レコードの後始末が不要になる。
--
-- 同一IPからの連続閲覧を30分デデュープするため、判定用の短命なテーブル
-- のみを追加する。生のIPアドレスは保存せずハッシュで判定する
-- （contact_rate_limits / reactions と同方針）。
--
-- 認可はRLSではなくアプリ層（service role経由）で行う方針のため、
-- RLSは有効化するのみでポリシーは作成しない
-- （anon/authenticated からは deny-all、service role専用）。
-- ============================================================

ALTER TABLE public.games
  ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;

-- 重複判定用。30分より古い行は加算時に削除するため行数は伸び続けない。
CREATE TABLE IF NOT EXISTS public.view_dedup (
  -- 将来の対象追加（選手ページなど）に備えて縦持ちにする（reactions と同方針）
  target_type TEXT NOT NULL CHECK (target_type IN ('game')),
  -- games.id を指す。対象テーブルが複数になるためFKは張らず、
  -- 「対象が team_id のものか」の検証は increment_game_view 側で行う。
  target_id   UUID NOT NULL,
  ip_hash     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (target_type, target_id, ip_hash)
);

-- 古い行の掃除用
CREATE INDEX IF NOT EXISTS view_dedup_created_at_idx
  ON public.view_dedup(created_at);

ALTER TABLE public.view_dedup ENABLE ROW LEVEL SECURITY;
-- anon/authenticated 向けポリシーは作成しない（service role専用）

-- Supabase CLI経由のマイグレーションでは新規テーブルへの権限が自動付与
-- されないため明示的にGRANTする（RLSにより anon/authenticated からは
-- 引き続きアクセスできない）
GRANT ALL ON TABLE public.view_dedup TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 閲覧数の加算
--
-- 「デデュープ行のUPSERT → 新規だった場合のみインクリメント」を1関数に
-- 閉じることで、同時アクセス時の競合で数字が飛ぶのを避ける。
--
-- 戻り値は (view_count, counted) の1行。
--   counted = true : 加算した
--   counted = false: 30分以内に同一IPからの閲覧が記録済みで加算しなかった
-- 対象が存在しない、または指定チームのものでない場合は0行を返す。
-- ------------------------------------------------------------

-- 戻り値の型を変えるため CREATE OR REPLACE では置き換えられない
DROP FUNCTION IF EXISTS public.increment_game_view(TEXT, UUID, TEXT);

CREATE FUNCTION public.increment_game_view(
  p_team_id TEXT,
  p_game_id UUID,
  p_ip_hash TEXT
)
RETURNS TABLE (view_count BIGINT, counted BOOLEAN)
LANGUAGE plpgsql
-- SECURITY DEFINER にはしない。呼び出し元は service role のみのため動作は変わらず、
-- 万一 EXECUTE 権限が再付与されても各テーブルのRLSが最後の砦として残る。
SET search_path = public
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- 対象がそのチームの試合かを検証しつつ現在値を取得する
  -- （OUTパラメータ view_count と列名が衝突するため列参照は必ず修飾する）
  SELECT g.view_count INTO v_count
    FROM public.games g
   WHERE g.id = p_game_id AND g.team_id = p_team_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 加算のついでに期限切れの判定行を掃除する（定期実行の仕組みに依存しない）
  DELETE FROM public.view_dedup
   WHERE created_at < now() - INTERVAL '30 minutes';

  INSERT INTO public.view_dedup (target_type, target_id, ip_hash)
  VALUES ('game', p_game_id, p_ip_hash)
  ON CONFLICT (target_type, target_id, ip_hash) DO NOTHING;

  -- 30分以内に同一IPからの閲覧が記録済みなら加算しない
  IF NOT FOUND THEN
    RETURN QUERY SELECT v_count, false;
    RETURN;
  END IF;

  UPDATE public.games
     SET view_count = public.games.view_count + 1
   WHERE id = p_game_id
   RETURNING public.games.view_count INTO v_count;

  RETURN QUERY SELECT v_count, true;
END;
$$;

-- 20260725040947_grant_client_roles.sql の
-- ALTER DEFAULT PRIVILEGES ... GRANT ALL ON FUNCTIONS TO ... anon ... により、
-- GRANT を書かなくても anon/authenticated に EXECUTE が付いてしまう。
-- この関数は閲覧数を書き込むため、公開されている anon キーで PostgREST から
-- 直接呼べると p_ip_hash を偽装して閲覧数を水増しできる。
-- 呼び出しは service role 経由（lib/view-counts.ts）のみのため明示的に剥がす。
REVOKE ALL ON FUNCTION public.increment_game_view(TEXT, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.increment_game_view(TEXT, UUID, TEXT) TO service_role;
