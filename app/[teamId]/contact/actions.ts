"use server"

import { headers } from "next/headers"
import { createHash } from "crypto"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/service"
import { sendContactEmail } from "@/lib/email"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { checkAndRecordContactRateLimit } from "@/lib/rate-limit"

const contactSchema = z.object({
  name: z.string().trim().max(50, "お名前は50文字以内で入力してください"),
  email: z
    .string()
    .trim()
    .max(254, "メールアドレスは254文字以内で入力してください")
    .email("メールアドレスの形式が正しくありません"),
  message: z
    .string()
    .trim()
    .min(10, "問い合わせ内容は10文字以上で入力してください")
    .max(2000, "問い合わせ内容は2000文字以内で入力してください"),
  agreedToPrivacy: z.boolean().refine((v) => v === true, "プライバシーポリシーへの同意が必要です"),
  turnstileToken: z.string().min(1, "認証トークンがありません。もう一度お試しください"),
})

export interface ContactFormInput {
  name: string
  email: string
  message: string
  agreedToPrivacy: boolean
  turnstileToken: string
  honeypot: string
}

async function getClientIp(): Promise<string> {
  const hdrs = await headers()
  const forwardedFor = hdrs.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return hdrs.get("x-real-ip") ?? "unknown"
}

function hashIp(ip: string): string {
  const salt = process.env.CONTACT_IP_HASH_SALT
  if (!salt) {
    throw new Error("CONTACT_IP_HASH_SALT が未設定です")
  }
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex")
}

export async function submitContactForm(teamId: string, input: ContactFormInput): Promise<void> {
  // ハニーポット欄に入力があるbotには、成功したように見せかけて何もしない
  if (input.honeypot.trim() !== "") {
    return
  }

  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "入力内容を確認してください")
  }
  const { name, email, message, turnstileToken } = parsed.data

  const ip = await getClientIp()

  const turnstileOk = await verifyTurnstileToken(turnstileToken, ip)
  if (!turnstileOk) {
    throw new Error("認証に失敗しました。もう一度お試しください")
  }

  const ipHash = hashIp(ip)
  const allowed = await checkAndRecordContactRateLimit(teamId, ipHash)
  if (!allowed) {
    throw new Error("送信回数の上限に達しました。しばらく時間をおいて再度お試しください")
  }

  const db = createServiceClient()

  const { data: team } = await db.from("teams").select("name").eq("id", teamId).single()
  if (!team) {
    throw new Error("チームが見つかりません")
  }

  const { data: owners } = await db
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("role", "owner")

  const ownerUserIds = (owners ?? []).map((m) => m.user_id)
  if (ownerUserIds.length === 0) {
    throw new Error("このチームは現在問い合わせを受け付けていません")
  }

  const { data: profiles } = await db.from("profiles").select("email").in("id", ownerUserIds)
  const ownerEmails = (profiles ?? [])
    .map((p) => p.email)
    .filter((email): email is string => !!email)

  if (ownerEmails.length === 0) {
    throw new Error("このチームは現在問い合わせを受け付けていません")
  }

  try {
    await Promise.all(
      ownerEmails.map((to) =>
        sendContactEmail({
          to,
          teamName: team.name,
          fromName: name || "名前未記入",
          fromEmail: email,
          message,
        })
      )
    )
  } catch (error) {
    console.error("問い合わせメールの送信に失敗しました", error)
    throw new Error("送信に失敗しました。時間をおいて再度お試しください")
  }
}
