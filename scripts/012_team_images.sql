-- ============================================================
-- チーム画像の保管機能（Issue #110）
-- team_images テーブルと Supabase Storage の team-images バケットを新設する。
--
-- 画像種別（kind）は将来増える想定のため、teams に列を増やすのではなく
-- 縦持ちのテーブルで管理する。種別の追加は CHECK 制約の変更のみで済む。
--
-- 認可はRLSではなくアプリ層（lib/auth.ts）で行う方針（scripts/009参照）の
-- ため、本マイグレーションでもRLSは有効化するのみでポリシーは作成しない
-- （anon/authenticated からは deny-all、service role専用）。
-- バケットは public のため閲覧はRLSを経由せず誰でも可能、書き込みは
-- ポリシーが無いので service role のみとなり、要件と一致する。
--
-- Supabase SQL Editorで実行してください
-- ※ 再実行可能（IF NOT EXISTS / ON CONFLICT で冪等性を確保）
-- ============================================================

-- ============================================================
-- team_images テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  -- 'header': チームトップのヘッダー画像（1チーム1枚）
  -- 'photo' : チーム写真（カルーセル表示、1チーム10枚まで）
  kind         TEXT NOT NULL CHECK (kind IN ('header', 'photo')),
  -- 公開URLではなくStorage上のパスを保持する。
  -- URLはアプリ側で getPublicUrl() により組み立てる。
  storage_path TEXT NOT NULL UNIQUE,
  mime_type    TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  width        INTEGER,
  height       INTEGER,
  -- ヘッダー画像の縦方向の表示位置（object-position の % 値）
  position_y   SMALLINT NOT NULL DEFAULT 50 CHECK (position_y BETWEEN 0 AND 100),
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 種別ごとに新しい順で取得するためのインデックス
CREATE INDEX IF NOT EXISTS team_images_team_kind_created_idx
  ON public.team_images(team_id, kind, created_at DESC);

ALTER TABLE public.team_images ENABLE ROW LEVEL SECURITY;
-- anon/authenticated 向けポリシーは作成しない（service role専用）

-- scripts/011 の ALTER DEFAULT PRIVILEGES で自動付与される想定だが、
-- 実行経路によって付与されない場合があるため明示的に GRANT する
-- （RLSにより anon/authenticated からは引き続きアクセスできない）
GRANT ALL ON TABLE public.team_images TO anon, authenticated, service_role;

-- ============================================================
-- teams.image_url は team_images に置き換えたため参照しない
-- ============================================================
COMMENT ON COLUMN public.teams.image_url IS
  'DEPRECATED: Issue #110 で team_images テーブルに移行。アプリからは参照しない。';

-- ============================================================
-- Storage バケット
-- ダッシュボードでの手作業ではなくマイグレーションで作成し、
-- ローカル（supabase db reset）と本番の設定を一致させる。
--
-- image/svg+xml は許可しない（publicバケットから配信されるSVGは
-- スクリプトを含められるためXSSの原因になる）。
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-images',
  'team-images',
  true,
  5242880, -- 5MiB（クライアント側で圧縮するため通常は1MB以下）
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
