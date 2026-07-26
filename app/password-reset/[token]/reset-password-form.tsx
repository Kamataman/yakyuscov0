"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { resetPassword } from "./actions"

interface Props {
  token: string
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください")
      return
    }
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません")
      return
    }

    setIsLoading(true)
    try {
      const { email } = await resetPassword(token, password)

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        router.push("/")
        return
      }

      const res = await fetch("/api/auth/my-team")
      const { teamId } = (await res.json()) as { teamId: string | null }

      if (teamId) {
        router.push(`/${teamId}`)
        router.refresh()
      } else {
        router.push("/")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "パスワードの再設定に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">新しいパスワードを設定</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">新しいパスワード</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            required
            className="h-12"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">新しいパスワード（確認）</label>
          <Input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="もう一度入力"
            required
            className="h-12"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              設定中...
            </>
          ) : (
            "パスワードを再設定する"
          )}
        </Button>
      </form>
    </>
  )
}
