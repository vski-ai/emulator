import React from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function AlertModal(
  { isOpen, onClose, title = "Notice", message }: AlertModalProps,
) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal modal-open flex items-center justify-center">
      <div className="modal-box border border-base-content/10 shadow-2xl p-0 overflow-hidden max-w-sm">
        <div className="bg-primary/5 p-4 flex items-center justify-between border-b border-base-content/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm font-medium opacity-80 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 bg-base-200/50 flex justify-end">
          <button
            className="btn btn-primary btn-sm px-6 font-bold uppercase tracking-wider text-[10px]"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
      <form
        method="dialog"
        className="modal-backdrop bg-base-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <button>close</button>
      </form>
    </div>,
    document.body,
  );
}
