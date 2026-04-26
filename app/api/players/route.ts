"use server"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 選手一覧を取得
export async function GET() {
  const supabase = await createClient()
  
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(players)
}

// 新しい選手を作成
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { name, number } = body

  const { data: player, error } = await supabase
    .from("players")
    .insert({ name, number })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(player)
}
