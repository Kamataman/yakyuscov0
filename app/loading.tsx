import { Loader2 } from "lucide-react"

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background"
    >
      <Loader2 aria-hidden className="h-8 w-8 animate-spin text-turf" />
      <p className="text-sm font-bold text-muted-foreground">読み込み中...</p>
    </div>
  )
}
