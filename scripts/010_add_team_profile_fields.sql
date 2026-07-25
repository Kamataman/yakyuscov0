-- teamsテーブルにチームプロフィール表示用の列を追加
-- description: チーム紹介文（チーム管理画面からの入力は別Issueで対応）
-- image_url: チーム画像URL（アップロード機能は別Issueで対応、未設定時はダミー画像を表示）
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;
