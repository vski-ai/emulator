// Copyright (c) 2025 Anton A Nesterov <an+vski@vski.sh>, VSKI License
//

import { EmulatorWorkflowService } from "./service.ts";

export class EmulatorFetchInterceptor {
  constructor(private service: EmulatorWorkflowService) {}

  async handleRequest(request: Request): Promise<Response | null> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith("/api/workflows")) return null;

    const db = request.headers.get("x-dbname") || "postgres";
    const method = request.method;

    try {
      // Runs
      if (path === "/api/workflows/runs" && method === "POST") {
        const data = await request.json();
        return this.jsonResponse(await this.service.createRun(db, data));
      }
      if (
        path.startsWith("/api/workflows/runs/") && method === "GET" &&
        !path.endsWith("/events")
      ) {
        const id = path.split("/").pop()!;
        return this.jsonResponse(await this.service.getRun(db, id));
      }
      if (path.startsWith("/api/workflows/runs/") && method === "PATCH") {
        const id = path.split("/").pop()!;
        const data = await request.json();
        return this.jsonResponse(await this.service.updateRun(db, id, data));
      }
      if (path === "/api/workflows/runs" && method === "GET") {
        const params = Object.fromEntries(url.searchParams.entries());
        return this.jsonResponse(await this.service.listRuns(db, params));
      }

      // Steps
      if (path === "/api/workflows/steps" && method === "POST") {
        const data = await request.json();
        return this.jsonResponse(
          await this.service.createStep(db, data.runId, data),
        );
      }
      if (path.startsWith("/api/workflows/steps/") && method === "GET") {
        const parts = path.split("/");
        if (parts.length === 6) { // /api/workflows/steps/:runId/:stepId
          return this.jsonResponse(
            await this.service.getStep(db, parts[4], parts[5]),
          );
        } else { // /api/workflows/steps/:runId
          return this.jsonResponse(await this.service.listSteps(db, parts[4]));
        }
      }
      if (path.startsWith("/api/workflows/steps/") && method === "PATCH") {
        const parts = path.split("/");
        const data = await request.json();
        return this.jsonResponse(
          await this.service.updateStep(db, parts[4], parts[5], data),
        );
      }

      // Events
      if (path === "/api/workflows/events" && method === "POST") {
        const data = await request.json();
        return this.jsonResponse(
          await this.service.createEvent(db, data.runId, data),
        );
      }
      if (path.startsWith("/api/workflows/runs/") && path.endsWith("/events")) {
        const id = path.split("/")[4];
        return this.jsonResponse(await this.service.listEvents(db, id));
      }

      // Hooks
      if (path === "/api/workflows/hooks" && method === "POST") {
        const data = await request.json();
        return this.jsonResponse(
          await this.service.createHook(db, data.runId, data),
        );
      }
      if (path === "/api/workflows/hooks" && method === "GET") {
        const token = url.searchParams.get("token");
        if (token) {
          return this.jsonResponse(
            await this.service.getHookByToken(db, token),
          );
        }
      }

      // Queue
      if (path === "/api/workflows/queue" && method === "POST") {
        const b = await request.json();
        return this.jsonResponse(
          await this.service.queue(db, b.queueName, b.message, b.opts),
        );
      }
      if (path === "/api/workflows/queue/ack" && method === "POST") {
        const b = await request.json();
        return this.jsonResponse(await this.service.ack(db, b.messageId));
      }
      if (path === "/api/workflows/queue/nack" && method === "POST") {
        const b = await request.json();
        return this.jsonResponse(await this.service.nack(db, b.messageId));
      }
      if (path.startsWith("/api/workflows/queue/") && method === "GET") {
        const name = path.split("/").pop()!;
        return this.jsonResponse(await this.service.poll(db, name));
      }

      return new Response("Not Found", { status: 404 });
    } catch (e: any) {
      return this.jsonResponse({ error: e.message }, 500);
    }
  }

  private jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  install() {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      const request = new Request(input, init);
      const response = await this.handleRequest(request);
      if (response) return response;
      return originalFetch(input, init);
    };
  }
}
