import React from "react";
import { WorkflowLogger, WorkflowEvent } from "./WorkflowLogger.tsx";
import { ActorCard, ActorAction } from "./ActorCard.tsx";
import { AlertTriangle } from "lucide-react";

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
  handleSignal: (signalName: string, data: any, correlationId?: string) => Promise<void>;
}

export function WorkflowTester({ 
  workflowName, 
  actors, 
  status,
  events,
  error,
  activeRunId,
  handleSignal
}: WorkflowTesterProps) {
  const getWaitingCorrelationId = (signalName: string) => {
    const lastWait = [...events].reverse().find(e => e.eventType === 'signal_waiting' && e.payload.name === signalName);
    const lastReceived = [...events].reverse().find(e => e.eventType === 'signal_received' && e.correlationId === lastWait?.correlationId);
    
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actors.map((actor) => {
          const waitingSignals = actor.signals?.map(s => ({
            ...s,
            correlationId: getWaitingCorrelationId(s.name)
          })).filter(s => !!s.correlationId) || [];

          const actions: ActorAction[] = waitingSignals.map(s => ({
            label: s.label,
            primary: true,
            onClick: () => handleSignal(s.name, s.data, s.correlationId)
          }));

          return (
            <ActorCard
              key={actor.name}
              name={actor.name}
              role={actor.role}
              isWaiting={actions.length > 0}
              actions={actions}
              status={actions.length > 0 ? `Needs to ${actions[0].label.toLowerCase()}` : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}