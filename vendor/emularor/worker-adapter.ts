// Copyright (c) 2025 Anton A Nesterov <an+vski@vski.sh>, VSKI License
//

import { EmulatorWorkflowService } from "./service.ts";
import { EmulatorFetchInterceptor } from "./fetch-interceptor.ts";
import {
  EmulatorWebSocketServer,
  installWebSocketEmulator,
} from "./ws-emulator.ts";

export function installEmulator() {
  const service = new EmulatorWorkflowService();
  const fetchInterceptor = new EmulatorFetchInterceptor(service);
  const wsServer = new EmulatorWebSocketServer(service);

  fetchInterceptor.install();
  installWebSocketEmulator(wsServer);

  // Background processing for waits
  const interval = setInterval(async () => {
    // Process all databases (we'd need a list, but for emulation let's just do postgres and common ones)
    await service.processWaits("postgres");
  }, 1000);

  return {
    service,
    stop: () => {
      wsServer.stop();
      clearInterval(interval);
    },
  };
}
