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
      config: { systemInstruction: system },
    })

    const text = response.text
    if (!text) {
      throw new Error("Geminiから空のレスポンスが返されました")
    }
    return { text: text.trim(), resolvedModelId: response.modelVersion ?? this.modelId }
  }
}
