import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "@/components/app-header"

interface Props {
  children: React.ReactNode
  params: Promise<{ teamId: string }>
}

export default async function TeamLayout({ children, params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .single()

  if (!data) {
    notFound()
  }

  return (
    <>
      <AppHeader />
      {children}
    </>
  )
}
