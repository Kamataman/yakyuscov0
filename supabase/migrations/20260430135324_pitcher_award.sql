-- pitcher_results の勝敗フィールドを4列から1列に統合
ALTER TABLE pitcher_results ADD COLUMN IF NOT EXISTS pitcher_award TEXT;

UPDATE pitcher_results SET pitcher_award = 'win'  WHERE is_win  = true;
UPDATE pitcher_results SET pitcher_award = 'lose' WHERE is_lose = true;
UPDATE pitcher_results SET pitcher_award = 'save' WHERE is_save = true;
UPDATE pitcher_results SET pitcher_award = 'hold' WHERE is_hold = true;

ALTER TABLE pitcher_results DROP COLUMN IF EXISTS is_win;
ALTER TABLE pitcher_results DROP COLUMN IF EXISTS is_lose;
ALTER TABLE pitcher_results DROP COLUMN IF EXISTS is_save;
ALTER TABLE pitcher_results DROP COLUMN IF EXISTS is_hold;
