-- teamsテーブルにSupabase Auth連携用のuser_id列を追加
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 検索パフォーマンス向上のためインデックスを追加
CREATE INDEX IF NOT EXISTS teams_user_id_idx ON public.teams(user_id);

-- RLS（Row Level Security）を有効化
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- SELECTは全員可能（チーム情報の公開読み取り）
CREATE POLICY "teams_select_policy" ON public.teams
  FOR SELECT USING (true);

-- INSERTは認証済みユーザーが自分のuser_idでのみ可能
CREATE POLICY "teams_insert_policy" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATEは自分のチームのみ可能
CREATE POLICY "teams_update_policy" ON public.teams
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETEは自分のチームのみ可能
CREATE POLICY "teams_delete_policy" ON public.teams
  FOR DELETE USING (auth.uid() = user_id);
