"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireTeamAdmin, getShareTokenSession } from "@/lib/auth"

export async function addPlayer(teamId: string, name: string, number: string | null, shareToken?: string) {
  if (shareToken) {
    const session = await getShareTokenSession(shareToken)
    if (!session || session.teamId !== teamId) throw new Error("アクセスできません")
  } else {
    const session = await requireTeamAdmin(teamId)
    if (!session) throw new Error("管理者権限が必要です")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("players")
    .insert({ team_id: teamId, name, number: number || null })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/${teamId}/players`)
  return data as { id: string; name: string; number?: string }
}

export async function updatePlayer(teamId: string, playerId: string, name: string, number: string | null) {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", playerId)
    .single()

  if (!existing || existing.team_id !== teamId) throw new Error("アクセスできません")

  const { data, error } = await supabase
    .from("players")
    .update({ name, number: number || null })
    .eq("id", playerId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/${teamId}/players`)
  return data as { id: string; name: string; number?: string }
}

export async function deletePlayer(teamId: string, playerId: string) {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", playerId)
    .single()

  if (!existing || existing.team_id !== teamId) throw new Error("アクセスできません")

  const { error } = await supabase.from("players").delete().eq("id", playerId)
  if (error) throw new Error(error.message)

  revalidatePath(`/${teamId}/players`)
}
