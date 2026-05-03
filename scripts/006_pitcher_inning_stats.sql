CREATE TABLE IF NOT EXISTS pitcher_inning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitcher_result_id UUID NOT NULL REFERENCES pitcher_results(id) ON DELETE CASCADE,
  inning INTEGER NOT NULL,
  runs INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0,
  strikeouts INTEGER NOT NULL DEFAULT 0,
  earned_runs INTEGER NOT NULL DEFAULT 0,
  walks INTEGER NOT NULL DEFAULT 0,
  hit_by_pitch INTEGER NOT NULL DEFAULT 0,
  home_runs INTEGER NOT NULL DEFAULT 0,
  batters_faced INTEGER NOT NULL DEFAULT 0,
  UNIQUE(pitcher_result_id, inning)
);
