export type Phase = "Explore" | "Define" | "Concept" | "Validate" | "Deliver" | "Improve";

export interface Arrangement {
  level: number;
  role: string;
  clause?: string;
}

export interface ValueHypothesis {
  types: string[];
  sentence: string;
}

export interface Attestation {
  level: string;
  diagnostic: string;
}

export interface Metadata {
  date_created: string;
  last_updated: string;
  template_version: string;
}

export interface ExpertiseDifferentiatorEntry {
  type: string;
  narrative: string;
}

export interface RiskTypologyEntry {
  rank: string;
  type: string;
  narrative: string;
}

export interface ValueIndicatorEntry {
  value_type: string;
  indicator: string;
  description: string;
}

export interface UseCase {
  id: string;
  phase: string;
  activity: string;
  name: string;
  description: string;
  arrangement: Arrangement;
  expertise_differentiator: ExpertiseDifferentiatorEntry[];
  value_hypothesis: ValueHypothesis;
  value_indicator: ValueIndicatorEntry[];
  risk_typology: RiskTypologyEntry[];
  attestation: Attestation;
  tool_category: string;
  named_tools: string[];
  source_refs?: string[];
  citations?: string;
  metadata: Metadata;
}

export interface TooltipEntry {
  definition: string;
  provenance?: string;
}

export interface ArrangementLevelEntry {
  level: number;
  role: string;
  initiative: string;
  human_function: string;
}

export interface TooltipData {
  value_types: Record<string, TooltipEntry>;
  risk_types: Record<string, TooltipEntry>;
  expertise_types: Record<string, TooltipEntry>;
  attestation_levels: Record<string, TooltipEntry>;
  attestation_diagnostics: Record<string, { definition: string }>;
  arrangement_levels: Record<string, ArrangementLevelEntry>;
  phases?: Record<string, TooltipEntry>;
}

export interface RiskModalEntry {
  title: string;
  description: string;
  observed_manifestations: string[];
  design_transfer: string[];
}

export type RiskModalsData = Record<string, RiskModalEntry>;

export type StackingDimension = "activity" | "arrangement" | "attestation" | "risk" | "value";

