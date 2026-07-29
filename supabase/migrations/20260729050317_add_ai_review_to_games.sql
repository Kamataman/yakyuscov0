-- 試合戦評（Issue #85）保存用カラムを追加
-- ai_review_error: 生成開始後の失敗メッセージ。離脱後も次回訪問時に気づけるよう保存し、成功時にNULLへ戻す
-- （薄い試合判定・再生成上限など生成前に同期的に分かるエラーはここに保存しない）
ALTER TABLE games
  ADD COLUMN ai_review TEXT,
  ADD COLUMN ai_review_generated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN ai_review_model TEXT,
  ADD COLUMN ai_review_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN ai_review_error TEXT;
