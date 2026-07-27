"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { submitContactForm } from "./actions"

declare global {
  interface Window {
    onContactTurnstileVerify?: (token: string) => void
    onContactTurnstileExpire?: () => void
  }
}

interface Props {
  teamId: string
  privacyText: string
  siteKey: string
}

export default function ContactForm({ teamId, privacyText, siteKey }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const widgetRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    agreedToPrivacy: false,
    honeypot: "",
  })

  useEffect(() => {
    window.onContactTurnstileVerify = (token: string) => setTurnstileToken(token)
    window.onContactTurnstileExpire = () => setTurnstileToken("")
    return () => {
      window.onContactTurnstileVerify = undefined
      window.onContactTurnstileExpire = undefined
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.email.trim()) {
      setError("メールアドレスを入力してください")
      return
    }
    if (form.message.trim().length < 10) {
      setError("問い合わせ内容は10文字以上で入力してください")
      return
    }
    if (form.message.length > 2000) {
      setError("問い合わせ内容は2000文字以内で入力してください")
      return
    }
    if (!form.agreedToPrivacy) {
      setError("プライバシーポリシーへの同意が必要です")
      return
    }
    if (!turnstileToken) {
      setError("認証を完了してください")
      return
    }

    setIsSubmitting(true)
    try {
      await submitContactForm(teamId, {
        name: form.name,
        email: form.email,
        message: form.message,
        agreedToPrivacy: form.agreedToPrivacy,
        turnstileToken,
        honeypot: form.honeypot,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-500" />
        <p className="font-bold text-slate-800">送信しました</p>
        <p className="mt-2 text-sm text-slate-500">
          お問い合わせいただきありがとうございます。チームの担当者からの返信をお待ちください。
        </p>
      </div>
    )
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* お名前 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            お名前（任意）
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={50}
            placeholder="山田 太郎"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* メールアドレス */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            連絡先メールアドレス
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={254}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">返信が届く可能性のあるアドレスを入力してください</p>
        </div>

        {/* 問い合わせ内容 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            問い合わせ内容
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            maxLength={2000}
            rows={6}
            placeholder="試合のお誘いやチーム参加のご連絡など"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{form.message.length} / 2000文字</p>
        </div>

        {/* ハニーポット（人間には見えない） */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
          <label htmlFor="website">ウェブサイト</label>
          <input
            id="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.honeypot}
            onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
          />
        </div>

        {/* プライバシーポリシー */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            プライバシーポリシー
          </label>
          <textarea
            readOnly
            value={privacyText}
            rows={6}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 resize-none overflow-y-auto"
          />
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              id="agreedToPrivacy"
              checked={form.agreedToPrivacy}
              onCheckedChange={(c) => setForm({ ...form, agreedToPrivacy: c === true })}
            />
            <label htmlFor="agreedToPrivacy" className="cursor-pointer text-sm text-slate-700">
              プライバシーポリシーに同意します
            </label>
          </div>
        </div>

        {/* Turnstile */}
        <div
          ref={widgetRef}
          className="cf-turnstile"
          data-sitekey={siteKey}
          data-callback="onContactTurnstileVerify"
          data-expired-callback="onContactTurnstileExpire"
        />

        {/* エラーメッセージ */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            "送信する"
          )}
        </button>
      </form>
    </>
  )
}
