import type { NetworkMessage } from "@/types/network";
import { CraftyPlayWebSocket } from "@/network/websocket";

export type DataChannelHandler = (message: NetworkMessage) => void;

/**
 * WebRTC DataChannel による P2P 同期。
 * シグナリングは WebSocket 経由のみ（外部 HTTP API 不使用）。
 */
export class CraftyPlayPeerConnection {
  private pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private handlers = new Set<DataChannelHandler>();

  constructor(
    private localId: string,
    private remoteId: string,
    private signaling: CraftyPlayWebSocket,
    iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }],
  ) {
    this.pc = new RTCPeerConnection({ iceServers });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send({
          type: "rtc:ice",
          candidate: event.candidate.toJSON(),
          from: localId,
          to: remoteId,
        });
      }
    };

    this.pc.ondatachannel = (event) => {
      this.attachChannel(event.channel);
    };
  }

  async connectAsInitiator(): Promise<void> {
    this.channel = this.pc.createDataChannel("craftyplay-sync", { ordered: true });
    this.attachChannel(this.channel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.signaling.send({
      type: "rtc:offer",
      sdp: offer,
      from: this.localId,
      to: this.remoteId,
    });
  }

  async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(sdp);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.signaling.send({
      type: "rtc:answer",
      sdp: answer,
      from: this.localId,
      to: this.remoteId,
    });
  }

  async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(sdp);
  }

  async handleIce(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc.addIceCandidate(candidate);
  }

  send(message: NetworkMessage): void {
    if (this.channel?.readyState !== "open") return;
    this.channel.send(JSON.stringify(message));
  }

  onMessage(handler: DataChannelHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close(): void {
    this.channel?.close();
    this.pc.close();
  }

  private attachChannel(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as NetworkMessage;
        this.handlers.forEach((h) => h(message));
      } catch {
        /* ignore malformed */
      }
    };
  }
}
