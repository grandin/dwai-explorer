import React, { createContext, useContext, useMemo, useState } from "react";
import type { StackingDimension } from "../types";

type FilterDimension = StackingDimension | "none";

interface ExplorerContextValue {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  stacking: StackingDimension;
  setStacking: (s: StackingDimension) => void;
  filterDimension: FilterDimension;
  setFilterDimension: (d: FilterDimension) => void;
  filterValue: string;
  setFilterValue: (v: string) => void;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export function ExplorerProvider({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stacking, setStacking] = useState<StackingDimension>("activity");
  const [filterDimension, setFilterDimension] = useState<FilterDimension>("none");
  const [filterValue, setFilterValue] = useState("");

  const value = useMemo(
    () => ({
      selectedId,
      setSelectedId,
      stacking,
      setStacking,
      filterDimension,
      setFilterDimension,
      filterValue,
      setFilterValue
    }),
    [selectedId, stacking, filterDimension, filterValue]
  );

  return (
    <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>
  );
}

export function useExplorer() {
  const ctx = useContext(ExplorerContext);
  if (!ctx) throw new Error("useExplorer requires ExplorerProvider");
  return ctx;
}

export type { FilterDimension };
