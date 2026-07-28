import { noindexMetadata } from "@/lib/seo"

// パスワード再設定フロー。トークン付きURLは期限切れで無効表示に変わるためインデックスさせない。
export const metadata = noindexMetadata

export default function PasswordResetLayout({ children }: { children: React.ReactNode }) {
  return children
}
