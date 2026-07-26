"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { acceptInvite } from "./actions"

interface Props {
  token: string
  email: string
  teamName: string
  role: "owner" | "admin"
}

export function InviteAcceptForm({ token, email, teamName, role }: Props) {
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
      const { teamId } = await acceptInvite(token, password)

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        // 招待前から同じメールアドレスのアカウントが既に存在していたケース
        router.push(`/${teamId}/login`)
        return
      }

      router.push(`/${teamId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "パスワードの設定に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const roleLabel = role === "owner" ? "オーナー" : "管理者"

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">パスワードを設定</h1>
        <p className="text-slate-500 mt-2">
          <strong>{teamName}</strong> の{roleLabel}として招待されました。ログインに使うパスワードを設定してください
        </p>
        <p className="text-slate-400 text-sm mt-1">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
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
          <label className="block text-sm font-medium text-slate-700 mb-1">パスワード（確認）</label>
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
            "パスワードを設定してはじめる"
          )}
        </Button>
      </form>
    </>
  )
}
