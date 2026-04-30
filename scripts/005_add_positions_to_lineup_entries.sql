ALTER TABLE lineup_entries ADD COLUMN IF NOT EXISTS positions TEXT[];
UPDATE lineup_entries SET positions = ARRAY[position] WHERE position IS NOT NULL;
ALTER TABLE lineup_entries DROP COLUMN IF EXISTS position;
