import React from "react";

interface FrameworkRow {
  term: string;
  definition: string;
  provenance?: string;
}

interface FrameworkModalProps {
  open: boolean;
  title: string;
  rationale: string;
  rows: FrameworkRow[];
  onClose: () => void;
}

export const FrameworkModal: React.FC<FrameworkModalProps> = ({
  open,
  title,
  rationale,
  rows,
  onClose
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 py-10"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-50">{title}</h2>
            <p className="mt-1 text-xs text-slate-300">{rationale}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto px-6 py-4">
          <table className="min-w-full border-collapse text-xs text-left text-slate-100">
            <thead className="sticky top-0 bg-slate-950">
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-2 py-2 font-semibold">Term</th>
                <th className="px-2 py-2 font-semibold">Definition</th>
                <th className="px-2 py-2 font-semibold">Provenance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.term} className="border-b border-slate-900/60 align-top">
                  <td className="px-2 py-2 font-semibold text-slate-100 whitespace-nowrap">
                    {row.term}
                  </td>
                  <td className="px-2 py-2 text-slate-200">{row.definition}</td>
                  <td className="px-2 py-2 text-[11px] text-slate-400">
                    {row.provenance ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

