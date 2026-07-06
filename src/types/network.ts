import type { CraftyPlayWorldExport, WorldObject } from "@/types/world";

export type ConnectionMode = "offline" | "websocket" | "webrtc";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/** WebSocket / WebRTC DataChannel で送受信するメッセージ */
export type NetworkMessage =
  | { type: "hello"; clientId: string; displayName: string }
  | { type: "presence"; clients: PresenceInfo[] }
  | { type: "world:full"; payload: CraftyPlayWorldExport; from: string }
  | { type: "world:patch"; objectId: string; patch: Partial<WorldObject>; from: string }
  | { type: "rtc:offer"; sdp: RTCSessionDescriptionInit; from: string; to: string }
  | { type: "rtc:answer"; sdp: RTCSessionDescriptionInit; from: string; to: string }
  | { type: "rtc:ice"; candidate: RTCIceCandidateInit; from: string; to: string }
  | { type: "ping"; ts: number }
  | { type: "pong"; ts: number };

export interface PresenceInfo {
  clientId: string;
  displayName: string;
}

export interface NetworkSessionConfig {
  displayName: string;
  /** WebSocket シグナリング / 同期サーバー URL (wss://) */
  signalingUrl?: string;
  /** WebRTC 用 STUN サーバー（ブラウザ標準 ICE のみでも可） */
  iceServers?: RTCIceServer[];
}

export interface NetworkSessionState {
  mode: ConnectionMode;
  status: ConnectionStatus;
  clientId: string | null;
  peers: PresenceInfo[];
  error: string | null;
}
