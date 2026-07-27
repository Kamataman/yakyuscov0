"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, UserCog, Loader2, X, Trash2, Shield, ShieldCheck } from "lucide-react"
import { inviteMember, removeMember } from "./admins-actions"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"

export interface TeamMember {
  id: string
  userId: string
  role: "owner" | "admin"
  email: string | null
  displayName: string | null
  createdAt: string
}

interface AdminsSectionProps {
  teamId: string
  currentUserId: string
  currentRole: "owner" | "admin"
  initialMembers: TeamMember[]
}

export function AdminsSection({ teamId, currentUserId, currentRole, initialMembers }: AdminsSectionProps) {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [isInviting, setIsInviting] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<"owner" | "admin">("admin")
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleInvite = async () => {
    if (!newEmail.trim()) {
      alert("メールアドレスを入力してください")
      return
    }
    setIsSaving(true)
    try {
      await inviteMember(teamId, newEmail.trim(), newRole)
      setNewEmail("")
      setIsInviting(false)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "招待に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const canRemove = (member: TeamMember) => {
    if (member.userId === currentUserId) return false
    if (member.role === "owner" && currentRole !== "owner") return false
    return true
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setIsDeleting(true)
    try {
      await removeMember(teamId, target.userId)
      setMembers((prev) => prev.filter((m) => m.userId !== target.userId))
      setDeleteTarget(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="mb-6 border border-border p-6">
      <h2 className="text-base font-bold text-foreground">管理者</h2>

      {!isInviting && (
        <button
          onClick={() => setIsInviting(true)}
          className="diagonal-cut mt-4 flex w-full items-center justify-center gap-2 bg-turf px-4 py-3 text-turf-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          <PlusCircle className="h-5 w-5" />
          <span className="font-bold">管理者を招待</span>
        </button>
      )}

      {isInviting && (
        <div className="mt-4 border border-border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-foreground">管理者を招待</h3>
            <button
              onClick={() => setIsInviting(false)}
              className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            招待メールを送信します。既にこのアプリを利用しているメールアドレスの場合は、そのままチームに追加されます。
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@example.com"
              className="flex-1 border border-input px-3 py-2 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
            />
            {currentRole === "owner" && (
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "owner" | "admin")}
                className="border border-input px-3 py-2 text-sm focus:border-turf focus:outline-none focus:ring-1 focus:ring-turf"
              >
                <option value="admin">管理者</option>
                <option value="owner">オーナー</option>
              </select>
            )}
            <button
              onClick={handleInvite}
              disabled={isSaving}
              className="flex items-center gap-2 bg-turf px-4 py-2 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "招待"}
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="mt-4 bg-muted p-8 text-center">
          <UserCog className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">管理者がいません</p>
        </div>
      ) : (
        <div className="mt-4 border border-border">
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {member.role === "owner" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <Shield className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {member.displayName || member.email || member.userId}
                    {member.userId === currentUserId && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(あなた)</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {member.role === "owner" ? "オーナー" : "管理者"}
                    {member.email && member.displayName ? ` ・ ${member.email}` : ""}
                  </div>
                </div>
                {canRemove(member) && (
                  <button
                    onClick={() => setDeleteTarget(member)}
                    className="p-2 text-muted-foreground hover:bg-muted hover:text-stitch"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="管理者から外しますか？"
        description="この操作は取り消せません。認証アカウント自体は削除されないため、他に所属チームがあればそちらへの影響はありません。"
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </section>
  )
}
