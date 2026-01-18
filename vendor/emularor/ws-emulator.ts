// Copyright (c) 2025 Anton A Nesterov <an+vski@vski.sh>, VSKI License
//

import { EmulatorWorkflowService } from "./service.ts";

export class EmulatorWebSocketServer {
  private subscriptions = new Map<string, Set<EmulatorWebSocket>>();
  private pollingInterval: any = null;

  constructor(private service: EmulatorWorkflowService) {
    this.startPolling();
  }

  private startPolling() {
    this.pollingInterval = setInterval(async () => {
      for (const [scopedQueueName, clients] of this.subscriptions.entries()) {
        if (clients.size === 0) continue;

        const [db, ...rest] = scopedQueueName.split(":");
        const queueName = rest.join(":");

        try {
          const job = await this.service.poll(db, queueName);
          if (job) {
            const worker = this.selectWorker(clients);
            if (worker) {
              worker.receive(JSON.stringify({ event: "JOB", data: job }));
            } else {
              await this.service.nack(db, job.id);
            }
          }
        } catch (e) {
          console.error(`Error polling queue ${scopedQueueName}:`, e);
        }
      }
    }, 200);
  }

  handleSubscribe(client: EmulatorWebSocket, db: string, queueName: string) {
    const scopedQueueName = `${db}:${queueName}`;
    if (!this.subscriptions.has(scopedQueueName)) {
      this.subscriptions.set(scopedQueueName, new Set());
    }
    this.subscriptions.get(scopedQueueName)?.add(client);
  }

  handleDisconnect(client: EmulatorWebSocket) {
    for (const subs of this.subscriptions.values()) {
      subs.delete(client);
    }
  }

  private selectWorker(
    clients: Set<EmulatorWebSocket>,
  ): EmulatorWebSocket | null {
    const arr = Array.from(clients).filter((c) => c.readyState === 1); // OPEN
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  stop() {
    clearInterval(this.pollingInterval);
  }
}

export class EmulatorWebSocket extends EventTarget {
  readyState = 0; // CONNECTING
  onopen: any = null;
  onmessage: any = null;
  onerror: any = null;
  onclose: any = null;

  private static server: EmulatorWebSocketServer;
  private db = "postgres";

  static setServer(server: EmulatorWebSocketServer) {
    this.server = server;
  }

  constructor(url: string) {
    super();
    const u = new URL(url);
    this.db = u.searchParams.get("db") || "postgres";

    setTimeout(() => {
      this.readyState = 1; // OPEN
      const ev = new Event("open");
      this.dispatchEvent(ev);
      if (this.onopen) this.onopen(ev);
    }, 10);
  }

  receive(data: string) {
    const ev = new MessageEvent("message", { data });
    this.dispatchEvent(ev);
    if (this.onmessage) this.onmessage(ev);
  }

  send(data: string) {
    const msg = JSON.parse(data);
    if (msg.event === "SUBSCRIBE") {
      EmulatorWebSocket.server.handleSubscribe(this, this.db, msg.data.queue);
      setTimeout(() => {
        this.receive(
          JSON.stringify({
            event: "SUBSCRIBED",
            data: { queue: msg.data.queue },
          }),
        );
      }, 10);
    }
  }

  close() {
    this.readyState = 3; // CLOSED
    EmulatorWebSocket.server.handleDisconnect(this);
    const ev = new CloseEvent("close");
    this.dispatchEvent(ev);
    if (this.onclose) this.onclose(ev);
  }
}

export function installWebSocketEmulator(server: EmulatorWebSocketServer) {
  EmulatorWebSocket.setServer(server);
  const originalWS = globalThis.WebSocket;

  const patchedWS = function (this: any, url: string) {
    if (url.includes("/api/workflow/ws") || url.startsWith("ws://emulator")) {
      return new EmulatorWebSocket(url);
    }
    return new (originalWS as any)(url);
  };

  patchedWS.prototype = originalWS.prototype;
  (globalThis as any).WebSocket = patchedWS;
}
