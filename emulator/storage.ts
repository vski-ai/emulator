// Copyright (c) 2025 Anton A Nesterov <an+vski@vski.sh>, VSKI License
//

export interface MemoryWorkflowRun {
  runId: string;
  status: string;
  workflowName: string;
  input: any[];
  output?: any;
  error?: any;
  executionContext: any;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deploymentId: string;
}

export interface MemoryWorkflowStep {
  id: string; // runId-stepId
  runId: string;
  stepId: string;
  stepName: string;
  status: string;
  input: any[];
  output?: any;
  error?: any;
  attempt: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryWorkflowEvent {
  eventId: string;
  runId: string;
  eventType: string;
  correlationId?: string;
  payload: any;
  createdAt: Date;
}

export interface MemoryWorkflowHook {
  hookId: string;
  runId: string;
  token: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryQueueMessage {
  messageId: string;
  queueName: string;
  payload: string;
  runId?: string;
  idempotencyKey?: string;
  status: "pending" | "processing" | "completed" | "failed";
  attempt: number;
  maxAttempts: number;
  notBefore: Date;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export class MemoryStorage {
  runs = new Map<string, MemoryWorkflowRun>();
  steps = new Map<string, MemoryWorkflowStep>();
  events: MemoryWorkflowEvent[] = [];
  hooks = new Map<string, MemoryWorkflowHook>();
  queue: MemoryQueueMessage[] = [];
  streams = new Map<string, any[]>();

  private dbName: string;
  private static instances = new Map<string, MemoryStorage>();

  constructor(dbName: string) {
    this.dbName = dbName;
    this.load();
  }

  static get(dbName: string): MemoryStorage {
    if (!this.instances.has(dbName)) {
      this.instances.set(dbName, new MemoryStorage(dbName));
    }
    return this.instances.get(dbName)!;
  }

  static getAllDbNames(): string[] {
    // Check localStorage for other DBs that might not be in instances yet
    if (typeof localStorage !== "undefined") {
      const names = new Set(Array.from(this.instances.keys()));
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("rb_emu_v1:")) {
          names.add(key.replace("rb_emu_v1:", ""));
        }
      }
      return Array.from(names);
    }
    return Array.from(this.instances.keys());
  }

  static clear() {
    if (typeof localStorage !== "undefined") {
      for (const dbName of this.getAllDbNames()) {
        localStorage.removeItem(`rb_emu_v1:${dbName}`);
      }
    }
    this.instances.clear();
  }

  persist() {
    if (typeof localStorage === "undefined") return;
    const data = {
      runs: Array.from(this.runs.entries()),
      steps: Array.from(this.steps.entries()),
      events: this.events,
      hooks: Array.from(this.hooks.entries()),
      queue: this.queue,
    };
    localStorage.setItem(`rb_emu_v1:${this.dbName}`, JSON.stringify(data));
  }

  load() {
    if (typeof localStorage === "undefined") return;
    const saved = localStorage.getItem(`rb_emu_v1:${this.dbName}`);
    if (!saved) return;

    try {
      const data = JSON.parse(saved, (key, value) => {
        // Revive dates
        if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
          return new Date(value);
        }
        return value;
      });

      this.runs = new Map(data.runs || []);
      this.steps = new Map(data.steps || []);
      this.events = data.events || [];
      this.hooks = new Map(data.hooks || []);
      this.queue = data.queue || [];
    } catch (e) {
      console.error(`Failed to load storage for ${this.dbName}:`, e);
    }
  }
}

// Global listener for cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key?.startsWith("rb_emu_v1:")) {
      const dbName = event.key.replace("rb_emu_v1:", "");
      const storage = MemoryStorage.get(dbName);
      storage.load();
    }
  });
}
