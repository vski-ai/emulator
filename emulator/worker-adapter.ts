// Copyright (c) 2025 Anton A Nesterov <an+vski@vski.sh>, VSKI License
//

import { EmulatorWorkflowService } from "./service.ts";
import { EmulatorFetchInterceptor } from "./fetch-interceptor.ts";
import { MemoryStorage } from "./storage.ts";
import {
  EmulatorWebSocketServer,
  installWebSocketEmulator,
  uninstallWebSocketEmulator,
} from "./ws-emulator.ts";

export function installEmulator() {
  const service = new EmulatorWorkflowService();
  const fetchInterceptor = new EmulatorFetchInterceptor(service);
  const wsServer = new EmulatorWebSocketServer(service);

  fetchInterceptor.install();
  installWebSocketEmulator(wsServer);

  // Background processing for waits
  const interval = setInterval(async () => {
    // Process all databases in memory
    const dbs = MemoryStorage.getAllDbNames();
    for (const db of dbs) {
      try {
        await service.processWaits(db);
      } catch (e) {
        console.error(`Error processing waits for ${db}:`, e);
      }
    }
  }, 1000);

  return {
    service,
    stop: () => {
      fetchInterceptor.uninstall();
      uninstallWebSocketEmulator();
      wsServer.stop();
      clearInterval(interval);
    },
  };
}
