import { getResultSummary, type BattingResult, type HitDirection, type HitResult } from "@/lib/batting-types"

interface GameInfo {
  date: string
  opponent: string
  location: string | null
  teamName: string
}

interface InningScoreRow {
  inning: number
  our_score: number
  opponent_score: number
}

interface LineupEntryRow {
  batting_order: number
  player_name: string
  is_substitute: boolean
  entered_inning: number | null
}

interface BattingResultRow {
  batting_order: number
  inning: number
  at_bat_sequence: number
  hit_result: string
  direction: string | null
  rbi_count: number
  scored: boolean
}

interface PitcherResultRow {
  player_name: string
  innings_outs: number
  is_mid_inning_exit: boolean
  hits: number
  runs: number
  earned_runs: number
  strikeouts: number
  walks: number
  hit_by_pitch: number
  home_runs: number
  pitcher_award: string | null
}

export interface ReviewPromptInput {
  game: GameInfo
  ourTotal: number
  opponentTotal: number
  inningScores: InningScoreRow[]
  lineupEntries: LineupEntryRow[]
  battingResults: BattingResultRow[]
  pitcherResults: PitcherResultRow[]
}

// "YYYY-MM-DD" を「YYYY年M月D日」に整形する。ISO形式のままモデルに渡すと転記ミスが起きやすいため。
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return `${year}年${month}月${day}日`
}

const PITCHER_AWARD_LABEL: Record<string, string> = {
  win: "勝",
  lose: "敗",
  save: "S",
  hold: "H",
}

function formatInningsPitched(outs: number, isMidInningExit: boolean): string {
  const whole = Math.floor(outs / 3)
  const rem = outs % 3
  if (rem === 0 && isMidInningExit) return `${whole}回0/3`
  if (rem === 0) return `${whole}回`
  return `${whole}回${rem}/3`
}

function buildScoreboardText(input: ReviewPromptInput): string {
  const teamName = input.game.teamName
  const lines = input.inningScores
    .sort((a, b) => a.inning - b.inning)
    .map((s) => `${s.inning}回 ${teamName}${s.our_score}-${s.opponent_score}${input.game.opponent}`)
  return [`最終スコア: ${teamName}${input.ourTotal} - ${input.opponentTotal}${input.game.opponent}`, ...lines].join("\n")
}

function buildBattingText(input: ReviewPromptInput): string {
  const nameByOrder = new Map<number, string>()
  for (const entry of input.lineupEntries) {
    if (!nameByOrder.has(entry.batting_order)) nameByOrder.set(entry.batting_order, entry.player_name)
  }

  const sorted = [...input.battingResults].sort((a, b) => {
    if (a.batting_order !== b.batting_order) return a.batting_order - b.batting_order
    if (a.inning !== b.inning) return a.inning - b.inning
    return a.at_bat_sequence - b.at_bat_sequence
  })

  return sorted
    .map((r) => {
      const playerName = nameByOrder.get(r.batting_order) ?? `${r.batting_order}番`
      const summary = getResultSummary({
        hitResult: r.hit_result as HitResult,
        direction: (r.direction ?? undefined) as HitDirection | undefined,
        rbiCount: r.rbi_count,
        scored: r.scored,
      } satisfies BattingResult)
      return `${r.inning}回 ${playerName}: ${summary}`
    })
    .join("\n")
}

function buildPitchingText(input: ReviewPromptInput): string {
  return input.pitcherResults
    .map((p) => {
      const award = p.pitcher_award ? `（${PITCHER_AWARD_LABEL[p.pitcher_award] ?? p.pitcher_award}）` : ""
      return (
        `${p.player_name}${award}: ${formatInningsPitched(p.innings_outs, p.is_mid_inning_exit)} ` +
        `被安打${p.hits} 失点${p.runs} 自責点${p.earned_runs} 奪三振${p.strikeouts} ` +
        `与四球${p.walks} 与死球${p.hit_by_pitch} 被本塁打${p.home_runs}`
      )
    })
    .join("\n")
}

export function buildReviewPrompt(input: ReviewPromptInput): { system: string; user: string } {
  const system = [
    "あなたは草野球の試合結果から戦評を書くスポーツ記者です。",
    "以下のルールを厳守してください。",
    "- 常体（である調）で書く",
    "- 130字程度、1段落で書く",
    "- 与えられたデータに書かれていない事実は一切書かない（選手の心情や背景など推測を含めない）",
    "- 投手成績の失点・自責点・被安打の数値と矛盾する記述は絶対にしない。1人でも失点した投手がいる場合、「無失点」「完封」「パーフェクト」とは書かない。1本でも被安打がある場合、「無安打」「ノーヒット」とは書かない",
    "- 選手名はデータ内の表記をそのまま使う",
    "- 試合の分かれ目になった場面と、目立った選手の活躍に触れる",
    "- 出力は戦評の本文のみとする。文字数の注釈、見出し、前置き、括弧書きの補足など本文以外は一切付け加えない",
  ].join("\n")

  const user = [
    `日付: ${formatDate(input.game.date)}`,
    `対戦相手: ${input.game.opponent}`,
    input.game.location ? `球場: ${input.game.location}` : null,
    "",
    "【スコアボード】",
    buildScoreboardText(input),
    "",
    "【打撃成績（打席結果）】",
    buildBattingText(input),
    "",
    "【投手成績】",
    buildPitchingText(input),
  ]
    .filter((line) => line !== null)
    .join("\n")

  return { system, user }
}
