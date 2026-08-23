#!/usr/bin/env node
/**
 * デモチーム（/demo）のヘッダー画像・チーム写真を Storage に投入する。
 *
 * team_images はファイル本体を Storage に持つため SQL だけでは復元できず、
 * マイグレーション（20260823010000_demo_team_showcase.sql）とは別にこのスクリプトで投入する。
 * 画像は supabase/demo-images/ にコミットされているサンプル画像を使う。
 *
 * 使い方（ローカル / 本番いずれも環境変数の向き先で決まる）:
 *   node --env-file=.env.local scripts/seed-demo-images.mjs
 *
 * 必要な環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * 冪等。Storage のパスと team_images.id を固定しているため、再実行しても増えない。
 */
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const TEAM_ID = "demo"
const BUCKET = "team-images"
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

/** id / storage_path を固定して冪等にする */
const IMAGES = [
  {
    id: "bbbbbbb1-0000-4000-8000-000000000001",
    kind: "header",
    file: "header.png",
    width: 1600,
    height: 600,
    positionY: 50,
  },
  {
    id: "bbbbbbb1-0000-4000-8000-000000000002",
    kind: "photo",
    file: "photo-1.png",
    width: 1200,
    height: 900,
    positionY: 50,
  },
  {
    id: "bbbbbbb1-0000-4000-8000-000000000003",
    kind: "photo",
    file: "photo-2.png",
    width: 1200,
    height: 900,
    positionY: 50,
  },
  {
    id: "bbbbbbb1-0000-4000-8000-000000000004",
    kind: "photo",
    file: "photo-3.png",
    width: 1200,
    height: 900,
    positionY: 50,
  },
]

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `環境変数 ${name} が設定されていません。node --env-file=.env.local scripts/seed-demo-images.mjs のように読み込ませてください`
    )
  }
  return value
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("id", TEAM_ID)
    .maybeSingle()

  if (teamError) {
    throw new Error(`チームの確認に失敗しました: ${teamError.message}`)
  }
  if (!team) {
    throw new Error(
      `${TEAM_ID} チームが存在しません。先にマイグレーション（と seed.sql）を適用してください`
    )
  }

  const rows = []

  for (const image of IMAGES) {
    const bytes = await readFile(join(ROOT, "supabase/demo-images", image.file))
    const storagePath = `${TEAM_ID}/${image.kind}/${image.file}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: "image/png",
        cacheControl: "31536000",
        // 固定パスに毎回上書きする（再実行でファイルが増えないようにするため）
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`${image.file} のアップロードに失敗しました: ${uploadError.message}`)
    }

    rows.push({
      id: image.id,
      team_id: TEAM_ID,
      kind: image.kind,
      storage_path: storagePath,
      mime_type: "image/png",
      size_bytes: bytes.byteLength,
      width: image.width,
      height: image.height,
      position_y: image.positionY,
      // デモデータのため作成者は紐付けない
      created_by: null,
    })

    console.log(`uploaded ${storagePath} (${bytes.byteLength} bytes)`)
  }

  const { error: upsertError } = await supabase
    .from("team_images")
    .upsert(rows, { onConflict: "id" })

  if (upsertError) {
    throw new Error(`team_images の登録に失敗しました: ${upsertError.message}`)
  }

  // このスクリプトが管理する4枚以外がデモチームに残っていたら取り除く
  const keepIds = IMAGES.map((image) => image.id)
  const { data: stale, error: staleError } = await supabase
    .from("team_images")
    .select("id, storage_path")
    .eq("team_id", TEAM_ID)
    .not("id", "in", `(${keepIds.join(",")})`)

  if (staleError) {
    throw new Error(`不要な画像の確認に失敗しました: ${staleError.message}`)
  }

  if (stale && stale.length > 0) {
    const { error: deleteError } = await supabase
      .from("team_images")
      .delete()
      .in("id", stale.map((row) => row.id))
    if (deleteError) {
      throw new Error(`不要な画像の削除に失敗しました: ${deleteError.message}`)
    }
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove(stale.map((row) => row.storage_path))
    if (removeError) {
      console.warn(`[demo-images] 古いファイルの削除に失敗しました: ${removeError.message}`)
    }
    console.log(`removed ${stale.length} stale image(s)`)
  }

  console.log(`done: ${rows.length} image(s) for team ${TEAM_ID}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
