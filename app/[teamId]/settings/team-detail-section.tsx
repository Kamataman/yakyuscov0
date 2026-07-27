"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { updateTeamProfileDetails, type TeamProfileDetailFields } from "./actions"

interface Props {
  teamId: string
  initialFields: TeamProfileDetailFields
}

const SHORT_FIELDS: {
  key: Exclude<keyof TeamProfileDetailFields, "notes">
  label: string
  placeholder: string
}[] = [
  { key: "activityArea", label: "活動地域", placeholder: "例: 東京都江東区・墨田区周辺" },
  { key: "activityDays", label: "活動曜日", placeholder: "例: 主に日曜（月2〜3回）" },
  { key: "teamLevel", label: "チームレベル", placeholder: "例: 経験者中心・初心者歓迎" },
  { key: "league", label: "所属リーグ・大会", placeholder: "例: ◯◯区軟式野球連盟 2部" },
  { key: "foundedPeriod", label: "結成時期", placeholder: "例: 2018年春" },
  { key: "averageAge", label: "平均年齢", placeholder: "例: 32歳（20代〜40代）" },
]

export function TeamDetailSection({ teamId, initialFields }: Props) {
  const router = useRouter()
  const [fields, setFields] = useState<TeamProfileDetailFields>(initialFields)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isDirty = SHORT_FIELDS.some(({ key }) => fields[key] !== initialFields[key]) ||
    fields.notes !== initialFields.notes

  const handleSave = async () => {
    setError(null)
    setMessage(null)
    setIsSaving(true)
    try {
      await updateTeamProfileDetails(teamId, fields)
      setMessage("チームプロフィールを保存しました")
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mb-6 border border-border p-6">
      <h2 className="text-base font-bold text-foreground">チームプロフィール</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        チームトップに表示されます。未入力の項目は表示されません。
      </p>

      {error && (
        <p className="mt-3 bg-stitch/10 border border-stitch/40 px-4 py-3 text-sm text-stitch">{error}</p>
      )}
      {message && (
        <p className="mt-3 bg-turf/10 border border-turf/40 px-4 py-3 text-sm text-turf">{message}</p>
      )}

      {SHORT_FIELDS.map(({ key, label, placeholder }) => (
        <div key={key} className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
          <input
            type="text"
            value={fields[key]}
            onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
            maxLength={100}
            placeholder={placeholder}
            className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
          />
        </div>
      ))}

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-foreground">その他</label>
        <textarea
          value={fields.notes}
          onChange={(e) => setFields((prev) => ({ ...prev, notes: e.target.value }))}
          rows={3}
          maxLength={300}
          placeholder="例: 助っ人歓迎です。詳しくは問い合わせフォームから。"
          className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className="mt-4 inline-flex items-center gap-2 bg-turf px-4 py-2 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        保存
      </button>
    </section>
  )
}
