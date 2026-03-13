import React from "react";

interface SectionHeaderProps {
  label: string;
  onClick: () => void;
  title?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  onClick,
  title
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-200"
    >
      {label}
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-400 hover:border-slate-500 hover:text-slate-200"
        aria-hidden
      >
        ⓘ
      </span>
    </button>
  );
};
