-- ============================================================
-- 全テーブルのRLS有効化
-- Supabase SQL Editorで実行してください
-- ※ 再実行可能（DROP POLICY IF EXISTS で冪等性を確保）
-- ============================================================

-- ============================================================
-- ヘルパー関数: ゲームに有効な共有トークンが存在するか確認
-- SECURITY DEFINER により game_share_tokens の RLS をバイパスして参照する
-- ============================================================
CREATE OR REPLACE FUNCTION public.game_has_valid_share_token(p_game_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_share_tokens
    WHERE game_id = p_game_id
      AND expires_at > NOW()
  );
$$;

-- ============================================================
-- games テーブル
-- SELECT: 全員公開
-- 書き込み: 自チーム管理者のみ
-- ============================================================
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "games_select_policy" ON public.games;
CREATE POLICY "games_select_policy" ON public.games
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "games_insert_policy" ON public.games;
CREATE POLICY "games_insert_policy" ON public.games
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "games_update_policy" ON public.games;
CREATE POLICY "games_update_policy" ON public.games
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "games_delete_policy" ON public.games;
CREATE POLICY "games_delete_policy" ON public.games
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- players テーブル
-- SELECT: 全員公開
-- 書き込み: 自チーム管理者のみ
-- ============================================================
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "players_select_policy" ON public.players;
DROP POLICY IF EXISTS "players_select_via_share_token" ON public.players;
CREATE POLICY "players_select_policy" ON public.players
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "players_insert_policy" ON public.players;
CREATE POLICY "players_insert_policy" ON public.players
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "players_update_policy" ON public.players;
CREATE POLICY "players_update_policy" ON public.players
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "players_delete_policy" ON public.players;
CREATE POLICY "players_delete_policy" ON public.players
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- inning_scores テーブル
-- SELECT: 全員公開
-- 書き込み: 管理者 OR 有効な共有トークンがある試合（共有URLからの入力）
-- ============================================================
ALTER TABLE public.inning_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inning_scores_select_policy" ON public.inning_scores;
CREATE POLICY "inning_scores_select_policy" ON public.inning_scores
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "inning_scores_insert_policy" ON public.inning_scores;
CREATE POLICY "inning_scores_insert_policy" ON public.inning_scores
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

DROP POLICY IF EXISTS "inning_scores_update_policy" ON public.inning_scores;
CREATE POLICY "inning_scores_update_policy" ON public.inning_scores
  FOR UPDATE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

DROP POLICY IF EXISTS "inning_scores_delete_policy" ON public.inning_scores;
CREATE POLICY "inning_scores_delete_policy" ON public.inning_scores
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

-- ============================================================
-- lineup_entries テーブル
-- SELECT: 全員公開
-- 書き込み: 管理者 OR 共有トークン経由
-- ============================================================
ALTER TABLE public.lineup_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lineup_entries_select_policy" ON public.lineup_entries;
CREATE POLICY "lineup_entries_select_policy" ON public.lineup_entries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "lineup_entries_insert_policy" ON public.lineup_entries;
CREATE POLICY "lineup_entries_insert_policy" ON public.lineup_entries
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

DROP POLICY IF EXISTS "lineup_entries_update_policy" ON public.lineup_entries;
CREATE POLICY "lineup_entries_update_policy" ON public.lineup_entries
  FOR UPDATE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

DROP POLICY IF EXISTS "lineup_entries_delete_policy" ON public.lineup_entries;
CREATE POLICY "lineup_entries_delete_policy" ON public.lineup_entries
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

-- ============================================================
-- batting_results テーブル
-- SELECT: 全員公開
-- 書き込み: 管理者 OR 共有トークン経由
-- ============================================================
ALTER TABLE public.batting_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "batting_results_select_policy" ON public.batting_results;
CREATE POLICY "batting_results_select_policy" ON public.batting_results
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "batting_results_insert_policy" ON public.batting_results;
CREATE POLICY "batting_results_insert_policy" ON public.batting_results
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

DROP POLICY IF EXISTS "batting_results_update_policy" ON public.batting_results;
CREATE POLICY "batting_results_update_policy" ON public.batting_results
  FOR UPDATE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

DROP POLICY IF EXISTS "batting_results_delete_policy" ON public.batting_results;
CREATE POLICY "batting_results_delete_policy" ON public.batting_results
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

-- ============================================================
-- pitcher_results テーブル
-- SELECT: 全員公開
-- 書き込み: 管理者のみ（投手成績は管理者が入力）
-- ============================================================
ALTER TABLE public.pitcher_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pitcher_results_select_policy" ON public.pitcher_results;
CREATE POLICY "pitcher_results_select_policy" ON public.pitcher_results
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "pitcher_results_insert_policy" ON public.pitcher_results;
CREATE POLICY "pitcher_results_insert_policy" ON public.pitcher_results
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

DROP POLICY IF EXISTS "pitcher_results_update_policy" ON public.pitcher_results;
CREATE POLICY "pitcher_results_update_policy" ON public.pitcher_results
  FOR UPDATE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

DROP POLICY IF EXISTS "pitcher_results_delete_policy" ON public.pitcher_results;
CREATE POLICY "pitcher_results_delete_policy" ON public.pitcher_results
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

-- ============================================================
-- game_share_tokens テーブル
-- SELECT: 管理者（自チーム） OR 有効期限内のトークン（share ページ検証用）
-- 書き込み: 管理者のみ
-- ============================================================
ALTER TABLE public.game_share_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_share_tokens_select_policy" ON public.game_share_tokens;
CREATE POLICY "game_share_tokens_select_policy" ON public.game_share_tokens
  FOR SELECT USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR (expires_at > NOW())
  );

DROP POLICY IF EXISTS "game_share_tokens_insert_policy" ON public.game_share_tokens;
CREATE POLICY "game_share_tokens_insert_policy" ON public.game_share_tokens
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "game_share_tokens_delete_policy" ON public.game_share_tokens;
CREATE POLICY "game_share_tokens_delete_policy" ON public.game_share_tokens
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );
