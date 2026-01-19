import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: true,
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
});

export function Mermaid(
  { chart, theme = "default" }: {
    chart: string;
    theme?: "default" | "dark" | "neutral" | "forest";
  },
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute("data-processed");
      mermaid.initialize({ theme });
      mermaid.contentLoaded();
    }
  }, [chart, theme]);

  return (
    <div
      className={`mermaid flex justify-center py-4 rounded-xl ${
        theme === "dark" ? "bg-base-300" : "bg-white"
      }`}
      ref={ref}
    >
      {chart}
    </div>
  );
}
