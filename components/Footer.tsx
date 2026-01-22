import React from "react";

export function Footer() {
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
