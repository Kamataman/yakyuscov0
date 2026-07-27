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
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="border border-border p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-foreground mb-3">ログインが必要です</h1>
          <p className="text-muted-foreground mb-6">
            新しいチームを作成するには、いずれかのチームの管理者としてログインしてください
          </p>
          <Link href="/" className="text-sm text-turf hover:text-turf/80 underline">
            トップページに戻る
          </Link>
        </div>
      </main>
    )
  }

  return <NewTeamForm />
}
