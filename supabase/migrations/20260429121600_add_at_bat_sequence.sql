-- batting_results テーブルに at_bat_sequence カラムを追加
-- 打者一巡（1イニング中に同じ打者が複数回打席に立つ）に対応
ALTER TABLE batting_results
  ADD COLUMN IF NOT EXISTS at_bat_sequence INTEGER NOT NULL DEFAULT 1;

-- 既存の UNIQUE 制約を削除して at_bat_sequence を含む制約に更新
ALTER TABLE batting_results
  DROP CONSTRAINT IF EXISTS batting_results_game_id_batting_order_inning_key;

ALTER TABLE batting_results
  ADD CONSTRAINT batting_results_game_id_batting_order_inning_seq_key
  UNIQUE (game_id, batting_order, inning, at_bat_sequence);
