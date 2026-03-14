# DwAI UC Explorer — Product Requirements Document
# Version: 2.0
# Date: 2026-03-14
# Status: Updated for Constellation View Focus Mode redesign

---

## 1. Product Overview

The DwAI UC Explorer is a React + Vite + Tailwind web application that presents 71 AI-in-design use cases across 6 design lifecycle phases (Explore, Define, Concept, Validate, Deliver, Improve). It is the interactive exploration layer of the Design With AI catalog — the tool that lets practitioners, product owners, and leadership browse, filter, and understand the use case landscape.

**Repository:** github.com/grandin/dwai-explorer

---

## 2. Views

### 2.1 Column View

**Status:** Working, stable, ship-ready. No changes in this release.

A structured list/card view organized by phase. Supports filtering by all UC fields (arrangement level, attestation, value type, risk type, expertise differentiator). Cards show summary-level fields; clicking opens the shared detail panel.

Handles all data including SCL (Shared Capability Links) through filtering and grouping, where edge density is a data problem rather than a rendering problem.

### 2.2 Constellation View

**Status:** Rebuild in progress. See Interaction Spec (DwAI_Constellation_FocusMode_Spec_20260314.md).

A spatial graph view with two modes:

**Overview Mode:** 71 UC nodes positioned in a phase (X) × attestation level (Y) matrix. No edges by default. Hovering a node ghosts in its WfSq (Workflow Sequence) edges as a lightweight preview. Clicking a node enters Focus Mode.

**Focus Mode:** The canvas splits into two zones. The upper focus band contains the clicked node and all nodes connected via EnDe and/or WfSq edges. Nodes keep phase column alignment; Y-position within the band is free (optimized for edge readability, not attestation). Both EnDe (solid amber, directional) and WfSq (dashed teal, directional) edges are drawn. The lower zone shows the remaining nodes in their matrix positions, dimmed but clickable. Clicking a dimmed node switches focus to that node. Clicking empty space or pressing Escape returns to Overview.

**Excluded from Constellation:** SCL edges (~2970) are not shown in any mode.

### 2.3 Shared Detail Panel

A slide-out or side panel that shows the full UC record (all 17 template fields). Triggered by clicking a node in either view. The panel is a shared component — same data, same layout regardless of which view opened it.

---

## 3. Data Model

### 3.1 Source Files

| File | Content | Records |
|------|---------|---------|
| `data/DwAI_UC_Data_v4.json` | Full UC records (all 17 fields) | 71 |
| `data/DwAI_UC_EnDe.json` | Enablement dependency edges | 112 |
| `data/DwAI_UC_WfSq.json` | Workflow sequence paths | 12 |
| `data/DwAI_UC_SCL.json` | Shared capability links | ~2970 |
| `data/DwAI_UC_Tooltips.json` | Sub-framework definitions | — |

### 3.2 UC Record Structure

Each UC record follows the DwAI UC Template v1.0 (17 fields, 4 clusters):

**Cluster 1 — Metadata:** UC-ID, Date Created, Last Updated, Template Version
**Cluster 2 — Identity:** Phase, Activity, Use Case Name, Use Case Description
**Cluster 3 — Assessment:** Human-AI Arrangement, Expertise Differentiator, Value Hypothesis, Value Indicator, Risk Typology, Attestation Level, Tool Category, Named Tools
**Cluster 4 — Evidence:** Citations

Summary-view fields (marked [S] in template): UC-ID, Phase, Activity, Use Case Name, Human-AI Arrangement, Value Hypothesis, Risk Typology (first tag), Attestation Level.

### 3.3 Edge Data Structure

**EnDe edges:** Each record contains source UC-ID, target UC-ID, and relationship description. Directional (source enables target).

**WfSq edges:** Each record defines an ordered path of UC-IDs representing a workflow sequence. Directional (execution order).

### 3.4 Controlled Vocabularies

| Field | Source Document | Values |
|-------|----------------|--------|
| Phase | UC Template v1.0 | Explore, Define, Concept, Validate, Deliver, Improve |
| Human-AI Arrangement | Field A v1.1 | Director, Co-creator, Challenger, Approver, Auditor |
| Expertise Differentiator | Field B v1.2 | 11 types (see reference doc) |
| Value Type | Value Framework v1.0 | Efficiency, Velocity, Quality, Insight, Innovation, Risk Reduction, Learning |
| Risk Type | Risk Typology v0.2 | 8 types (see reference doc) |
| Attestation Level | UC Template v1.0 | Speculative, Emerging, Developing, Established |

---

## 4. Visual Encoding (Constellation View)

### 4.1 Node Encoding

| Property | Encoding |
|----------|----------|
| Position X | Phase column (temporal, left to right) |
| Position Y (overview) | Attestation level (Established top → Speculative bottom) |
| Position Y (focus band) | Free — optimized for edge readability |
| Fill color | Phase color |
| Border weight + pattern | Arrangement level (Director 3px solid → Auditor 1px dotted) |
| Border stroke color | White / light neutral |
| Badge (corner pill) | Attestation level |
| Text content | UC-ID + role abbreviation + UC name |

### 4.2 Edge Encoding

| Property | EnDe | WfSq |
|----------|------|------|
| Stroke | Solid | Dashed |
| Color | Amber (#F59E0B) | Teal (#14B8A6) |
| Width | 2px (3px on hover) | 2px (3px on hover) |
| Arrow | Filled triangle, 8px | Filled triangle, 8px |
| Overview hover | Not shown | Ghosted at 30% opacity |
| Focus mode | Visible | Visible |

### 4.3 Active Node Treatment

Selection ring or outer glow (~2px additional boundary). No size change. No position change within phase column.

---

## 5. Interaction Model

### 5.1 Overview Mode

| Action | Result |
|--------|--------|
| Hover node | Ghost WfSq edges at 30% opacity |
| Click node | Enter Focus Mode for that node |
| Click empty space | Nothing |
| Zoom/pan | Standard canvas navigation |

### 5.2 Focus Mode

| Action | Result |
|--------|--------|
| Click node in focus band | Open detail panel for that UC |
| Click dimmed node (lower zone) | Switch focus to that node (direct transition) |
| Click empty space (lower zone) | Exit to Overview |
| Press Escape | Exit to Overview |
| Hover edge | Widen to 3px, show tooltip |

### 5.3 Transitions

| Transition | Duration | Behavior |
|------------|----------|----------|
| Overview → Focus | ~400ms | Unlinked dim; active + linked slide up; edges draw in |
| Focus → Focus (switch) | ~400ms | Old neighborhood slides down; new slides up; edges redraw |
| Focus → Overview | ~350ms | Edges fade; nodes slide back; all restore full opacity |

---

## 6. Component Architecture

### 6.1 Existing Components (no changes)

- `ExplorerApp.tsx` — top-level app shell, view switching
- `ExplorerContext.tsx` — shared state (selected UC, filters, active view)
- Column View components (all stable)
- Shared detail panel component

### 6.2 Constellation Components (rebuild)

| Component | Responsibility |
|-----------|---------------|
| `ConstellationView.jsx` | Top-level constellation container. Manages overview/focus state. |
| `ConstellationOverview.jsx` | Renders the phase × attestation matrix. Handles hover previews. |
| `ConstellationFocus.jsx` | Renders the two-zone focus layout. Manages active node, edge drawing, transitions. |
| `ConstellationNode.jsx` | Individual node rendering (mini-card). Shared between overview and focus. |
| `ConstellationEdge.jsx` | Individual edge rendering with tooltips. EnDe and WfSq variants. |
| `constellationLayout.js` | Layout algorithms: matrix positioning (overview) and focus band arrangement (focus mode). |

`EdgeControls.jsx` — **removed.** No edge layer toggles needed; both types always visible in focus mode.

---

## 7. Technical Constraints

- **Minimum viewport:** 1200px width. Below this, Constellation tab is hidden; Column View only.
- **Performance:** 71 nodes + max ~20 edges visible at once (focus neighborhood). No performance concerns anticipated. SVG rendering preferred over canvas for accessibility and interactivity.
- **Accessibility:** Nodes must be keyboard-navigable. Tab through nodes; Enter to select; Escape to exit focus. Edge information available via screen reader (aria-label on edge elements).
- **Browser support:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge).

---

## 8. Out of Scope (This Release)

- SCL edges in constellation (excluded by design decision DDL-005)
- Mobile constellation layout
- Column View changes
- Detail panel redesign
- Edge filtering or layer toggle UI
- Search within constellation
- Saved views or bookmarks

---

## 9. Reference Documents

| Document | Purpose |
|----------|---------|
| DwAI_Constellation_FocusMode_Spec_20260314.md | Detailed interaction specification |
| DwAI_Constellation_DesignDecisions_20260314.md | Design decision log with rationale |
| DwAI_UC_Template_v1_0.md | UC template defining all 17 fields |
| DwAI_FieldA_HumanAI_Arrangement_v1_1.md | Arrangement level definitions |
| DwAI_FieldB_Expertise_Differentiator_v1_2.md | Expertise type definitions |
| DwAI_ValueFramework_v1_0.md | Value type definitions and measurement schema |
| DwAI_RiskTypology_v0_2.md | Risk type definitions and evidence base |

---

**Version:** 2.0
**Date:** 2026-03-14
**Changes from v1.0:** Complete Constellation View redesign — replaced matrix-with-edges approach with Overview + Focus Mode two-zone interaction model. Removed EdgeControls component. Updated component architecture. Added visual encoding and interaction model sections.
