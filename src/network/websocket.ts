import type { NetworkMessage } from "@/types/network";

export type MessageHandler = (message: NetworkMessage) => void;
export type StatusHandler = (status: "connecting" | "connected" | "disconnected" | "error", detail?: string) => void;

/**
 * ブラウザネイティブ WebSocket クライアント。
 * 外部通信は wss:// のみ（静的アセット配信とは別経路）。
 */
export class CraftyPlayWebSocket {
  private socket: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private url: string) {}

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.emitStatus("connecting");
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.emitStatus("connected");
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as NetworkMessage;
        this.handlers.forEach((h) => h(message));
      } catch {
        this.emitStatus("error", "Invalid message from server");
      }
    };

    this.socket.onerror = () => {
      this.emitStatus("error", "WebSocket connection error");
    };

    this.socket.onclose = () => {
      this.emitStatus("disconnected");
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  send(message: NetworkMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    this.socket.send(JSON.stringify(message));
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private emitStatus(
    status: "connecting" | "connected" | "disconnected" | "error",
    detail?: string,
  ): void {
    this.statusHandlers.forEach((h) => h(status, detail));
  }
}
