import { createServiceClient } from "@/lib/supabase/service"
import { InviteAcceptForm } from "./invite-accept-form"

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const db = createServiceClient()

  const { data: invite } = await db
    .from("team_invites")
    .select("email, role, expires_at, accepted_at, teams(name)")
    .eq("token", token)
    .maybeSingle()

  const team = invite?.teams as unknown as { name: string } | null
  const isExpired = invite ? new Date(invite.expires_at) < new Date() : false
  const isAccepted = !!invite?.accepted_at
  const isValid = !!invite && !isExpired && !isAccepted

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="border border-border p-8 max-w-md w-full">
        {isValid && invite && team ? (
          <InviteAcceptForm
            token={token}
            email={invite.email}
            teamName={team.name}
            role={invite.role as "owner" | "admin"}
          />
        ) : (
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-3">招待リンクが無効です</h1>
            <p className="text-muted-foreground text-sm">
              {isAccepted
                ? "このリンクは既に使用されています。"
                : isExpired
                  ? "このリンクの有効期限が切れています。"
                  : "招待リンクが見つかりませんでした。"}
              {" "}管理者に再招待を依頼してください。
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
