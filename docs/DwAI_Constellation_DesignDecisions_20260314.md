# DwAI UC Explorer — Constellation View: Design Decision Log
# Date: 2026-03-14
# Session: Focus Mode Redesign

---

## Purpose

This document captures design decisions made during the Constellation View redesign session, including the reasoning behind each choice. It demonstrates that structured design thinking can coexist with rapid AI-assisted development — decisions are traceable, not buried in chat history.

---

## DDL-001: Abandon Matrix + Edges Overlay

**Decision:** Stop trying to show edges across the full 71-node attestation × phase matrix simultaneously.

**Context:** The previous implementation drew EnDe, WfSq, and SCL edges across the complete node matrix. Every visual fix (hover states, fat edge hitboxes, tooltip styling, zoom controls) revealed two new problems.

**Rationale:** The core issue is architectural, not cosmetic. A 71-node matrix with 100+ edges cannot be both a readable spatial map and a readable relationship graph at the same time. The two goals require different layouts — one optimized for node positioning (the matrix), one optimized for edge legibility (the focus neighborhood).

**Alternatives considered:**
- More aggressive edge filtering → still spaghetti with fewer lines
- Bundled/curved edge routing → added visual complexity without solving legibility
- Minimap + detail view split → lost the benefit of spatial context

**Status:** Final.

---

## DDL-002: Two-Zone Focus Mode (Lift, Don't Teleport)

**Decision:** When a node is selected, its linked neighbors lift into a focus band at the top of the canvas. Unlinked nodes remain in their matrix positions, dimmed but clickable.

**Context:** Multiple alternatives were evaluated for how to show a node's relationship neighborhood.

**Rationale:** This preserves spatial context — the user never loses the mental model of the matrix. The matrix doesn't disappear; it becomes a background layer. Nodes don't teleport to arbitrary positions; they move vertically within their phase column. The animation reinforces the metaphor: "we're lifting this neighborhood up for inspection."

**Alternatives considered:**
- Radial layout (selected node center, connected nodes orbiting) → wastes space, treats all connections as equal, loses phase positioning
- Columnar layout with selected node at fixed anchor point → cleaner for edge reading but breaks the spatial relationship between the node and its matrix position
- Full view replacement (matrix disappears, focus layout takes over) → loses the overview context, makes it harder to browse

**Status:** Final.

---

## DDL-003: Focus Band Y-Axis Is Free (Not Attestation-Governed)

**Decision:** Inside the focus band, nodes keep their phase X-position but are arranged freely on the Y-axis for edge readability. Attestation does not govern vertical position in the focus band.

**Context:** The overview mode uses attestation as the Y-axis. The question was whether focus mode should preserve this.

**Rationale:** In focus mode, the user's task shifts from "where does this UC sit in the maturity landscape?" to "what is this UC connected to and how?" Attestation positioning would constrain the layout and potentially force edge crossings that a free Y arrangement can avoid. The attestation badge on each node still communicates maturity level without requiring axis encoding.

**Status:** Final.

---

## DDL-004: WfSq-Only Hover Preview in Overview

**Decision:** Hovering a node in overview mode ghosts in only its WfSq (Workflow Sequence) edges. EnDe edges do not appear until Focus Mode.

**Context:** The question was whether both edge types, one, or neither should appear on hover.

**Rationale:** The overview's narrative function is "here's how work flows" — it's about helping people imagine future ways of working. WfSq edges directly serve this: they show temporal ordering within a practitioner's workflow. EnDe edges are about organizational maturity and capability building order, which is a different (more analytical) concern that belongs in the inspection context of Focus Mode. Showing both on hover would also increase visual noise for a lightweight preview interaction.

**Status:** Final.

---

## DDL-005: SCL Edges Excluded From Constellation Entirely

**Decision:** Shared Capability Links (~2970 edges) are not shown in the Constellation View in any mode — not on hover, not in Focus Mode, not as a toggleable layer.

**Context:** SCL edges connect any two UCs that share an Expertise Differentiator tag. With 71 UCs and 11 expertise types, this produces a dense combinatorial graph.

**Rationale:** Even filtered to a single node's neighborhood, SCL could produce 30+ edges connecting to nodes that share an expertise tag. This is noise in a spatial view. The information SCL encodes ("these UCs draw on the same human competency") is better served by the Column View's filtering and grouping capabilities, where density is a data table problem, not a visual rendering problem.

**Status:** Final.

---

## DDL-006: Both EnDe and WfSq Visible in Focus Mode

**Decision:** When in Focus Mode, both Enablement Dependency and Workflow Sequence edges are drawn, visually distinct (solid amber vs. dashed teal).

**Context:** Since WfSq is the only edge type in overview hover, the question was whether Focus Mode should also be WfSq-only or show the full relationship picture.

**Rationale:** Focus Mode is the inspection context — the user has committed to examining a node's neighborhood. At this point, showing both edge types gives the full relationship picture: "this UC sits in these workflow sequences AND enables/is enabled by these other UCs." The two edge types have distinct visual treatments and serve complementary narrative functions. With a maximum neighborhood size constrained by the data (not the full 71-node set), both layers remain readable.

**Status:** Final.

---

## DDL-007: Node Shape — Rounded Rectangle Mini-Cards, Not Circles

**Decision:** Nodes are ~150×52px rounded rectangles showing UC-ID, role abbreviation, and UC name. Not circles with labels.

**Context:** Decision made in a prior session and carried forward.

**Rationale:** Circles force external labels (which collide with edges) or abbreviations so short they're meaningless. Rounded rectangles carry enough text to be self-identifying without requiring a hover or click. This is critical for both overview scanning and focus mode edge-following — the user needs to read node identities at a glance.

**Status:** Final (prior session).

---

## DDL-008: Arrangement Level Encoded as Border, Not Shape or Size

**Decision:** Human-AI Arrangement level is encoded as border weight and pattern (Director 3px solid through Auditor 1px dotted). White/light stroke color.

**Context:** Decision made in a prior session and carried forward.

**Rationale:** Shape and size encoding would interfere with the matrix layout (variable node sizes create alignment problems) and with edge routing (connection points shift). Border encoding is visible but non-disruptive. The weight + pattern combination creates a 5-level scale that's distinguishable at the mini-card size. White stroke ensures visibility against all phase-colored fills.

**Status:** Final (prior session).

---

## DDL-009: Active Node Stays In Place (No Anchor Repositioning)

**Decision:** The active (clicked) node stays in its phase column when entering Focus Mode. It receives extra visual weight (glow/ring) but does not move to a fixed anchor position.

**Context:** An alternative was proposed where the active node would shift to a prominent center-left anchor to anchor the focus layout.

**Rationale:** Moving the active node would break the spatial continuity between overview and focus mode. The user clicked a node at a specific position in the matrix; it should lift from that position, not jump elsewhere. Visual weight (selection ring, glow) is sufficient to mark it as the active item. Phase column alignment is preserved for all nodes in the focus band, maintaining the temporal left-to-right reading.

**Status:** Final.

---

## DDL-010: Clicking Dimmed Node Switches Focus (Not Exit + Re-enter)

**Decision:** Clicking a dimmed node in the lower zone transitions Focus Mode directly to that node's neighborhood — no intermediate return to Overview.

**Context:** The alternative would be: click dimmed node → return to overview → then enter focus on new node. Two transitions instead of one.

**Rationale:** The direct switch is faster and maintains the user's exploratory flow. The animation (old neighborhood slides down, new neighborhood lifts up) communicates the switch clearly. Requiring a round-trip through overview would feel sluggish and add no information.

**Status:** Final.

---

## DDL-011: Edge Tooltips Are Self-Contained

**Decision:** Edge tooltips show full node names first, UC-IDs in parentheses, and relationship description on a separate line. No external reference needed.

**Context:** Decision made in a prior session and carried forward.

**Rationale:** Users hovering an edge need to understand the relationship without cross-referencing other UI elements. The tooltip must answer "what two things are connected and how?" in a single glance. UC-IDs alone are not meaningful to most users; full names are required. IDs are parenthetical for users who work with the data directly.

**Status:** Final (prior session).

---

## Meta: Design Decision Capture as Practice

This document exists because the Constellation View redesign was conducted via conversational AI session. Without explicit capture, the decisions and their rationale would be lost in chat history — recoverable only by re-reading the full conversation.

The practice demonstrated here: design decisions are captured as they are made, with context, rationale, and alternatives considered. This is compatible with AI-assisted development ("vibe coding") and addresses the common criticism that rapid AI-assisted work produces undocumented, untraceable design choices.

The decision log is a first-class project artifact, not an afterthought.
