import { headers } from "next/headers"
import { createHash } from "crypto"

/**
 * リクエスト元のIPアドレスを取得する。
 * プロキシ経由の場合は x-forwarded-for の先頭（クライアント側）を採用する。
 */
export async function getClientIp(): Promise<string> {
  const hdrs = await headers()
  const forwardedFor = hdrs.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return hdrs.get("x-real-ip") ?? "unknown"
}

/**
 * IPアドレスをソルト付きでハッシュ化する。
 * 問い合わせフォームのレート制限・リアクションの重複判定に使う。
 * 生のIPアドレスはどのテーブルにも保存しない。
 *
 * ソルトが未設定のまま動かすと重複防止・レート制限が無言で骨抜きになるため、
 * 握りつぶさず例外を投げる。
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? process.env.CONTACT_IP_HASH_SALT
  if (!salt) {
    throw new Error("IP_HASH_SALT（または CONTACT_IP_HASH_SALT）が未設定です")
  }
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex")
}

/**
 * リクエスト元IPのハッシュを取得するショートハンド
 */
export async function getClientIpHash(): Promise<string> {
  return hashIp(await getClientIp())
}
