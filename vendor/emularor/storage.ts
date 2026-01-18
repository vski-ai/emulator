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
  idempotencyKey?: string;
  status: "pending" | "processing" | "completed" | "failed";
  attempt: number;
  maxAttempts: number;
  notBefore: Date;
  createdAt: Date;
  processedAt?: Date;
}

export class MemoryStorage {
  runs = new Map<string, MemoryWorkflowRun>();
  steps = new Map<string, MemoryWorkflowStep>();
  events: MemoryWorkflowEvent[] = [];
  hooks = new Map<string, MemoryWorkflowHook>();
  queue: MemoryQueueMessage[] = [];
  streams = new Map<string, any[]>();

  // Map of dbName -> Storage
  private static instances = new Map<string, MemoryStorage>();

  static get(dbName: string): MemoryStorage {
    if (!this.instances.has(dbName)) {
      this.instances.set(dbName, new MemoryStorage());
    }
    return this.instances.get(dbName)!;
  }

  static clear() {
    this.instances.clear();
  }
}
