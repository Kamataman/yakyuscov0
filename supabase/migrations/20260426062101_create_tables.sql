-- 選手テーブル
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 試合テーブル
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  opponent TEXT NOT NULL,
  location TEXT,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- イニングスコアテーブル
CREATE TABLE IF NOT EXISTS inning_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  inning INTEGER NOT NULL,
  our_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  UNIQUE(game_id, inning)
);

-- 打順テーブル（試合ごとの打順）
CREATE TABLE IF NOT EXISTS lineup_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  batting_order INTEGER NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  position TEXT,
  is_substitute BOOLEAN DEFAULT FALSE,
  entered_inning INTEGER,
  UNIQUE(game_id, batting_order, player_id)
);

-- 打撃結果テーブル
CREATE TABLE IF NOT EXISTS batting_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  batting_order INTEGER NOT NULL,
  inning INTEGER NOT NULL,
  hit_result TEXT NOT NULL,
  direction TEXT,
  rbi_count INTEGER DEFAULT 0,
  runner_first BOOLEAN DEFAULT FALSE,
  runner_second BOOLEAN DEFAULT FALSE,
  runner_third BOOLEAN DEFAULT FALSE,
  stolen_second BOOLEAN DEFAULT FALSE,
  stolen_third BOOLEAN DEFAULT FALSE,
  stolen_home BOOLEAN DEFAULT FALSE,
  memo TEXT,
  UNIQUE(game_id, batting_order, inning)
);

-- 投手成績テーブル
CREATE TABLE IF NOT EXISTS pitcher_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  innings_pitched REAL DEFAULT 0,
  hits INTEGER DEFAULT 0,
  runs INTEGER DEFAULT 0,
  earned_runs INTEGER DEFAULT 0,
  strikeouts INTEGER DEFAULT 0,
  walks INTEGER DEFAULT 0,
  hit_by_pitch INTEGER DEFAULT 0,
  home_runs INTEGER DEFAULT 0,
  pitch_count INTEGER,
  is_win BOOLEAN DEFAULT FALSE,
  is_lose BOOLEAN DEFAULT FALSE,
  is_save BOOLEAN DEFAULT FALSE,
  is_hold BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_inning_scores_game_id ON inning_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_lineup_entries_game_id ON lineup_entries(game_id);
CREATE INDEX IF NOT EXISTS idx_batting_results_game_id ON batting_results(game_id);
CREATE INDEX IF NOT EXISTS idx_pitcher_results_game_id ON pitcher_results(game_id);
