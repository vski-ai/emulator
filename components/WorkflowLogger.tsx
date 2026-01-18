import React, { useEffect, useRef } from "react";
import { CheckCircle2, Circle, AlertCircle, Clock, MessageSquare } from "lucide-react";

export interface WorkflowEvent {
  eventId: string;
  eventType: string;
  correlationId?: string;
  payload: any;
  createdAt: string | Date;
}

interface WorkflowLoggerProps {
  events: WorkflowEvent[];
  status?: string;
  runId?: string | null;
}

export function WorkflowLogger({ events, status, runId }: WorkflowLoggerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getIcon = (type: string) => {
    switch (type) {
      case "step_completed": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "step_failed": return <AlertCircle className="w-4 h-4 text-error" />;
      case "step_retrying": return <Clock className="w-4 h-4 text-warning" />;
      case "signal_waiting": return <MessageSquare className="w-4 h-4 text-info" />;
      case "signal_received": return <CheckCircle2 className="w-4 h-4 text-info" />;
      default: return <Circle className="w-4 h-4 text-base-content/30" />;
    }
  };

  const getLabel = (event: WorkflowEvent) => {
    const payload = event.payload || {};
    switch (event.eventType) {
      case "step_started": return `Started step: ${event.correlationId} (Attempt ${payload.attempt || 0})`;
      case "step_completed": return `Completed step: ${event.correlationId}`;
      case "step_failed": return `Failed step: ${event.correlationId} - ${payload.error}`;
      case "step_retrying": return `Retrying step: ${event.correlationId} (Attempt ${payload.attempt})`;
      case "wait_created": return `Sleeping for ${payload.duration}ms...`;
      case "wait_completed": return `Woke up from sleep`;
      case "signal_waiting": return `Waiting for signal: ${payload.name}`;
      case "signal_received": return `Received signal: ${event.correlationId?.replace('signal-', '')}`;
      case "rollback_registered": return `Registered rollback: ${payload.method}`;
      default: return event.eventType;
    }
  };

  return (
    <div className="card bg-base-300 shadow-inner h-96">
      <div className="card-body p-0 flex flex-col h-full">
        <div className="p-4 border-b border-base-content/10 flex-none flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider opacity-50 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Workflow Execution Log
          </h3>
          <div className="flex items-center gap-2">
            <span className="badge badge-ghost badge-sm border-base-content/10">{events.length} events</span>
            {status && status !== 'idle' && (
              <span className={`badge badge-sm font-bold ${
                status === 'completed' ? 'badge-success' : 
                status === 'failed' ? 'badge-error' : 
                status === 'running' ? 'badge-primary' : 'badge-ghost'
              }`}>
                {status.toUpperCase()}
              </span>
            )}
            {runId && <span className="text-[10px] opacity-20 font-mono hidden sm:inline">ID: {runId}</span>}
          </div>
        </div>
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs scroll-smooth"
        >
          {events.length === 0 && (
            <div className="h-full flex items-center justify-center opacity-30 italic">
              No events yet. Start a workflow to see logs.
            </div>
          )}
          {events.map((event) => (
            <div key={event.eventId} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="mt-0.5">{getIcon(event.eventType)}</div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className={event.eventType.includes('failed') ? 'text-error' : ''}>
                    {getLabel(event)}
                  </span>
                  <span className="opacity-30 text-[10px]">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {event.eventType === "step_completed" && event.payload?.output !== undefined && (
                  <pre className="mt-1 p-2 bg-base-100 rounded text-[10px] opacity-70 overflow-x-auto">
                    {JSON.stringify(event.payload.output, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
