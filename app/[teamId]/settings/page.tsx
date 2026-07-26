import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { fetchTeamHeaderImage, fetchTeamImages } from "@/lib/team-images-server"
import { SettingsClient } from "./settings-client"

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
  const [teamResult, headerImage, photos] = await Promise.all([
    db.from("teams").select("name").eq("id", teamId).single(),
    fetchTeamHeaderImage(teamId),
    fetchTeamImages(teamId, "photo"),
  ])

  return (
    <SettingsClient
      teamId={teamId}
      teamName={teamResult.data?.name ?? teamId}
      initialHeaderImage={headerImage}
      initialPhotos={photos}
    />
  )
}
