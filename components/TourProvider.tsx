import React, { createContext, ReactNode, useContext, useState } from "react";
import { useLocation } from "wouter";
import { createPortal } from "react-dom";
import { ChevronRight, info, X } from "lucide-react";

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  exitTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [_, setLocation] = useLocation();

  const startTour = () => {
    setIsActive(true);
    steps[currentStep].callback?.();
    setCurrentStep(1);
    // Auto-navigate to first demo if not already on a workflow page
    if (!window.location.pathname.includes("/workflow/")) {
      setLocation("/workflow/approval-workflow");
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      steps[currentStep].callback?.();
    } else {
      exitTour();
    }
  };

  const exitTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    window.scrollTo({ top: 0 });
  };

  const steps = [
    {
      title: "1. Runtime Configuration",
      content:
        "Choose between EMULATOR (local in-memory execution) or LIVE API (connecting to a remote VSKI server).",
      position: "top-right",
      callback() {
        window.scrollTo({ top: 0 });
      },
    },
    {
      title: "2. Triggering Execution",
      content:
        "Click INITIALIZE to start a new durable workflow run. This generates a unique Run ID and begins replaying the code logic.",
      position: "execution",
    },
    {
      title: "3. Durable Observability",
      content:
        "Every step, retry, and sleep is recorded here. Because the logic is durable, the execution state survives failures and can be resumed at any point.",
      position: "center",
      callback() {
        window.scrollTo({ top: 200 });
      },
    },
    {
      title: "4. Human-in-the-Loop",
      content:
        "These cards represent workflow participants. When the code reaches a 'waitForSignal' point, the corresponding actor card will pulse and show manual actions.",
      position: "bottom-center",
      callback() {
        window.scrollTo({ top: 1000 });
      },
    },
  ];

  const renderStep = () => {
    if (!isActive || currentStep === 0) return null;
    const step = steps[currentStep - 1];

    const positionClasses = {
      "bottom-center": "bottom-8 left-1/2 -translate-x-1/2",
      "top-right": "top-24 right-8",
      "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      "top-center": "top-24 left-1/2 -translate-x-1/2",
      "execution": "top-54 right-20",
    }[step.position];

    return createPortal(
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <div className="absolute inset-0 bg-black/40 " />
        <div
          className={`absolute ${positionClasses} w-80 md:w-96 pointer-events-auto animate-in zoom-in-95 duration-200`}
        >
          <div className="card bg-base-100 border-2 border-primary shadow-2xl overflow-hidden">
            <div className="bg-primary p-3 flex justify-between items-center text-primary-content">
              <span className="font-black text-xs uppercase tracking-widest">
                {step.title}
              </span>
              <button
                onClick={exitTour}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <X size={14} />
              </button>
            </div>
            <div className="card-body p-5 space-y-4">
              <p className="text-sm font-medium leading-relaxed italic opacity-80 italic">
                "{step.content}"
              </p>
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i === currentStep ? "bg-primary" : "bg-base-content/20"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-ghost btn-xs uppercase font-bold"
                    onClick={exitTour}
                  >
                    Exit
                  </button>
                  <button
                    className="btn btn-primary btn-xs uppercase font-black px-4"
                    onClick={nextStep}
                  >
                    {currentStep === 4 ? "Finish" : "Next"}{" "}
                    <ChevronRight size={12} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <TourContext.Provider
      value={{ isActive, currentStep, startTour, nextStep, exitTour }}
    >
      {children}
      {renderStep()}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
