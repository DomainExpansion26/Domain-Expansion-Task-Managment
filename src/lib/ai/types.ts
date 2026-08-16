export interface AIMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatRequest {
  messages: AIMessageInput[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  tools?: Record<string, any>[];
}

export interface AIChatResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  modelUsed: string;
  provider: string;
  durationMs: number;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
}

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  chat(request: AIChatRequest): Promise<AIChatResult>;
  streamChat(request: AIChatRequest): Promise<ReadableStream<string>>;
  healthCheck(model?: string): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}
