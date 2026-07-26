import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { AdminsClient, type TeamMember } from "./admins-client"

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function AdminsPage({ params }: Props) {
  const { teamId } = await params
  const session = await requireTeamAdmin(teamId)

  if (!session) {
    notFound()
  }

  const db = createServiceClient()
  const { data } = await db
    .from("team_members")
    .select("id, user_id, role, created_at, profiles(email, display_name)")
    .eq("team_id", teamId)

  const members: TeamMember[] = (data ?? [])
    .map((m) => {
      const profile = m.profiles as unknown as { email: string | null; display_name: string | null } | null
      return {
        id: m.id as string,
        userId: m.user_id as string,
        role: m.role as "owner" | "admin",
        email: profile?.email ?? null,
        displayName: profile?.display_name ?? null,
        createdAt: m.created_at as string,
      }
    })
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1
      return a.createdAt.localeCompare(b.createdAt)
    })

  return (
    <AdminsClient
      teamId={teamId}
      currentUserId={session.userId}
      currentRole={session.role}
      initialMembers={members}
    />
  )
}
