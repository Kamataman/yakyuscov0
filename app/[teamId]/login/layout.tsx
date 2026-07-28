import { noindexMetadata } from "@/lib/seo"

// 管理者ログイン画面。検索結果に出す意味が無いためインデックスさせない。
export const metadata = noindexMetadata

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
