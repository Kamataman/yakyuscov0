ALTER TABLE pitcher_results ADD COLUMN innings_outs INTEGER DEFAULT 0;
ALTER TABLE pitcher_results ADD COLUMN is_mid_inning_exit BOOLEAN DEFAULT FALSE;

-- 既存データを移行: 小数値をアウト数（整数）に変換
UPDATE pitcher_results SET innings_outs = ROUND(innings_pitched * 3);

ALTER TABLE pitcher_results DROP COLUMN innings_pitched;
