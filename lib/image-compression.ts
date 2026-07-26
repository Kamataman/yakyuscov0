/**
 * ブラウザ専用の画像圧縮ユーティリティ。
 *
 * Server Actions のリクエストボディには上限があるため、アップロード前に
 * クライアント側で縮小・再エンコードしてから送信する。
 */
import {
  TEAM_IMAGE_JPEG_QUALITY,
  TEAM_IMAGE_MAX_EDGE_PX,
  isAllowedTeamImageMime,
} from "@/lib/team-images"

/** これ以下のサイズかつ十分小さい画像は再エンコードせず原本を送る */
const SKIP_COMPRESSION_BYTES = 1024 * 1024

export interface CompressedImage {
  file: File
  width: number
  height: number
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    // EXIF の回転情報を反映させる（スマホ撮影の縦写真が横向きになるのを防ぐ）
    return await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch (error) {
    throw new Error(
      `画像を読み込めませんでした（対応形式はJPEG・PNG・WebPです）: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("画像の変換に失敗しました"))
        }
      },
      "image/jpeg",
      quality
    )
  })
}

/**
 * 長辺を TEAM_IMAGE_MAX_EDGE_PX 以内に縮小し、JPEGとして再エンコードする。
 * 既に小さい画像は原本のまま返す（PNGの透過を保持できる）。
 */
export async function compressTeamImage(file: File): Promise<CompressedImage> {
  const bitmap = await decode(file)

  try {
    const { width, height } = bitmap
    const longestEdge = Math.max(width, height)
    const needsResize = longestEdge > TEAM_IMAGE_MAX_EDGE_PX

    if (
      !needsResize &&
      file.size <= SKIP_COMPRESSION_BYTES &&
      isAllowedTeamImageMime(file.type)
    ) {
      return { file, width, height }
    }

    const scale = needsResize ? TEAM_IMAGE_MAX_EDGE_PX / longestEdge : 1
    const targetWidth = Math.round(width * scale)
    const targetHeight = Math.round(height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = targetHeight

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("画像の変換に失敗しました（canvasを利用できません）")
    }

    // JPEGは透過を扱えないため、透過部分が黒くならないよう白で塗りつぶす
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, targetWidth, targetHeight)
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    const blob = await toBlob(canvas, TEAM_IMAGE_JPEG_QUALITY)
    const compressed = new File([blob], "image.jpg", { type: "image/jpeg" })

    return { file: compressed, width: targetWidth, height: targetHeight }
  } finally {
    bitmap.close()
  }
}
