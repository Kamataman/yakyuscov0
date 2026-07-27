import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * グラウンドライン準拠(シャープエッジ)のスケルトン。
 * shadcn の Skeleton は既定で rounded-md のため、角丸を打ち消して使う。
 */
export function SkeletonBlock({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={cn("rounded-none", className)} {...props} />
}
