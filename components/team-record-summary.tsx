import { calculateWinningPercentage, type TeamRecord } from "@/lib/game-score"
import { formatRate } from "@/lib/stats"
import { cn } from "@/lib/utils"

interface TeamRecordSummaryProps {
  record: TeamRecord
  className?: string
}

/** チームの勝敗分と勝率のサマリー */
export function TeamRecordSummary({ record, className }: TeamRecordSummaryProps) {
  const cells: Array<{ label: string; value: string; tone?: string }> = [
    { label: "試合", value: String(record.games) },
    { label: "勝", value: String(record.wins), tone: "text-turf" },
    { label: "敗", value: String(record.losses), tone: "text-stitch" },
    { label: "分", value: String(record.draws) },
    { label: "勝率", value: formatRate(calculateWinningPercentage(record)) },
  ]

  return (
    <dl className={cn("grid grid-cols-5 divide-x divide-border border border-border", className)}>
      {cells.map((cell) => (
        <div key={cell.label} className="px-2 py-3 text-center">
          <dt className="text-xs text-muted-foreground">{cell.label}</dt>
          <dd className={cn("font-display text-2xl font-bold", cell.tone ?? "text-foreground")}>{cell.value}</dd>
        </div>
      ))}
    </dl>
  )
}
