import { GoogleGenAI } from "@google/genai"
import type { ReviewGenerator, ReviewResult } from "./provider"

// Geminiが一時的に返すエラー（過負荷・レート制限・内部エラー）はリトライで回復することが多い
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 700

function getErrorStatus(err: unknown): number | null {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status: unknown }).status
    if (typeof status === "number") return status
  }
  return null
}

function isRetryable(err: unknown): boolean {
  const status = getErrorStatus(err)
  return status !== null && RETRYABLE_STATUS.has(status)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class GeminiReviewGenerator implements ReviewGenerator {
  readonly modelId: string
  private readonly client: GoogleGenAI

  constructor(apiKey: string, modelId: string) {
    this.modelId = modelId
    this.client = new GoogleGenAI({ apiKey })
  }

  async generate(system: string, user: string): Promise<ReviewResult> {
    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await this.generateOnce(system, user)
      } catch (err) {
        lastError = err
        if (!isRetryable(err) || attempt === MAX_ATTEMPTS) break

        // 指数バックオフ + ジッターで再試行する（同時リクエストの再衝突を避ける）
        const delay = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 300
        console.warn(
          `Geminiが一時エラー(status=${getErrorStatus(err)})を返したため再試行します (${attempt}/${MAX_ATTEMPTS - 1})`
        )
        await sleep(delay)
      }
    }

    throw lastError
  }

  private async generateOnce(system: string, user: string): Promise<ReviewResult> {
    const response = await this.client.models.generateContent({
      model: this.modelId,
      contents: user,
      // temperatureを下げ、データにない誇張・矛盾した記述（例: 失点があるのに無失点と書く）が
      // 生成される頻度を抑える。完全には防げないためroute側でも矛盾チェックを行う
      config: { systemInstruction: system, temperature: 0.3 },
    })

    const text = response.text
    if (!text) {
      throw new Error("Geminiから空のレスポンスが返されました")
    }
    return { text: text.trim(), resolvedModelId: response.modelVersion ?? this.modelId }
  }
}
