import { createServiceClient } from "@/lib/supabase/service"
import { ResetPasswordForm } from "./reset-password-form"

interface Props {
  params: Promise<{ token: string }>
}

export default async function PasswordResetTokenPage({ params }: Props) {
  const { token } = await params
  const db = createServiceClient()

  const { data: resetToken } = await db
    .from("password_reset_tokens")
    .select("expires_at, used_at")
    .eq("token", token)
    .maybeSingle()

  const isExpired = resetToken ? new Date(resetToken.expires_at) < new Date() : false
  const isUsed = !!resetToken?.used_at
  const isValid = !!resetToken && !isExpired && !isUsed

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {isValid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 mb-3">リンクが無効です</h1>
            <p className="text-slate-500 text-sm">
              {isUsed
                ? "このリンクは既に使用されています。"
                : isExpired
                  ? "このリンクの有効期限が切れています。"
                  : "リンクが見つかりませんでした。"}
              {" "}もう一度パスワード再設定をお試しください。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
