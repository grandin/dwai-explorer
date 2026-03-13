import React from "react";
import type { UseCase, TooltipData } from "../types";
import { TooltipTag } from "./TooltipTag";
import { SectionHeader } from "./SectionHeader";

interface DetailPanelProps {
  useCase: UseCase | null;
  tooltipData: TooltipData;
  onOpenFramework: (kind: "arrangement" | "value" | "risk" | "attestation" | "expertise") => void;
  onOpenRiskDetail: (riskType: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  useCase,
  tooltipData,
  onOpenFramework,
  onOpenRiskDetail
}) => {
  if (!useCase) {
    return (
      <aside className="w-96 shrink-0 border-l border-slate-800 bg-slate-950/80 px-4 py-6 text-slate-400">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Detail
        </h2>
        <p className="text-sm text-slate-500">
          Select a use case card to see full details here.
        </p>
      </aside>
    );
  }

  const primaryRisk = useCase.risk_typology[0];
  const phaseEntry = tooltipData.phases?.[useCase.phase];
  const arrangementEntry = tooltipData.arrangement_levels[useCase.arrangement.role];
  const diagnosticKey = useCase.attestation.diagnostic.split(" - ")[0]?.trim() ?? useCase.attestation.diagnostic;
  const displayName = useCase.name.replace(/\s*SUMMARY VIEW[\s\S]*$/i, "").trim();

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-slate-800 bg-slate-950/90 px-5 py-6 text-sm text-slate-100 backdrop-blur">
      <div className="mb-4">
        <div className="mb-1 text-[13px] font-medium uppercase tracking-wide text-slate-400">
          {useCase.id}
        </div>
        {phaseEntry && (
          <div className="mb-0.5 flex items-center gap-1.5">
            <TooltipTag
              term={useCase.phase.toUpperCase()}
              definitionOverride={phaseEntry.definition}
              provenanceOverride={phaseEntry.provenance}
              className="[&>span:first-child]:rounded-none [&>span:first-child]:border-0 [&>span:first-child]:bg-transparent [&>span:first-child]:px-0 [&>span:first-child]:py-0 [&>span:first-child]:text-[12px] [&>span:first-child]:font-semibold [&>span:first-child]:uppercase [&>span:first-child]:tracking-wide [&>span:first-child]:text-slate-500"
            />
          </div>
        )}
        {!phaseEntry && (
          <div className="mb-0.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
            {useCase.phase.toUpperCase()}
          </div>
        )}
        <div className="mb-1 text-[12px] font-medium text-slate-300">
          {useCase.activity}
        </div>
        <h2 className="text-[17px] font-semibold leading-snug text-slate-50">
          {displayName}
        </h2>
      </div>

      <div className="mb-4 flex-1 overflow-y-auto pr-1">
        <div className="mb-4 space-y-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <div className="space-y-1 text-xs">
            <SectionHeader
              label="Value Hypothesis"
              onClick={() => onOpenFramework("value")}
            />
            <div className="mb-1 flex flex-wrap gap-1">
              {useCase.value_hypothesis.types.map((vt) => (
                <TooltipTag
                  key={vt}
                  tooltipData={tooltipData}
                  category="value_types"
                  term={vt}
                />
              ))}
            </div>
            <div className="text-slate-300">
              {useCase.value_hypothesis.sentence}
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <SectionHeader
              label="Human-AI Arrangement"
              onClick={() => onOpenFramework("arrangement")}
            />
            <TooltipTag
              term={`Level ${useCase.arrangement.level} — ${useCase.arrangement.role}`}
              definitionOverride={arrangementEntry?.human_function}
            />
          </div>

          {primaryRisk && (
            <div className="space-y-1 text-xs">
              <SectionHeader
                label="Risk (primary)"
                onClick={() => onOpenFramework("risk")}
              />
              <TooltipTag
                tooltipData={tooltipData}
                category="risk_types"
                term={primaryRisk.type}
              />
            </div>
          )}

          <div className="space-y-1 text-xs">
            <SectionHeader
              label="Attestation Level"
              onClick={() => onOpenFramework("attestation")}
            />
            <TooltipTag
              tooltipData={tooltipData}
              category="attestation_levels"
              term={useCase.attestation.level}
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </h3>
          <p className="text-sm leading-relaxed text-slate-200">{useCase.description}</p>
        </div>

        <div className="mb-4 space-y-2">
          <SectionHeader
            label="Expertise Differentiators"
            onClick={() => onOpenFramework("expertise")}
          />
          <div className="space-y-3 text-xs text-slate-300">
            {useCase.expertise_differentiator.map((ed) => (
              <div key={ed.type} className="space-y-1">
                <TooltipTag
                  tooltipData={tooltipData}
                  category="expertise_types"
                  term={ed.type}
                />
                {ed.narrative ? (
                  <p className="whitespace-pre-line text-slate-300">{ed.narrative}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <div
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
            title="What kind of evidence would validate the value hypothesis. Specific metrics and thresholds belong in the POC template."
          >
            Value indicators
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] text-slate-400"
              aria-hidden
            >
              ⓘ
            </span>
          </div>
          <div className="space-y-3 text-xs text-slate-300">
            {Array.isArray(useCase.value_indicator) && useCase.value_indicator.length > 0 ? (
              useCase.value_indicator.map((vi, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <TooltipTag
                      tooltipData={tooltipData}
                      category="value_types"
                      term={vi.value_type}
                    />
                    <span className="font-medium text-slate-200">{vi.indicator}</span>
                  </div>
                  {vi.description && (
                    <p className="whitespace-pre-line text-slate-300">{vi.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-400">—</p>
            )}
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <SectionHeader
            label="Risk in application"
            onClick={() => onOpenFramework("risk")}
          />
          <div className="space-y-3 text-xs text-slate-300">
            {useCase.risk_typology.map((r, index) => {
              const rankLabel =
                r.rank === "primary"
                  ? "PRIMARY"
                  : r.rank === "secondary"
                  ? "SECONDARY"
                  : "TERTIARY";
              return (
                <div key={`${r.type}-${index}`} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wide text-slate-400">
                      {rankLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenRiskDetail(r.type)}
                      className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-left"
                    >
                      <TooltipTag
                        tooltipData={tooltipData}
                        category="risk_types"
                        term={r.type}
                      />
                    </button>
                  </div>
                  {r.narrative ? (
                    <p className="whitespace-pre-line text-slate-300">{r.narrative}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <SectionHeader
            label="Attestation"
            onClick={() => onOpenFramework("attestation")}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <TooltipTag
              tooltipData={tooltipData}
              category="attestation_levels"
              term={useCase.attestation.level}
            />
            <span className="text-slate-400">·</span>
            <TooltipTag
              tooltipData={tooltipData}
              category="attestation_diagnostics"
              term={diagnosticKey}
            />
          </div>
          {useCase.attestation.diagnostic.includes(" - ") && (
            <p className="text-[11px] text-slate-400">
              {useCase.attestation.diagnostic}
            </p>
          )}
        </div>

        <div className="mb-4 space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tools & Category
          </h3>
          <p className="text-xs text-slate-300">
            <span className="font-medium text-slate-200">Category:</span>{" "}
            {useCase.tool_category}
          </p>
          <p className="text-xs text-slate-300">
            <span className="font-medium text-slate-200">Named tools:</span>{" "}
            {Array.isArray(useCase.named_tools)
              ? useCase.named_tools.join(", ")
              : useCase.named_tools}
          </p>
        </div>

        <div className="mb-4 space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Citations
          </h3>
          <p className="text-xs text-slate-400">
            {useCase.source_refs?.length
              ? useCase.source_refs.join(", ")
              : useCase.citations ?? "—"}
          </p>
        </div>

        <div className="space-y-1 text-[11px] text-slate-500">
          <div>
            Created:{" "}
            <span className="text-slate-300">{useCase.metadata.date_created}</span>
          </div>
          <div>
            Last updated:{" "}
            <span className="text-slate-300">{useCase.metadata.last_updated}</span>
          </div>
          <div>Template v{useCase.metadata.template_version}</div>
        </div>
      </div>
    </aside>
  );
};
