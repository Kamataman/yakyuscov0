"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requestPasswordReset } from "./actions"

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await requestPasswordReset(email)
    } finally {
      setIsLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="border border-border p-8 max-w-md w-full">
        {submitted ? (
          <div className="text-center">
            <div className="diamond-mark w-16 h-16 bg-turf flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-turf-foreground -rotate-45" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-3">メールを送信しました</h1>
            <p className="text-muted-foreground text-sm">
              入力されたメールアドレスが登録済みの場合、パスワード再設定用のリンクを送信しました。
              しばらく待っても届かない場合は、メールアドレスが登録されていない可能性があります。
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">パスワードをお忘れですか？</h1>
              <p className="text-muted-foreground mt-2">登録済みのメールアドレスを入力してください</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">メールアドレス</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-turf hover:bg-turf/90 text-turf-foreground font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "再設定メールを送信"
                )}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
