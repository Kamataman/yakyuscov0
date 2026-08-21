import { NextResponse } from "next/server"
import { z } from "zod"
import { isBotUserAgent } from "@/lib/bot-user-agent"
import { getClientIpHash } from "@/lib/client-ip"
import { incrementGameView, ViewTargetNotFoundError } from "@/lib/view-counts"

const viewSchema = z.object({
  teamId: z.string().min(1),
  targetType: z.literal("game"),
  targetId: z.string().uuid(),
})

// 閲覧数を加算する（ログイン不要）
export async function POST(request: Request) {
  const parsed = viewSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストの内容が正しくありません" }, { status: 400 })
  }

  if (isBotUserAgent(request.headers.get("user-agent"))) {
    return NextResponse.json({ counted: false })
  }

  try {
    const ipHash = await getClientIpHash()
    const count = await incrementGameView(parsed.data.teamId, parsed.data.targetId, ipHash)
    return NextResponse.json({ count, counted: true })
  } catch (error) {
    if (error instanceof ViewTargetNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("閲覧数の加算に失敗しました", error)
    return NextResponse.json({ error: "閲覧数を記録できませんでした" }, { status: 500 })
  }
}
