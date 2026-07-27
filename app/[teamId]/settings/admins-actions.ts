"use server"

import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { SITE_URL } from "@/lib/constants"
import { sendAdminInviteEmail } from "@/lib/email"

const INVITE_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000
const MAX_TEAM_ADMINS = 5

export type InviteMemberResult =
  | {
      status: "added"
      member: { id: string; userId: string; email: string | null; displayName: string | null; createdAt: string }
    }
  | {
      status: "invited"
      invite: { id: string; email: string; createdAt: string; expiresAt: string }
    }

export async function inviteMember(
  teamId: string,
  email: string,
  role: "owner" | "admin"
): Promise<InviteMemberResult> {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")
  if (role === "owner" && session.role !== "owner") {
    throw new Error("オーナー権限の付与はオーナーのみ行えます")
  }

  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail) throw new Error("メールアドレスを入力してください")

  const db = createServiceClient()

  const { data: team } = await db.from("teams").select("name").eq("id", teamId).single()
  if (!team) throw new Error("チームが見つかりません")

  const { count: memberCount } = await db
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)

  const { count: pendingInviteCount } = await db
    .from("team_invites")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())

  if ((memberCount ?? 0) + (pendingInviteCount ?? 0) >= MAX_TEAM_ADMINS) {
    throw new Error(`管理者・オーナーは合計${MAX_TEAM_ADMINS}人までです`)
  }

  const { data: existingProfile } = await db
    .from("profiles")
    .select("id, email, display_name")
    .eq("email", trimmedEmail)
    .maybeSingle()

  if (existingProfile) {
    const { data: inserted, error: insertError } = await db
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: existingProfile.id,
        role,
      })
      .select("id, created_at")
      .single()

    if (insertError || !inserted) {
      if (insertError?.code === "23505") {
        throw new Error("このユーザーは既にこのチームの管理者です")
      }
      throw new Error(insertError?.message ?? "管理者の追加に失敗しました")
    }

    revalidatePath(`/${teamId}/settings`)
    return {
      status: "added",
      member: {
        id: inserted.id,
        userId: existingProfile.id,
        email: existingProfile.email ?? null,
        displayName: existingProfile.display_name ?? null,
        createdAt: inserted.created_at,
      },
    }
  }

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + INVITE_EXPIRES_IN_MS).toISOString()

  const { data: insertedInvite, error: inviteInsertError } = await db
    .from("team_invites")
    .insert({
      team_id: teamId,
      email: trimmedEmail,
      role,
      token,
      invited_by: session.userId,
      expires_at: expiresAt,
    })
    .select("id, created_at")
    .single()

  if (inviteInsertError || !insertedInvite) {
    throw new Error(inviteInsertError?.message ?? "招待の作成に失敗しました")
  }

  try {
    await sendAdminInviteEmail({
      to: trimmedEmail,
      teamName: team.name,
      role,
      inviteUrl: `${SITE_URL}/invite/${token}`,
    })
  } catch (error) {
    await db.from("team_invites").delete().eq("id", insertedInvite.id)
    throw error
  }

  revalidatePath(`/${teamId}/settings`)
  return {
    status: "invited",
    invite: {
      id: insertedInvite.id,
      email: trimmedEmail,
      createdAt: insertedInvite.created_at,
      expiresAt,
    },
  }
}

export async function removeMember(teamId: string, targetUserId: string) {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const db = createServiceClient()

  const { data: target } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", targetUserId)
    .single()

  if (!target) throw new Error("対象の管理者が見つかりません")

  if (target.role === "owner") {
    if (session.role !== "owner") {
      throw new Error("オーナーを外すことはオーナーのみ行えます")
    }

    const { count } = await db
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("role", "owner")

    if ((count ?? 0) <= 1) {
      throw new Error("最後のオーナーは削除できません")
    }
  }

  const { error } = await db
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", targetUserId)

  if (error) throw new Error(error.message)

  revalidatePath(`/${teamId}/settings`)
}
