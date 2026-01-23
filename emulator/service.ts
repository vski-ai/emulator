// Copyright (c) 2025 Anton A Nesterov <an+vski@vski.sh>, VSKI License
//

import {
  MemoryQueueMessage,
  MemoryStorage,
  MemoryWorkflowEvent,
  MemoryWorkflowHook,
  MemoryWorkflowRun,
  MemoryWorkflowStep,
} from "./storage.ts";

export class EmulatorWorkflowService {
  private generateId(prefix: string) {
    const ts = Date.now().toString(16).padStart(12, "0");
    const random = Math.random().toString(16).substring(2, 10);
    return `${prefix}${ts}${random}`;
  }

  private getStorage(dbName: string) {
    return MemoryStorage.get(dbName);
  }

  async createRun(dbName: string, data: any) {
    const storage = this.getStorage(dbName);
    const run: MemoryWorkflowRun = {
      runId: this.generateId("wrun_"),
      status: "pending",
      deploymentId: data.deploymentId || "default",
      workflowName: data.workflowName,
      input: data.input || [],
      executionContext: data.executionContext || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    storage.runs.set(run.runId, run);
    return run;
  }

  async getRun(dbName: string, runId: string) {
    const storage = this.getStorage(dbName);
    const run = storage.runs.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    return run;
  }

  async updateRun(dbName: string, runId: string, data: any) {
    const storage = this.getStorage(dbName);
    const run = await this.getRun(dbName, runId);

    if (data.status === "running" && !run.startedAt) {
      run.startedAt = new Date();
    }
    if (["completed", "failed", "cancelled"].includes(data.status)) {
      run.completedAt = new Date();
      // Cleanup hooks (simplified)
      for (const [id, hook] of storage.hooks.entries()) {
        if (hook.runId === runId) storage.hooks.delete(id);
      }
    }

    Object.assign(run, data);
    run.updatedAt = new Date();
    return run;
  }

  async listRuns(dbName: string, params: any) {
    const storage = this.getStorage(dbName);
    let runs = Array.from(storage.runs.values());

    if (params.workflowName) {
      runs = runs.filter((r) => r.workflowName === params.workflowName);
    }
    if (params.status) {
      runs = runs.filter((r) => r.status === params.status);
    }

    runs.sort((a, b) => b.runId.localeCompare(a.runId));

    const limit = parseInt(params.limit) || 100;
    const data = runs.slice(0, limit);

    return {
      data,
      hasMore: runs.length > limit,
      cursor: runs.length > limit ? data[data.length - 1].runId : null,
    };
  }

  async createStep(dbName: string, runId: string, data: any) {
    const storage = this.getStorage(dbName);
    const id = `${runId}-${data.stepId}`;
    const step: MemoryWorkflowStep = {
      id,
      runId,
      stepId: data.stepId,
      stepName: data.stepName,
      status: "pending",
      input: data.input || [],
      attempt: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    storage.steps.set(id, step);
    return step;
  }

  async getStep(dbName: string, runId: string, stepId: string) {
    const storage = this.getStorage(dbName);
    const id = `${runId}-${stepId}`;
    const step = storage.steps.get(id);
    if (!step) throw new Error(`Step ${stepId} not found`);
    return step;
  }

  async updateStep(dbName: string, runId: string, stepId: string, data: any) {
    const storage = this.getStorage(dbName);
    const step = await this.getStep(dbName, runId, stepId);

    if (data.status === "running" && !step.startedAt) {
      step.startedAt = new Date();
    }
    if (["completed", "failed"].includes(data.status)) {
      step.completedAt = new Date();
    }

    Object.assign(step, data);
    step.updatedAt = new Date();
    return step;
  }

  async listSteps(dbName: string, runId: string) {
    const storage = this.getStorage(dbName);
    const steps = Array.from(storage.steps.values())
      .filter((s) => s.runId === runId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return { data: steps, hasMore: false };
  }

  async createEvent(dbName: string, runId: string, data: any) {
    const storage = this.getStorage(dbName);
    const event: MemoryWorkflowEvent = {
      eventId: this.generateId("wevt_"),
      runId,
      eventType: data.eventType,
      correlationId: data.correlationId,
      payload: data.payload || data.eventData || {},
      createdAt: new Date(),
    };
    storage.events.push(event);
    return event;
  }

  async listEvents(dbName: string, runId: string) {
    const storage = this.getStorage(dbName);
    return storage.events
      .filter((e) => e.runId === runId)
      .sort((a, b) => a.eventId.localeCompare(b.eventId));
  }

  async createHook(dbName: string, runId: string, data: any) {
    const storage = this.getStorage(dbName);
    const hook: MemoryWorkflowHook = {
      hookId: data.hookId || this.generateId("whook_"),
      runId,
      token: data.token,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    storage.hooks.set(hook.hookId, hook);
    return hook;
  }

  async getHookByToken(dbName: string, token: string) {
    const storage = this.getStorage(dbName);
    const hook = Array.from(storage.hooks.values()).find((h) =>
      h.token === token
    );
    if (!hook) throw new Error("Hook not found");
    return hook;
  }

  async queue(dbName: string, queueName: string, message: any, opts?: any) {
    const storage = this.getStorage(dbName);

    if (opts?.idempotencyKey) {
      const existing = storage.queue.find((m) =>
        m.idempotencyKey === opts.idempotencyKey && m.queueName === queueName
      );
      if (existing) return { messageId: existing.messageId };
    }

    const msg: MemoryQueueMessage = {
      messageId: this.generateId("msg_"),
      queueName,
      payload: JSON.stringify(message),
      idempotencyKey: opts?.idempotencyKey,
      status: "pending",
      attempt: 0,
      maxAttempts: 3,
      notBefore: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    storage.queue.push(msg);
    return { messageId: msg.messageId };
  }

  async poll(dbName: string, queueName: string) {
    const storage = this.getStorage(dbName);
    const now = new Date();
    const msg = storage.queue.find((m) =>
      m.queueName === queueName &&
      m.status === "pending" &&
      m.notBefore <= now
    );

    if (!msg) return null;

    msg.status = "processing";
    msg.attempt += 1;
    msg.updatedAt = new Date();

    return {
      id: msg.messageId,
      data: JSON.parse(msg.payload),
      attempt: msg.attempt,
    };
  }

  async ack(dbName: string, messageId: string) {
    const storage = this.getStorage(dbName);
    const msg = storage.queue.find((m) => m.messageId === messageId);
    if (msg) {
      msg.status = "completed";
      msg.processedAt = new Date();
      msg.updatedAt = new Date();
    }
    return { success: true };
  }

  async nack(dbName: string, messageId: string) {
    const storage = this.getStorage(dbName);
    const msg = storage.queue.find((m) => m.messageId === messageId);
    if (msg) {
      msg.status = "pending";
      msg.notBefore = new Date(Date.now() + 5000);
      msg.updatedAt = new Date();
    }
    return { success: true };
  }

  async touch(dbName: string, messageId: string) {
    const storage = this.getStorage(dbName);
    const msg = storage.queue.find((m) => m.messageId === messageId);
    if (msg) {
      msg.updatedAt = new Date();
    }
    return { success: true };
  }

  async cleanupStuckMessages(dbName: string) {
    const storage = this.getStorage(dbName);
    const timeout = 30000;
    const now = new Date();
    let count = 0;

    for (const msg of storage.queue) {
      if (
        msg.status === "processing" &&
        now.getTime() - msg.updatedAt.getTime() > timeout
      ) {
        msg.status = "pending";
        msg.notBefore = new Date();
        count++;
      }
    }
    return count;
  }

  async processWaits(dbName: string) {
    const storage = this.getStorage(dbName);
    const now = new Date();

    const waitCreatedEvents = storage.events.filter((e) =>
      e.eventType === "wait_created" &&
      new Date(e.payload.resumeAt) <= now
    );

    let processed = 0;
    for (const event of waitCreatedEvents) {
      const isCompleted = storage.events.some((e) =>
        e.runId === event.runId &&
        e.correlationId === event.correlationId &&
        e.eventType === "wait_completed"
      );

      if (!isCompleted) {
        await this.createEvent(dbName, event.runId, {
          eventType: "wait_completed",
          correlationId: event.correlationId,
          eventData: {},
        });

        const run = storage.runs.get(event.runId);
        if (run) {
          await this.queue(dbName, `__wkf_workflow_${run.workflowName}`, {
            runId: run.runId,
            workflowName: run.workflowName,
            input: run.input,
            executionContext: run.executionContext,
          });
        }
        processed++;
      }
    }
    return processed;
  }
}
