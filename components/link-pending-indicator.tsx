"use client"

import { useLinkStatus } from "next/link"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * <Link> の子孫として配置すると、遷移待ちの間だけスピナーを表示する。
 * レイアウトシフトを避けるため常にレンダリングし、opacity だけを切り替える。
 * 遷移先がプリフェッチ済みの場合は pending がスキップされるため、
 * ルート単位の loading.tsx を主軸としたうえでの補助表示として使う。
 */
export function LinkPendingIndicator({ className }: { className?: string }) {
  const { pending } = useLinkStatus()

  return (
    <Loader2
      aria-hidden
      className={cn(
        "h-4 w-4 shrink-0 animate-spin transition-opacity",
        pending ? "opacity-100" : "opacity-0",
        className
      )}
    />
  )
}
