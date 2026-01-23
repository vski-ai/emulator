import React, { useMemo, useState } from "react";
import { ChatSimulationLayout } from "./ChatSimulationLayout.tsx";
import { ChatMessage } from "./ChatBubble.tsx";
import { WorkflowEvent } from "../WorkflowLogger.tsx";
import { AlertTriangle, Play, RefreshCw } from "lucide-react";
import { useSdk } from "@/sdk-context.tsx";
import { AlertModal } from "../AlertModal.tsx";
import { ActorAction, ActorCard } from "../ActorCard.tsx";

interface ActorConfig {
  name: string;
  role: "user" | "manager" | "system";
  signals?: {
    name: string;
    label: string;
    data: any;
    chatLabel?: string;
  }[];
}

interface ChatWorkflowTesterProps {
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

export function ChatWorkflowTester({
  workflowName,
  actors,
  status,
  events,
  error,
  activeRunId,
  handleSignal,
  setRunId,
}: ChatWorkflowTesterProps) {
  const { client, isReady } = useSdk();
  const [activeRuns, setActiveRuns] = useState<any[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [alertConfig, setAlertConfig] = useState<
    { isOpen: boolean; message: string }
  >({
    isOpen: false,
    message: "",
  });

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

  React.useEffect(() => {
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

  const { userMessages, managerMessages } = useMemo(() => {
    const uMsgs: ChatMessage[] = [];
    const mMsgs: ChatMessage[] = [];

    // ... (rest of the useMemo logic)

    // Helper to find signal definition and its owner across all actors
    const findSignalDefinition = (sigName: string, data: any) => {
      for (const actor of actors) {
        const signals = actor.signals || [];
        const matches = signals.filter((s) => s.name === sigName);
        if (matches.length === 0) continue;

        if (matches.length === 1) return { actor, signal: matches[0] };

        const bestMatch = matches.find((s) => {
          const configData = s.data || {};
          const eventData = data || {};
          const configKeys = Object.keys(configData);
          if (configKeys.length === 0) {
            return Object.keys(eventData).length === 0;
          }
          return configKeys.every((k) => eventData[k] === configData[k]);
        });

        if (bestMatch) return { actor, signal: bestMatch };
        return { actor, signal: matches[0] };
      }
      return null;
    };

    const humanize = (str: string) => {
      if (!str) return "";
      return str.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };

    // Process events chronologically
    events.forEach((e) => {
      const ts = new Date(e.createdAt);

      if (e.eventType === "step_completed" && (e.payload?.output?.target)) {
        const { target, text } = e.payload.output;
        const msg: ChatMessage = {
          id: e.eventId,
          sender: "system",
          text: text,
          timestamp: ts,
        };
        if (target === "user") uMsgs.push(msg);
        if (target === "manager") mMsgs.push(msg);
      }

      if (e.eventType === "signal_received") {
        const waitEvent = events.find((prev) =>
          prev.correlationId === e.correlationId &&
          prev.eventType === "signal_waiting"
        );

        if (waitEvent) {
          const sigName = waitEvent.payload.name;
          const sigData = e.payload;
          const result = findSignalDefinition(sigName, sigData);

          if (result) {
            const { actor, signal } = result;
            const text = signal.chatLabel || signal.label || humanize(sigName);

            const msg: ChatMessage = {
              id: e.eventId,
              sender: actor.role as any,
              text: text,
              timestamp: ts,
            };
            if (actor.role === "user") uMsgs.push(msg);
            if (actor.role === "manager") mMsgs.push(msg);

            const targetList = actor.role === "user" ? uMsgs : mMsgs;
            const sourceMsg = targetList.find((m) =>
              m.actions?.some((a) =>
                (a as any).correlationId === e.correlationId
              )
            );
            if (sourceMsg) {
              sourceMsg.actions = sourceMsg.actions?.map((a) => ({
                ...a,
                disabled: true,
              }));
            }
          }
        }
      }

      if (e.eventType === "signal_waiting") {
        const isReceived = events.some((next) =>
          next.eventType === "signal_received" &&
          next.correlationId === e.correlationId
        );
        const sigName = e.payload.name;
        const ownerActor = actors.find((a) =>
          a.signals?.some((s) => s.name === sigName)
        );

        if (ownerActor) {
          const actions = ownerActor.signals
            ?.filter((s) => s.name === sigName)
            .map((s) => ({
              label: s.label,
              primary: true,
              disabled: isReceived,
              correlationId: e.correlationId,
              onClick: () => handleSignal(s.name, s.data, e.correlationId),
            }));

          const targetList = ownerActor.role === "user" ? uMsgs : mMsgs;
          const lastMsg = targetList[targetList.length - 1];

          if (lastMsg && lastMsg.sender === "system" && !lastMsg.actions) {
            lastMsg.actions = actions;
          } else {
            const msg: ChatMessage = {
              id: e.eventId,
              sender: "system",
              text: `Action required: ${humanize(sigName)}`,
              timestamp: ts,
              actions: actions,
            };
            targetList.push(msg);
          }
        }
      }
    });

    return { userMessages: uMsgs, managerMessages: mMsgs };
  }, [events, actors, handleSignal]);

  const handleLocalSend = (target: "user" | "manager") => (text: string) => {
    setAlertConfig({
      isOpen: true,
      message:
        "The chat service isn't connected. This is a workflow replay. Please use the interactive buttons to progress the workflow.",
    });
  };

  return (
    <div className="space-y-6">
      <AlertModal
        isOpen={alertConfig.isOpen}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
      {activeRuns.length > 0 && (
        <div className="card bg-base-100 border border-base-content/10 shadow-sm overflow-hidden mb-4">
          <div className="bg-base-200 px-4 py-2 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
              <RefreshCw
                className={`w-3 h-3 ${isLoadingRuns ? "animate-spin" : ""}`}
              />
              Active Sessions
            </h3>
          </div>
          <div className="divide-y divide-base-content/5">
            {activeRuns.map((run) => (
              <div
                key={run.runId}
                className="px-4 py-3 flex justify-between items-center hover:bg-base-200/50 transition-colors"
              >
                <span className="text-[10px] font-mono font-bold opacity-70">
                  {run.runId}
                </span>
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

      {error && (
        <div className="alert alert-error shadow-sm py-2 text-xs">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {(() => {
        const isUserWaiting = actors
          .filter((a) => a.role === "user")
          .some((a) =>
            a.signals?.some((s) => !!getWaitingCorrelationId(s.name))
          );

        const isManagerWaiting = actors
          .filter((a) => a.role === "manager")
          .some((a) =>
            a.signals?.some((s) => !!getWaitingCorrelationId(s.name))
          );

        return (
          <ChatSimulationLayout
            userMessages={userMessages}
            managerMessages={managerMessages}
            onUserSend={handleLocalSend("user")}
            onManagerSend={handleLocalSend("manager")}
            userWaiting={isUserWaiting}
            managerWaiting={isManagerWaiting}
          />
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
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
