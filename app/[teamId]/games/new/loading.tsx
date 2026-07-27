import { Loader2 } from "lucide-react"

/**
 * 「新しい試合を記録」のローディング表示。
 * このルートは表示用ページではなく、試合レコードを作成して編集画面へ
 * リダイレクトする処理のため、待ち時間の説明を明示する。
 */
export default function NewGameLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-background p-4"
    >
      <Loader2 aria-hidden className="h-8 w-8 animate-spin text-turf" />
      <p className="text-sm font-bold text-foreground">試合を準備しています...</p>
      <p className="text-xs text-muted-foreground">まもなく入力画面が開きます</p>
    </main>
  )
}
