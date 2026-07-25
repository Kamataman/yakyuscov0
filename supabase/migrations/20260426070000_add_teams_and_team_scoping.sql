-- teams テーブルおよびチーム紐付け列の追加
-- 本番スキーマ（pg_dump）には存在するが scripts/ に元スクリプトが残っていなかったため、
-- 本番の実スキーマ（supabase/schema_dump.sql）を正として復元したマイグレーション。
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  image_url TEXT
);

ALTER TABLE games ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_first_batting BOOLEAN DEFAULT TRUE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS total_innings INTEGER DEFAULT 9;

ALTER TABLE players ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_games_team_id ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);

-- players.number は INTEGER で作成されていたが、本番では背番号の先頭ゼロ等を
-- 保持するため VARCHAR(3) に変更されている。
ALTER TABLE players ALTER COLUMN number TYPE VARCHAR(3) USING number::VARCHAR(3);
