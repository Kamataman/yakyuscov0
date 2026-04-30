-- batting_resultsテーブルに得点フラグを追加
ALTER TABLE batting_results ADD COLUMN IF NOT EXISTS scored BOOLEAN DEFAULT FALSE;
