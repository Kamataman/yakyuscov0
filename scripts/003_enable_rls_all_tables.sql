-- ============================================================
-- 全テーブルのRLS有効化
-- Supabase SQL Editorで実行してください
-- ============================================================

-- ============================================================
-- ヘルパー関数: ゲームに有効な共有トークンが存在するか確認
-- SECURITY DEFINER により game_share_tokens の RLS をバイパスして参照する
-- share/[token]/page.tsx が未認証状態でゲームデータを読む際に使用
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
-- ============================================================
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 自チーム管理者、または有効な共有トークンがある試合は読める
CREATE POLICY "games_select_policy" ON public.games
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
    OR game_has_valid_share_token(id)
  );

CREATE POLICY "games_insert_policy" ON public.games
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "games_update_policy" ON public.games
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "games_delete_policy" ON public.games
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- players テーブル
-- ============================================================
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_select_policy" ON public.players
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "players_insert_policy" ON public.players
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "players_update_policy" ON public.players
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "players_delete_policy" ON public.players
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- inning_scores テーブル（game経由で権限確認）
-- ============================================================
ALTER TABLE public.inning_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inning_scores_select_policy" ON public.inning_scores
  FOR SELECT USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

CREATE POLICY "inning_scores_insert_policy" ON public.inning_scores
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "inning_scores_update_policy" ON public.inning_scores
  FOR UPDATE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "inning_scores_delete_policy" ON public.inning_scores
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

-- ============================================================
-- lineup_entries テーブル
-- ============================================================
ALTER TABLE public.lineup_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lineup_entries_select_policy" ON public.lineup_entries
  FOR SELECT USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

CREATE POLICY "lineup_entries_insert_policy" ON public.lineup_entries
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "lineup_entries_update_policy" ON public.lineup_entries
  FOR UPDATE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "lineup_entries_delete_policy" ON public.lineup_entries
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

-- ============================================================
-- batting_results テーブル
-- ============================================================
ALTER TABLE public.batting_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batting_results_select_policy" ON public.batting_results
  FOR SELECT USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

CREATE POLICY "batting_results_insert_policy" ON public.batting_results
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "batting_results_update_policy" ON public.batting_results
  FOR UPDATE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "batting_results_delete_policy" ON public.batting_results
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

-- ============================================================
-- pitcher_results テーブル
-- ============================================================
ALTER TABLE public.pitcher_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pitcher_results_select_policy" ON public.pitcher_results
  FOR SELECT USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    OR game_has_valid_share_token(game_id)
  );

CREATE POLICY "pitcher_results_insert_policy" ON public.pitcher_results
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "pitcher_results_update_policy" ON public.pitcher_results
  FOR UPDATE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "pitcher_results_delete_policy" ON public.pitcher_results
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

-- ============================================================
-- game_share_tokens テーブル
-- 有効期限内のトークンは匿名ユーザーも読める
-- (share/[token]/page.tsx がサーバー側で未認証として token を検証するため)
-- ============================================================
ALTER TABLE public.game_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_share_tokens_select_policy" ON public.game_share_tokens
  FOR SELECT USING (
    -- 自チーム管理者
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
    -- または有効期限内のトークン（share ページのブートストラップのため）
    OR (expires_at > NOW())
  );

CREATE POLICY "game_share_tokens_insert_policy" ON public.game_share_tokens
  FOR INSERT WITH CHECK (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "game_share_tokens_delete_policy" ON public.game_share_tokens
  FOR DELETE USING (
    game_id IN (
      SELECT g.id FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE t.user_id = auth.uid()
    )
  );
