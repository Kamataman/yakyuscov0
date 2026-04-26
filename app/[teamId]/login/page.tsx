"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TeamLoginPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/teams/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "ログインに失敗しました")
        return
      }

      // ログイン成功
      router.push(`/${teamId}`)
      router.refresh()
    } catch {
      setError("ログインに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">管理者ログイン</h1>
          <p className="text-slate-500 mt-2">
            チーム設定や選手管理を行うにはログインが必要です
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              メールアドレス
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="h-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              パスワード
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
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
                ログイン中...
              </>
            ) : (
              "ログイン"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href={`/${teamId}`}
            className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            チームページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
