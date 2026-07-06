import { useWorld } from "@/context/WorldContext";
import type { ConnectionMode } from "@/types/network";
import { useState } from "react";

export function ConnectionPanel() {
  const {
    network,
    connectWebSocket,
    connectWebRTC,
    disconnectNetwork,
    storage,
  } = useWorld();

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("wss://localhost:8080/sync");
  const [mode, setMode] = useState<ConnectionMode>("websocket");

  const statusColor =
    network.status === "connected"
      ? "text-success-500"
      : network.status === "error"
        ? "text-danger-500"
        : "text-surface-500";

  const handleConnect = () => {
    if (mode === "webrtc") {
      connectWebRTC(url);
    } else {
      connectWebSocket(url);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={[
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
          network.status === "connected"
            ? "bg-success-500/15 text-success-500"
            : "text-surface-400 hover:bg-surface-800 hover:text-surface-200",
        ].join(" ")}
        title="WebSocket / WebRTC 接続"
      >
        <span
          className={[
            "size-1.5 rounded-full",
            network.status === "connected" ? "bg-success-500" : "bg-surface-600",
          ].join(" ")}
        />
        {network.status === "connected"
          ? `${network.mode.toUpperCase()} (${network.peers.length})`
          : "Connect"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-80 rounded-lg border border-surface-700 bg-surface-850 p-3 shadow-xl">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            外部通信
          </h3>
          <p className="mt-1 text-[10px] text-surface-500">
            静的配信以外の通信は WebSocket / WebRTC のみ
          </p>

          <div className="mt-3 flex gap-1">
            {(["websocket", "webrtc"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={[
                  "flex-1 rounded-md px-2 py-1 text-xs font-medium",
                  mode === m
                    ? "bg-accent-500 text-white"
                    : "bg-surface-800 text-surface-400 hover:text-surface-200",
                ].join(" ")}
              >
                {m === "websocket" ? "WebSocket" : "WebRTC P2P"}
              </button>
            ))}
          </div>

          <label className="mt-3 flex flex-col gap-1">
            <span className="text-[10px] uppercase text-surface-500">
              Signaling URL (wss://)
            </span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-md border border-surface-700 bg-surface-900 px-2 py-1.5 text-xs outline-none focus:border-accent-500"
              placeholder="wss://your-server/sync"
            />
          </label>

          <div className="mt-3 flex gap-2">
            {network.status === "connected" ? (
              <button
                type="button"
                onClick={() => {
                  disconnectNetwork();
                  setOpen(false);
                }}
                className="flex-1 rounded-md bg-danger-500/20 py-1.5 text-xs font-medium text-danger-500 hover:bg-danger-500/30"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                className="flex-1 rounded-md bg-accent-500 py-1.5 text-xs font-medium text-white hover:bg-accent-600"
              >
                Connect
              </button>
            )}
          </div>

          <div className="mt-3 space-y-1 border-t border-surface-800 pt-2 text-[10px] text-surface-500">
            <p className={statusColor}>Status: {network.status}</p>
            {network.error && <p className="text-danger-500">{network.error}</p>}
            <p>IndexedDB: {storage.indexedDB ? "✓" : "✗"}</p>
            <p>File System Access: {storage.fileSystemAccess ? "✓" : "✗"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
