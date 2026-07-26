import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { fetchTeamHeaderImage, fetchTeamImages } from "@/lib/team-images-server"
import { SettingsClient } from "./settings-client"
import type { TeamMember } from "./admins-section"

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function TeamSettingsPage({ params }: Props) {
  const { teamId } = await params
  const session = await requireTeamAdmin(teamId)

  if (!session) {
    notFound()
  }

  const db = createServiceClient()
  const [teamResult, headerImage, photos, teamMembersResult] = await Promise.all([
    db.from("teams").select("name, description").eq("id", teamId).single(),
    fetchTeamHeaderImage(teamId),
    fetchTeamImages(teamId, "photo"),
    db.from("team_members").select("id, user_id, role, created_at").eq("team_id", teamId),
  ])

  if (teamMembersResult.error) {
    throw new Error(teamMembersResult.error.message)
  }

  const userIds = (teamMembersResult.data ?? []).map((m) => m.user_id)
  const { data: profiles, error: profilesError } = await db
    .from("profiles")
    .select("id, email, display_name")
    .in("id", userIds.length > 0 ? userIds : [""])

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const members: TeamMember[] = (teamMembersResult.data ?? [])
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
    <SettingsClient
      teamId={teamId}
      teamName={teamResult.data?.name ?? teamId}
      teamDescription={teamResult.data?.description ?? ""}
      initialHeaderImage={headerImage}
      initialPhotos={photos}
      currentUserId={session.userId}
      currentRole={session.role}
      initialMembers={members}
    />
  )
}
