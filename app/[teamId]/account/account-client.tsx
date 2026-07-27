"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface Props {
  teamId: string
}

export function AccountClient({ teamId }: Props) {
  const [email, setEmail] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (newPassword.length < 8) {
      setError("新しいパスワードは8文字以上で入力してください")
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError("新しいパスワードが一致しません")
      return
    }
    if (!email) {
      setError("ログイン情報を確認できませんでした。再度ログインしてください")
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      // 現在のパスワードを確認してから変更する
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (verifyError) {
        setError("現在のパスワードが正しくありません")
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(updateError.message || "パスワードの変更に失敗しました")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setNewPasswordConfirm("")
      setSuccess(true)
    } catch {
      setError("パスワードの変更に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md p-4 md:p-6">
        <Link
          href={`/${teamId}/settings`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          チーム設定に戻る
        </Link>

        <div className="border border-border p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="diamond-mark flex h-12 w-12 items-center justify-center bg-turf">
              <KeyRound className="h-6 w-6 text-turf-foreground -rotate-45" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">パスワードを変更</h1>
              {email && <p className="text-sm text-muted-foreground">{email}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border border-stitch/40 bg-stitch/10 px-4 py-3 text-sm text-stitch">
                {error}
              </div>
            )}
            {success && (
              <div className="border border-turf/40 bg-turf/10 px-4 py-3 text-sm text-turf">
                パスワードを変更しました
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">現在のパスワード</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">新しいパスワード</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8文字以上"
                required
                className="h-12"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">新しいパスワード（確認）</label>
              <Input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="もう一度入力"
                required
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-turf hover:bg-turf/90 text-turf-foreground font-semibold"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "パスワードを変更する"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
