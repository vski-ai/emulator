import React, { useEffect } from "react";
import { SdkProvider, useSdk } from "./sdk-context.tsx";
import { Header } from "./components/Header.tsx";
import { WorkflowTester } from "./components/WorkflowTester.tsx";
import { Link, Route, Switch, useRoute } from "wouter";
import { WORKFLOW_DEMOS } from "./workflow-config.ts";
import {
  ArrowLeft,
  ChevronRight,
  Code,
  LayoutGrid,
  Network,
  Play,
  RotateCcw,
  Terminal as TerminalIcon,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Mermaid } from "./components/Mermaid.tsx";
import * as Icons from "lucide-react";
import { WorkflowEvent } from "./components/WorkflowLogger.tsx";

function Home() {
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const categories = ["All", ...new Set(WORKFLOW_DEMOS.map((d) => d.category))];

  const filteredDemos =
    (selectedCategory === "All"
      ? WORKFLOW_DEMOS
      : WORKFLOW_DEMOS.filter((d) => d.category === selectedCategory))
      .sort((a, b) => {
        if (selectedCategory === "All") {
          if (a.isTop && !b.isTop) return -1;
          if (!a.isTop && b.isTop) return 1;
        }
        return 0;
      });

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="text-center space-y-6 py-12">
        <div className="inline-block p-2 bg-primary/10 rounded-2xl mb-4 border border-primary/20">
          <TerminalIcon className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <h1 className="text-6xl font-black tracking-tighter uppercase italic">
          VSKI <span className="text-primary">Workflows</span>
        </h1>
        <p className="text-base-content/50 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
          Infrastructure in your pocket. Run durable state machines directly in
          the browser.
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm font-bold border-2 ${
              selectedCategory === cat
                ? "btn-primary border-primary"
                : "btn-ghost border-base-content/10 hover:border-primary/50"
            }`}
          >
            {cat === "All" && <LayoutGrid className="w-3 h-3 mr-1" />}
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDemos.map((demo) => {
          const IconComponent = (Icons as any)[demo.icon] || Icons.HelpCircle;
          return (
            <Link key={demo.id} href={`/workflow/${demo.id}`}>
              <div className="card bg-base-100 shadow-sm hover:shadow-primary/20 hover:shadow-2xl transition-all cursor-pointer group border-2 border-base-content/5 hover:border-primary/40 overflow-hidden relative">
                <div className="h-32 flex items-center justify-center bg-base-200/50 group-hover:bg-primary/5 transition-colors relative">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden font-mono text-[8px] leading-none whitespace-pre select-none">
                    {Array(20).fill(0).map(() =>
                      Math.random().toString(36).substring(2)
                    ).join(" ")}
                  </div>
                  <IconComponent
                    className={`w-16 h-16 text-${demo.color} group-hover:scale-110 transition-transform duration-500`}
                    strokeWidth={1.5}
                  />

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <div className="badge badge-neutral border-none text-[9px] font-black tracking-widest bg-black">
                      {demo.category.toUpperCase()}
                    </div>
                    {demo.isTop && (
                      <div className="badge badge-primary text-[9px] font-black tracking-widest">
                        FEATURED
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-body p-6">
                  <h2 className="card-title text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                    {demo.name}
                  </h2>
                  <p className="text-xs opacity-50 mt-2 leading-relaxed h-12 overflow-hidden">
                    {demo.description}
                  </p>
                  <div className="card-actions justify-between items-center mt-6 pt-4 border-t border-base-content/5">
                    <span className="text-[10px] font-bold opacity-30 group-hover:opacity-100 transition-opacity">
                      ID: {demo.id.toUpperCase()}
                    </span>
                    <span className="text-primary text-[10px] font-black flex items-center gap-1 group-hover:gap-2 transition-all">
                      INITIALIZE <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowPage() {
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
          <button className="btn btn-ghost btn-sm gap-2 uppercase font-black tracking-tighter">
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
              className="btn btn-outline btn-sm gap-2 font-bold"
              onClick={() => setShowCode(true)}
            >
              <Code className="w-4 h-4" /> CODE
            </button>
          )}
          {demo.hasFlowchart && (
            <button
              className="btn btn-outline btn-sm gap-2 font-bold"
              onClick={() => setShowFlow(true)}
            >
              <Network className="w-4 h-4" /> FLOW
            </button>
          )}
          <button
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
            <button>close</button>
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
            <button>close</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="py-12 border-t border-base-content/5 mt-20 opacity-40 hover:opacity-100 transition-opacity">
      <div className="text-center space-y-2">
        <div className="text-[10px] font-black tracking-widest uppercase italic">
          VSKI Platform Engine
        </div>
        <p className="text-xs">
          Anton A Nesterov &copy; 2026 —
          <a
            href="https://github.com/nesterow"
            target="_blank"
            className="ml-1 text-primary hover:underline"
          >
            github.com/nesterow
          </a>
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <SdkProvider>
      <div className="min-h-screen bg-base-200 text-base-content pb-10">
        <Header />
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/workflow/:id" component={WorkflowPage} />
            <Route>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold">404</h1>
                <p>Page not found</p>
                <Link href="/" className="btn btn-primary mt-4">Go Home</Link>
              </div>
            </Route>
          </Switch>
          <Footer />
        </main>
      </div>
    </SdkProvider>
  );
}
