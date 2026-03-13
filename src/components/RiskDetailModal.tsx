import React from "react";
import type { RiskModalEntry } from "../types";
import { CenteredModal } from "./CenteredModal";

interface RiskDetailModalProps {
  open: boolean;
  onClose: () => void;
  entry: RiskModalEntry | null;
}

export const RiskDetailModal: React.FC<RiskDetailModalProps> = ({
  open,
  onClose,
  entry
}) => {
  if (!entry) return null;

  return (
    <CenteredModal open={open} onClose={onClose} title={entry.title}>
      <div className="space-y-4 text-sm text-slate-200">
        <p className="leading-relaxed">{entry.description}</p>

        {entry.observed_manifestations?.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Observed manifestations
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              {entry.observed_manifestations.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {entry.design_transfer?.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Design transfer
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              {entry.design_transfer.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CenteredModal>
  );
};
