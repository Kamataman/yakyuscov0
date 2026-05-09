-- ============================================================
-- games テーブルの UPDATE ポリシーを修正
-- 共有トークン経由でも対戦相手・球場等を更新できるようにする
-- ============================================================
-- 問題: games テーブルの UPDATE ポリシーには他テーブルと異なり
--       game_has_valid_share_token() による共有トークン例外がなかった。
--       そのため共有URLからの保存が RLS に阻まれ、0行更新（エラーなし）
--       となり、APIが誤って success: true を返していた。
-- ============================================================

DROP POLICY IF EXISTS "games_update_policy" ON public.games;
CREATE POLICY "games_update_policy" ON public.games
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE user_id = auth.uid()
    )
    OR game_has_valid_share_token(id)
  );
