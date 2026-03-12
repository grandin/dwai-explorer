import React, { useEffect, useRef, useState } from "react";
import type { TooltipData } from "../types";

type TooltipCategory =
  | "value_types"
  | "risk_types"
  | "expertise_types"
  | "attestation_levels"
  | "attestation_diagnostics"
  | "arrangement_levels";

interface TooltipTagProps {
  tooltipData?: TooltipData;
  category?: TooltipCategory;
  term: string;
  className?: string;
  definitionOverride?: string;
  provenanceOverride?: string;
}

export const TooltipTag: React.FC<TooltipTagProps> = ({
  tooltipData,
  category,
  term,
  className,
  definitionOverride,
  provenanceOverride
}) => {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0
  });

  const entry =
    tooltipData && category ? ((tooltipData[category] as any)?.[term] as any) : undefined;

  const definition = definitionOverride ?? entry?.definition;
  const provenance = provenanceOverride ?? entry?.provenance;
  const hasEntry = Boolean(definition);

  useEffect(() => {
    if (!visible || !hasEntry) return;
    const wrapper = wrapperRef.current;
    const tooltip = tooltipRef.current;
    if (!wrapper || !tooltip) return;

    const triggerRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = triggerRect.right - tooltipRect.width;
    if (left < 8) {
      left = triggerRect.left;
    }
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - tooltipRect.width - 8);
    }

    let top = triggerRect.bottom + 8;
    if (top + tooltipRect.height > window.innerHeight - 8) {
      top = triggerRect.top - tooltipRect.height - 8;
    }
    if (top < 8) {
      top = 8;
    }

    setPosition({ top, left });
  }, [visible, hasEntry, term, definition, provenance]);

  useEffect(() => {
    if (!visible) return;
    const handleScrollOrResize = () => {
      setVisible(false);
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [visible]);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex items-center ${className ?? ""}`}
      onMouseEnter={() => hasEntry && setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-100 border border-slate-700/70">
        {term}
      </span>
      {hasEntry && (
        <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-300">
          i
        </span>
      )}
      {hasEntry && visible && (
        <div
          ref={tooltipRef}
          className="fixed z-40 w-72 rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-100 shadow-xl backdrop-blur-sm"
          style={{ top: position.top, left: position.left }}
        >
          <div className="mb-1 font-semibold">{term}</div>
          <div className="mb-1 text-slate-200">{definition}</div>
          {provenance && (
            <div className="text-[10px] text-slate-400">Provenance: {provenance}</div>
          )}
        </div>
      )}
    </span>
  );
};

