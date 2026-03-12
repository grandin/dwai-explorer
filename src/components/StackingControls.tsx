import React from "react";
import type { StackingDimension } from "../types";

const stackingOptions: { value: StackingDimension; label: string }[] = [
  { value: "activity", label: "Activity" },
  { value: "arrangement", label: "Arrangement level" },
  { value: "attestation", label: "Attestation level" },
  { value: "risk", label: "Primary Risk type" },
  { value: "value", label: "Primary Value type" }
];

interface StackingControlsProps {
  stacking: StackingDimension;
  onStackingChange: (value: StackingDimension) => void;
  filterDimension: StackingDimension | "none";
  onFilterDimensionChange: (value: StackingDimension | "none") => void;
  filterValue: string;
  onFilterValueChange: (value: string) => void;
  availableFilterValues: string[];
}

export const StackingControls: React.FC<StackingControlsProps> = ({
  stacking,
  onStackingChange,
  filterDimension,
  onFilterDimensionChange,
  filterValue,
  onFilterValueChange,
  availableFilterValues
}) => {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Stacking
        </span>
        <select
          className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          value={stacking}
          onChange={(e) => onStackingChange(e.target.value as StackingDimension)}
        >
          {stackingOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Highlight / Dim
        </span>
        <select
          className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          value={filterDimension}
          onChange={(e) =>
            onFilterDimensionChange(
              e.target.value === "none" ? "none" : (e.target.value as StackingDimension)
            )
          }
        >
          <option value="none">None</option>
          {stackingOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:opacity-40"
          value={filterValue}
          onChange={(e) => onFilterValueChange(e.target.value)}
          disabled={filterDimension === "none" || availableFilterValues.length === 0}
        >
          <option value="">All</option>
          {availableFilterValues.map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

