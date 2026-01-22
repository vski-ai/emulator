import React, { useState } from "react";
import { Link } from "wouter";

import {
  ChevronRight,
  LayoutGrid,
  Terminal as TerminalIcon,
} from "lucide-react";

import * as Icons from "lucide-react";

import { WORKFLOW_DEMOS } from "@/workflow-config.ts";

export function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");

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
          VSKI <span className="text-primary">Emulator</span>
        </h1>
        <p className="text-base-content/50 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
          Infrastructure in your pocket. Run durable state machines directly in
          the browser.
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((cat) => (
          <button
            type="button"
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
