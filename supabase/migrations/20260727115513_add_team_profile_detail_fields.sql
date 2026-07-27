-- ============================================================
-- チームプロフィール項目（活動地域・活動曜日など）を追加（Issue #143）
-- チームトップ・チーム設定画面で表示・編集するためのフリーテキスト項目
-- ============================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS activity_area TEXT,
  ADD COLUMN IF NOT EXISTS activity_days TEXT,
  ADD COLUMN IF NOT EXISTS team_level TEXT,
  ADD COLUMN IF NOT EXISTS league TEXT,
  ADD COLUMN IF NOT EXISTS founded_period TEXT,
  ADD COLUMN IF NOT EXISTS average_age TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
