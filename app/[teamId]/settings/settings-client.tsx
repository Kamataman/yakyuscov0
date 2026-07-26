"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImageIcon, Loader2, Upload } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { compressTeamImage } from "@/lib/image-compression"
import {
  TEAM_IMAGE_ALLOWED_MIME_TYPES,
  TEAM_IMAGE_LIMITS,
  TEAM_IMAGE_MAX_SOURCE_BYTES,
  type TeamImage,
  type TeamImageKind,
  formatMegabytes,
  isAllowedTeamImageMime,
} from "@/lib/team-images"
import { updateHeaderImagePosition, uploadTeamImage } from "./actions"

interface SettingsClientProps {
  teamId: string
  teamName: string
  initialHeaderImage: TeamImage | null
  initialPhotos: TeamImage[]
}

const ACCEPT = TEAM_IMAGE_ALLOWED_MIME_TYPES.join(",")

function validateSource(file: File): void {
  if (!isAllowedTeamImageMime(file.type)) {
    throw new Error(`${file.name}: JPEG・PNG・WebP形式の画像のみアップロードできます`)
  }
  if (file.size > TEAM_IMAGE_MAX_SOURCE_BYTES) {
    throw new Error(
      `${file.name}: ファイルサイズが大きすぎます（${formatMegabytes(TEAM_IMAGE_MAX_SOURCE_BYTES)}以下にしてください）`
    )
  }
}

export function SettingsClient({
  teamId,
  teamName,
  initialHeaderImage,
  initialPhotos,
}: SettingsClientProps) {
  const router = useRouter()
  const headerInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [headerImage, setHeaderImage] = useState<TeamImage | null>(initialHeaderImage)
  const [photos, setPhotos] = useState<TeamImage[]>(initialPhotos)
  const [positionY, setPositionY] = useState(initialHeaderImage?.positionY ?? 50)
  const [uploadingKind, setUploadingKind] = useState<TeamImageKind | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [isSavingPosition, setIsSavingPosition] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isBusy = uploadingKind !== null || isSavingPosition
  const isPositionDirty =
    headerImage !== null && positionY !== headerImage.positionY

  const upload = async (kind: TeamImageKind, files: File[]) => {
    setError(null)
    setMessage(null)
    setUploadingKind(kind)
    setProgress({ done: 0, total: files.length })

    try {
      let latest: TeamImage[] = []
      for (const [index, file] of files.entries()) {
        validateSource(file)
        const compressed = await compressTeamImage(file)

        const formData = new FormData()
        formData.append("kind", kind)
        formData.append("file", compressed.file)
        formData.append("width", String(compressed.width))
        formData.append("height", String(compressed.height))

        latest = await uploadTeamImage(teamId, formData)
        setProgress({ done: index + 1, total: files.length })
      }

      if (kind === "header") {
        const next = latest[0] ?? null
        setHeaderImage(next)
        setPositionY(next?.positionY ?? 50)
        setMessage("ヘッダー画像を更新しました")
      } else {
        setPhotos(latest)
        setMessage(`チーム写真を${files.length}枚追加しました`)
      }
      router.refresh()
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "画像のアップロードに失敗しました"
      )
    } finally {
      setUploadingKind(null)
      setProgress(null)
    }
  }

  const handleSelect = async (
    kind: TeamImageKind,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return
    await upload(kind, files)
  }

  const handleSavePosition = async () => {
    if (!headerImage) return
    setError(null)
    setMessage(null)
    setIsSavingPosition(true)
    try {
      await updateHeaderImagePosition(teamId, headerImage.id, positionY)
      setHeaderImage({ ...headerImage, positionY })
      setMessage("表示位置を保存しました")
      router.refresh()
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "表示位置の保存に失敗しました"
      )
    } finally {
      setIsSavingPosition(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <h1 className="mb-6 text-xl font-bold text-slate-800">チーム設定</h1>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        {/* ヘッダー画像 */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-base font-bold text-slate-800">ヘッダー画像</h2>
          <p className="mt-1 text-xs text-slate-500">
            チームトップの上部に表示されます。新しい画像をアップロードすると、これまでの画像は削除されます。
          </p>

          <div className="mt-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-slate-200 md:h-56">
            {headerImage ? (
              <Image
                src={headerImage.url}
                alt={teamName}
                width={headerImage.width ?? 1200}
                height={headerImage.height ?? 400}
                className="h-full w-full object-cover"
                style={{ objectPosition: `50% ${positionY}%` }}
              />
            ) : (
              <span className="text-sm text-slate-500">未設定</span>
            )}
          </div>

          {headerImage && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">
                  表示位置（上下）
                </label>
                <span className="text-xs text-slate-500">{positionY}%</span>
              </div>
              <Slider
                className="mt-2"
                min={0}
                max={100}
                step={1}
                value={[positionY]}
                onValueChange={([value]) => setPositionY(value)}
                disabled={isBusy}
              />
              <button
                type="button"
                onClick={handleSavePosition}
                disabled={!isPositionDirty || isBusy}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSavingPosition && <Loader2 className="h-4 w-4 animate-spin" />}
                表示位置を保存
              </button>
            </div>
          )}

          <input
            ref={headerInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => handleSelect("header", event)}
          />
          <button
            type="button"
            onClick={() => headerInputRef.current?.click()}
            disabled={isBusy}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploadingKind === "header" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {headerImage ? "画像を変更" : "画像をアップロード"}
          </button>
        </section>

        {/* チーム写真 */}
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">チーム写真</h2>
            <span className="text-xs text-slate-500">
              {photos.length}/{TEAM_IMAGE_LIMITS.photo}枚
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            チームトップにカルーセルで新しい順に表示されます。
            {TEAM_IMAGE_LIMITS.photo}枚を超えると、古い写真から自動的に削除されます。
          </p>

          {photos.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-slate-50 py-10 text-center">
              <ImageIcon className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">まだ写真がありません</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-lg bg-slate-100"
                >
                  <Image
                    src={photo.url}
                    alt=""
                    width={photo.width ?? 640}
                    height={photo.height ?? 360}
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <input
            ref={photoInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(event) => handleSelect("photo", event)}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isBusy}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploadingKind === "photo" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            写真を追加
          </button>

          {progress && progress.total > 1 && (
            <span className="ml-3 text-xs text-slate-500">
              {progress.done}/{progress.total}枚 アップロード中
            </span>
          )}

          <p className="mt-3 text-xs text-slate-400">
            JPEG・PNG・WebP形式、1枚{formatMegabytes(TEAM_IMAGE_MAX_SOURCE_BYTES)}まで。
            アップロード時に自動で縮小されます。
          </p>
        </section>
      </div>
    </main>
  )
}
