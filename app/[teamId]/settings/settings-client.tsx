"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
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
import { deleteTeamImage, updateHeaderImagePosition, uploadTeamImage } from "./actions"
import { TeamProfileSection } from "./team-profile-section"
import { AdminsSection, type TeamMember } from "./admins-section"

interface SettingsClientProps {
  teamId: string
  teamName: string
  teamDescription: string
  initialHeaderImage: TeamImage | null
  initialPhotos: TeamImage[]
  currentUserId: string
  currentRole: "owner" | "admin"
  initialMembers: TeamMember[]
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
  teamDescription,
  initialHeaderImage,
  initialPhotos,
  currentUserId,
  currentRole,
  initialMembers,
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
  const [deleteTarget, setDeleteTarget] = useState<{ kind: TeamImageKind; id: string } | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isBusy = uploadingKind !== null || isSavingPosition || isDeleting
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setError(null)
    setMessage(null)
    setIsDeleting(true)
    try {
      await deleteTeamImage(teamId, deleteTarget.id)
      if (deleteTarget.kind === "header") {
        setHeaderImage(null)
        setPositionY(50)
        setMessage("ヘッダー画像を削除しました")
      } else {
        setPhotos((prev) => prev.filter((photo) => photo.id !== deleteTarget.id))
        setMessage("チーム写真を削除しました")
      }
      router.refresh()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "画像の削除に失敗しました"
      )
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <h1 className="mb-6 text-xl font-bold text-foreground border-b-4 border-foreground pb-2">チーム設定</h1>

        {error && (
          <p className="mb-4 bg-stitch/10 border border-stitch/40 px-4 py-3 text-sm text-stitch">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 bg-turf/10 border border-turf/40 px-4 py-3 text-sm text-turf">
            {message}
          </p>
        )}

        <TeamProfileSection
          teamId={teamId}
          initialName={teamName}
          initialDescription={teamDescription}
        />

        <AdminsSection
          teamId={teamId}
          currentUserId={currentUserId}
          currentRole={currentRole}
          initialMembers={initialMembers}
        />

        {/* ヘッダー画像 */}
        <section className="mb-6 border border-border p-6">
          <h2 className="text-base font-bold text-foreground">ヘッダー画像</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            チームトップの上部に表示されます。新しい画像をアップロードすると、これまでの画像は削除されます。
          </p>

          <div className="mt-4 flex h-40 w-full items-center justify-center overflow-hidden bg-muted md:h-56">
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
              <span className="text-sm text-muted-foreground">未設定</span>
            )}
          </div>

          {headerImage && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  表示位置（上下）
                </label>
                <span className="text-xs text-muted-foreground">{positionY}%</span>
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
                className="mt-3 inline-flex items-center gap-2 bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
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
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => headerInputRef.current?.click()}
              disabled={isBusy}
              className="inline-flex items-center gap-2 bg-turf px-4 py-2 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploadingKind === "header" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {headerImage ? "画像を変更" : "画像をアップロード"}
            </button>
            {headerImage && (
              <button
                type="button"
                onClick={() => setDeleteTarget({ kind: "header", id: headerImage.id })}
                disabled={isBusy}
                className="inline-flex items-center gap-2 border border-stitch px-4 py-2 text-sm font-bold text-stitch transition-colors hover:bg-stitch/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                画像を削除
              </button>
            )}
          </div>
        </section>

        {/* チーム写真 */}
        <section className="border border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">チーム写真</h2>
            <span className="text-xs text-muted-foreground">
              {photos.length}/{TEAM_IMAGE_LIMITS.photo}枚
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            チームトップにカルーセルで新しい順に表示されます。
            {TEAM_IMAGE_LIMITS.photo}枚を超えると、古い写真から自動的に削除されます。
          </p>

          {photos.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center bg-muted py-10 text-center">
              <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">まだ写真がありません</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-muted"
                >
                  {/* チームトップと同じく切り抜かずに全体を表示する */}
                  <Image
                    src={photo.url}
                    alt=""
                    width={photo.width ?? 640}
                    height={photo.height ?? 360}
                    className="max-h-full w-auto max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ kind: "photo", id: photo.id })}
                    disabled={isBusy}
                    aria-label="この写真を削除"
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-black/60 text-white transition-colors hover:bg-stitch disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
            className="mt-4 inline-flex items-center gap-2 bg-turf px-4 py-2 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploadingKind === "photo" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            写真を追加
          </button>

          {progress && progress.total > 1 && (
            <span className="ml-3 text-xs text-muted-foreground">
              {progress.done}/{progress.total}枚 アップロード中
            </span>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            JPEG・PNG・WebP形式、1枚{formatMegabytes(TEAM_IMAGE_MAX_SOURCE_BYTES)}まで。
            アップロード時に自動で縮小されます。
          </p>
        </section>
      </div>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={
          deleteTarget?.kind === "header" ? "ヘッダー画像を削除しますか？" : "この写真を削除しますか？"
        }
        description="この操作は取り消せません。"
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
      />
    </main>
  )
}
