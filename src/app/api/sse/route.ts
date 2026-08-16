import { NextRequest } from "next/server";
import { eventHub } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: "connected", time: Date.now() })}\n\n`));

      const unsubscribe = eventHub.subscribe((data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream might be closed
        }
      });

      request.signal.addEventListener("abort", () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
