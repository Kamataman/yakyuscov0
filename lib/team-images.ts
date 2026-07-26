/**
 * チーム画像（Issue #110）の共通定義。
 * クライアント・サーバーの双方から import されるため、
 * サーバー専用モジュール（service client 等）は読み込まないこと。
 */

/** 画像の種別。追加時は scripts/ 側の CHECK 制約も合わせて変更する */
export type TeamImageKind = "header" | "photo"

export const TEAM_IMAGE_BUCKET = "team-images"

/** 種別ごとの保持枚数上限。超過分は古い順に自動削除される */
export const TEAM_IMAGE_LIMITS: Record<TeamImageKind, number> = {
  header: 1,
  photo: 10,
}

/** ユーザーが選択できる元ファイルの上限（圧縮前） */
export const TEAM_IMAGE_MAX_SOURCE_BYTES = 10 * 1024 * 1024

/** Storage に保存できる上限（バケットの file_size_limit と一致させる） */
export const TEAM_IMAGE_MAX_STORED_BYTES = 5 * 1024 * 1024

/**
 * 許可するMIMEタイプ。
 * image/svg+xml は public バケットから配信するとスクリプトを実行できてしまう
 * ため、意図的に除外している。
 */
export const TEAM_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type TeamImageMimeType = (typeof TEAM_IMAGE_ALLOWED_MIME_TYPES)[number]

/** クライアント側で縮小する際の長辺の最大ピクセル数 */
export const TEAM_IMAGE_MAX_EDGE_PX = 1920

/** クライアント側で再エンコードする際のJPEG品質 */
export const TEAM_IMAGE_JPEG_QUALITY = 0.8

const EXTENSION_BY_MIME: Record<TeamImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export interface TeamImage {
  id: string
  kind: TeamImageKind
  storagePath: string
  url: string
  width: number | null
  height: number | null
  positionY: number
  createdAt: string
}

export function isAllowedTeamImageMime(
  mimeType: string
): mimeType is TeamImageMimeType {
  return (TEAM_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

/** 拡張子はアップロードされたファイル名ではなく、検証済みのMIMEから決める */
export function extensionForTeamImageMime(mimeType: TeamImageMimeType): string {
  return EXTENSION_BY_MIME[mimeType]
}

/**
 * ファイル先頭のマジックナンバーから実際の画像形式を判定する。
 * File.type や Content-Type はクライアントの自己申告であり信用できないため、
 * サーバー側では必ずこの関数で検証する。
 * 判定できない（＝許可形式ではない）場合は null を返す。
 */
export function detectTeamImageMime(bytes: Uint8Array): TeamImageMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg"
  }

  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (
    bytes.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)
  ) {
    return "image/png"
  }

  // WebP: "RIFF" + 4バイトのサイズ + "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp"
  }

  return null
}

/**
 * Storage 上のパスから公開URLを組み立てる。
 * DBにはURLではなくパスのみを保存しているため、表示側でこの関数を通す。
 */
export function teamImagePublicUrl(storagePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL が設定されていません")
  }
  return `${baseUrl}/storage/v1/object/public/${TEAM_IMAGE_BUCKET}/${storagePath}`
}

export function formatMegabytes(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`
}
