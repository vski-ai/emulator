import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { RocketBaseClient, WorkflowWorker, WorkflowRegistry } from "@rocketbase/client";
import { installEmulator } from "@rocketbase/emulator";
import "./workflows.ts"; // Ensure workflows are registered

type SdkMode = "url" | "emulator";

interface SdkContextType {
  client: RocketBaseClient | null;
  mode: SdkMode;
  setMode: (mode: SdkMode) => void;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  isReady: boolean;
}

const SdkContext = createContext<SdkContextType | undefined>(undefined);

export function SdkProvider({
  children,
  forceMode
}: {
  children: ReactNode;
  forceMode?: SdkMode
}) {
  const [mode, setMode] = useState<SdkMode>(forceMode || "emulator");
  const [apiUrl, setApiUrl] = useState("http://localhost:3001");
  const [client, setClient] = useState<RocketBaseClient | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stopEmulator: (() => void) | null = null;
    let worker: WorkflowWorker | null = null;

    const init = async () => {
      setIsReady(false);
      
      // Cleanup previous state
      if (worker) worker.stop();
      if (stopEmulator) stopEmulator();

      const targetUrl = mode === "emulator" ? "http://emulator" : apiUrl;
      const newClient = new RocketBaseClient(targetUrl);

      if (mode === "emulator") {
        const emu = installEmulator();
        stopEmulator = emu.stop;
        
        // Start workers for all registered workflows automatically
        const workflowNames = Array.from(WorkflowRegistry.keys());
        console.log("Starting emulator workers for:", workflowNames);
        
        // In a real app we'd have a pool, for demo we just start them all
        for (const name of workflowNames) {
          const w = new WorkflowWorker(newClient);
          w.start(name);
        }

        (window as any).emulatorService = emu.service;
      } else {        // Ping API to verify connectivity
        try {
          const res = await fetch(`${targetUrl}/api/admins/has-admins`);
          if (!res.ok) throw new Error("Unreachable");
        } catch (e) {
          console.error("Connection check failed:", e);
          setClient(newClient);
          setIsReady(false);
          return;
        }
      }

      setClient(newClient);
      setIsReady(true);
    };

    init();

    return () => {
      if (worker) worker.stop();
      if (stopEmulator) stopEmulator();
    };
  }, [mode, apiUrl]);

  return (
    <SdkContext.Provider value={{ client, mode, setMode, apiUrl, setApiUrl, isReady }}>
      {children}
    </SdkContext.Provider>
  );
}

export function useSdk() {
  const context = useContext(SdkContext);
  if (context === undefined) {
    throw new Error("useSdk must be used within an SdkProvider");
  }
  return context;
}
