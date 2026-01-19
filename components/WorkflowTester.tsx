import React, { useEffect, useState } from "react";
import { WorkflowEvent, WorkflowLogger } from "./WorkflowLogger.tsx";
import { ActorAction, ActorCard } from "./ActorCard.tsx";
import { AlertTriangle, Play, RefreshCw } from "lucide-react";
import { useSdk } from "@/sdk-context.tsx";

interface ActorConfig {
  name: string;
  role: "user" | "manager" | "system";
  signals?: {
    name: string;
    label: string;
    data: any;
  }[];
}

interface WorkflowTesterProps {
  workflowName: string;
  actors: ActorConfig[];
  status: string;
  events: WorkflowEvent[];
  error: string | null;
  activeRunId: string | null;
  handleSignal: (
    signalName: string,
    data: any,
    correlationId?: string,
  ) => Promise<void>;
  setRunId: (runId: string) => void;
}

export function WorkflowTester({
  workflowName,
  actors,
  status,
  events,
  error,
  activeRunId,
  handleSignal,
  setRunId,
}: WorkflowTesterProps) {
  const { client, isReady } = useSdk();
  const [activeRuns, setActiveRuns] = useState<any[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);

  const fetchActiveRuns = async () => {
    if (!client || !isReady) return;
    setIsLoadingRuns(true);
    try {
      const [pending, running] = await Promise.all([
        client.workflow.listRuns({ workflowName, status: "pending" }),
        client.workflow.listRuns({ workflowName, status: "running" }),
      ]);
      setActiveRuns([...pending.data, ...running.data]);
    } catch (e) {
      console.error("Failed to fetch active runs:", e);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  useEffect(() => {
    fetchActiveRuns();
    const interval = setInterval(fetchActiveRuns, 5000);
    return () => clearInterval(interval);
  }, [client, isReady, workflowName]);

  const handleResume = async (runId: string) => {
    if (!client) return;
    try {
      await client.workflow.resume(runId);
      setRunId(runId);
    } catch (e) {
      console.error("Failed to resume workflow:", e);
    }
  };

  const getWaitingCorrelationId = (signalName: string) => {
    const lastWait = [...events].reverse().find((e) =>
      e.eventType === "signal_waiting" && e.payload.name === signalName
    );
    const lastReceived = [...events].reverse().find((e) =>
      e.eventType === "signal_received" &&
      e.correlationId === lastWait?.correlationId
    );

    if (!lastWait) return null;
    if (lastReceived) return null;

    return lastWait.correlationId;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="alert alert-error shadow-sm py-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      <WorkflowLogger events={events} status={status} runId={activeRunId} />

      {activeRuns.length > 0 && (
        <div className="card bg-base-100 border border-base-content/10 shadow-sm overflow-hidden">
          <div className="bg-base-200 px-4 py-2 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
              <RefreshCw
                className={`w-3 h-3 ${isLoadingRuns ? "animate-spin" : ""}`}
              />
              Unfinished Runs
            </h3>
            <span className="badge badge-ghost badge-xs font-bold">
              {activeRuns.length}
            </span>
          </div>
          <div className="divide-y divide-base-content/5">
            {activeRuns.map((run) => (
              <div
                key={run.runId}
                className="px-4 py-3 flex justify-between items-center hover:bg-base-200/50 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold opacity-70">
                    {run.runId}
                  </span>
                  <span className="text-[9px] opacity-40 uppercase font-black">
                    Started {new Date(run.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`badge badge-xs font-bold tracking-widest ${
                      run.status === "running" ? "badge-primary" : "badge-ghost"
                    }`}
                  >
                    {run.status.toUpperCase()}
                  </div>
                  <button
                    className="btn btn-ghost btn-xs gap-1 font-black uppercase text-[10px] hover:text-primary"
                    onClick={() => handleResume(run.runId)}
                    disabled={run.runId === activeRunId}
                  >
                    {run.runId === activeRunId ? "ACTIVE" : (
                      <>
                        RESUME <Play className="w-2 h-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actors.map((actor) => {
          const waitingSignals = actor.signals?.map((s) => ({
            ...s,
            correlationId: getWaitingCorrelationId(s.name),
          })).filter((s) => !!s.correlationId) || [];

          const actions: ActorAction[] = waitingSignals.map((s) => ({
            label: s.label,
            primary: true,
            onClick: () => handleSignal(s.name, s.data, s.correlationId),
          }));

          return (
            <ActorCard
              key={actor.name}
              name={actor.name}
              role={actor.role}
              isWaiting={actions.length > 0}
              actions={actions}
              status={actions.length > 0
                ? `Needs to ${actions[0].label.toLowerCase()}`
                : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
