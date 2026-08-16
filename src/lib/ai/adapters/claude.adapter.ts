import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, AIChatRequest, AIChatResult } from "../types";

export class ClaudeAdapter implements AIProvider {
  public readonly name = "ANTHROPIC";
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = "claude-3-5-sonnet-20241022") {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || "";
    this.defaultModel = defaultModel;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async chat(request: AIChatRequest): Promise<AIChatResult> {
    if (!this.isConfigured()) {
      throw new Error("Provider Anthropic Claude is not configured. Please add ANTHROPIC_API_KEY in Settings -> AI Providers or .env.");
    }

    const startTime = Date.now();
    const modelName = request.model || this.defaultModel;
    const client = new Anthropic({ apiKey: this.apiKey });

    const messages = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await client.messages.create({
      model: modelName,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.4,
      system: request.systemPrompt || "You are DX AI for Domain Expansion.",
      messages,
    });

    const text = response.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    const durationMs = Date.now() - startTime;

    return {
      text,
      modelUsed: modelName,
      provider: this.name,
      durationMs,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async streamChat(request: AIChatRequest): Promise<ReadableStream<string>> {
    if (!this.isConfigured()) {
      throw new Error("Provider Anthropic Claude is not configured. Please add ANTHROPIC_API_KEY in Settings or .env.");
    }

    const modelName = request.model || this.defaultModel;
    const client = new Anthropic({ apiKey: this.apiKey });

    const messages = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const stream = await client.messages.stream({
      model: modelName,
      max_tokens: request.maxTokens ?? 2048,
      system: request.systemPrompt || "You are DX AI for Domain Expansion.",
      messages,
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && (event.delta as any).text) {
              controller.enqueue((event.delta as any).text);
            }
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
      return { ok: false, latencyMs: 0, error: "ANTHROPIC_API_KEY not configured" };
    }

    const startTime = Date.now();
    try {
      const client = new Anthropic({ apiKey: this.apiKey });
      await client.messages.create({
        model: modelName || "claude-3-haiku-20240307",
        max_tokens: 5,
        messages: [{ role: "user", content: "ping" }],
      });
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - startTime, error: err.message };
    }
  }
}
