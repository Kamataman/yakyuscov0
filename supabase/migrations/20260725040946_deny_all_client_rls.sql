-- ============================================================
-- クライアントからの直接アクセスを完全遮断（deny all 化）
-- 背景: バックエンドは service role key（RLSをバイパス）に一本化したため、
-- anon / authenticated ロール向けのポリシーは不要になった。
-- RLS 自体は有効のまま残し、ポリシーを全て削除することで
-- anon / authenticated からのアクセスを完全に拒否する。
-- Supabase SQL Editorで実行してください
-- ※ 再実行可能（DROP POLICY / DROP FUNCTION IF EXISTS で冪等性を確保）
-- ============================================================

-- teams
DROP POLICY IF EXISTS "teams_select_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_update_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON public.teams;

-- games
DROP POLICY IF EXISTS "games_select_policy" ON public.games;
DROP POLICY IF EXISTS "games_insert_policy" ON public.games;
DROP POLICY IF EXISTS "games_update_policy" ON public.games;
DROP POLICY IF EXISTS "games_delete_policy" ON public.games;

-- players
DROP POLICY IF EXISTS "players_select_policy" ON public.players;
DROP POLICY IF EXISTS "players_select_via_share_token" ON public.players;
DROP POLICY IF EXISTS "players_insert_policy" ON public.players;
DROP POLICY IF EXISTS "players_update_policy" ON public.players;
DROP POLICY IF EXISTS "players_delete_policy" ON public.players;

-- inning_scores
DROP POLICY IF EXISTS "inning_scores_select_policy" ON public.inning_scores;
DROP POLICY IF EXISTS "inning_scores_insert_policy" ON public.inning_scores;
DROP POLICY IF EXISTS "inning_scores_update_policy" ON public.inning_scores;
DROP POLICY IF EXISTS "inning_scores_delete_policy" ON public.inning_scores;

-- lineup_entries
DROP POLICY IF EXISTS "lineup_entries_select_policy" ON public.lineup_entries;
DROP POLICY IF EXISTS "lineup_entries_insert_policy" ON public.lineup_entries;
DROP POLICY IF EXISTS "lineup_entries_update_policy" ON public.lineup_entries;
DROP POLICY IF EXISTS "lineup_entries_delete_policy" ON public.lineup_entries;

-- batting_results
DROP POLICY IF EXISTS "batting_results_select_policy" ON public.batting_results;
DROP POLICY IF EXISTS "batting_results_insert_policy" ON public.batting_results;
DROP POLICY IF EXISTS "batting_results_update_policy" ON public.batting_results;
DROP POLICY IF EXISTS "batting_results_delete_policy" ON public.batting_results;

-- pitcher_results
DROP POLICY IF EXISTS "pitcher_results_select_policy" ON public.pitcher_results;
DROP POLICY IF EXISTS "pitcher_results_insert_policy" ON public.pitcher_results;
DROP POLICY IF EXISTS "pitcher_results_update_policy" ON public.pitcher_results;
DROP POLICY IF EXISTS "pitcher_results_delete_policy" ON public.pitcher_results;

-- game_share_tokens
DROP POLICY IF EXISTS "game_share_tokens_select_policy" ON public.game_share_tokens;
DROP POLICY IF EXISTS "game_share_tokens_insert_policy" ON public.game_share_tokens;
DROP POLICY IF EXISTS "game_share_tokens_delete_policy" ON public.game_share_tokens;

-- ポリシーからのみ使用されていたヘルパー関数も削除
DROP FUNCTION IF EXISTS public.game_has_valid_share_token(UUID);
DROP FUNCTION IF EXISTS public.team_has_valid_share_token(UUID);

-- 注: ALTER TABLE ... ENABLE ROW LEVEL SECURITY はそのまま維持する。
-- ポリシーが0件になることで anon / authenticated ロールからのアクセスは
-- 全て拒否される。service_role は RLS を常にバイパスするため影響を受けない。
