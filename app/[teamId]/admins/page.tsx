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
  const { data: teamMembers, error: teamMembersError } = await db
    .from("team_members")
    .select("id, user_id, role, created_at")
    .eq("team_id", teamId)

  if (teamMembersError) {
    throw new Error(teamMembersError.message)
  }

  const userIds = (teamMembers ?? []).map((m) => m.user_id)
  const { data: profiles, error: profilesError } = await db
    .from("profiles")
    .select("id, email, display_name")
    .in("id", userIds.length > 0 ? userIds : [""])

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const members: TeamMember[] = (teamMembers ?? [])
    .map((m) => {
      const profile = profileById.get(m.user_id)
      return {
        id: m.id,
        userId: m.user_id,
        role: m.role as "owner" | "admin",
        email: profile?.email ?? null,
        displayName: profile?.display_name ?? null,
        createdAt: m.created_at,
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
