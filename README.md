# 野球スコア管理アプリ

チームごとに試合データ・打順・成績を管理する Web アプリケーション。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router) + React 19
- **言語**: TypeScript 5（strict mode）
- **バックエンド**: Supabase（データベース・認証）
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **パッケージマネージャ**: pnpm

## ディレクトリ構成

```
app/           Next.js App Router（ページ・API Routes）
components/    React コンポーネント
  ui/          shadcn/ui 生成コンポーネント（直接編集は最小限に）
lib/           ユーティリティ・型定義・Supabase クライアント
hooks/         カスタム React フック
```

## セットアップ

```bash
pnpm install
pnpm dev
```

デフォルトでは `.env.local` にリモートの Supabase プロジェクトの URL・キーを設定して使います（`.env.local.example` 参照）。

## ローカル開発（Supabase CLI）

[Docker](https://www.docker.com/products/docker-desktop/) を起動した状態で、ローカルに Postgres・Auth・Studio 等の Supabase スタックを立ち上げて開発できます。

```bash
# ローカル Supabase スタックを起動（初回はイメージ取得のため数分かかります）
pnpm supabase:start

# API URL / anon key / service_role key を確認
pnpm supabase:status
```

`pnpm supabase:status` で表示された値を `.env.local` の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` に設定してから、別ターミナルで `pnpm dev` を起動してください。起動時に `supabase/migrations/` 配下のマイグレーションと `supabase/seed.sql`（`/demo` 用のデモチームデータ）が自動適用されます。

```bash
# ローカルスタックを停止
pnpm supabase:stop

# マイグレーションをローカル DB に再適用（差分確認用）
pnpm supabase:reset
```

新しいマイグレーションを追加する場合は `pnpm dlx supabase migration new <名前>` で `supabase/migrations/` にファイルを作成してください。
