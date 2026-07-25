import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { NewTeamForm } from "./new-team-form"

export default async function NewTeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-3">ログインが必要です</h1>
          <p className="text-slate-500 mb-6">
            新しいチームを作成するには、いずれかのチームの管理者としてログインしてください
          </p>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 underline">
            トップページに戻る
          </Link>
        </div>
      </main>
    )
  }

  return <NewTeamForm />
}
