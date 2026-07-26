import { notFound } from "next/navigation"
import { requireTeamAdmin } from "@/lib/auth"
import { AccountClient } from "./account-client"

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
