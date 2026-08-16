import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIChatRequest, AIChatResult } from "../types";

export class GeminiAdapter implements AIProvider {
  public readonly name = "GEMINI";
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = "gemini-1.5-pro-latest") {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.defaultModel = defaultModel;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async chat(request: AIChatRequest): Promise<AIChatResult> {
    if (!this.isConfigured()) {
      throw new Error("Provider Google Gemini is not configured. Please add GEMINI_API_KEY in Settings -> AI Providers or .env.");
    }

    const startTime = Date.now();
    const modelName = request.model || this.defaultModel;
    const client = new GoogleGenerativeAI(this.apiKey);
    const model = client.getGenerativeModel({ model: modelName });

    // Format prompt
    const contents = request.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    if (request.systemPrompt) {
      contents.unshift({
        role: "user",
        parts: [{ text: `System Instruction: ${request.systemPrompt}` }],
      });
    }

    const response = await model.generateContent({
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.4,
        maxOutputTokens: request.maxTokens ?? 2048,
      },
    });

    const text = response.response.text();
    const durationMs = Date.now() - startTime;

    return {
      text,
      modelUsed: modelName,
      provider: this.name,
      durationMs,
      usage: {
        promptTokens: Math.round((request.systemPrompt?.length || 0) + JSON.stringify(request.messages).length / 4),
        completionTokens: Math.round(text.length / 4),
        totalTokens: Math.round(((request.systemPrompt?.length || 0) + JSON.stringify(request.messages).length + text.length) / 4),
      },
    };
  }

  async streamChat(request: AIChatRequest): Promise<ReadableStream<string>> {
    if (!this.isConfigured()) {
      throw new Error("Provider Google Gemini is not configured. Please add GEMINI_API_KEY in Settings or .env.");
    }

    const modelName = request.model || this.defaultModel;
    const client = new GoogleGenerativeAI(this.apiKey);
    const model = client.getGenerativeModel({ model: modelName });

    const contents = request.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContentStream({ contents });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(chunkText);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  async healthCheck(modelName?: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    if (!this.isConfigured()) {
      return { ok: false, latencyMs: 0, error: "GEMINI_API_KEY not configured" };
    }

    const startTime = Date.now();
    try {
      const client = new GoogleGenerativeAI(this.apiKey);
      const model = client.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });
      await model.generateContent("Ping");
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - startTime, error: err.message };
    }
  }
}
