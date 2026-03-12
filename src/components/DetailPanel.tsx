import React from "react";
import type { UseCase, TooltipData } from "../types";
import { TooltipTag } from "./TooltipTag";

interface DetailPanelProps {
  useCase: UseCase | null;
  tooltipData: TooltipData;
  onOpenFramework: (kind: "arrangement" | "value" | "risk" | "attestation" | "expertise") => void;
}

const phaseMeta: Record<
  string,
  {
    definition: string;
    provenance: string;
  }
> = {
  Explore: {
    definition:
      "Understanding the problem space — research, discovery, landscape analysis",
    provenance:
      "Maps to multiple recognized process models. See entry animation for framework reconciliation: Double Diamond, Design Thinking (d.school), Lean UX, Lean Startup, Agile/Scrum, Continuous Discovery/Delivery."
  },
  Define: {
    definition:
      "Framing the problem — synthesis, prioritization, requirements, strategy",
    provenance:
      "Maps to multiple recognized process models. See entry animation for framework reconciliation: Double Diamond, Design Thinking (d.school), Lean UX, Lean Startup, Agile/Scrum, Continuous Discovery/Delivery."
  },
  Concept: {
    definition:
      "Generating solutions — ideation, wireframing, prototyping, design exploration",
    provenance:
      "Maps to multiple recognized process models. See entry animation for framework reconciliation: Double Diamond, Design Thinking (d.school), Lean UX, Lean Startup, Agile/Scrum, Continuous Discovery/Delivery."
  },
  Validate: {
    definition:
      "Testing solutions — usability testing, accessibility audit, design review, QA",
    provenance:
      "Maps to multiple recognized process models. See entry animation for framework reconciliation: Double Diamond, Design Thinking (d.school), Lean UX, Lean Startup, Agile/Scrum, Continuous Discovery/Delivery."
  },
  Deliver: {
    definition:
      "Producing final output — specs, assets, handoff, documentation, design system contribution",
    provenance:
      "Maps to multiple recognized process models. See entry animation for framework reconciliation: Double Diamond, Design Thinking (d.school), Lean UX, Lean Startup, Agile/Scrum, Continuous Discovery/Delivery."
  },
  Improve: {
    definition:
      "Optimizing live products — analytics, A/B testing, iteration, monitoring",
    provenance:
      "Maps to multiple recognized process models. See entry animation for framework reconciliation: Double Diamond, Design Thinking (d.school), Lean UX, Lean Startup, Agile/Scrum, Continuous Discovery/Delivery."
  }
};

export const DetailPanel: React.FC<DetailPanelProps> = ({
  useCase,
  tooltipData,
  onOpenFramework
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

  const primaryValueType = useCase.value_hypothesis.types[0];
  const primaryRiskType = useCase.risk_typology[0];

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-slate-800 bg-slate-950/90 px-5 py-6 text-sm text-slate-100 backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {useCase.id}
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-50">{useCase.name}</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-100 border border-slate-700/70">
            {useCase.activity}
          </span>
          <TooltipTag
            tooltipData={tooltipData}
            category="arrangement_levels"
            term={useCase.arrangement.role}
            className="mt-1"
          />
        </div>
      </div>

      <div className="mb-4 flex-1 overflow-y-auto pr-1">
        <div className="mb-4 space-y-2 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <div className="mb-2 space-y-1 text-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Phase
            </div>
            <TooltipTag
              term={useCase.phase}
              definitionOverride={phaseMeta[useCase.phase]?.definition}
              provenanceOverride={phaseMeta[useCase.phase]?.provenance}
            />
          </div>

          <div className="mb-2 space-y-1 text-xs">
            <button
              type="button"
              onClick={() => onOpenFramework("attestation")}
              className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
            >
              Attestation
            </button>
            <TooltipTag
              tooltipData={tooltipData}
              category="attestation_levels"
              term={useCase.attestation.level}
            />
          </div>

          {primaryRiskType && (
            <div className="mb-2 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => onOpenFramework("risk")}
                className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
              >
                Risk
              </button>
              <TooltipTag
                tooltipData={tooltipData}
                category="risk_types"
                term={primaryRiskType}
              />
            </div>
          )}

          {primaryValueType && (
            <div className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => onOpenFramework("value")}
                className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
              >
                Value
              </button>
              <TooltipTag
                tooltipData={tooltipData}
                category="value_types"
                term={primaryValueType}
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </h3>
          <p className="text-sm leading-relaxed text-slate-200">{useCase.description}</p>
        </div>

        <div className="mb-4 space-y-2">
          <button
            type="button"
            onClick={() => onOpenFramework("arrangement")}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-200"
          >
            Arrangement
          </button>
          <p className="text-xs text-slate-300">
            Level {useCase.arrangement.level} —{" "}
            <TooltipTag
              tooltipData={tooltipData}
              category="arrangement_levels"
              term={useCase.arrangement.role}
            />
          </p>
          {useCase.arrangement.clause && (
            <p className="text-xs text-slate-300">{useCase.arrangement.clause}</p>
          )}
        </div>

        <div className="mb-4 space-y-2">
          <button
            type="button"
            onClick={() => onOpenFramework("expertise")}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-200"
          >
            Expertise
          </button>
          <div className="flex flex-wrap gap-1">
            {useCase.expertise_differentiator.map((ed) => (
              <TooltipTag
                key={ed}
                tooltipData={tooltipData}
                category="expertise_types"
                term={ed}
              />
            ))}
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Value Indicator
          </h3>
          <p className="whitespace-pre-line text-xs text-slate-300">
            {useCase.value_indicator}
          </p>
        </div>

        <div className="mb-4 space-y-2">
          <button
            type="button"
            onClick={() => onOpenFramework("risk")}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-200"
          >
            Risk
          </button>
          <div className="flex flex-wrap gap-1">
            {useCase.risk_typology.map((risk) => (
              <TooltipTag
                key={risk}
                tooltipData={tooltipData}
                category="risk_types"
                term={risk}
              />
            ))}
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <button
            type="button"
            onClick={() => onOpenFramework("attestation")}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-200"
          >
            Attestation
          </button>
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
              term={useCase.attestation.diagnostic}
            />
          </div>
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
            {useCase.named_tools}
          </p>
        </div>

        <div className="mb-4 space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Citations
          </h3>
          <p className="text-xs text-slate-400">{useCase.citations}</p>
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

      <div className="pointer-events-none h-0" />
      <div className="sr-only">
          <span className="font-medium text-slate-200">Value hypothesis:</span>{" "}
        {useCase.value_hypothesis.sentence}
        </div>
    </aside>
  );
};

