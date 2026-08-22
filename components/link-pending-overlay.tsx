"use client"

import type { ReactNode } from "react"
import { useLinkStatus } from "next/link"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LinkPendingOverlayProps {
  children: ReactNode
  className?: string
}

/**
 * <Link> の子孫として配置すると、遷移待ちの間だけ子要素を薄くし、
 * その上にスピナーを重ねて表示する。
 * スピナーを絶対配置にすることで待機中に幅を占有せず、
 * LinkPendingIndicator のように空の余白を常時確保しなくて済む。
 * 重ねる基準にするため、親の <Link> に relative が必要。
 */
export function LinkPendingOverlay({ children, className }: LinkPendingOverlayProps) {
  const { pending } = useLinkStatus()

  return (
    <>
      <span className={cn("transition-opacity duration-200", pending && "opacity-25", className)}>{children}</span>
      {pending && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        </span>
      )}
    </>
  )
}
