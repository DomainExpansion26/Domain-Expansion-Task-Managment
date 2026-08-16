import { AIProvider, AIChatRequest, AIChatResult } from "../types";

export class OpenRouterAdapter implements AIProvider {
  public readonly name = "OPENROUTER";
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = "meta-llama/llama-3.3-70b-instruct") {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    this.defaultModel = defaultModel;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async chat(request: AIChatRequest): Promise<AIChatResult> {
    if (!this.isConfigured()) {
      throw new Error("Provider OpenRouter is not configured. Please add OPENROUTER_API_KEY in Settings -> AI Providers or .env.");
    }

    const startTime = Date.now();
    const modelName = request.model || this.defaultModel;

    const messages = [...request.messages];
    if (request.systemPrompt) {
      messages.unshift({ role: "system", content: request.systemPrompt });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://domainexpansion.in",
        "X-Title": "Domain Expansion Task Management",
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: request.temperature ?? 0.4,
        max_tokens: request.maxTokens ?? 2048,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(`OpenRouter error (${res.status}): ${errJson.error?.message || res.statusText}`);
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || "";
    const durationMs = Date.now() - startTime;

    return {
      text,
      modelUsed: modelName,
      provider: this.name,
      durationMs,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens,
            completionTokens: json.usage.completion_tokens,
            totalTokens: json.usage.total_tokens,
          }
        : undefined,
    };
  }

  async streamChat(request: AIChatRequest): Promise<ReadableStream<string>> {
    if (!this.isConfigured()) {
      throw new Error("Provider OpenRouter is not configured. Please add OPENROUTER_API_KEY in Settings or .env.");
    }

    const modelName = request.model || this.defaultModel;
    const messages = [...request.messages];
    if (request.systemPrompt) {
      messages.unshift({ role: "system", content: request.systemPrompt });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://domainexpansion.in",
        "X-Title": "Domain Expansion Task Management",
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: request.temperature ?? 0.4,
        max_tokens: request.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`OpenRouter stream failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream<string>({
      async start(controller) {
        try {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const dataStr = trimmed.slice(6);
                if (dataStr === "[DONE]") {
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) controller.enqueue(delta);
                } catch {
                  // Ignore SSE chunk parse error
                }
              }
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
      return { ok: false, latencyMs: 0, error: "OPENROUTER_API_KEY not configured" };
    }

    const startTime = Date.now();
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (res.ok) {
        return { ok: true, latencyMs: Date.now() - startTime };
      }
      return { ok: false, latencyMs: Date.now() - startTime, error: `Status ${res.status}` };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - startTime, error: err.message };
    }
  }
}
