import type {
  ConnectionStatus,
  NetworkMessage,
  NetworkSessionConfig,
  NetworkSessionState,
  PresenceInfo,
} from "@/types/network";
import type { CraftyPlayWorldExport, WorldObject } from "@/types/world";
import { CraftyPlayPeerConnection } from "@/network/webrtc";
import { CraftyPlayWebSocket } from "@/network/websocket";

type SessionListener = (state: NetworkSessionState) => void;
type WorldSyncListener = (world: CraftyPlayWorldExport, from: string) => void;
type PatchListener = (
  objectId: string,
  patch: Partial<WorldObject>,
  from: string,
) => void;

/**
 * 外部通信の統合セッション。
 * - シグナリング / ルーム同期: WebSocket (wss://)
 * - 低遅延 P2P 編集同期: WebRTC DataChannel
 */
export class NetworkSession {
  private ws: CraftyPlayWebSocket | null = null;
  private peers = new Map<string, CraftyPlayPeerConnection>();
  private state: NetworkSessionState = {
    mode: "offline",
    status: "disconnected",
    clientId: null,
    peers: [],
    error: null,
  };
  private listeners = new Set<SessionListener>();
  private worldListeners = new Set<WorldSyncListener>();
  private patchListeners = new Set<PatchListener>();
  private config: NetworkSessionConfig;

  constructor(config: NetworkSessionConfig) {
    this.config = config;
    this.state.clientId = crypto.randomUUID();
  }

  getState(): NetworkSessionState {
    return this.state;
  }

  onStateChange(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onWorldSync(listener: WorldSyncListener): () => void {
    this.worldListeners.add(listener);
    return () => this.worldListeners.delete(listener);
  }

  onPatch(listener: PatchListener): () => void {
    this.patchListeners.add(listener);
    return () => this.patchListeners.delete(listener);
  }

  /** WebSocket ルームに参加（サーバー経由同期） */
  connectWebSocket(url: string): void {
    this.disconnect();
    this.updateState({ mode: "websocket", status: "connecting", error: null });

    this.ws = new CraftyPlayWebSocket(url);
    this.ws.onStatus((status, detail) => {
      const mapped: ConnectionStatus =
        status === "connecting"
          ? "connecting"
          : status === "connected"
            ? "connected"
            : status === "error"
              ? "error"
              : "disconnected";
      this.updateState({
        status: mapped,
        error: detail ?? null,
      });

      if (status === "connected" && this.state.clientId) {
        this.ws?.send({
          type: "hello",
          clientId: this.state.clientId,
          displayName: this.config.displayName,
        });
      }
    });

    this.ws.onMessage((msg) => this.handleMessage(msg));
    this.ws.connect();
  }

  /** WebRTC P2P モード（シグナリングは WebSocket 必須） */
  connectWebRTC(signalingUrl: string): void {
    this.connectWebSocket(signalingUrl);
    this.updateState({ mode: "webrtc" });
  }

  disconnect(): void {
    this.peers.forEach((p) => p.close());
    this.peers.clear();
    this.ws?.disconnect();
    this.ws = null;
    this.updateState({
      mode: "offline",
      status: "disconnected",
      peers: [],
      error: null,
    });
  }

  broadcastWorld(world: CraftyPlayWorldExport): void {
    if (!this.state.clientId) return;
    const message: NetworkMessage = {
      type: "world:full",
      payload: world,
      from: this.state.clientId,
    };
    this.send(message);
  }

  broadcastPatch(objectId: string, patch: Partial<WorldObject>): void {
    if (!this.state.clientId) return;
    const message: NetworkMessage = {
      type: "world:patch",
      objectId,
      patch,
      from: this.state.clientId,
    };
    this.send(message);
  }

  private send(message: NetworkMessage): void {
    if (this.state.mode === "webrtc") {
      this.peers.forEach((peer) => peer.send(message));
    }
    if (this.ws?.isConnected()) {
      this.ws.send(message);
    }
  }

  private handleMessage(message: NetworkMessage): void {
    const selfId = this.state.clientId;
    if (!selfId) return;

    switch (message.type) {
      case "presence":
        this.updateState({ peers: message.clients.filter((c) => c.clientId !== selfId) });
        if (this.state.mode === "webrtc") {
          this.ensurePeerConnections(message.clients);
        }
        break;

      case "world:full":
        if (message.from !== selfId) {
          this.worldListeners.forEach((h) => h(message.payload, message.from));
        }
        break;

      case "world:patch":
        if (message.from !== selfId) {
          this.patchListeners.forEach((h) =>
            h(message.objectId, message.patch, message.from),
          );
        }
        break;

      case "rtc:offer":
        if (message.to === selfId) {
          void this.handleOffer(message.from, message.sdp);
        }
        break;

      case "rtc:answer":
        if (message.to === selfId) {
          this.peers.get(message.from)?.handleAnswer(message.sdp);
        }
        break;

      case "rtc:ice":
        if (message.to === selfId) {
          void this.peers.get(message.from)?.handleIce(message.candidate);
        }
        break;

      default:
        break;
    }
  }

  private ensurePeerConnections(clients: PresenceInfo[]): void {
    if (!this.ws || !this.state.clientId) return;

    for (const client of clients) {
      if (client.clientId === this.state.clientId) continue;
      if (this.peers.has(client.clientId)) continue;

      const peer = new CraftyPlayPeerConnection(
        this.state.clientId,
        client.clientId,
        this.ws,
        this.config.iceServers,
      );
      peer.onMessage((msg) => this.handleMessage(msg));
      this.peers.set(client.clientId, peer);

      if (this.state.clientId < client.clientId) {
        void peer.connectAsInitiator();
      }
    }
  }

  private async handleOffer(
    from: string,
    sdp: RTCSessionDescriptionInit,
  ): Promise<void> {
    if (!this.ws || !this.state.clientId) return;

    let peer = this.peers.get(from);
    if (!peer) {
      peer = new CraftyPlayPeerConnection(
        this.state.clientId,
        from,
        this.ws,
        this.config.iceServers,
      );
      peer.onMessage((msg) => this.handleMessage(msg));
      this.peers.set(from, peer);
    }
    await peer.handleOffer(sdp);
  }

  private updateState(patch: Partial<NetworkSessionState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }
}

let sessionInstance: NetworkSession | null = null;

export function getNetworkSession(displayName = "Editor"): NetworkSession {
  if (!sessionInstance) {
    sessionInstance = new NetworkSession({ displayName });
  }
  return sessionInstance;
}
