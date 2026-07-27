"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { fetchTeamImages } from "@/lib/team-images-server"
import {
  TEAM_IMAGE_BUCKET,
  TEAM_IMAGE_LIMITS,
  TEAM_IMAGE_MAX_STORED_BYTES,
  type TeamImage,
  type TeamImageKind,
  detectTeamImageMime,
  extensionForTeamImageMime,
  formatMegabytes,
} from "@/lib/team-images"

/** チーム名・紹介文を更新する */
export async function updateTeamProfile(
  teamId: string,
  name: string,
  description: string
): Promise<void> {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("チーム名を入力してください")

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("teams")
    .update({ name: trimmedName, description: description.trim() || null })
    .eq("id", teamId)

  if (error) {
    throw new Error(`チーム情報の保存に失敗しました: ${error.message}`)
  }

  revalidatePath(`/${teamId}`)
  revalidatePath(`/${teamId}/settings`)
}

/** チームプロフィール詳細項目（活動地域・活動曜日など） */
export interface TeamProfileDetailFields {
  activityArea: string
  activityDays: string
  teamLevel: string
  league: string
  foundedPeriod: string
  averageAge: string
  notes: string
}

const SHORT_FIELD_MAX_LENGTH = 100
const NOTES_MAX_LENGTH = 300

const SHORT_FIELD_LABELS: Record<
  Exclude<keyof TeamProfileDetailFields, "notes">,
  string
> = {
  activityArea: "活動地域",
  activityDays: "活動曜日",
  teamLevel: "チームレベル",
  league: "所属リーグ・大会",
  foundedPeriod: "結成時期",
  averageAge: "平均年齢",
}

/** チームプロフィール詳細項目（活動地域・活動曜日など）を更新する */
export async function updateTeamProfileDetails(
  teamId: string,
  fields: TeamProfileDetailFields
): Promise<void> {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const trimmedShortFields: Record<string, string | null> = {}

  for (const key of Object.keys(SHORT_FIELD_LABELS) as (keyof typeof SHORT_FIELD_LABELS)[]) {
    const value = fields[key].trim()
    if (value.length > SHORT_FIELD_MAX_LENGTH) {
      throw new Error(`${SHORT_FIELD_LABELS[key]}は${SHORT_FIELD_MAX_LENGTH}文字以内で入力してください`)
    }
    trimmedShortFields[key] = value || null
  }

  const notes = fields.notes.trim()
  if (notes.length > NOTES_MAX_LENGTH) {
    throw new Error(`その他は${NOTES_MAX_LENGTH}文字以内で入力してください`)
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("teams")
    .update({
      activity_area: trimmedShortFields.activityArea,
      activity_days: trimmedShortFields.activityDays,
      team_level: trimmedShortFields.teamLevel,
      league: trimmedShortFields.league,
      founded_period: trimmedShortFields.foundedPeriod,
      average_age: trimmedShortFields.averageAge,
      notes: notes || null,
    })
    .eq("id", teamId)

  if (error) {
    throw new Error(`チームプロフィールの保存に失敗しました: ${error.message}`)
  }

  revalidatePath(`/${teamId}`)
  revalidatePath(`/${teamId}/settings`)
}

/** 規定打席・規定投球回の係数を更新する */
export async function updateQualificationCoefficients(
  teamId: string,
  paCoefficient: number,
  ipCoefficient: number
): Promise<void> {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  if (!Number.isFinite(paCoefficient) || paCoefficient <= 0 || paCoefficient > 99.99) {
    throw new Error("規定打席の係数の値が不正です")
  }
  if (!Number.isFinite(ipCoefficient) || ipCoefficient <= 0 || ipCoefficient > 99.99) {
    throw new Error("規定投球回の係数の値が不正です")
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("teams")
    .update({
      qualified_pa_coefficient: paCoefficient,
      qualified_ip_coefficient: ipCoefficient,
    })
    .eq("id", teamId)

  if (error) {
    throw new Error(`規定打席・規定投球回の係数の保存に失敗しました: ${error.message}`)
  }

  revalidatePath(`/${teamId}/settings`)
  revalidatePath(`/${teamId}/stats`)
}

const KINDS: TeamImageKind[] = ["header", "photo"]

function parseKind(value: FormDataEntryValue | null): TeamImageKind {
  if (typeof value === "string" && (KINDS as string[]).includes(value)) {
    return value as TeamImageKind
  }
  throw new Error("画像の種別が不正です")
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value === "") return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * 保持枚数の上限を超えた分を古い順に削除する。
 * ヘッダー画像（上限1枚）の差し替えも、写真の11枚目投稿もこの処理で扱う。
 *
 * DBの行を先に削除し、その後Storageのオブジェクトを削除する。
 * 逆順にするとStorage削除成功・DB削除失敗の場合に画像切れの行が残るため。
 * Storage側の削除に失敗しても表示は正しいままなので、例外にはせず警告に留める。
 */
async function trimTeamImages(teamId: string, kind: TeamImageKind): Promise<void> {
  const supabase = createServiceClient()
  const images = await fetchTeamImages(teamId, kind)
  const obsolete = images.slice(TEAM_IMAGE_LIMITS[kind])

  if (obsolete.length === 0) return

  const { error: deleteRowsError } = await supabase
    .from("team_images")
    .delete()
    .in(
      "id",
      obsolete.map((image) => image.id)
    )

  if (deleteRowsError) {
    throw new Error(`古い画像の削除に失敗しました: ${deleteRowsError.message}`)
  }

  const { error: removeObjectsError } = await supabase.storage
    .from(TEAM_IMAGE_BUCKET)
    .remove(obsolete.map((image) => image.storagePath))

  if (removeObjectsError) {
    console.warn(
      `[team-images] 古い画像のファイル削除に失敗しました (team=${teamId}, kind=${kind}): ${removeObjectsError.message}`
    )
  }
}

/**
 * 画像を1枚アップロードする。
 * クライアント側で縮小・再エンコードされたファイルを受け取る前提。
 */
export async function uploadTeamImage(
  teamId: string,
  formData: FormData
): Promise<TeamImage[]> {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const kind = parseKind(formData.get("kind"))
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("画像ファイルが選択されていません")
  }

  if (file.size > TEAM_IMAGE_MAX_STORED_BYTES) {
    throw new Error(
      `画像サイズが大きすぎます（${formatMegabytes(TEAM_IMAGE_MAX_STORED_BYTES)}以下にしてください）`
    )
  }

  // File.type は自己申告のため信用せず、先頭バイトから形式を判定する
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = detectTeamImageMime(bytes)
  if (!mimeType) {
    throw new Error("JPEG・PNG・WebP形式の画像のみアップロードできます")
  }

  // ファイル名はユーザー入力を使わず、UUID + 検証済みMIMEの拡張子で決定する
  const storagePath = `${teamId}/${kind}/${crypto.randomUUID()}.${extensionForTeamImageMime(mimeType)}`

  const supabase = createServiceClient()
  const { error: uploadError } = await supabase.storage
    .from(TEAM_IMAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: mimeType,
      // パスは毎回一意なので長期キャッシュしてよい
      cacheControl: "31536000",
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`画像のアップロードに失敗しました: ${uploadError.message}`)
  }

  const { error: insertError } = await supabase.from("team_images").insert({
    team_id: teamId,
    kind,
    storage_path: storagePath,
    mime_type: mimeType,
    size_bytes: bytes.byteLength,
    width: parseOptionalInt(formData.get("width")),
    height: parseOptionalInt(formData.get("height")),
    created_by: session.userId,
  })

  if (insertError) {
    // DB登録に失敗した場合はアップロード済みのファイルを残さない
    await supabase.storage.from(TEAM_IMAGE_BUCKET).remove([storagePath])
    throw new Error(`画像の登録に失敗しました: ${insertError.message}`)
  }

  await trimTeamImages(teamId, kind)

  revalidatePath(`/${teamId}`)
  revalidatePath(`/${teamId}/settings`)

  return fetchTeamImages(teamId, kind)
}

/** 指定した画像を削除する（DB行→Storageオブジェクトの順） */
export async function deleteTeamImage(teamId: string, imageId: string): Promise<void> {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("team_images")
    .delete()
    .eq("id", imageId)
    .eq("team_id", teamId)
    .select("storage_path")
    .maybeSingle()

  if (error) {
    throw new Error(`画像の削除に失敗しました: ${error.message}`)
  }
  if (!data) {
    throw new Error("対象の画像が見つかりません")
  }

  const { error: removeObjectError } = await supabase.storage
    .from(TEAM_IMAGE_BUCKET)
    .remove([data.storage_path])

  if (removeObjectError) {
    console.warn(
      `[team-images] 画像のファイル削除に失敗しました (team=${teamId}, image=${imageId}): ${removeObjectError.message}`
    )
  }

  revalidatePath(`/${teamId}`)
  revalidatePath(`/${teamId}/settings`)
}

/** ヘッダー画像の縦方向の表示位置（object-position）を更新する */
export async function updateHeaderImagePosition(
  teamId: string,
  imageId: string,
  positionY: number
): Promise<void> {
  const session = await requireTeamAdmin(teamId)
  if (!session) throw new Error("管理者権限が必要です")

  if (!Number.isInteger(positionY) || positionY < 0 || positionY > 100) {
    throw new Error("表示位置の値が不正です")
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("team_images")
    .update({ position_y: positionY })
    .eq("id", imageId)
    .eq("team_id", teamId)
    .eq("kind", "header")
    .select("id")
    .maybeSingle()

  if (error) {
    throw new Error(`表示位置の保存に失敗しました: ${error.message}`)
  }
  if (!data) {
    throw new Error("対象のヘッダー画像が見つかりません")
  }

  revalidatePath(`/${teamId}`)
  revalidatePath(`/${teamId}/settings`)
}
