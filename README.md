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
