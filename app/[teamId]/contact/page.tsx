import { readFileSync } from "fs"
import { join } from "path"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createServiceClient } from "@/lib/supabase/service"
import ContactForm from "./contact-form"

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function ContactPage({ params }: Props) {
  const { teamId } = await params
  const db = createServiceClient()

  const [teamResult, ownerResult] = await Promise.all([
    db.from("teams").select("name").eq("id", teamId).single(),
    db
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("role", "owner"),
  ])

  if (!teamResult.data || !ownerResult.count) {
    notFound()
  }

  const privacyText = readFileSync(join(process.cwd(), "public", "privacy.txt"), "utf-8")
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link
          href={`/${teamId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          チームページに戻る
        </Link>

        <div className="border border-border p-6 md:p-8">
          <h1 className="mb-1 text-2xl font-bold text-foreground">
            {teamResult.data.name} への問い合わせ
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            試合のお誘いやチーム参加のご連絡など、このチームへの問い合わせにご利用ください。
          </p>
          <ContactForm teamId={teamId} privacyText={privacyText} siteKey={siteKey} />
        </div>
      </div>
    </main>
  )
}
