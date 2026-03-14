import React, { useMemo, useState } from "react";
import type { Phase, UseCase, StackingDimension } from "../types";
import ucData from "../../data/DwAI_UC_Data_v4.json";
import tooltipJson from "../../data/DwAI_UC_Tooltips.json";
import riskModalsJson from "../../data/DwAI_UC_RiskModals.json";
import { ExplorerProvider, useExplorer } from "../context/ExplorerContext";
import { ColumnView } from "./ColumnView";
import { ConstellationView } from "./ConstellationView";
import { DetailPanel } from "./DetailPanel";
import { FrameworkModal } from "./FrameworkModal";
import { TableModal } from "./TableModal";
import { RiskDetailModal } from "./RiskDetailModal";
import { StackingControls } from "./StackingControls";
import type { RiskModalsData } from "../types";

const tooltipData = tooltipJson as TooltipData;
const riskModalsData = riskModalsJson as RiskModalsData;

interface UseCaseWithPhases extends UseCase {
  primaryPhase: Phase;
  secondaryPhase?: Phase;
}

function normalizePhases(uc: UseCase): UseCaseWithPhases {
  const parts = uc.phase.split("/").map((p) => p.trim()) as string[];
  return {
    ...uc,
    primaryPhase: parts[0] as Phase,
    secondaryPhase: parts[1] as Phase | undefined
  };
}

type FrameworkKind = "arrangement" | "value" | "risk" | "attestation" | "expertise";
type FilterDimension = StackingDimension | "none";

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

function getFilterValue(uc: UseCaseWithPhases, dim: FilterDimension): string {
  if (dim === "none") return "";
  return getGroupKey(uc, dim);
}

function ExplorerInner() {
  const [view, setView] = useState<"columns" | "constellation">("columns");
  const {
    selectedId,
    stacking,
    setStacking,
    filterDimension,
    setFilterDimension,
    filterValue,
    setFilterValue
  } = useExplorer();
  const [openFramework, setOpenFramework] = useState<FrameworkKind | null>(null);
  const [openRiskDetailType, setOpenRiskDetailType] = useState<string | null>(null);

  const allUseCases = useMemo(
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

  const frameworkConfig = useMemo(() => {
    if (!openFramework) return null;
    if (openFramework === "value") {
      return {
        title: "Value Framework",
        rationale:
          "The Value framework captures the seven distinct ways AI-augmented design work creates value.",
        rows: Object.entries(tooltipData.value_types).map(([term, entry]) => ({
          term,
          definition: entry.definition,
          provenance: entry.provenance
        }))
      };
    }
    if (openFramework === "attestation") {
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
          provenance: undefined as string | undefined
        })
      );
      return {
        title: "Attestation Framework",
        rationale:
          "The Attestation framework tracks how mature each use case is in real practice.",
        rows: [...levelRows, ...diagnosticRows]
      };
    }
    return null;
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
    <div className="flex h-screen min-h-[720px] min-w-[1280px] bg-slate-950 text-slate-50">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col px-6 py-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">
              DwAI Use Case Explorer
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              71 use cases · Column & Constellation views
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setView("columns")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                view === "columns"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Columns
            </button>
            <button
              type="button"
              onClick={() => setView("constellation")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                view === "constellation"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Constellation
            </button>
          </div>
        </header>

        <StackingControls
          stacking={stacking}
          onStackingChange={setStacking}
          filterDimension={filterDimension}
          onFilterDimensionChange={(v) => {
            setFilterDimension(v);
            setFilterValue("");
          }}
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
          availableFilterValues={availableFilterValues}
        />

        <section className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {view === "columns" ? <ColumnView /> : <ConstellationView />}
          </div>
          <DetailPanel
            useCase={selectedUseCase}
            tooltipData={tooltipData}
            onOpenFramework={(kind) => setOpenFramework(kind)}
            onOpenRiskDetail={(t) => setOpenRiskDetailType(t)}
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
          entry={
            openRiskDetailType ? riskModalsData[openRiskDetailType] ?? null : null
          }
        />
      </main>
    </div>
  );
}

export function ExplorerApp() {
  return (
    <ExplorerProvider>
      <ExplorerInner />
    </ExplorerProvider>
  );
}
