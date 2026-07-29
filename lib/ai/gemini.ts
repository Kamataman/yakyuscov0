import { GoogleGenAI } from "@google/genai"
import type { ReviewGenerator, ReviewResult } from "./provider"

export class GeminiReviewGenerator implements ReviewGenerator {
  readonly modelId: string
  private readonly client: GoogleGenAI

  constructor(apiKey: string, modelId: string) {
    this.modelId = modelId
    this.client = new GoogleGenAI({ apiKey })
  }

  async generate(system: string, user: string): Promise<ReviewResult> {
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
