import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { fetchTeamHeaderImage, fetchTeamImages } from "@/lib/team-images-server"
import { SettingsClient } from "./settings-client"
import type { TeamMember, PendingInvite } from "./admins-section"

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
  const [teamResult, headerImage, photos, teamMembersResult, pendingInvitesResult] = await Promise.all([
    db
      .from("teams")
      .select("name, description, qualified_pa_coefficient, qualified_ip_coefficient")
      .eq("id", teamId)
      .single(),
    fetchTeamHeaderImage(teamId),
    fetchTeamImages(teamId, "photo"),
    db.from("team_members").select("id, user_id, role, created_at").eq("team_id", teamId),
    db
      .from("team_invites")
      .select("id, email, role, created_at, expires_at")
      .eq("team_id", teamId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
  ])

  if (teamMembersResult.error) {
    throw new Error(teamMembersResult.error.message)
  }

  if (pendingInvitesResult.error) {
    throw new Error(pendingInvitesResult.error.message)
  }

  const pendingInvites: PendingInvite[] = (pendingInvitesResult.data ?? [])
    .map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role as "owner" | "admin",
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

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
      initialPaCoefficient={teamResult.data?.qualified_pa_coefficient ?? 3.1}
      initialIpCoefficient={teamResult.data?.qualified_ip_coefficient ?? 1}
      initialHeaderImage={headerImage}
      initialPhotos={photos}
      currentUserId={session.userId}
      currentRole={session.role}
      initialMembers={members}
      initialPendingInvites={pendingInvites}
    />
  )
}
