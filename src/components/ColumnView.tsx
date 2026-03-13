import React, { useMemo, useState } from "react";
import type { Phase, UseCase, StackingDimension, TooltipData } from "../types";
import ucData from "../../data/DwAI_UC_Data_v3.json";
import tooltipJson from "../../data/DwAI_UC_Tooltips.json";
import riskModalsJson from "../../data/DwAI_UC_RiskModals.json";
import { StackingControls } from "./StackingControls";
import { DetailPanel } from "./DetailPanel";
import { FrameworkModal } from "./FrameworkModal";
import { TableModal } from "./TableModal";
import { RiskDetailModal } from "./RiskDetailModal";
import type { TooltipData, RiskModalsData } from "../types";

const phases: Phase[] = ["Explore", "Define", "Concept", "Validate", "Deliver", "Improve"];

interface UseCaseWithPhases extends UseCase {
  primaryPhase: Phase;
  secondaryPhase?: Phase;
}

type FilterDimension = StackingDimension | "none";

const tooltipData = tooltipJson as TooltipData;
const riskModalsData = riskModalsJson as RiskModalsData;

type FrameworkKind = "arrangement" | "value" | "risk" | "attestation" | "expertise";

function normalizePhases(uc: UseCase): UseCaseWithPhases {
  const parts = uc.phase.split("/").map((p) => p.trim()) as string[];
  const primary = parts[0] as Phase;
  const secondary = parts[1] as Phase | undefined;
  return {
    ...uc,
    primaryPhase: primary,
    secondaryPhase: secondary
  };
}

function getGroupKey(uc: UseCaseWithPhases, dim: StackingDimension): string {
  switch (dim) {
    case "activity":
      return uc.activity;
    case "arrangement":
      return uc.arrangement.role;
    case "attestation":
      return uc.attestation.level;
    case "risk":
      return uc.risk_typology[0]?.type ?? "Unspecified";
    case "value":
      return uc.value_hypothesis.types[0] ?? "Unspecified";
    default:
      return "";
  }
}

function getDynamicField(uc: UseCaseWithPhases, dim: StackingDimension): string {
  // PRD rule: 4th field shows active stacking dimension,
  // except when stacking by Activity, where it becomes Arrangement role.
  switch (dim) {
    case "activity":
      return uc.arrangement.role;
    case "arrangement":
      return uc.activity;
    case "attestation":
      return uc.attestation.level;
    case "risk":
      return uc.risk_typology[0]?.type ?? "—";
    case "value":
      return uc.value_hypothesis.types[0] ?? "—";
    default:
      return "—";
  }
}

function getFilterValue(uc: UseCaseWithPhases, dim: FilterDimension): string {
  if (dim === "none") return "";
  return getGroupKey(uc, dim);
}

function displayName(name: string): string {
  return name.replace(/\s*SUMMARY VIEW[\s\S]*$/i, "").trim();
}

export const ColumnView: React.FC = () => {
  const [stacking, setStacking] = useState<StackingDimension>("activity");
  const [filterDimension, setFilterDimension] = useState<FilterDimension>("none");
  const [filterValue, setFilterValue] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openFramework, setOpenFramework] = useState<FrameworkKind | null>(null);
  const [openRiskDetailType, setOpenRiskDetailType] = useState<string | null>(null);

  const allUseCases: UseCaseWithPhases[] = useMemo(
    () => (ucData as UseCase[]).map(normalizePhases),
    []
  );

  const selectedUseCase = useMemo(
    () => allUseCases.find((uc) => uc.id === selectedId) ?? null,
    [allUseCases, selectedId]
  );

  const availableFilterValues = useMemo(() => {
    if (filterDimension === "none") return [];
    const values = new Set<string>();
    for (const uc of allUseCases) {
      const v = getFilterValue(uc, filterDimension);
      if (v) values.add(v);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [allUseCases, filterDimension]);

  const columns = useMemo(() => {
    const byPhase: Record<Phase, Record<string, UseCaseWithPhases[]>> = {
      Explore: {},
      Define: {},
      Concept: {},
      Validate: {},
      Deliver: {},
      Improve: {}
    };

    for (const uc of allUseCases) {
      const phase = uc.primaryPhase;
      const groupKey = getGroupKey(uc, stacking);
      if (!byPhase[phase][groupKey]) {
        byPhase[phase][groupKey] = [];
      }
      byPhase[phase][groupKey].push(uc);
    }

    return byPhase;
  }, [allUseCases, stacking]);

  const frameworkConfig = useMemo(() => {
    if (!openFramework) return null;

    switch (openFramework) {
      case "value": {
        const rows = Object.entries(tooltipData.value_types).map(([term, entry]) => ({
          term,
          definition: entry.definition,
          provenance: entry.provenance
        }));
        return {
          title: "Value Framework",
          rationale:
            "The Value framework captures the seven distinct ways AI-augmented design work creates value — beyond generic 'efficiency'. It was built by converging dozens of published value models into a single, design-relevant vocabulary.",
          rows
        };
      }
      case "risk":
      case "expertise":
      case "arrangement":
        return null;
      case "attestation": {
        const levelRows = Object.entries(tooltipData.attestation_levels).map(
          ([term, entry]) => ({
            term,
            definition: entry.definition,
            provenance: entry.provenance
          })
        );
        const diagnosticRows = Object.entries(tooltipData.attestation_diagnostics).map(
          ([term, entry]) => ({
            term,
            definition: entry.definition,
            provenance: undefined
          })
        );
        return {
          title: "Attestation Framework",
          rationale:
            "The Attestation framework tracks how mature each use case is in real practice — from speculative ideas to established workflows — and what gaps block progression.",
          rows: [...levelRows, ...diagnosticRows]
        };
      }
      default:
        return null;
    }
  }, [openFramework]);

  const expertiseTable = useMemo(
    () => ({
      columns: [
        { key: "term", header: "Term" },
        { key: "definition", header: "Definition" },
        { key: "provenance", header: "Provenance" }
      ],
      rows: Object.entries(tooltipData.expertise_types).map(([term, entry]) => ({
        term,
        definition: entry.definition,
        provenance: entry.provenance
      }))
    }),
    []
  );

  const riskSummaryTable = useMemo(
    () => ({
      columns: [
        { key: "term", header: "Risk Type" },
        { key: "definition", header: "Definition" }
      ],
      rows: Object.entries(tooltipData.risk_types).map(([term, entry]) => ({
        term,
        definition: entry.definition
      }))
    }),
    []
  );

  const arrangementTable = useMemo(
    () => ({
      columns: [
        { key: "level", header: "Level" },
        { key: "role", header: "Role" },
        { key: "initiative", header: "Initiative" },
        { key: "human_function", header: "Human Function" }
      ],
      rows: Object.entries(tooltipData.arrangement_levels).map(([, entry]) => ({
        level: entry.level,
        role: entry.role,
        initiative: entry.initiative,
        human_function: entry.human_function
      }))
    }),
    []
  );

  return (
    <div className="flex h-screen min-h-[720px] bg-slate-950 text-slate-50">
      <main className="flex min-w-0 flex-1 flex-col px-6 py-4">
        <header className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">
              DwAI Use Case Explorer
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Column View · 71 use cases across six phases
            </p>
          </div>
        </header>

        <StackingControls
          stacking={stacking}
          onStackingChange={(value) => {
            setStacking(value);
            // keep selection and filters; only recluster
          }}
          filterDimension={filterDimension}
          onFilterDimensionChange={(value) => {
            setFilterDimension(value);
            setFilterValue("");
          }}
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
          availableFilterValues={availableFilterValues}
        />

        <section className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          <div className="grid flex-1 grid-cols-6 gap-3 overflow-auto rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            {phases.map((phase) => {
              const groups = columns[phase];
              const groupKeys = Object.keys(groups).sort((a, b) =>
                a.localeCompare(b)
              );

              const phaseColorClass =
                phase === "Explore"
                  ? "border-phase-explore/70"
                  : phase === "Define"
                  ? "border-phase-define/70"
                  : phase === "Concept"
                  ? "border-phase-concept/70"
                  : phase === "Validate"
                  ? "border-phase-validate/70"
                  : phase === "Deliver"
                  ? "border-phase-deliver/70"
                  : "border-phase-improve/70";

              return (
                <div
                  key={phase}
                  className="flex min-w-0 flex-col rounded-lg border border-slate-800/80 bg-slate-950/60"
                >
                  <div
                    className={`sticky top-0 z-10 border-b bg-slate-950/90 px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 ${phaseColorClass}`}
                  >
                    {phase}
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto px-2.5 py-2">
                    {groupKeys.map((group) => (
                      <div key={group} className="space-y-1.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {group}
                        </div>
                        <div className="space-y-1.5">
                          {groups[group]
                            .slice()
                            .sort((a, b) => a.id.localeCompare(b.id))
                            .map((uc) => {
                              const dynamicField = getDynamicField(uc, stacking);
                              const isDimmed =
                                filterDimension !== "none" &&
                                filterValue &&
                                getFilterValue(uc, filterDimension) !== filterValue;

                              return (
                                <button
                                  key={uc.id}
                                  type="button"
                                  onClick={() => setSelectedId(uc.id)}
                                  className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                                    selectedId === uc.id
                                      ? "border-sky-400 bg-sky-950/60 shadow-[0_0_0_1px_rgba(56,189,248,0.6)]"
                                      : "border-slate-800 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-900"
                                  } ${isDimmed ? "opacity-35" : "opacity-100"}`}
                                >
                                  <div className="mb-0.5 text-[10px] font-medium text-slate-400">
                                    {uc.id}
                                  </div>
                                  <div className="mb-0.5 text-[9px] font-medium text-slate-500">
                                    {uc.activity}
                                  </div>
                                  <div className="mb-1 line-clamp-2 text-[13px] font-semibold text-slate-50">
                                    {displayName(uc.name)}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="inline-flex w-[80%] items-center rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-100 border border-slate-700/70">
                                      <span className="truncate">
                                        {dynamicField || "—"}
                                      </span>
                                    </span>
                                    {uc.secondaryPhase && (
                                      <span className="inline-flex shrink-0 items-center rounded-full bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-200 border border-slate-700/70">
                                        {uc.secondaryPhase}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                    {groupKeys.length === 0 && (
                      <div className="text-[11px] text-slate-500">
                        No use cases in this phase.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DetailPanel
            useCase={selectedUseCase}
            tooltipData={tooltipData}
            onOpenFramework={(kind) => setOpenFramework(kind)}
            onOpenRiskDetail={(riskType) => setOpenRiskDetailType(riskType)}
          />
        </section>

        <FrameworkModal
          open={Boolean(openFramework && frameworkConfig)}
          title={frameworkConfig?.title ?? ""}
          rationale={frameworkConfig?.rationale ?? ""}
          rows={frameworkConfig?.rows ?? []}
          onClose={() => setOpenFramework(null)}
        />

        <TableModal
          open={openFramework === "expertise"}
          onClose={() => setOpenFramework(null)}
          title="Expertise Differentiators"
          columns={expertiseTable.columns}
          rows={expertiseTable.rows}
        />

        <TableModal
          open={openFramework === "risk"}
          onClose={() => setOpenFramework(null)}
          title="Risk in application"
          columns={riskSummaryTable.columns}
          rows={riskSummaryTable.rows}
        />

        <TableModal
          open={openFramework === "arrangement"}
          onClose={() => setOpenFramework(null)}
          title="Human-AI Arrangement"
          columns={arrangementTable.columns}
          rows={arrangementTable.rows}
        />

        <RiskDetailModal
          open={Boolean(openRiskDetailType)}
          onClose={() => setOpenRiskDetailType(null)}
          entry={openRiskDetailType ? riskModalsData[openRiskDetailType] ?? null : null}
        />
      </main>
    </div>
  );
};

