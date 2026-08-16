type Listener = (data: { event: string; payload: any }) => void;

class EventEmitterHub {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: string, payload: any) {
    for (const listener of this.listeners) {
      try {
        listener({ event, payload });
      } catch (err) {
        console.error("SSE listener error:", err);
      }
    }
  }
}

const globalForEvents = globalThis as unknown as { eventHub: EventEmitterHub };

export const eventHub = globalForEvents.eventHub || new EventEmitterHub();

if (process.env.NODE_ENV !== "production") globalForEvents.eventHub = eventHub;

export function emitPlatformEvent(eventData: { event: string; data?: any; payload?: any }) {
  eventHub.emit(eventData.event, eventData.data || eventData.payload);
}
