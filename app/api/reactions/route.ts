import { NextResponse } from "next/server"
import { z } from "zod"
import { getClientIpHash } from "@/lib/client-ip"
import { addReaction, ReactionTargetNotFoundError } from "@/lib/reactions"

const reactionSchema = z.object({
  teamId: z.string().min(1),
  targetType: z.literal("game"),
  targetId: z.string().uuid(),
  kind: z.literal("nice_game"),
})

// リアクションを記録する（ログイン不要）
export async function POST(request: Request) {
  const parsed = reactionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストの内容が正しくありません" }, { status: 400 })
  }

  try {
    const ipHash = await getClientIpHash()
    const state = await addReaction(parsed.data, ipHash)
    return NextResponse.json(state)
  } catch (error) {
    if (error instanceof ReactionTargetNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("リアクションの記録に失敗しました", error)
    return NextResponse.json(
      { error: "リアクションを送れませんでした。時間をおいて再度お試しください" },
      { status: 500 }
    )
  }
}
