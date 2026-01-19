# RocketBase Workflow Emulator

The RocketBase Workflow Emulator is a lightweight, in-memory implementation of
the RocketBase workflow engine. It is designed specifically for **browser
environments**, **demos**, and **unit testing**, allowing you to run durable
workflows without a dedicated backend or database.

## Features

- **In-Memory Storage**: Full tracking of workflow runs, steps, events, and
  hooks in local memory.
- **Fetch Interceptor**: Automatically redirects RocketBase SDK requests to the
  local emulator.
- **WebSocket Mock**: Simulates real-time worker communication within the
  browser.
- **Durable Logic**: Supports retries, deterministic step execution, signals,
  and sleeps.
- **Zero Configuration**: No Postgres or Redis required.

## Getting Started

### Installation

```bash
import { installEmulator } from "@rocketbase/emulator";
```

### Quick Start (Browser/Test)

Calling `installEmulator()` globally patches `fetch` and `WebSocket` to redirect
workflow traffic.

```typescript
import {
  RocketBaseClient,
  step,
  workflow,
  WorkflowWorker,
} from "@rocketbase/client";
import { installEmulator } from "@rocketbase/emulator";

// 1. Install the emulator
const emulator = installEmulator();

// 2. Use the standard SDK (it will be intercepted)
const client = new RocketBaseClient("http://emulator");

// 3. Define a workflow
const myStep = step("do-something", async (val: string) => `Processed ${val}`);

workflow("demo").run(async (ctx, name: string) => {
  return await myStep(name);
});

// 4. Start a worker locally
const worker = new WorkflowWorker(client);
worker.start("demo");

// 5. Trigger
const run = await client.workflow.trigger("demo", ["World"]);

// Cleanup when done
emulator.stop();
```

## How it Works

The emulator operates by intercepting runtime globals:

1. **`fetch`**: Any request starting with `/api/workflows` is caught by the
   `EmulatorFetchInterceptor` and handled by the `EmulatorWorkflowService`.
2. **`WebSocket`**: Any connection to `/api/workflow/ws` is caught by the
   `EmulatorWebSocket` and connected to a virtual `EmulatorWebSocketServer`.

This means your application code and the RocketBase SDK don't need to know they
are running against an emulator.

## Advanced Usage

### Manual Installation

If you don't want to use the high-level `installEmulator()` helper, you can set
up components manually:

```typescript
import {
  EmulatorFetchInterceptor,
  EmulatorWebSocketServer,
  EmulatorWorkflowService,
  installWebSocketEmulator,
} from "@rocketbase/emulator";

const service = new EmulatorWorkflowService();

// Patch Fetch
const fetchInterceptor = new EmulatorFetchInterceptor(service);
fetchInterceptor.install();

// Patch WebSocket
const wsServer = new EmulatorWebSocketServer(service);
installWebSocketEmulator(wsServer);
```

### Multi-Tenancy

The emulator supports the `x-dbname` header just like the real API. Data is
isolated per database name within the `MemoryStorage` singleton.

```typescript
client.setDb("customer_a");
// Workflows triggered here won't be visible to "customer_b"
```

## Limitations

- **Persistence**: All data is lost on page refresh (unless you manually
  serialize/deserialize `MemoryStorage`).
- **Isolation**: In some browser environments without `AsyncLocalStorage`
  support, interleaved concurrent workflows might share global context if using
  the functional style without explicit context passing.
- **Performance**: Designed for logic verification and demos, not
  high-throughput production workloads.
