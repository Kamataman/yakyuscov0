import { notFound } from "next/navigation"
import { requireTeamAdmin } from "@/lib/auth"
import { noindexMetadata } from "@/lib/seo"
import { AccountClient } from "./account-client"

// 管理者専用画面。検索結果に出す意味が無いためインデックスさせない。
export const metadata = noindexMetadata

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function AccountPage({ params }: Props) {
  const { teamId } = await params
  const session = await requireTeamAdmin(teamId)

  if (!session) {
    notFound()
  }

  return <AccountClient teamId={teamId} />
}
