import { GeminiReviewGenerator } from "./gemini"

export interface ReviewResult {
  text: string
  // 実際に応答したモデルのバージョン（modelIdがエイリアスの場合、解決先の具体的なモデルID）
  resolvedModelId: string
}

export interface ReviewGenerator {
  readonly modelId: string
  generate(system: string, user: string): Promise<ReviewResult>
}

// AI_API_KEY が未設定の場合は null を返す（機能自体を無効化するため）
export function getReviewGenerator(): ReviewGenerator | null {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) return null

  const provider = process.env.AI_PROVIDER ?? "gemini"
  const model = process.env.AI_MODEL ?? "gemini-flash-lite-latest"

  switch (provider) {
    case "gemini":
      return new GeminiReviewGenerator(apiKey, model)
    default:
      throw new Error(`未対応のAIプロバイダです: ${provider}`)
  }
}
