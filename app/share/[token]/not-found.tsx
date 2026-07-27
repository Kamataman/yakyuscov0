import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="border border-border p-8 max-w-md w-full text-center">
        <div className="diamond-mark w-16 h-16 bg-stitch flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-stitch-foreground -rotate-45" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">
          リンクが無効です
        </h1>

        <p className="text-muted-foreground mb-6">
          この共有リンクは有効期限が切れているか、存在しません。
          管理者に新しいリンクを発行してもらってください。
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-turf text-turf-foreground font-semibold hover:bg-turf/90 transition-colors"
        >
          トップページへ
        </Link>
      </div>
    </div>
  )
}
