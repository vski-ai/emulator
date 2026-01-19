import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  RocketBaseClient,
  WorkflowRegistry,
  WorkflowWorker,
} from "@rocketbase/client";
import { installEmulator } from "@rocketbase/emulator";
import "./workflows.ts"; // Ensure workflows are registered

type SdkMode = "url" | "emulator";

interface SdkContextType {
  client: RocketBaseClient | null;
  mode: SdkMode;
  setMode: (mode: SdkMode) => void;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  dbName: string;
  setDbName: (db: string) => void;
  isReady: boolean;
  refresh: () => void;
}

const SdkContext = createContext<SdkContextType | undefined>(undefined);

export function SdkProvider({
  children,
  forceMode,
}: {
  children: ReactNode;
  forceMode?: SdkMode;
}) {
  const [mode, setMode] = useState<SdkMode>(() => {
    if (forceMode) return forceMode;
    if (typeof window !== "undefined") {
      return (localStorage.getItem("rb_mode") as SdkMode) || "emulator";
    }
    return "emulator";
  });

  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rb_api_url") || "http://localhost:3001";
    }
    return "http://localhost:3001";
  });

  const [dbName, setDbName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rb_db_name") || "postgres";
    }
    return "postgres";
  });

  const [client, setClient] = useState<RocketBaseClient | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = () => setRefreshCounter((c) => c + 1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rb_mode", mode);
      localStorage.setItem("rb_api_url", apiUrl);
      localStorage.setItem("rb_db_name", dbName);
    }
  }, [mode, apiUrl, dbName]);

  useEffect(() => {
    let stopEmulator: (() => void) | null = null;
    const workers: WorkflowWorker[] = [];

    const init = async () => {
      setIsReady(false);

      // Cleanup previous state
      if (stopEmulator) stopEmulator();

      const targetUrl = mode === "emulator" ? "http://emulator" : apiUrl;
      const newClient = new RocketBaseClient(targetUrl);
      newClient.setDb(dbName);
      newClient.setAdminDb(dbName);

      if (mode === "emulator") {
        const emu = installEmulator();
        stopEmulator = emu.stop;
        (window as any).emulatorService = emu.service;
      } else { // Ping API to verify connectivity
        try {
          // Use the client itself to check connectivity so headers are handled correctly
          await newClient.admins.hasAdmins();
        } catch (e) {
          console.error("Connection check failed:", e);
          setClient(newClient);
          setIsReady(false);
          return;
        }
      }

      setClient(newClient);
      setIsReady(true);

      // Start workers for all registered workflows automatically
      const workflowNames = Array.from(WorkflowRegistry.keys());
      console.log(`Starting workers for (${mode}):`, workflowNames);

      for (const name of workflowNames) {
        const w = new WorkflowWorker(newClient);
        w.start(name, { resume: true });
        workers.push(w);
      }
    };

    init();

    return () => {
      workers.forEach((w) => w.stop());
      if (stopEmulator) stopEmulator();
    };
  }, [mode, apiUrl, dbName, refreshCounter]);

  return (
    <SdkContext.Provider
      value={{
        client,
        mode,
        setMode,
        apiUrl,
        setApiUrl,
        dbName,
        setDbName,
        isReady,
        refresh,
      }}
    >
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
