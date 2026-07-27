"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { submitContactForm } from "./actions"

interface TurnstileRenderOptions {
  sitekey: string
  callback: (token: string) => void
  "expired-callback": () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
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
  const widgetIdRef = useRef<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    agreedToPrivacy: false,
    honeypot: "",
  })

  // Turnstileの暗黙的レンダリング（class="cf-turnstile"の自動スキャン）は
  // スクリプト読み込み時にしか走らないため、クライアントサイド遷移で
  // このコンポーネントが再マウントされてもウィジェットが再描画されない。
  // 明示的にrender()を呼ぶことで、毎回のマウント時に確実に描画する。
  useEffect(() => {
    let cancelled = false
    let pollId: ReturnType<typeof setInterval> | undefined

    const renderWidget = () => {
      if (cancelled || !window.turnstile || !widgetRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      pollId = setInterval(() => {
        if (window.turnstile) {
          if (pollId) clearInterval(pollId)
          renderWidget()
        }
      }, 100)
    }

    return () => {
      cancelled = true
      if (pollId) clearInterval(pollId)
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

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
      // Turnstileのトークンは1回しか使えないため、失敗時は次回に備えてリセットする
      setTurnstileToken("")
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 className="mb-3 h-12 w-12 text-turf" />
        <p className="font-bold text-foreground">送信しました</p>
        <p className="mt-2 text-sm text-muted-foreground">
          お問い合わせいただきありがとうございます。チームの担当者からの返信をお待ちください。
        </p>
      </div>
    )
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* お名前 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            お名前（任意）
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={50}
            placeholder="山田 太郎"
            className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
          />
        </div>

        {/* メールアドレス */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            連絡先メールアドレス
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={254}
            placeholder="you@example.com"
            className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
          />
          <p className="mt-1 text-xs text-muted-foreground">返信が届く可能性のあるアドレスを入力してください</p>
        </div>

        {/* 問い合わせ内容 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            問い合わせ内容
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            maxLength={2000}
            rows={6}
            placeholder="試合のお誘いやチーム参加のご連絡など"
            className="w-full border border-input px-4 py-3 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{form.message.length} / 2000文字</p>
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
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            プライバシーポリシー
          </label>
          <textarea
            readOnly
            value={privacyText}
            rows={6}
            className="w-full border border-input bg-muted px-3 py-2 text-xs text-muted-foreground resize-none overflow-y-auto"
          />
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              id="agreedToPrivacy"
              checked={form.agreedToPrivacy}
              onCheckedChange={(c) => setForm({ ...form, agreedToPrivacy: c === true })}
            />
            <label htmlFor="agreedToPrivacy" className="cursor-pointer text-sm text-foreground">
              プライバシーポリシーに同意します
            </label>
          </div>
        </div>

        {/* Turnstile */}
        <div ref={widgetRef} />

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-stitch/10 border border-stitch/40 p-3 text-sm text-stitch">{error}</div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 bg-turf px-4 py-3 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
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
