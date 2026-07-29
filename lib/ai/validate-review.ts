// LLMは指示に反してデータと矛盾する記述（例: 失点があるのに「無失点」と書く）を
// 低確率ながら生成することがある。プロンプトだけに頼らず、実測値と照合して機械的に検出する
export function hasContradictoryClaim(text: string, opponentRuns: number, hitsAllowed: number): boolean {
  const claimsShutout = /無失点|完封|パーフェクト/.test(text)
  const claimsNoHit = /無安打|ノーヒット/.test(text)
  return (claimsShutout && opponentRuns > 0) || (claimsNoHit && hitsAllowed > 0)
}

// モデルが指示に反して付け足すことがある末尾の文字数注釈（例:「（134字）」）を取り除く
export function stripLengthAnnotation(text: string): string {
  return text.replace(/[\s　]*[（(]\s*\d+\s*(?:字|文字)\s*[）)]\s*$/, "").trim()
}
