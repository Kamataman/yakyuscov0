"use client"

import { useLinkStatus } from "next/link"
import { Loader2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavLinkIconProps {
  icon: LucideIcon
  className?: string
}

/**
 * ナビゲーション用アイコン。<Link> の子孫として配置し、
 * 遷移待ちの間だけ同サイズのスピナーに差し替える(レイアウトシフトなし)。
 */
export function NavLinkIcon({ icon: Icon, className }: NavLinkIconProps) {
  const { pending } = useLinkStatus()

  if (pending) {
    return <Loader2 aria-hidden className={cn("animate-spin", className)} />
  }

  return <Icon aria-hidden className={className} />
}
