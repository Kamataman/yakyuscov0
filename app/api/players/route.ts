import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 選手一覧を取得
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("teamId")
  
  let query = supabase
    .from("players")
    .select("*")
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

// 新しい選手を作成
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { teamId, name, number } = body

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
