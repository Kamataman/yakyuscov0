-- 試合共有トークンテーブル作成
CREATE TABLE IF NOT EXISTS game_share_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_game_share_tokens_token ON game_share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_game_share_tokens_game_id ON game_share_tokens(game_id);
CREATE INDEX IF NOT EXISTS idx_game_share_tokens_expires_at ON game_share_tokens(expires_at);
