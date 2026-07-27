# CLAUDE.md

## コミュニケーション

- 日本語で応答する（コード・変数名・コメントは英語）
- 簡潔に回答し、自明な説明は省略する
- 複雑なタスクでは実装前に計画を提示し、承認後に着手する

---

## コードスタイル

- 厳密な型付け（`any` は使わず `unknown` を使う）
- エラーは握りつぶさず、意味のあるメッセージ付きで処理する
- コンポーネントは `components/ui/` に既存の shadcn/ui を優先して使う
- 新しい UI コンポーネントは `pnpm dlx shadcn@latest add <component>` で追加する

---

## デザインシステム(グラウンドライン)

- 方向性: ターフグリーン×白×黒インク、シャープなエッジのエディトリアルなデザイン。丸角カード・slateグラデ背景・定番ブルー・ハンバーガーメニューなど「AI生成でよく見る」見た目は使わない
- カラートークン(`app/globals.css` の `:root` / `@theme inline` で定義): `bg-turf` / `text-turf`(ターフグリーン、主アクション・自チーム)、`bg-stitch` / `text-stitch`(ステッチレッド、警告・削除・相手チーム)、`text-foreground`(インク、本文基調)。新しい色を追加する場合もこのファイルにトークンを足す形にし、Tailwindの標準カラー(`blue-600`など)を直接使わない
  - 固定列・固定行(`sticky`)の背景に半透明トークン(`bg-turf/15`など)を使うと、横スクロール時に下のコンテンツが透けて重なって見える。固定要素の背景には必ず不透明な `bg-turf-tint` / `bg-stitch-tint` を使う
- 角丸: 基本 `--radius: 0`(シャープ)。強調したいCTAボタンや写真プレースホルダーのみ `diagonal-cut` / `diagonal-cut-lg` ユーティリティで対角カットする。打順・背番号などの丸バッジは `rounded-full` のままでよい
- フォント: 日本語見出し・本文は `Zen Kaku Gothic New`(`font-sans`、`app/layout.tsx` で設定済み)。スコアや成績などの英数字のみ `Oswald`(`font-display` ユーティリティ)を使う。日本語には使わない
- モバイルナビ: ハンバーガーメニューは使わず、画面下部固定タブバー(ホーム/試合一覧/個人成績/選手一覧+その他)を使う。「その他」は管理者ログイン・設定・アカウント・ログアウトをまとめたDrawer(下部シート)を開く
- モーダル: 打席入力・投手入力・選手選択などフォーム系はDrawer(`components/ui/drawer.tsx`、下部シート)を使う。確認削除・写真ライトボックス・共有URLなど短い操作は中央Dialogのままでよい
- アイコン/ロゴ: アプリアイコンは `public/apple-icon.png`(黒スクイーク角丸+ターフグリーンをオフセットして重ねた立体感+白いホームベース型ダイヤモンド+V字タイ3段)。ヘッダーロゴなど再利用箇所もこの画像をそのまま使い、簡易な自作マークで代替しない

---

## Git 規約

- Conventional Commits 形式、本文は日本語
  - 例: `feat: ユーザー認証に OAuth2 を追加`
  - 例: `fix: 打席集計のゼロ除算エラーを修正`
- 確認なしに自動コミット・自動 push しない
- Issueに対応したらそのIssueにPRを関連付ける
- Pull Requestは日本語で作成する。

---

## データベースマイグレーション

- マイグレーションは `supabase/migrations/` に一本化されている（旧 `scripts/` は廃止済み。過去分は git 履歴を参照）
- 新規追加は `pnpm dlx supabase migration new <名前>` で `supabase/migrations/<timestamp>_<名前>.sql` を作成する
- ダッシュボードの SQL Editor 経由と異なり、Supabase CLI 経由のマイグレーションでは新規テーブル・関数に `anon` / `authenticated` / `service_role` への権限が自動付与されない。新しいテーブルや関数を追加する場合は、そのマイグレーション内で `GRANT ALL ON TABLE <table> TO anon, authenticated, service_role;`（関数は `GRANT ALL ON FUNCTION ...`）を明示する
- 追加後は `pnpm supabase:reset`（`supabase db reset`）をローカルで実行し、エラーなく最後まで適用できることを確認する

---

## 削除処理のガイドライン

- 削除操作には必ず `ConfirmDeleteDialog` コンポーネントで確認を挟む
- `confirm()` や `alert()` などのブラウザネイティブダイアログは使用しない
- コンポーネント: `components/confirm-delete-dialog.tsx`
  - props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `isPending?`

---

## 禁止事項

- README・ドキュメントを確認なしに生成・変更しない
- テストコードを確認なしに削除・コメントアウトしない
- 既存の動作するコードを理由なくリファクタリングしない
