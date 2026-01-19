import React, { ReactNode } from "react";
import { HardDrive, Play, Shield, User } from "lucide-react";

export interface ActorAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface ActorCardProps {
  name: string;
  role: "user" | "manager" | "system";
  status?: string;
  icon?: ReactNode;
  actions?: ActorAction[];
  isWaiting?: boolean;
}

export function ActorCard(
  { name, role, status, actions, isWaiting }: ActorCardProps,
) {
  const getRoleIcon = () => {
    switch (role) {
      case "user":
        return <User className="w-5 h-5" />;
      case "manager":
        return <Shield className="w-5 h-5 text-primary" />;
      case "system":
        return <HardDrive className="w-5 h-5 opacity-50" />;
    }
  };

  return (
    <div
      className={`card bg-base-100 shadow-lg border-2 ${
        isWaiting ? "border-info animate-pulse" : "border-transparent"
      } transition-all`}
    >
      <div className="card-body p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-base-200 rounded-lg">
            {getRoleIcon()}
          </div>
          <div>
            <h3 className="font-bold text-sm">{name}</h3>
            <div className="text-[10px] uppercase opacity-50 tracking-widest">
              {role}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs opacity-70 mb-4">
            {status || (isWaiting ? "Waiting for your action..." : "Idle")}
          </div>
        </div>

        {actions && actions.length > 0 && (
          <div className="card-actions justify-end mt-auto pt-2 border-t border-base-200">
            {actions.map((action, i) => (
              <button
                key={i}
                className={`btn btn-xs ${
                  action.primary ? "btn-primary" : "btn-ghost"
                }`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
