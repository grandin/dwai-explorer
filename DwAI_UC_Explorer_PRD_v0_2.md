# DwAI UC Explorer — Product Requirements Document
# Version: 0.2
# Date: 2026-03-12
# Status: Hardened — ready for build session

---

## 1. Purpose

An interactive web-based tool for exploring the Design With AI
use case catalog. Serves as the primary Phase 4 deliverable —
the interface through which designers, POs, data scientists,
and leadership engage with the catalog's 71 use cases.

The tool must:
- Make the catalog browsable without prior knowledge of its
  structure
- Support both casual exploration and targeted analytical
  queries
- Communicate process agnosticism — the catalog maps to any
  design/product process model, not just one
- Expose the provenance and definitions of all sub-frameworks
  (Value, Risk, Expertise, Attestation) on demand

---

## 2. Entry Animation — Process Model Convergence

### Concept
On first load, the tool plays a short animation that cycles
through six recognized process models, mapping each onto the
catalog's six phases, then dissolving to leave the phases as
common ground. The argument: "These models disagree about
shape but agree about what work gets done."

### Sequence
1. Double Diamond appears → stages map to six phase columns
2. Design Thinking (d.school) replaces it → different mapping
3. Lean UX → different shape, different gaps
4. Lean Startup → Learn wraps Improve back to Explore
5. Agile/Scrum → no Explore phase visible
6. Continuous Discovery/Delivery → two-part split
7. All six briefly overlay → every column covered by some
   model, none covered by all
8. Models dissolve → six phase labels remain → cards populate

### Duration
15–20 seconds total. Skippable. Does not replay on return
visits (use localStorage or session flag).

### Priority
PINNABLE. The explorer is the primary deliverable. If the
animation causes delays, pin it and return after the
explorer core is functional. Build the explorer to work
without the animation — it's an enhancement, not a gate.

### Phase Mappings

#### Double Diamond (Design Council)
| Their stage | DwAI phase(s) |
|---|---|
| Discover | Explore |
| Define | Define |
| Develop | Concept, Validate |
| Deliver | Deliver |
| *(absent)* | Improve |

#### Design Thinking (d.school / IDEO)
| Their stage | DwAI phase(s) |
|---|---|
| Empathize | Explore |
| Define | Define |
| Ideate | Concept |
| Prototype | Concept, Deliver |
| Test | Validate |
| *(absent)* | Improve |

#### Lean UX (Gothelf)
| Their stage | DwAI phase(s) |
|---|---|
| Think | Define, Concept |
| Make | Concept, Deliver |
| Check | Validate, Improve |
| *(implicit)* | Explore |

#### Lean Startup (Ries)
| Their stage | DwAI phase(s) |
|---|---|
| Problem/Solution Fit | Explore, Define |
| Build (MVP) | Concept, Deliver |
| Measure | Validate |
| Learn | Improve → Explore |

#### Agile / Scrum
| Their stage | DwAI phase(s) |
|---|---|
| Backlog Refinement | Define |
| Sprint Planning | Define, Concept |
| Sprint Execution | Concept, Deliver |
| Sprint Review | Validate |
| Retrospective | Improve |
| *(absent)* | Explore |

#### Continuous Discovery / Delivery (Torres)
| Their side | DwAI phase(s) |
|---|---|
| Discovery | Explore, Define, Validate |
| Delivery | Concept, Deliver, Improve |

---

## 3. Views

### 3.1 Primary View — Column View

Six columns arranged left to right:
Explore | Define | Concept | Validate | Deliver | Improve

Each column contains UC cards stacked vertically.

#### Stacking logic
Default stacking: grouped by Activity (cluster headers
within each column).

Stacking is switchable. User can re-stack by:
- Activity (default)
- Arrangement level (Director → Auditor)
- Attestation level (Speculative → Established)
- Primary Risk type
- Primary Value type

When stacking dimension changes, cards re-sort within
columns. Cluster headers update to reflect the active
stacking dimension.

#### Secondary filter (highlight/dim)
A second dimension can be selected as an overlay. Non-matching
cards dim (reduced opacity). Matching cards remain full.

This allows two-factor exploration: e.g., stack by
Arrangement, highlight by Risk type = "see all Co-creator
UCs, with False Fidelity ones highlighted."

#### Phase-spanning UCs
UCs that span two phases (e.g., CON-021 Concept/Deliver)
appear in their primary phase column with a badge (small
pill or tag) showing the secondary phase. The primary
phase is the one matching the UC-ID prefix.

No ghost cards (distort column counts). No connector
lines (visual noise at 71 UCs). In Constellation view,
spanning is naturally visible because the node positions
between two phase anchors.

Revisit if badge approach proves insufficient during
build testing.

### 3.2 Secondary View — Constellation View

A positioned graph laid out on a horizontal temporal
gradient (Explore left → Improve right). NOT force-directed
— the temporal axis provides inherent spatial logic.

Phase nodes at fixed X positions. Activity and UC nodes
positioned within phase bands. D3 for rendering and
interaction, but layout is deterministic, not simulated.

The constellation's value over column view is surfacing
looser, more nuanced relationships (dependencies, workflows,
shared capabilities) without requiring connector lines
in a tabular layout.

#### Node hierarchy
- Phase nodes: large anchors along horizontal axis
- Activity nodes: clustered around phase nodes
- UC nodes: clustered around activity nodes

#### Edge types (toggleable layers)

**Strong edges (always visible by default):**
- UC → Activity → Phase (hierarchical structure)

**Enablement Dependencies (EnDe):**
- "This UC enables that UC" — directed edges
- Example: CON-028 (System-Grounded Generation) enables
  DEL-052 (DS-Aware Prototyping at Scale)
- Editorial data, defined manually

**Workflow Sequences (WfSq):**
- "In practice, you'd do this then this" — directed edges
  tracing common practitioner paths
- Example: EXP-001 → EXP-002 → EXP-003 → EXP-007 →
  DEF-010 → DEF-016
- Editorial data, defined manually

**Shared Capability Links (SCL):**
- Derived automatically from shared data:
  - Shared Named Tools
  - Shared Expertise Differentiator (primary)
  - Shared primary Risk type
  - Shared primary Value type
- These are toggled on/off per dimension
- Rendered as lighter/thinner edges than EnDe/WfSq

#### Interaction
- Hover a UC node: highlight its edges
- Click a UC node: open detail panel
- Toggle edge layers on/off via controls
- Zoom and pan

### 3.3 List Item (LI) Template

The most compressed UC representation. Used on cards in
Column View and as labels in Constellation View.

#### Fixed fields (always visible)
- **UC-ID**: e.g., EXP-001
- **Name**: Use Case Name (truncated if needed)
- **Activity**: Activity grouping

#### Dynamic 4th field
Changes based on the active stacking/filter dimension:
- If stacking = Activity → 4th field = Arrangement (role)
- If stacking = Arrangement → 4th field = Activity
- If stacking = Risk → 4th field = Primary Risk type
- If stacking = Value → 4th field = Primary Value type
- If stacking = Attestation → 4th field = Attestation level

Rule: the 4th field shows the active stacking dimension
UNLESS Activity is the stacking dimension (since Activity
is already a fixed field), in which case it defaults to
Arrangement role.

### 3.4 Detail View (D) — Right Panel

Single click on any card opens the Detail panel on the
right side. No intermediate Summary view step.

The panel shows all 17 template fields, with the [S] fields
forming the top section (visible without scrolling) and
[D]-only fields below. This replaces a separate S view —
the LI card with its dynamic 4th field provides the scan
level; the D panel provides everything else.

Fields, top section (from [S]):
- UC-ID
- Phase
- Activity
- Use Case Name
- Human-AI Arrangement (level + role)
- Value Hypothesis (type tags + sentence)
- Risk (primary tag only)
- Attestation Level

Fields, extended section (from [D]):
- Use Case Description
- Human-AI Arrangement (full clause)
- Expertise Differentiator (1–3 tags)
- Value Indicator
- Risk Typology (all tags, primary/secondary/tertiary)
- Attestation Diagnostic
- Tool Category
- Named Tools
- Citations
- Metadata (dates, template version)

---

## 4. Tooltip Framework — Sub-Framework Definitions

### Requirement
Every controlled vocabulary term used as a field label or
tag value must have a tooltip exposing:
1. **Definition**: What the term means in the catalog context
2. **Provenance**: Where it was derived from — source
   references and methodological notes

### Fields requiring tooltips

#### Value Types (7 terms)
Efficiency, Velocity, Quality, Insight, Innovation,
Risk Reduction, Learning
- Definitions from DwAI_ValueFramework_v1_0.md
- Provenance: "Phase 1 structured fan-out across 20+
  published frameworks. Source convergence documented
  per type."

#### Risk Types (8 terms)
False Fidelity, Homogenization, False Progress,
Skill & Judgment Erosion, Black Box Rationale,
Bias Transfer, Feasibility Blindness, Empathy Gap
- Definitions from DwAI_RiskTypology_v0_2.md
- Provenance: "Built from structured research fan-out.
  No pre-seeded categories. Eight types emerged from
  ~60 observations across individual, team,
  organizational, and cross-industry sources."

#### Expertise Differentiator Types (11 terms)
Information architecture, Creative direction,
Interaction design, Research and insight,
Content strategy, Design system logic, Business framing,
Technical feasibility, Behavioral reasoning,
Data and analytics, Ethical assessment
- Definitions from DwAI_FieldB_Expertise_Differentiator_v1_2.md
- Provenance: "Role-agnostic typology. Decoupled from
  job titles. Encodes the ceiling of the floor/ceiling
  dynamic."

#### Attestation Levels (4 levels + 5 diagnostics)
Speculative, Emerging, Developing, Established
+ Tool gap, Workflow gap, Adoption gap, Trust gap,
  Regulatory gap
- Definitions from UC template attestation field
- Provenance: "Adapted from Rogers diffusion language.
  Diagnostics identify what blocks progression."

#### Arrangement Levels (5 levels)
Director, Co-creator, Challenger, Approver, Auditor
- Definitions from DwAI_FieldA_HumanAI_Arrangement_v1_2.md
- Provenance: "Primary structure from Feng, McDonald &
  Zhang (2025). Cross-referenced with Parasuraman et al.
  (2000), HITL/HOTL/HOOTL governance taxonomy, Boos
  et al. (2024), Rezwana & Maher (2022/2023)."

### Implementation
Tooltips appear on hover over any tag or field label.
Styled consistently. Include a small "i" icon or
underline-dot pattern to signal interactivity.

Definition text should be concise (1–2 sentences max).
Provenance text should be briefer still (1 sentence).

---

## 5. Data Requirements

### 5.1 UC Data (JSON)

One JSON file containing all 71 UCs. Each UC object:

```json
{
  "id": "EXP-001",
  "phase": "Explore",
  "activity": "Desk Research",
  "name": "Domain Literature Review",
  "description": "Two to four sentence description...",
  "arrangement": {
    "level": 2,
    "role": "Co-creator",
    "clause": "Full arrangement clause text..."
  },
  "expertise_differentiator": [
    "Research and insight",
    "Business framing"
  ],
  "value_hypothesis": {
    "types": ["Velocity", "Insight"],
    "sentence": "Value sentence text..."
  },
  "value_indicator": "Indicator text...",
  "risk_typology": [
    "False Fidelity",
    "Homogenization"
  ],
  "attestation": {
    "level": "Developing",
    "diagnostic": "Workflow gap"
  },
  "tool_category": "Research synthesis, General-purpose LLM",
  "named_tools": "Claude, Perplexity, ChatGPT",
  "citations": "[TBD — Source Registry]",
  "metadata": {
    "date_created": "2026-03-07",
    "last_updated": "2026-03-12",
    "template_version": "1.0"
  }
}
```

### 5.2 Relationship Data (JSON)

Separate JSON file or nested within main file.

```json
{
  "enablement_dependencies": [
    {
      "from": "CON-028",
      "to": "DEL-052",
      "label": "DS grounding enables DS-aware generation"
    }
  ],
  "workflow_sequences": [
    {
      "path_id": "research_flow_01",
      "label": "Core research-to-synthesis path",
      "sequence": ["EXP-001", "EXP-002", "EXP-003",
                    "EXP-007", "DEF-010", "DEF-016"]
    }
  ],
  "shared_capability_links": {
    "note": "Computed at build time from UC data — shared tools, shared ED, shared risk, shared value"
  }
}
```

### 5.3 Tooltip Data (JSON)

Structured definitions and provenance for all controlled
vocabulary terms. Embedded in the app or loaded as a
separate file.

```json
{
  "value_types": {
    "Efficiency": {
      "definition": "Reduces effort, cost, or resource expenditure for equivalent output.",
      "provenance": "Converges across Lean SQDC, SPACE, DORA, McKinsey, Deloitte, Accenture, Gartner, DesignOps, Val IT, Balanced Scorecard."
    }
  },
  "risk_types": {
    "False Fidelity": {
      "definition": "Output looks correct but contains hidden errors, fabrications, or logical incoherence.",
      "provenance": "Emergent from ~60 observations across practitioner, academic, and cross-industry sources. No pre-seeded categories."
    }
  },
  "expertise_types": { },
  "attestation_levels": { },
  "attestation_diagnostics": { },
  "arrangement_levels": { }
}
```

---

## 6. Technical Constraints

- **Build environment:** Cursor IDE + GitHub repo
- **Framework:** React (Vite or Next.js — Cursor's choice)
- **Styling:** Tailwind CSS
- **Graph rendering:** D3 (deterministic positioning, not
  force-directed)
- **Data:** JSON files imported or loaded at build time
- **Hosting:** GitHub Pages (free, shareable URL)
- **Animation:** CSS transitions + requestAnimationFrame
  for entry sequence (if built)
- **Responsive:** Desktop-first. Minimum 1280px viewport.
  Mobile is not a priority for v1.
- **Browser target:** Modern evergreen browsers (Chrome,
  Firefox, Safari, Edge)

---

## 7. Build Sequence

1. Data preparation (Claude Code — tonight)
   - Export UC JSON from 71 files
   - Define Enablement Dependencies (review)
   - Define Workflow Sequences (review)
   - Compute Shared Capability Links
   - Build Tooltip data from framework documents
2. Cursor: Explorer core
   - Column view with card grid
   - LI template with dynamic 4th field
   - Stacking switcher + cluster headers
   - Highlight/dim secondary filter
   - Detail panel (right side)
   - Tooltip framework on all controlled vocab terms
3. Cursor: Constellation view
   - Positioned graph with temporal axis
   - Edge layer toggles (EnDe, WfSq, SCL)
   - Node interaction + detail panel integration
4. Cursor: Entry animation (if time permits — pinnable)
   - Process model mapping sequence
   - Transition to column view
5. Deploy to GitHub Pages

---

## 8. Resolved Decisions

1. **Card interaction:** Single click → D panel on right.
   No intermediate S view. LI is the scan level; D panel
   is everything else. S fields form the top of D panel.

2. **Phase-spanning UCs:** Badge (pill) on card showing
   secondary phase. No ghost cards, no connector lines.
   Primary phase = UC-ID prefix phase. Revisit if
   insufficient.

3. **Constellation layout:** Deterministic positioning
   along temporal axis. NOT force-directed. D3 for
   rendering only. Phase nodes at fixed X, UC nodes
   within phase bands.

4. **Workflow sequences:** 8–12 paths, 3–8 UCs each.
   Claude Code proposes, human reviews. Full paths, not
   fragments.

5. **Entry animation:** Pinnable. Build explorer first.
   Animation is enhancement, not gate. If it causes
   delays, defer to post-explorer polish pass.

---

## 9. Remaining Open

- [ ] Snappy title for the explorer (working name:
      "DwAI UC Explorer")
- [ ] Exact stacking animation/transition when user
      switches grouping dimension
- [ ] Constellation node sizing — by what dimension?
      (Attestation level? Fixed? TBD during build)
- [ ] Color system — what dimension drives card color?
      (Arrangement level was proposed earlier; confirm
      during build)

---

**Version:** 0.2
**Date:** 2026-03-12
