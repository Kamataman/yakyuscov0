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

## Git 規約

- Conventional Commits 形式、本文は日本語
  - 例: `feat: ユーザー認証に OAuth2 を追加`
  - 例: `fix: 打席集計のゼロ除算エラーを修正`
- 確認なしに自動コミット・自動 push しない
- Issueに対応したらそのIssueにPRを関連付ける
- Pull Requestは日本語で作成する。

---

## データベースマイグレーション

- `scripts/NNN_*.sql` を追加したら、必ず対になる `supabase/migrations/<timestamp>_*.sql` も同時に追加する
  - `supabase/migrations/` にファイルが無いと、ローカル Supabase CLI（`supabase db reset` 等）や CI で変更が一切反映されない
  - 内容は `scripts/` 側と同一にする（過去のマイグレーションは全て一致している）
- `scripts/` の連番は既存の最大番号 + 1 を使う（他ブランチと番号が衝突していないか `ls scripts/` で確認する）
- 追加後は `supabase db reset` をローカルで実行し、エラーなく最後まで適用できることを確認する

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
