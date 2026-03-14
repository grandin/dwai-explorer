# DwAI UC Explorer — Constellation View: Focus Mode Interaction Spec
# Version: 1.0
# Date: 2026-03-14
# Status: Locked for Cursor implementation

---

## 1. Scope

This spec defines the interaction model for the Constellation View's Focus Mode — the mechanism by which users explore relationships between use cases. It replaces the previous attempt at drawing edges across the full 71-node matrix, which produced unreadable results regardless of visual refinements.

The Column View is out of scope. It is working and stable.

---

## 2. View Modes

The Constellation View has two modes: **Overview** and **Focus**.

### 2.1 Overview Mode (default)

**Layout:** 71 UC nodes positioned in a phase × attestation matrix.
- X-axis: Phase (Explore → Improve, left to right, 6 columns)
- Y-axis: Attestation level (Established top → Speculative bottom, 4 rows)
- Nodes positioned within their phase column and attestation row

**Nodes:** Rounded rectangle mini-cards (~150×52px).
- Content: UC-ID + arrangement role abbreviation + UC name (truncated if needed)
- Fill: Phase color
- Border: Arrangement level encoded as weight + pattern:
  - Director: 3px solid
  - Co-creator: 2.5px solid
  - Challenger: 2px solid
  - Approver: 1.5px dashed
  - Auditor: 1px dotted
  - Stroke color: white/light, visible against any phase fill
- Attestation badge: small pill on node corner

**Edges:** No edges drawn by default.

**Hover behavior:** When a node is hovered, its WfSq (Workflow Sequence) edges ghost in — dashed teal lines connecting to other nodes in the same workflow path. This is a lightweight preview only. EnDe edges do NOT appear on hover.

**Click behavior:** Clicking a node transitions to Focus Mode (see §2.2). Clicking empty canvas space does nothing.

### 2.2 Focus Mode (node selected)

**Trigger:** Click any node in Overview Mode, OR click a dimmed node in the lower zone while already in Focus Mode.

**Canvas split:** The view divides into two vertical zones:

**Upper zone — Focus Band**
- Contains the clicked (active) node and all nodes connected to it via active edge layers (EnDe and WfSq).
- The active node stays in its phase column. It receives additional visual weight (e.g., thicker outer glow, slightly larger scale, or a selection ring) to distinguish it as the clicked item.
- Connected nodes also keep their phase X-position (column alignment preserved).
- Y-position within the focus band is NOT governed by attestation. Nodes arrange freely on the vertical axis for edge readability. Layout algorithm should minimize edge crossings within the band.
- Edges are drawn between nodes in the focus band:
  - EnDe edges: solid amber lines, directional (arrow indicating enablement direction)
  - WfSq edges: dashed teal lines, directional (arrow indicating sequence order)
- Edge tooltips: self-contained. Format:
  ```
  [Full UC Name A] (UC-ID-A)
  → [Full UC Name B] (UC-ID-B)
  [Relationship type]: [description]
  ```

**Lower zone — Dimmed Matrix**
- All nodes NOT in the active node's edge neighborhood remain in their original matrix positions.
- Visually dimmed (reduced opacity, desaturated, or similar treatment) but still interactive.
- Clicking a dimmed node: transitions Focus Mode to that node. The focus band repopulates with the new node's neighborhood. Animation: previous focus band nodes slide back down, new neighborhood nodes lift up.
- Clicking empty space in the lower zone (or a dedicated "back" affordance): exits Focus Mode, returns to Overview.

**Edge layers in Focus Mode:**
- EnDe (Enablement Dependency): always visible. Solid amber, directional arrows.
- WfSq (Workflow Sequence): always visible. Dashed teal, directional arrows.
- SCL (Shared Capability Links): excluded from constellation entirely.

**Detail panel:** Clicking a node in the focus band opens the shared detail panel (same component used by Column View). The detail panel shows the full UC record. It does NOT replace Focus Mode — both coexist. Focus Mode shows relationships; the detail panel shows individual UC fields.

---

## 3. Transition Animation

### Overview → Focus Mode
1. Unlinked nodes dim in place (opacity transition, ~200ms)
2. Active node and connected nodes slide upward into the focus band (~300ms ease-out)
3. Active node receives visual weight treatment (glow/ring, ~100ms)
4. Edges draw in after nodes settle (~200ms, staggered by type — WfSq first, then EnDe)

Total perceived transition: ~400ms. Steps overlap; this is not sequential.

### Focus Mode → Focus Mode (switching active node)
1. Current focus band edges fade out (~150ms)
2. Nodes leaving the focus band slide down to their matrix positions while new nodes slide up (~300ms)
3. New active node receives visual weight; edges draw in (~200ms)

### Focus Mode → Overview
1. Edges fade out (~150ms)
2. Focus band nodes slide back to their matrix positions (~300ms)
3. All nodes return to full opacity (~200ms)

---

## 4. Node Specification

Applies in both Overview and Focus modes unless stated otherwise.

| Property | Value |
|----------|-------|
| Shape | Rounded rectangle |
| Size | ~150×52px (may flex slightly for text) |
| Content | `{UC-ID} {Role Abbrev} — {UC Name}` |
| Fill | Phase color from existing palette |
| Border weight/pattern | Per arrangement level (see §2.1) |
| Border stroke color | White or light neutral |
| Attestation badge | Small pill, positioned at top-right corner |
| Corner radius | 6–8px |

**Role abbreviations:** DIR (Director), COC (Co-creator), CHL (Challenger), APP (Approver), AUD (Auditor)

**Active node treatment (Focus Mode only):** Selection ring or outer glow, ~2px additional visual boundary. No size change. No position change within phase column.

---

## 5. Edge Specification

| Property | EnDe | WfSq |
|----------|------|------|
| Stroke style | Solid | Dashed (8px dash, 4px gap) |
| Color | Amber (#F59E0B or similar) | Teal (#14B8A6 or similar) |
| Width | 2px | 2px |
| Arrowhead | Filled triangle, 8px | Filled triangle, 8px |
| Direction | Source → Target (enablement) | Source → Target (sequence) |
| Hover state | 3px width, tooltip appears | 3px width, tooltip appears |
| Ghost preview (Overview hover) | Not shown | Shown at 30% opacity |

**Edge routing:** Prefer straight lines or single-bend paths. Avoid complex curves. If edges cross, accept it — the focus band contains a small enough node set that minor crossings are acceptable.

---

## 6. Data Sources

| File | Purpose | Edge count |
|------|---------|------------|
| `DwAI_UC_Data_v4.json` | Node data (71 UCs, all fields) | — |
| `DwAI_UC_EnDe.json` | Enablement dependency edges | 112 |
| `DwAI_UC_WfSq.json` | Workflow sequence paths | 12 |
| `DwAI_UC_Tooltips.json` | Sub-framework definitions for tooltips | — |
| `DwAI_UC_SCL.json` | **Not used in Constellation View** | ~2970 |

---

## 7. Controls

**Edge layer toggles:** Not needed. Both EnDe and WfSq are always visible in Focus Mode. SCL is excluded.

**Zoom/pan:** The constellation should support basic zoom and pan for the full canvas. Implementation detail — trackpad pinch/scroll or dedicated controls at implementer's discretion.

**Exit Focus Mode:** Click empty space in lower zone, or press Escape, or click a dedicated "×" / "Back to overview" affordance near the focus band.

---

## 8. Responsive Behavior

The Constellation View is primarily a desktop experience. Minimum viable width: 1200px. Below that, hide the constellation tab and show Column View only.

On very large screens (>1920px), the focus band can expand vertically to give edges more room.

---

## 9. Out of Scope

- SCL edges (excluded from constellation)
- Column View changes (stable, don't touch)
- Detail panel redesign (shared component, unchanged)
- Mobile constellation layout
- Edge filtering or layer toggle UI
