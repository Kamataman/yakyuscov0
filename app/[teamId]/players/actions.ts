"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin, getShareTokenSession } from "@/lib/auth"
import { isPlayerPosition, isThrowBat } from "@/lib/player-profile"

export interface PlayerRecord {
  id: string
  name: string
  number?: string
  position?: string | null
  throw_bat?: string | null
}

function parsePosition(value: string | null): string | null {
  if (!value) return null
  if (!isPlayerPosition(value)) throw new Error("ポジションの値が不正です")
  return value
}

function parseThrowBat(value: string | null): string | null {
  if (!value) return null
  if (!isThrowBat(value)) throw new Error("投打の値が不正です")
  return value
}

interface AddPlayerOptions {
  shareToken?: string
  position?: string | null
  throwBat?: string | null
}

export async function addPlayer(
  teamId: string,
  name: string,
  number: string | null,
  options: AddPlayerOptions = {}
): Promise<PlayerRecord> {
  const { shareToken, position = null, throwBat = null } = options

  if (shareToken) {
    const session = await getShareTokenSession(shareToken)
    if (!session || session.teamId !== teamId) throw new Error("アクセスできません")
  } else {
    const session = await requireTeamAdmin(teamId)
    if (!session) throw new Error("管理者権限が必要です")
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("players")
    .insert({
      team_id: teamId,
      name,
      number: number || null,
      position: parsePosition(position),
      throw_bat: parseThrowBat(throwBat),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/${teamId}/players`)
  return data as PlayerRecord
}

export async function updatePlayer(
  teamId: string,
  playerId: string,
  name: string,
  number: string | null,
  position: string | null,
  throwBat: string | null
): Promise<PlayerRecord> {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", playerId)
    .single()

  if (!existing || existing.team_id !== teamId) throw new Error("アクセスできません")

  const { data, error } = await supabase
    .from("players")
    .update({
      name,
      number: number || null,
      position: parsePosition(position),
      throw_bat: parseThrowBat(throwBat),
    })
    .eq("id", playerId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/${teamId}/players`)
  return data as PlayerRecord
}

export async function deletePlayer(teamId: string, playerId: string) {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const supabase = createServiceClient()

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
