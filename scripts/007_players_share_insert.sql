-- ============================================================
-- players テーブルへの共有トークン経由 INSERT を許可
-- Supabase SQL Editorで実行してください
-- ============================================================

-- team_id に有効な共有トークンが存在するか確認するヘルパー関数
CREATE OR REPLACE FUNCTION public.team_has_valid_share_token(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_share_tokens gst
    JOIN public.games g ON g.id = gst.game_id
    WHERE g.team_id = p_team_id
      AND gst.expires_at > NOW()
  );
$$;

-- players INSERT: 管理者 OR 有効な共有トークンがあるチームへ許可
DROP POLICY IF EXISTS "players_insert_policy" ON public.players;
CREATE POLICY "players_insert_policy" ON public.players
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
    OR team_has_valid_share_token(team_id)
  );
