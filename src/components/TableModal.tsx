import React from "react";
import { CenteredModal } from "./CenteredModal";

export interface TableColumn {
  key: string;
  header: string;
}

interface TableModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: TableColumn[];
  rows: Record<string, string | number | undefined>[];
}

export const TableModal: React.FC<TableModalProps> = ({
  open,
  onClose,
  title,
  columns,
  rows
}) => {
  return (
    <CenteredModal open={open} onClose={onClose} title={title}>
      <table className="min-w-full border-collapse text-xs text-left text-slate-100">
        <thead className="sticky top-0 bg-slate-950">
          <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
            {columns.map((col) => (
              <th key={col.key} className="px-2 py-2 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-900/60 align-top">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-2 py-2 text-slate-200"
                >
                  {row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </CenteredModal>
  );
};
