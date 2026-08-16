import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getAIProviderInstance } from "@/lib/ai/provider-manager";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "ai.use")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "AI permission required" } }, { status: 403 });
    }

    const { prompt, provider = "GEMINI", model } = await request.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Prompt is required" } }, { status: 400 });
    }

    const adapter = getAIProviderInstance(provider, undefined, model);

    if (!adapter.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROVIDER_NOT_CONFIGURED",
            message: `Provider ${provider} is not configured with an API key. Configure it in Admin Settings -> AI Providers.`,
          },
        },
        { status: 400 }
      );
    }

    const stream = await adapter.streamChat({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: "You are DX AI for Domain Expansion. Provide concise, expert project management and task advice.",
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
