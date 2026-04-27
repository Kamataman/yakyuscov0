import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("id");

  if (teamId) {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, created_at")
      .eq("id", teamId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "チームが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  }

  // 全チーム一覧
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
