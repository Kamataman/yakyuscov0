import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireTeamAdmin } from "@/lib/auth"

// 選手一覧を取得
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("teamId")
  
  let query = supabase
    .from("players")
    .select("*")
    .order("number", { ascending: true, nullsFirst: false })
    .order("name")

  if (teamId) {
    query = query.eq("team_id", teamId)
  }

  const { data: players, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(players)
}

// 新しい選手を作成（管理者のみ）
export async function POST(request: Request) {
  const body = await request.json()
  const { teamId, name, number } = body

  // 管理者権限チェック
  const session = await requireTeamAdmin(teamId)
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: player, error } = await supabase
    .from("players")
    .insert({ team_id: teamId || null, name, number })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(player)
}
