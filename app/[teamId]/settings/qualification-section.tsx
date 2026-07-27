"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { updateQualificationCoefficients } from "./actions"

interface Props {
  teamId: string
  initialPaCoefficient: number
  initialIpCoefficient: number
}

export function QualificationSection({ teamId, initialPaCoefficient, initialIpCoefficient }: Props) {
  const router = useRouter()
  const [paCoefficient, setPaCoefficient] = useState(String(initialPaCoefficient))
  const [ipCoefficient, setIpCoefficient] = useState(String(initialIpCoefficient))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isDirty =
    paCoefficient !== String(initialPaCoefficient) || ipCoefficient !== String(initialIpCoefficient)

  const handleSave = async () => {
    setError(null)
    setMessage(null)

    const parsedPa = Number(paCoefficient)
    const parsedIp = Number(ipCoefficient)

    if (!Number.isFinite(parsedPa) || parsedPa <= 0) {
      setError("規定打席の係数には正の数値を入力してください")
      return
    }
    if (!Number.isFinite(parsedIp) || parsedIp <= 0) {
      setError("規定投球回の係数には正の数値を入力してください")
      return
    }

    setIsSaving(true)
    try {
      await updateQualificationCoefficients(teamId, parsedPa, parsedIp)
      setMessage("規定打席・規定投球回の係数を保存しました")
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mb-6 border border-border p-6">
      <h2 className="text-base font-bold text-foreground">規定打席・規定投球回</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        個人成績画面で規定到達を判定する係数です。規定打席・規定投球回は「試合数 × 係数」で算出されます。
      </p>

      {error && (
        <p className="mt-3 bg-stitch/10 border border-stitch/40 px-4 py-3 text-sm text-stitch">{error}</p>
      )}
      {message && (
        <p className="mt-3 bg-turf/10 border border-turf/40 px-4 py-3 text-sm text-turf">{message}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">規定打席の係数</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0.1"
            max="99.99"
            value={paCoefficient}
            onChange={(e) => setPaCoefficient(e.target.value)}
            className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
          />
          <p className="mt-1 text-xs text-muted-foreground">デフォルト: 3.1</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">規定投球回の係数</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0.1"
            max="99.99"
            value={ipCoefficient}
            onChange={(e) => setIpCoefficient(e.target.value)}
            className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
          />
          <p className="mt-1 text-xs text-muted-foreground">デフォルト: 1</p>
        </div>
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
