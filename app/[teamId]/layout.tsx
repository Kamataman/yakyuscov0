import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"

interface Props {
  children: React.ReactNode
  params: Promise<{ teamId: string }>
}

export default async function TeamLayout({ children, params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single()

  if (!data) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader teamName={data.name} />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  )
}
