import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSdk } from "@/sdk-context.tsx";
import {
  Database,
  Globe,
  Key,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  TestTube,
} from "lucide-react";
import { RocketBaseClient } from "@vski/sdk";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { apiUrl, setApiUrl, dbName, setDbName, refresh } = useSdk();
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [localDbName, setLocalDbName] = useState(dbName);
  const [activeTab, setActiveTab] = useState<"password" | "key">("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { success: boolean; message: string } | null
  >(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const client = new RocketBaseClient(localApiUrl);
      client.setDb(localDbName);
      client.setAdminDb(localDbName);

      if (activeTab === "password") {
        await client.admins.authWithPassword(email, password);
      } else {
        client.setApiKey(apiKey);
        // API keys don't have isAdmin=true, so they can't access /api/admins/me
        // But they (usually) have workflow role, so let's check stats
        await client.workflowStats.get();
      }

      setTestResult({ success: true, message: "Connection successful!" });
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiUrl(localApiUrl);
    setDbName(localDbName);

    if (activeTab === "password") {
      // The token is already saved to localStorage by the client if we tested successfully
    } else {
      // We'll use a new client to make sure everything is clean
      const client = new RocketBaseClient(localApiUrl);
      client.setApiKey(apiKey);
    }

    refresh();
    onClose();
  };

  return createPortal(
    <div className="modal modal-open">
      <div className="modal-box max-w-md border-2 border-primary/20 shadow-2xl p-0 overflow-hidden">
        <div className="bg-base-200 p-6 border-b border-base-content/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">
                Connect to <span className="text-primary">Live API</span>
              </h3>
              <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">
                Infrastructure Configuration
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> API Gateway URL
                </span>
              </label>
              <input
                type="text"
                placeholder="https://api.vski.ai"
                className="input input-bordered font-mono text-sm"
                value={localApiUrl}
                onChange={(e) => setLocalApiUrl(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Database Name
                </span>
              </label>
              <input
                type="text"
                placeholder="postgres"
                className="input input-bordered font-mono text-sm"
                value={localDbName}
                onChange={(e) => setLocalDbName(e.target.value)}
              />
            </div>
          </div>

          <div className="tabs tabs-boxed bg-base-200 p-1">
            <button
              className={`tab tab-sm flex-1 font-bold ${
                activeTab === "password" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("password")}
            >
              PASSWORD
            </button>
            <button
              className={`tab tab-sm flex-1 font-bold ${
                activeTab === "key" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("key")}
            >
              API KEY
            </button>
          </div>

          {activeTab === "password"
            ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="form-control">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                    <input
                      type="email"
                      placeholder="Admin Email"
                      className="input input-bordered w-full pl-10 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-control">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                    <input
                      type="password"
                      placeholder="Password"
                      className="input input-bordered w-full pl-10 text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )
            : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="form-control">
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                    <textarea
                      placeholder="Paste your API Key here..."
                      className="textarea textarea-bordered w-full pl-10 text-sm font-mono h-24"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

          {testResult && (
            <div
              className={`alert ${
                testResult.success ? "alert-success" : "alert-error"
              } py-2 shadow-sm text-xs font-bold`}
            >
              {testResult.message}
            </div>
          )}
        </div>

        <div className="p-6 bg-base-200 border-t border-base-content/5 flex gap-2">
          <button
            className="btn btn-ghost flex-1 font-black uppercase tracking-tighter"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`btn btn-outline flex-1 gap-2 font-black uppercase tracking-tighter ${
              testing ? "loading" : ""
            }`}
            onClick={handleTest}
            disabled={testing}
          >
            {!testing && <TestTube className="w-4 h-4" />}
            Test
          </button>
          <button
            className="btn btn-primary flex-1 gap-2 font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
            onClick={handleSave}
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </div>,
    document.body,
  );
}
