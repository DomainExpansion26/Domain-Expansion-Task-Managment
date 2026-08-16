import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { handleAIChat } from "@/lib/ai/provider-manager";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "ai.use")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You lack permission to use DX AI" } },
        { status: 403 }
      );
    }

    const { prompt, conversationId, provider } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Prompt cannot be empty" } },
        { status: 400 }
      );
    }

    const response = await handleAIChat({
      userId: currentUser.id,
      userRole: currentUser.role,
      userName: currentUser.name,
      prompt: prompt.trim(),
      conversationId,
      provider,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "AI Assistant failed to process query" } },
      { status: 500 }
    );
  }
}
