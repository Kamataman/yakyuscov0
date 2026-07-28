import { noindexMetadata } from "@/lib/seo"

// 認証フローの中継ページ。検索結果に出す意味が無いためインデックスさせない。
export const metadata = noindexMetadata

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
