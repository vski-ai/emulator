import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSdk } from "@/sdk-context.tsx";
import { useTour } from "@/components/TourProvider.tsx";
import { LoginModal } from "@/components/LoginModal.tsx";
import {
  Cloud,
  Compass,
  Database,
  Github,
  HelpCircle,
  Info,
  Settings,
} from "lucide-react";

export function Header() {
  const { mode, setMode, apiUrl, dbName, isReady } = useSdk();
  const { startTour } = useTour();
  const [showAbout, setShowAbout] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header className="navbar bg-base-100 border-b border-base-content/10 px-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="flex-1 flex items-center gap-4">
        <a
          href="/"
          className="btn btn-ghost text-2xl gap-2 font-black tracking-tighter italic p-0 hover:bg-transparent"
        >
          <Database className="w-7 h-7 text-primary" strokeWidth={3} />
          VSKI{" "}
          <span className="font-light text-base-content/40 not-italic">
            EMULATOR
          </span>
        </a>

        <div className="flex items-center gap-1 border-l border-base-content/10 pl-4 ml-2">
          <button
            className="btn btn-ghost btn-sm gap-2 font-black text-[10px] tracking-tighter opacity-60 hover:opacity-100 uppercase"
            onClick={startTour}
          >
            <Compass className="w-4 h-4 text-primary" />
            Tour
          </button>

          <button
            className="btn btn-ghost btn-xs btn-circle opacity-50 hover:opacity-100"
            onClick={() => setShowAbout(true)}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <a
            href="https://github.com/vski-ai/emulator/"
            target="_blank"
            className="btn btn-ghost btn-xs btn-circle opacity-50 hover:opacity-100"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex-none flex items-center gap-4">
        <div className="flex bg-base-200 p-1 rounded-lg border border-base-content/5">
          <button
            className={`btn btn-xs rounded-md ${
              mode === "emulator"
                ? "btn-primary shadow-lg shadow-primary/20"
                : "btn-ghost"
            }`}
            onClick={() => setMode("emulator")}
          >
            <Settings className="w-3 h-3 mr-1" />
            EMULATOR
          </button>
          <button
            className={`btn btn-xs rounded-md ${
              mode === "url"
                ? "btn-primary shadow-lg shadow-primary/20"
                : "btn-ghost"
            }`}
            onClick={() => {
              setMode("url");
              setShowLogin(true);
            }}
          >
            <Cloud className="w-3 h-3 mr-1" />
            LIVE API
          </button>
        </div>

        {mode === "url" && (
          <div
            className="flex items-center gap-2 px-3 py-1 bg-base-200 rounded-lg border border-base-content/5 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setShowLogin(true)}
          >
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono leading-none opacity-40 uppercase font-black">
                Gateway
              </span>
              <span className="text-[10px] font-mono leading-none font-bold">
                {new URL(apiUrl).hostname}
              </span>
            </div>
            <div className="w-px h-4 bg-base-content/10 mx-1" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono leading-none opacity-40 uppercase font-black">
                DB
              </span>
              <span className="text-[10px] font-mono leading-none font-bold">
                {dbName}
              </span>
            </div>
          </div>
        )}

        <div
          className={`badge ${
            isReady
              ? "badge-success"
              : (mode === "url" && apiUrl ? "badge-error" : "badge-warning")
          } badge-sm font-bold tracking-widest text-[9px] cursor-pointer ${
            !isReady && mode === "url" ? "animate-pulse" : ""
          }`}
          onClick={() => mode === "url" && setShowLogin(true)}
        >
          {isReady
            ? "READY"
            : (mode === "url" && apiUrl ? "ERROR" : "CONNECTING")}
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      {/* About Modal */}
      {showAbout && createPortal(
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl border-2 border-primary/20 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Info className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-black italic tracking-tight uppercase">
                  VSKI Durable Execution
                </h3>
                <p className="text-sm opacity-50 font-bold uppercase tracking-widest">
                  Infrastructure in your pocket
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed overflow-y-auto max-h-[60vh] pr-2">
              <p>
                <span className="text-primary font-bold">
                  Durable Execution
                </span>{" "}
                is a programming paradigm that allows you to write code that is
                guaranteed to run to completion, regardless of infrastructure
                failures, network timeouts, or human response times.
              </p>

              <div className="bg-base-200 p-4 rounded-xl space-y-2 border border-base-content/5">
                <h4 className="font-black uppercase text-xs tracking-wider flex items-center gap-2">
                  <Database className="w-3 h-3" /> Key Benefits
                </h4>
                <ul className="list-disc list-inside opacity-70 space-y-1 text-xs">
                  <li>Automatic retries on transient step failures</li>
                  <li>State is preserved across restarts and crashes</li>
                  <li>Pause for days/months waiting for external signals</li>
                  <li>
                    "Code as Infrastructure" - no more complex state machines in
                    DB
                  </li>
                </ul>
              </div>

              <p>
                This application is a demonstration of the{" "}
                <span className="font-bold">VSKI Platform</span>. VSKI is
                designed to provide powerful backend primitives (like these
                workflows) in a self-hosted, private-first package.
              </p>

              <p className="p-4 bg-primary/5 rounded-xl border border-primary/10 italic text-xs">
                In this demo, you are using the{" "}
                <span className="font-bold">VSKI Workflow Emulator</span>. It
                replicates the entire server-side engine logic directly in your
                browser using Fetch/WebSocket interception and in-memory event
                sourcing.
              </p>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-primary btn-sm font-black uppercase tracking-widest"
                onClick={() => setShowAbout(false)}
              >
                Understood
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowAbout(false)}
          >
            <button>close</button>
          </form>
        </div>,
        document.body,
      )}
    </header>
  );
}
