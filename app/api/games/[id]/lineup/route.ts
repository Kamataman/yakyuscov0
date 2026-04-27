import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireGameAccess } from "@/lib/auth"

interface LineupEntry {
  playerId?: string
  playerName: string
  position?: string
  isSubstitute?: boolean
  enteredInning?: number
  isHelper?: boolean
}

// 打順を保存（都度保存用）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const body = await request.json()
  const { battingOrder, entries, shareToken } = body as {
    battingOrder: number
    entries: LineupEntry[]
    shareToken?: string
  }

  // アクセス権チェック
  const session = await requireGameAccess(gameId, shareToken)
  if (!session) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 401 })
  }

  const supabase = await createClient()

  // この打順の既存エントリを削除
  await supabase
    .from("lineup_entries")
    .delete()
    .eq("game_id", gameId)
    .eq("batting_order", battingOrder)

  // 新しいエントリを挿入
  if (entries && entries.length > 0) {
    const validEntries = entries.filter(e => e.playerName && e.playerName.trim() !== "")
    
    if (validEntries.length > 0) {
      const insertData = validEntries.map(entry => ({
        game_id: gameId,
        batting_order: battingOrder,
        player_id: entry.playerId || null,
        player_name: entry.playerName,
        position: entry.position || null,
        is_substitute: entry.isSubstitute || false,
        entered_inning: entry.enteredInning || null,
        is_helper: entry.isHelper || false,
      }))

      const { error } = await supabase
        .from("lineup_entries")
        .insert(insertData)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true })
}
