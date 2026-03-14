# Cursor Prompt — Constellation View: Focus Mode Rebuild

## Context

You are working on `dwai-explorer`, a React + Vite + Tailwind app that displays 71 AI-in-design use cases. The app has two views: a Column View (working, don't touch) and a Constellation View (being rebuilt). 

Read these files before starting:
- `docs/DwAI_Constellation_FocusMode_Spec_20260314.md` — the interaction spec (this is the source of truth)
- `docs/DwAI_Explorer_PRD_v2_0_20260314.md` — the full PRD
- `docs/DwAI_Constellation_DesignDecisions_20260314.md` — design decision log (read to understand rationale)

Read the existing codebase:
- `src/ExplorerApp.tsx` — top-level shell and view switching
- `src/ExplorerContext.tsx` — shared state (selected UC, filters, active view)
- `src/ConstellationView.jsx` — current constellation (will be rebuilt)
- `src/constellationLayout.js` — current layout logic (will be rebuilt)
- `data/DwAI_UC_Data_v4.json` — 71 UC records
- `data/DwAI_UC_EnDe.json` — 112 enablement dependency edges
- `data/DwAI_UC_WfSq.json` — 12 workflow paths (decompose into 70 unique pairwise edges across 64 nodes)

Remove `src/EdgeControls.jsx` — no longer needed.

## What to build

Rebuild the Constellation View with two modes: **Overview** and **Focus**.

### Overview Mode (default, no node selected)

Layout: 71 nodes in a phase (X) × attestation level (Y) matrix.
- X-axis: 6 phase columns (Explore, Define, Concept, Validate, Deliver, Improve), left to right
- Y-axis: 4 attestation rows (Established top, Developing, Emerging, Speculative bottom)
- Nodes positioned within their column and row. Space nodes evenly within each cell; avoid overlap.

Nodes: Rounded rectangle mini-cards (~150×52px).
- Content: `{UC-ID} {RoleAbbrev} — {UC Name}` (truncate name with ellipsis if needed)
- Role abbreviations: DIR (Director), COC (Co-creator), CHL (Challenger), APP (Approver), AUD (Auditor)
- Fill: phase color (use the existing phase color palette from the codebase)
- Border encodes arrangement level:
  - Director: 3px solid white
  - Co-creator: 2.5px solid white
  - Challenger: 2px solid white
  - Approver: 1.5px dashed white
  - Auditor: 1px dotted white
- Attestation badge: small pill at top-right corner of each node
- Corner radius: 6px

No edges by default. 

Hover: When hovering a node, ghost in its **WfSq edges only** at 30% opacity (dashed teal lines). To compute WfSq edges: decompose `DwAI_UC_WfSq.json` paths into pairwise edges (each consecutive pair in a sequence array), then show all edges involving the hovered node.

Click: Enter Focus Mode for that node.

### Focus Mode (node selected)

The canvas splits into two vertical zones:

**Upper zone (Focus Band):**
- Contains the clicked (active) node plus all nodes connected to it via EnDe OR WfSq edges.
- Active node stays in its phase column. Receives a selection ring (e.g., 2px offset ring in a highlight color, or a subtle outer glow).
- Connected nodes keep their phase X-column alignment.
- Y-position within the focus band is FREE — arrange to minimize edge crossings. Do not use attestation for Y-positioning in the focus band.
- Draw both edge types between nodes:
  - EnDe: solid amber (#F59E0B), 2px, directional arrow (filled triangle 8px)
  - WfSq: dashed teal (#14B8A6), 2px (8px dash, 4px gap), directional arrow
- Edge hover: widen to 3px, show tooltip. Tooltip format:
  ```
  {Full UC Name A} (UC-ID-A)
  → {Full UC Name B} (UC-ID-B)
  {Edge type}: {description from edge data}
  ```
- Neighborhood can range from 2–3 nodes to 15+ nodes. The focus band must accommodate this range gracefully — scale vertical spacing, don't clip.

**Lower zone (Dimmed Matrix):**
- All nodes NOT in the focus neighborhood stay in their matrix positions.
- Dim them: reduce opacity to ~0.3, desaturate slightly.
- Still clickable: clicking a dimmed node switches focus to that node (direct transition, no intermediate overview).
- Clicking empty space in lower zone OR pressing Escape exits Focus Mode, returns to Overview.

### Transitions

Overview → Focus (~400ms total):
1. Unlinked nodes dim (opacity transition, ~200ms)
2. Active node + connected nodes slide upward into focus band (~300ms ease-out)
3. Active node gets selection ring (~100ms)
4. Edges draw in after nodes settle (~200ms, WfSq first then EnDe)

Focus → Focus (switching active node, ~400ms):
1. Current edges fade out (~150ms)
2. Old focus nodes slide down, new focus nodes slide up (~300ms)
3. New edges draw in (~200ms)

Focus → Overview (~350ms):
1. Edges fade out (~150ms)
2. Focus band nodes slide back to matrix positions (~300ms)
3. All nodes restore full opacity (~200ms)

### Shared Detail Panel

Clicking a node in the focus band should open the shared detail panel (the same one Column View uses). Focus Mode and the detail panel coexist — focus shows relationships, panel shows individual UC fields.

## Component architecture

Create these components:

| Component | File | Responsibility |
|-----------|------|----------------|
| ConstellationView | `ConstellationView.jsx` | Top-level container. Manages overview/focus state. Handles zoom/pan. |
| ConstellationOverview | `ConstellationOverview.jsx` | Renders phase × attestation matrix. Handles hover WfSq preview. |
| ConstellationFocus | `ConstellationFocus.jsx` | Renders two-zone focus layout. Active node, edge drawing, zone management. |
| ConstellationNode | `ConstellationNode.jsx` | Individual node mini-card. Shared between overview and focus. |
| ConstellationEdge | `ConstellationEdge.jsx` | Edge rendering with hover states and tooltips. EnDe and WfSq variants. |
| constellationLayout | `constellationLayout.js` | Layout algorithms: matrix grid (overview) and focus band arrangement (focus mode). |

Delete `EdgeControls.jsx`.

## Data processing

On load, pre-compute:
1. Parse `DwAI_UC_WfSq.json` — decompose each path's `sequence` array into pairwise edges `{source, target, pathId, pathLabel}`. Deduplicate. Result: ~70 unique edges.
2. Parse `DwAI_UC_EnDe.json` — load as-is (source, target, description). Result: 112 edges.
3. Build adjacency maps for quick lookup: `nodeId → {wfSqNeighbors: Set, enDeNeighbors: Set}`.
4. For any given node, its "focus neighborhood" = union of wfSqNeighbors and enDeNeighbors (both directions — if A→B exists, B is in A's neighborhood AND A is in B's neighborhood).

## Design quality

Use @21st-dev/magic MCP (`/ui` command) to generate polished components for:
- The node mini-card (ConstellationNode) — it should feel tactile, with clean typography and subtle shadow
- The edge tooltip — modern, clean, with good hierarchy between node names and edge description
- The focus band container — needs a subtle visual separation from the lower zone (could be a faint gradient boundary, a thin separator line, or a very subtle background tint difference)

Use UI UX Pro Max skill to get recommendations for:
- Color palette validation — ensure phase colors, edge colors (amber, teal), and the dimmed state work well together
- Spacing and typography — proper type scale for the UC-ID, role abbreviation, and UC name within the 150×52px card
- Animation easing curves — appropriate easing for the slide transitions

## Technical notes

- Use SVG for rendering (not canvas). Nodes and edges should be accessible DOM elements.
- Keyboard navigation: Tab through nodes, Enter to select (triggers focus mode), Escape to exit focus.
- Minimum viewport: 1200px. Below that, hide Constellation tab.
- The constellation should support basic zoom (scroll wheel) and pan (drag on empty space).
- Keep the Column View completely untouched.

## Build order

1. Data loading and adjacency map computation
2. ConstellationNode component
3. constellationLayout — matrix grid algorithm
4. ConstellationOverview — static matrix, no edges yet
5. Hover behavior — WfSq ghost edges on hover
6. ConstellationFocus — two-zone layout with edge drawing
7. Transitions and animations
8. Edge tooltips
9. Keyboard accessibility
10. Zoom/pan
