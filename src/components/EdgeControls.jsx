import React from "react";

export function EdgeControls({
  endeCount,
  wfsqPathCount,
  sclOn,
  setSclOn,
  endeOn,
  setEndeOn,
  wfsqOn,
  setWfsqOn,
  sclDimension,
  setSclDimension,
  sclValue,
  setSclValue,
  sclOptions
}) {
  const dimLabel =
    sclDimension === "risk"
      ? "Risk"
      : sclDimension === "value"
      ? "Value"
      : sclDimension === "expertise"
      ? "Expertise"
      : "Tool";

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-20 flex max-w-sm flex-col gap-2 rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-xs text-slate-200 shadow-xl backdrop-blur">
      <div className="font-semibold uppercase tracking-wide text-slate-400">
        Edge layers
      </div>

      <div className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1.5">
        <label className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
          <span>
            Enablement (EnDe) <span className="text-slate-500">{endeCount}</span>
          </span>
          <input
            type="checkbox"
            checked={endeOn}
            onChange={(e) => setEndeOn(e.target.checked)}
          />
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-1.5 text-[10px] text-slate-500">
          <svg width="36" height="10" className="shrink-0" aria-hidden>
            <line x1="2" y1="5" x2="34" y2="5" stroke="#BA7517" strokeWidth="2" />
          </svg>
          <span>enables / unlocks</span>
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1.5">
        <label className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
          <span>
            Workflow (WfSq){" "}
            <span className="text-slate-500">{wfsqPathCount} paths</span>
          </span>
          <input
            type="checkbox"
            checked={wfsqOn}
            onChange={(e) => setWfsqOn(e.target.checked)}
          />
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-1.5 text-[10px] text-slate-500">
          <svg width="36" height="10" className="shrink-0" aria-hidden>
            <line
              x1="2"
              y1="5"
              x2="34"
              y2="5"
              stroke="#0F6E56"
              strokeWidth="2"
              strokeDasharray="8 5"
            />
          </svg>
          <span>practitioner sequence</span>
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-900/80 p-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={sclOn}
            onChange={(e) => setSclOn(e.target.checked)}
          />
          <span>Shared capability (SCL)</span>
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-1.5 text-[10px] text-slate-500">
          <svg width="36" height="10" className="shrink-0" aria-hidden>
            <line
              x1="2"
              y1="5"
              x2="34"
              y2="5"
              stroke="#888780"
              strokeWidth="1"
              strokeDasharray="2 5"
            />
          </svg>
          <span>shared capability</span>
        </div>
        {sclOn && (
          <div className="mt-2 flex flex-col gap-1 border-t border-slate-800 pt-2">
            <select
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              value={sclDimension}
              onChange={(e) => {
                setSclDimension(e.target.value);
                setSclValue("");
              }}
            >
              <option value="risk">Risk type</option>
              <option value="value">Value type</option>
              <option value="expertise">Expertise</option>
              <option value="tool">Tool</option>
            </select>
            <select
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              value={sclValue}
              onChange={(e) => setSclValue(e.target.value)}
            >
              <option value="">— Select {dimLabel} —</option>
              {sclOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
