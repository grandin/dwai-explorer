export type Phase = "Explore" | "Define" | "Concept" | "Validate" | "Deliver" | "Improve";

export interface Arrangement {
  level: number;
  role: string;
  clause: string;
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

export interface UseCase {
  id: string;
  phase: string;
  activity: string;
  name: string;
  description: string;
  arrangement: Arrangement;
  expertise_differentiator: string[];
  value_hypothesis: ValueHypothesis;
  value_indicator: string;
  risk_typology: string[];
  attestation: Attestation;
  tool_category: string;
  named_tools: string;
  citations: string;
  metadata: Metadata;
}

export interface TooltipEntry {
  definition: string;
  provenance?: string;
}

export interface TooltipData {
  value_types: Record<string, TooltipEntry>;
  risk_types: Record<string, TooltipEntry>;
  expertise_types: Record<string, TooltipEntry>;
  attestation_levels: Record<string, TooltipEntry>;
  attestation_diagnostics: Record<string, { definition: string }>;
  arrangement_levels: Record<string, TooltipEntry>;
}

export type StackingDimension = "activity" | "arrangement" | "attestation" | "risk" | "value";

