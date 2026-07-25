-- CLI 経由のマイグレーションでは新規テーブルに anon/authenticated/service_role への
-- 権限が自動付与されない（ダッシュボード SQL Editor 経由の場合と異なる）ため、
-- 全テーブル・関数に明示的に GRANT する。
-- 今後作成されるテーブル/関数/シーケンスにも自動で権限が付くよう、
-- ALTER DEFAULT PRIVILEGES も合わせて設定する。

GRANT ALL ON TABLE batting_results TO anon, authenticated, service_role;
GRANT ALL ON TABLE game_share_tokens TO anon, authenticated, service_role;
GRANT ALL ON TABLE games TO anon, authenticated, service_role;
GRANT ALL ON TABLE inning_scores TO anon, authenticated, service_role;
GRANT ALL ON TABLE lineup_entries TO anon, authenticated, service_role;
GRANT ALL ON TABLE pitcher_inning_stats TO anon, authenticated, service_role;
GRANT ALL ON TABLE pitcher_results TO anon, authenticated, service_role;
GRANT ALL ON TABLE players TO anon, authenticated, service_role;
GRANT ALL ON TABLE teams TO anon, authenticated, service_role;

GRANT ALL ON FUNCTION team_has_valid_share_token(TEXT) TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
