/**
 * チーム画像のサーバー専用クエリ。
 * service role でアクセスするため、クライアントコンポーネントから import しないこと。
 */
import { createServiceClient } from "@/lib/supabase/service"
import {
  type TeamImage,
  type TeamImageKind,
  teamImagePublicUrl,
} from "@/lib/team-images"

interface TeamImageRow {
  id: string
  kind: TeamImageKind
  storage_path: string
  width: number | null
  height: number | null
  position_y: number
  created_at: string
}

function toTeamImage(row: TeamImageRow): TeamImage {
  return {
    id: row.id,
    kind: row.kind,
    storagePath: row.storage_path,
    url: teamImagePublicUrl(row.storage_path),
    width: row.width,
    height: row.height,
    positionY: row.position_y,
    createdAt: row.created_at,
  }
}

/**
 * 指定種別の画像を新しい順で取得する。
 * created_at が同一になった場合でも順序が安定するよう id を第2キーにする。
 */
export async function fetchTeamImages(
  teamId: string,
  kind: TeamImageKind
): Promise<TeamImage[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("team_images")
    .select("id, kind, storage_path, width, height, position_y, created_at")
    .eq("team_id", teamId)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })

  if (error) {
    throw new Error(`チーム画像の取得に失敗しました: ${error.message}`)
  }

  return (data as TeamImageRow[]).map(toTeamImage)
}

/** ヘッダー画像（1チーム1枚）を取得する。未設定なら null */
export async function fetchTeamHeaderImage(
  teamId: string
): Promise<TeamImage | null> {
  const images = await fetchTeamImages(teamId, "header")
  return images[0] ?? null
}
