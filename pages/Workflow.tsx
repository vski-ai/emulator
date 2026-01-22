import React, { useEffect } from "react";
import { useSdk } from "@/sdk-context.tsx";
import { WorkflowTester } from "@/components/WorkflowTester.tsx";
import { Link, useRoute } from "wouter";

import { ArrowLeft, Code, Network, Play, RotateCcw } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus.js";

import { Mermaid } from "@/components/Mermaid.tsx";
import type { WorkflowEvent } from "@/components/WorkflowLogger.tsx";
import { WORKFLOW_DEMOS } from "@/workflow-config.ts";

export function WorkflowPage() {
  const [match, params] = useRoute("/workflow/:id");
  const demo = WORKFLOW_DEMOS.find((d) => d.id === params?.id);
  const { client, isReady } = useSdk();

  const [showCode, setShowCode] = React.useState(false);
  const [showFlow, setShowFlow] = React.useState(false);
  const [codeContent, setCodeContent] = React.useState<string | null>(null);
  const [flowContent, setFlowContent] = React.useState<string | null>(null);

  const [activeRunId, setRunId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>("idle");
  const [events, setEvents] = React.useState<WorkflowEvent[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchState = React.useCallback(async () => {
    if (!client || !activeRunId) return;
    try {
      const [run, eventList] = await Promise.all([
        client.workflow.getRun(activeRunId),
        client.workflow.listEvents(activeRunId),
      ]);
      setStatus(run.status);
      setEvents(eventList);
      if (run.status === "failed") {
        setError(run.error?.message || "Unknown error");
      }
    } catch (e: any) {
      console.error("Failed to fetch state:", e);
    }
  }, [client, activeRunId]);

  // Reset state and fetch immediately when activeRunId changes
  useEffect(() => {
    if (activeRunId) {
      setStatus("idle");
      setEvents([]);
      setError(null);
      fetchState();
    }
  }, [activeRunId, fetchState]);

  useEffect(() => {
    if (status === "completed" || status === "failed" || !activeRunId) return;
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [status, activeRunId, fetchState]);

  const handleStart = async () => {
    if (!client || !demo) return;
    setError(null);
    setEvents([]);
    try {
      const run = await client.workflow.trigger(demo.id, demo.defaultInput);
      setRunId(run.runId);
      setStatus("pending");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSignal = async (
    signalName: string,
    data: any,
    correlationId?: string,
  ) => {
    if (!client || !activeRunId) return;
    try {
      await client.workflow.sendSignal(
        activeRunId,
        signalName,
        data,
        correlationId,
      );
      await fetchState();
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (showCode && demo && !codeContent) {
      fetch(`/assets/workflows/${demo.id}/code.ts`)
        .then((r) => r.text())
        .then(setCodeContent)
        .catch(console.error);
    }
  }, [showCode, demo, codeContent]);

  useEffect(() => {
    if (showFlow && demo && !flowContent) {
      fetch(`/assets/workflows/${demo.id}/chart.mermaid`)
        .then((r) => r.text())
        .then(setFlowContent)
        .catch(console.error);
    }
  }, [showFlow, demo, flowContent]);

  if (!demo) return <div className="p-8">Workflow not found</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center">
        <Link href="/">
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-2 uppercase font-black tracking-tighter"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Gallery
          </button>
        </Link>
      </div>

      <div className="bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm flex justify-between items-start gap-4">
        <div className="space-y-3 flex-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {demo.name}
          </h1>
          <p className="text-base-content/60 text-sm max-w-2xl">
            {demo.description}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {demo.actors.map((a) => (
              <span
                key={a.name}
                className="badge badge-neutral badge-outline opacity-50 text-[10px] font-bold uppercase tracking-wider bg-black text-white"
              >
                {a.role}: {a.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {demo.hasCode && (
            <button
              type="button"
              className="btn btn-outline btn-sm gap-2 font-bold"
              onClick={() => setShowCode(true)}
            >
              <Code className="w-4 h-4" /> CODE
            </button>
          )}
          {demo.hasFlowchart && (
            <button
              type="button"
              className="btn btn-outline btn-sm gap-2 font-bold"
              onClick={() => setShowFlow(true)}
            >
              <Network className="w-4 h-4" /> FLOW
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2 font-black"
            onClick={handleStart}
            disabled={!isReady || status === "running"}
          >
            {status === "idle" ? "INITIALIZE" : "RESTART"}
            {status === "idle"
              ? <Play className="w-4 h-4" />
              : <RotateCcw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <WorkflowTester
        workflowName={demo.id}
        actors={demo.actors as any}
        status={status}
        events={events}
        error={error}
        activeRunId={activeRunId}
        handleSignal={handleSignal}
        setRunId={setRunId}
      />

      {/* Code Modal */}
      {showCode && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl p-0 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-base-content/10 flex-none flex justify-between items-center bg-base-200">
              <h3 className="font-bold uppercase tracking-widest text-xs">
                Workflow Implementation
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowCode(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
              {codeContent
                ? (
                  <SyntaxHighlighter
                    language="typescript"
                    style={vscDarkPlus as any}
                    customStyle={{
                      margin: 0,
                      padding: "1.5rem",
                      borderRadius: 0,
                      fontSize: "13px",
                      background: "transparent",
                    }}
                  >
                    {codeContent}
                  </SyntaxHighlighter>
                )
                : (
                  <div className="p-8 text-center opacity-50">
                    Loading code...
                  </div>
                )}
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowCode(false)}
          >
            <button type="button">close</button>
          </form>
        </div>
      )}

      {/* Flowchart Modal */}
      {showFlow && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-4 border-b border-base-content/10 pb-4">
              <h3 className="font-bold uppercase tracking-widest text-xs">
                Workflow Logic
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowFlow(false)}
              >
                ✕
              </button>
            </div>
            {flowContent
              ? (
                <Mermaid
                  chart={flowContent}
                  theme={window.matchMedia("(prefers-color-scheme: dark)")
                      .matches
                    ? "dark"
                    : "default"}
                />
              )
              : (
                <div className="p-8 text-center opacity-50">
                  Loading logic...
                </div>
              )}
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowFlow(false)}
          >
            <button type="button">close</button>
          </form>
        </div>
      )}
    </div>
  );
}
