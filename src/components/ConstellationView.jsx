import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import ucData from "../../data/DwAI_UC_Data_v4.json";
import endeJson from "../../data/DwAI_UC_EnDe.json";
import wfsqJson from "../../data/DwAI_UC_WfSq.json";
import {
  buildConstellationLayout,
  NODE_W,
  NODE_H
} from "../utils/constellationLayout";
import { EdgeControls } from "./EdgeControls";
import { useExplorer } from "../context/ExplorerContext";

const PHASES = ["Explore", "Define", "Concept", "Validate", "Deliver", "Improve"];

const PHASE_FILL = {
  Explore: "#e0f4fc",
  Define: "#dcfce7",
  Concept: "#f3e8ff",
  Validate: "#ffedd5",
  Deliver: "#fef9c3",
  Improve: "#fce7f3"
};
const PHASE_MID = {
  Explore: "#0ea5e9",
  Define: "#22c55e",
  Concept: "#9333ea",
  Validate: "#ea580c",
  Deliver: "#ca8a04",
  Improve: "#db2777"
};

/** Single contrast stroke for all arrangement levels (dark UI) */
const ARRANGEMENT_STROKE = "#E0E0E0";

const ATTEST_BADGE = {
  Established: { abbr: "Est", fill: "#bbf7d0", stroke: "#15803d", text: "#14532d" },
  Developing: { abbr: "Dev", fill: "#bfdbfe", stroke: "#1d4ed8", text: "#1e3a8a" },
  Emerging: { abbr: "Emr", fill: "#fde68a", stroke: "#b45309", text: "#78350f" },
  Speculative: { abbr: "Spc", fill: "#e2e8f0", stroke: "#64748b", text: "#334155" }
};

const HITBOX_STROKE = 16;

function normalizePhases(uc) {
  const parts = (uc.phase || "").split("/").map((p) => p.trim());
  return {
    ...uc,
    primaryPhase: parts[0],
    secondaryPhase: parts[1]
  };
}

function normalizeAttestationLevel(uc) {
  const L = (uc.attestation?.level || "").trim().toLowerCase();
  if (L === "established") return "Established";
  if (L === "developing") return "Developing";
  if (L === "emerging") return "Emerging";
  if (L === "speculative") return "Speculative";
  return "Emerging";
}

function getGroupKey(uc, dim) {
  switch (dim) {
    case "activity":
      return uc.activity;
    case "arrangement":
      return uc.arrangement?.role ?? "";
    case "attestation":
      return uc.attestation?.level ?? "";
    case "risk":
      return uc.risk_typology?.[0]?.type ?? "";
    case "value":
      return uc.value_hypothesis?.types?.[0] ?? "";
    default:
      return "";
  }
}

function displayName(name) {
  return (name || "").replace(/\s*SUMMARY VIEW[\s\S]*$/i, "").trim();
}

function roleAbbr(role) {
  if (!role) return "—";
  const map = {
    Director: "Di",
    "Co-creator": "Co",
    Challenger: "Ch",
    Approver: "Ap",
    Auditor: "Au"
  };
  return map[role.trim()] || role.trim().slice(0, 2);
}

function arrangementBorderStyle(level) {
  const L = level ?? 2;
  const c = ARRANGEMENT_STROKE;
  if (L <= 1) return { width: 3, dash: null, color: c };
  if (L === 2) return { width: 2.5, dash: null, color: c };
  if (L === 3) return { width: 2, dash: null, color: c };
  if (L === 4) return { width: 1.5, dash: "4 3", color: c };
  return { width: 1, dash: "2 4", color: c };
}

function quadPath(x1, y1, x2, y2, bend, spreadIdx) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const off = bend + spreadIdx * 22;
  return `M ${x1} ${y1} Q ${mx + nx * off} ${my + ny * off} ${x2} ${y2}`;
}

function ArrangementLegend() {
  const [open, setOpen] = useState(true);
  const c = ARRANGEMENT_STROKE;
  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-20 max-w-[220px] rounded-xl border border-slate-700 bg-slate-950/95 text-xs text-slate-200 shadow-xl backdrop-blur">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 border-b border-slate-800 px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400"
        onClick={() => setOpen((o) => !o)}
      >
        Arrangement (border)
        <span className="text-slate-500">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-2 p-3 text-[10px] text-slate-400">
          <p className="text-slate-500">Weight &amp; pattern only — {c}</p>
          <div className="flex items-center gap-2">
            <svg width="44" height="12" className="shrink-0">
              <line x1="2" y1="6" x2="42" y2="6" stroke={c} strokeWidth="3" />
            </svg>
            <span>Director (human drives)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="44" height="12" className="shrink-0">
              <line x1="2" y1="6" x2="42" y2="6" stroke={c} strokeWidth="2.5" />
            </svg>
            <span>Co-creator (shared)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="44" height="12" className="shrink-0">
              <line x1="2" y1="6" x2="42" y2="6" stroke={c} strokeWidth="2" />
            </svg>
            <span>Challenger (AI proposes)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="44" height="12" className="shrink-0">
              <line x1="2" y1="6" x2="42" y2="6" stroke={c} strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            <span>Approver (human gates)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="44" height="12" className="shrink-0">
              <line x1="2" y1="6" x2="42" y2="6" stroke={c} strokeWidth="1" strokeDasharray="2 4" />
            </svg>
            <span>Auditor (AI autonomous)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConstellationView() {
  const {
    selectedId,
    setSelectedId,
    filterDimension,
    filterValue,
    stacking
  } = useExplorer();
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const containerRef = useRef(null);
  const zoomRef = useRef(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [hoveredWfPath, setHoveredWfPath] = useState(null);
  /** { clientX, clientY, tip: EnDeTip | WfTip } */
  const [edgeTip, setEdgeTip] = useState(null);
  /** locked: one of ende key or wf pathId */
  const [lockedEnDeKey, setLockedEnDeKey] = useState(null);
  const [lockedWfPathId, setLockedWfPathId] = useState(null);
  const [hoverEnDeKey, setHoverEnDeKey] = useState(null);
  const [hoverWfPathId, setHoverWfPathId] = useState(null);
  const [nodeTip, setNodeTip] = useState(null);
  const [endeOn, setEndeOn] = useState(true);
  const [wfsqOn, setWfsqOn] = useState(true);
  const [sclOn, setSclOn] = useState(false);
  const [sclDimension, setSclDimension] = useState("risk");
  const [sclValue, setSclValue] = useState("");

  const allUseCases = useMemo(() => (ucData || []).map(normalizePhases), []);
  const layout = useMemo(
    () => buildConstellationLayout(allUseCases),
    [allUseCases]
  );
  const {
    nodes,
    nodeById,
    attestationBands,
    canvasWidth,
    canvasHeight,
    bandInnerW,
    bandGap,
    padding,
    leftAttestLabelW
  } = layout;

  const wfsqPathCount = (wfsqJson || []).length;

  const endeEdges = useMemo(() => {
    const list = [];
    const bySource = {};
    (endeJson || []).forEach((e) => {
      if (!nodeById[e.from] || !nodeById[e.to]) return;
      if (!bySource[e.from]) bySource[e.from] = [];
      bySource[e.from].push(e);
    });
    Object.keys(bySource).forEach((from) => {
      bySource[from].forEach((e, i) => {
        list.push({ ...e, spread: i - (bySource[from].length - 1) / 2 });
      });
    });
    return list;
  }, [nodeById]);

  const wfsqEdges = useMemo(() => {
    const list = [];
    (wfsqJson || []).forEach((path) => {
      const seq = path.sequence || [];
      for (let i = 0; i < seq.length - 1; i++) {
        const from = seq[i];
        const to = seq[i + 1];
        if (!nodeById[from] || !nodeById[to]) continue;
        list.push({
          from,
          to,
          pathId: path.path_id,
          label: path.label,
          spread: i * 0.3
        });
      }
    });
    return list;
  }, [nodeById]);

  const sclEdges = useMemo(() => {
    if (!sclOn || !sclValue) return [];
    const ids = [];
    allUseCases.forEach((uc) => {
      let match = false;
      if (sclDimension === "risk")
        match = uc.risk_typology?.[0]?.type === sclValue;
      else if (sclDimension === "value")
        match = uc.value_hypothesis?.types?.includes(sclValue);
      else if (sclDimension === "expertise")
        match = uc.expertise_differentiator?.some((ed) => ed.type === sclValue);
      else if (sclDimension === "tool")
        match = (uc.named_tools || []).includes(sclValue);
      if (match) ids.push(uc.id);
    });
    const edges = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (nodeById[ids[i]] && nodeById[ids[j]])
          edges.push({ from: ids[i], to: ids[j], spread: i + j });
      }
    }
    return edges;
  }, [sclOn, sclValue, sclDimension, allUseCases, nodeById]);

  const sclOptions = useMemo(() => {
    const s = new Set();
    allUseCases.forEach((uc) => {
      if (sclDimension === "risk" && uc.risk_typology?.[0]?.type)
        s.add(uc.risk_typology[0].type);
      if (sclDimension === "value")
        (uc.value_hypothesis?.types || []).forEach((t) => s.add(t));
      if (sclDimension === "expertise")
        (uc.expertise_differentiator || []).forEach((ed) => s.add(ed.type));
      if (sclDimension === "tool")
        (uc.named_tools || []).forEach((t) => s.add(t));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allUseCases, sclDimension]);

  const neighbors = useCallback(
    (id) => {
      const set = new Set();
      if (!id) return set;
      set.add(id);
      if (endeOn)
        endeEdges.forEach((e) => {
          if (e.from === id) set.add(e.to);
          if (e.to === id) set.add(e.from);
        });
      if (wfsqOn)
        wfsqEdges.forEach((e) => {
          if (e.from === id) set.add(e.to);
          if (e.to === id) set.add(e.from);
        });
      if (sclOn && sclEdges.length)
        sclEdges.forEach((e) => {
          if (e.from === id) set.add(e.to);
          if (e.to === id) set.add(e.from);
        });
      return set;
    },
    [endeOn, wfsqOn, sclOn, endeEdges, wfsqEdges, sclEdges]
  );

  const selectedNeighbors = useMemo(
    () => neighbors(selectedId),
    [selectedId, neighbors]
  );

  const edgeTouchesSelected = useCallback(
    (e) => {
      if (!selectedId) return true;
      return e.from === selectedId || e.to === selectedId;
    },
    [selectedId]
  );

  const clearPinnedEdge = useCallback(() => {
    setLockedEnDeKey(null);
    setLockedWfPathId(null);
    setEdgeTip(null);
    setHoverEnDeKey(null);
    setHoverWfPathId(null);
  }, []);

  const computeFitTransform = useCallback(() => {
    const el = containerRef.current;
    const svgNode = svgRef.current;
    if (!el || !svgNode) return d3.zoomIdentity;
    const w = el.clientWidth || 800;
    const h = el.clientHeight || 600;
    const pad = 40;
    const kFit = Math.min(
      (w - 2 * pad) / canvasWidth,
      (h - 2 * pad) / canvasHeight,
      2
    );
    const k = Math.max(0.5, kFit);
    const tx = w / 2 - (k * canvasWidth) / 2;
    const ty = h / 2 - (k * canvasHeight) / 2;
    return d3.zoomIdentity.translate(tx, ty).scale(k);
  }, [canvasWidth, canvasHeight]);

  const applyFitTransform = useCallback(
    (animate) => {
      const { zoom, svg } = zoomRef.current || {};
      if (!zoom || !svg?.node()) return;
      const t = computeFitTransform();
      const el = containerRef.current;
      if (!el || el.clientWidth < 32 || el.clientHeight < 32) return;
      const chain = animate
        ? svg.transition().duration(150).ease(d3.easeCubicOut)
        : svg;
      chain.call(zoom.transform, t);
      setZoomPercent(Math.round(t.k * 100));
    },
    [computeFitTransform]
  );

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const svgNode = svgRef.current;
    const container = containerRef.current;
    if (!svgNode || !gRef.current || !container) return;

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 2])
      .filter((event) => {
        if (event.type === "dblclick") return false;
        if (event.type === "wheel") return false;
        return !event.button;
      })
      .on("zoom", (ev) => {
        g.attr("transform", ev.transform);
        setZoomPercent(Math.round(ev.transform.k * 100));
      });

    zoomRef.current = { zoom, svg, g, computeFitTransform };

    const onWheel = (event) => {
      event.preventDefault();
      const z = d3.zoomTransform(svgNode);
      const nextK = Math.max(
        0.5,
        Math.min(2, z.k + (event.deltaY > 0 ? -0.1 : 0.1))
      );
      const pt = d3.pointer(event, svgNode);
      const factor = nextK / z.k;
      const nt = d3.zoomIdentity
        .translate(pt[0], pt[1])
        .scale(factor)
        .translate(-pt[0], -pt[1])
        .multiply(z);
      svg
        .transition()
        .duration(80)
        .ease(d3.easeCubicOut)
        .call(zoom.transform, nt);
    };
    svgNode.addEventListener("wheel", onWheel, { passive: false });
    svg.call(zoom);

    const runFit = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => applyFitTransform(false));
      });
    };
    runFit();

    const ro = new ResizeObserver(() => runFit());
    ro.observe(container);

    return () => {
      ro.disconnect();
      svgNode.removeEventListener("wheel", onWheel);
      svg.on(".zoom", null);
    };
  }, [applyFitTransform, canvasWidth, canvasHeight]);

  const zoomIn = () => {
    const { zoom, svg } = zoomRef.current || {};
    if (!zoom || !svg) return;
    const z = d3.zoomTransform(svg.node());
    const k = Math.min(2, z.k + 0.2);
    svg
      .transition()
      .duration(150)
      .ease(d3.easeCubicOut)
      .call(zoom.scaleTo, k);
  };

  const zoomOut = () => {
    const { zoom, svg } = zoomRef.current || {};
    if (!zoom || !svg) return;
    const z = d3.zoomTransform(svg.node());
    const k = Math.max(0.5, z.k - 0.2);
    svg
      .transition()
      .duration(150)
      .ease(d3.easeCubicOut)
      .call(zoom.scaleTo, k);
  };

  const zoomReset = () => applyFitTransform(true);

  const dimmed = useCallback(
    (uc) =>
      filterDimension !== "none" &&
      filterValue &&
      getGroupKey(uc, filterDimension || stacking) !== filterValue,
    [filterDimension, filterValue, stacking]
  );

  const DIM = 0.15;
  const hw = NODE_W / 2;
  const hh = NODE_H / 2;

  const activeEnDeKey =
    lockedEnDeKey ||
    (lockedWfPathId == null ? hoverEnDeKey : null);
  const activeWfPathIdState =
    lockedWfPathId ||
    (lockedEnDeKey == null ? hoverWfPathId : null);

  const edgeEndpointBoostIds = useMemo(() => {
    const s = new Set();
    const endeKey = lockedEnDeKey || activeEnDeKey;
    if (endeKey != null) {
      const m = endeKey.match(/^ende-(\d+)$/);
      if (m) {
        const e = endeEdges[Number(m[1])];
        if (e) {
          s.add(e.from);
          s.add(e.to);
        }
      }
    }
    const wfPath = lockedWfPathId || activeWfPathIdState;
    if (wfPath != null) {
      wfsqEdges.forEach((e) => {
        if (e.pathId === wfPath) {
          s.add(e.from);
          s.add(e.to);
        }
      });
    }
    return s;
  }, [
    lockedEnDeKey,
    lockedWfPathId,
    activeEnDeKey,
    activeWfPathIdState,
    endeEdges,
    wfsqEdges
  ]);

  const brightNodeIds = useMemo(() => {
    const s = new Set();
    edgeEndpointBoostIds.forEach((id) => s.add(id));
    if (selectedId) {
      selectedNeighbors.forEach((id) => s.add(id));
      return s;
    }
    if (hoveredNode) {
      neighbors(hoveredNode).forEach((id) => s.add(id));
      return s;
    }
    if (hoveredEdge && hoveredEdge.pathId == null) {
      s.add(hoveredEdge.from);
      s.add(hoveredEdge.to);
      return s;
    }
    if (hoveredEdge && hoveredEdge.pathId != null) {
      wfsqEdges.forEach((e) => {
        if (e.pathId === hoveredEdge.pathId) {
          s.add(e.from);
          s.add(e.to);
        }
      });
      return s;
    }
    return s;
  }, [
    selectedId,
    hoveredNode,
    hoveredEdge,
    selectedNeighbors,
    wfsqEdges,
    endeOn,
    wfsqOn,
    sclOn,
    endeEdges,
    sclEdges,
    neighbors,
    edgeEndpointBoostIds
  ]);

  const nodeOpacity = (id) => {
    const uc = nodeById[id]?.uc;
    const f = dimmed(uc) ? 0.35 : 1;
    if (!selectedId && !hoveredNode && !hoveredEdge) return f;
    if (selectedId) {
      if (selectedNeighbors.has(id)) return f;
      return f * DIM;
    }
    if (brightNodeIds.has(id)) return f;
    return f * DIM;
  };

  const endeOpacity = (e, idx) => {
    if (!endeOn) return 0;
    const key = `ende-${idx}`;
    const active = activeEnDeKey === key;
    if (selectedId) {
      if (!edgeTouchesSelected(e)) return 0;
      return active ? 1 : 1;
    }
    if (active) return 1;
    if (hoveredNode)
      return e.from === hoveredNode || e.to === hoveredNode ? 1 : DIM;
    if (hoveredWfPath != null || activeWfPathIdState != null) return DIM;
    if (hoveredEdge && hoveredEdge.pathId != null) return DIM;
    if (hoveredEdge && hoveredEdge.pathId == null)
      return e === hoveredEdge ? 1 : DIM;
    return 0.2;
  };

  const wfsqOpacity = (e) => {
    if (!wfsqOn) return 0;
    const pathActive = activeWfPathIdState === e.pathId;
    if (selectedId) {
      if (!edgeTouchesSelected(e)) return 0;
      return pathActive ? 1 : 1;
    }
    if (pathActive) return 1;
    if (hoveredNode)
      return e.from === hoveredNode || e.to === hoveredNode ? 1 : DIM;
    if (hoveredWfPath != null) return e.pathId === hoveredWfPath ? 1 : DIM;
    if (hoveredEdge && hoveredEdge.pathId != null)
      return e.pathId === hoveredEdge.pathId ? 1 : DIM;
    return 0.22;
  };

  const hitboxPointer = (e) => {
    if (selectedId && !edgeTouchesSelected(e)) return "none";
    return "stroke";
  };

  const buildEnDeTip = (e) => {
    const na = displayName(nodeById[e.from]?.uc?.name);
    const nb = displayName(nodeById[e.to]?.uc?.name);
    return {
      kind: "ende",
      namesLine: `${na} → ${nb}`,
      codesLine: `(${e.from} → ${e.to})`,
      desc: e.label || ""
    };
  };

  const buildWfTip = (e) => {
    const na = displayName(nodeById[e.from]?.uc?.name);
    const nb = displayName(nodeById[e.to]?.uc?.name);
    return {
      kind: "wf",
      workflow: e.label || "Workflow",
      namesLine: `${na} → ${nb}`,
      codesLine: `(${e.from} → ${e.to})`
    };
  };

  const tipLocked = lockedEnDeKey != null || lockedWfPathId != null;

  const clampTipPosition = (clientX, clientY) => {
    const pad = 12;
    const maxW = 320;
    const estH = 120;
    const vw =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    let left = clientX + pad;
    let top = clientY + pad;
    if (left + maxW > vw - 8) left = Math.max(8, vw - maxW - 8);
    if (top + estH > vh - 8) top = Math.max(8, vh - estH - 8);
    return { left, top };
  };

  const onHitboxEnter = (ev, e, isWf, endeKey) => {
    if (selectedId && !edgeTouchesSelected(e)) return;
    setHoveredEdge(e);
    setHoveredWfPath(isWf ? e.pathId : null);
    if (isWf) {
      setHoverWfPathId(e.pathId);
      setHoverEnDeKey(null);
    } else {
      setHoverEnDeKey(endeKey);
      setHoverWfPathId(null);
    }
    if (!tipLocked)
      setEdgeTip({
        clientX: ev.clientX,
        clientY: ev.clientY,
        tip: isWf ? buildWfTip(e) : buildEnDeTip(e)
      });
  };

  const onHitboxMove = (ev, e, isWf, endeKey) => {
    if (selectedId && !edgeTouchesSelected(e)) return;
    if (isWf) setHoverWfPathId(e.pathId);
    else setHoverEnDeKey(endeKey);
    if (!tipLocked)
      setEdgeTip({
        clientX: ev.clientX,
        clientY: ev.clientY,
        tip: isWf ? buildWfTip(e) : buildEnDeTip(e)
      });
  };

  const onHitboxLeave = () => {
    setHoveredEdge(null);
    setHoveredWfPath(null);
    if (!tipLocked) {
      setHoverEnDeKey(null);
      setHoverWfPathId(null);
      setEdgeTip(null);
    } else {
      setHoverEnDeKey(null);
      setHoverWfPathId(null);
    }
  };

  const onHitboxClick = (ev, endeKey, e, isWf) => {
    ev.stopPropagation();
    const tip = isWf ? buildWfTip(e) : buildEnDeTip(e);
    if (isWf) {
      if (lockedWfPathId === e.pathId) {
        setLockedWfPathId(null);
        setLockedEnDeKey(null);
        setEdgeTip(null);
      } else {
        setLockedWfPathId(e.pathId);
        setLockedEnDeKey(null);
        setEdgeTip({
          clientX: ev.clientX,
          clientY: ev.clientY,
          tip
        });
      }
    } else if (lockedEnDeKey === endeKey) {
      setLockedEnDeKey(null);
      setLockedWfPathId(null);
      setEdgeTip(null);
    } else {
      setLockedEnDeKey(endeKey);
      setLockedWfPathId(null);
      setEdgeTip({
        clientX: ev.clientX,
        clientY: ev.clientY,
        tip
      });
    }
  };

  const onBgClick = () => {
    setSelectedId(null);
    setHoveredNode(null);
    setNodeTip(null);
    clearPinnedEdge();
  };

  const onCanvasSurfacePointerDown = (ev) => {
    if (ev.target === ev.currentTarget) onBgClick();
  };

  const onDismissSurfaceClick = (ev) => {
    ev.stopPropagation();
    onBgClick();
  };

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col bg-slate-950">
      <ArrangementLegend />
      {edgeTip && edgeTip.tip && (
        <div
          className={
            tipLocked
              ? "pointer-events-auto fixed z-[200] cursor-default"
              : "pointer-events-none fixed z-[200]"
          }
          style={{
            ...clampTipPosition(edgeTip.clientX, edgeTip.clientY),
            maxWidth: 320,
            padding: "10px 14px",
            paddingRight: tipLocked ? 28 : 14,
            borderRadius: 8,
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-secondary)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            color: "var(--color-text-primary)",
            position: "fixed"
          }}
        >
          {tipLocked && (
            <button
              type="button"
              aria-label="Close"
              className="absolute right-1 top-1 flex h-3 w-3 items-center justify-center rounded text-[14px] leading-none text-slate-500 hover:text-slate-200"
              style={{
                width: 12,
                height: 12,
                color: "var(--color-text-muted)"
              }}
              onClick={(e) => {
                e.stopPropagation();
                clearPinnedEdge();
              }}
            >
              ×
            </button>
          )}
          {edgeTip.tip.kind === "ende" ? (
            <>
              <div style={{ fontSize: 12, lineHeight: 1.4 }}>{edgeTip.tip.namesLine}</div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-text-muted)",
                  marginTop: 2
                }}
              >
                {edgeTip.tip.codesLine}
              </div>
              {edgeTip.tip.desc ? (
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: "0.5px solid var(--color-border-secondary)"
                  }}
                >
                  {edgeTip.tip.desc}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>
                {edgeTip.tip.workflow}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.4, marginTop: 6 }}>
                {edgeTip.tip.namesLine}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-text-muted)",
                  marginTop: 2
                }}
              >
                {edgeTip.tip.codesLine}
              </div>
            </>
          )}
          {tipLocked && (
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                color: "var(--color-text-muted)"
              }}
            >
              Click edge again or background to dismiss
            </div>
          )}
        </div>
      )}
      {nodeTip && (
        <div
          className="pointer-events-none fixed z-[100] max-w-xs rounded-lg border border-slate-600 bg-slate-900/98 px-3 py-2 text-xs text-slate-100 shadow-xl"
          style={{ left: nodeTip.clientX + 12, top: nodeTip.clientY + 12 }}
        >
          <div className="font-semibold">{nodeTip.name}</div>
          <div className="mt-1 text-slate-400">
            {nodeTip.phase}
            {nodeTip.activity ? ` · ${nodeTip.activity}` : ""}
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="absolute inset-0 min-h-0 overflow-hidden rounded-xl border border-slate-800"
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="block h-full w-full min-h-0 cursor-grab touch-none bg-slate-900/50 active:cursor-grabbing"
        >
          <defs>
            <filter id="nodeSelGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.5" />
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#3b82f6" floodOpacity="0.35" />
            </filter>
            <filter id="edgePinGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="white" floodOpacity="0.4" result="g" />
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="white" floodOpacity="0.25" />
            </filter>
            <filter id="edgePinGlowLight" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#000" floodOpacity="0.15" />
            </filter>
            <marker
              id="arrow-ende"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#BA7517" />
            </marker>
            <marker id="arrow-wf" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#0F6E56" />
            </marker>
            <marker id="arrow-pinned-dark" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#FFFFFF" />
            </marker>
            <marker id="arrow-pinned-light" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="#1a1a1a" />
            </marker>
          </defs>
          <rect
            data-dismiss-bg="1"
            className="constellation-canvas-bg"
            width={canvasWidth}
            height={canvasHeight}
            fill="transparent"
            onClick={onCanvasSurfacePointerDown}
            onDoubleClick={(e) => {
              if (e.target === e.currentTarget) {
                e.stopPropagation();
                zoomReset();
              }
            }}
          />
          <g ref={gRef}>
            {(attestationBands || []).map((band, i) => (
              <rect
                key={`bandbg-${band.name}`}
                x={0}
                y={band.y0}
                width={canvasWidth}
                height={band.y1 - band.y0}
                fill={i % 2 === 0 ? "#f8fafc" : "#e2e8f0"}
                fillOpacity={0.03}
                className="pointer-events-none"
              />
            ))}

            {(attestationBands || []).map((band, i) =>
              i > 0 ? (
                <line
                  key={`sep-${band.name}`}
                  x1={padding}
                  x2={canvasWidth - padding}
                  y1={band.y0}
                  y2={band.y0}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  opacity={0.25}
                  className="pointer-events-none"
                />
              ) : null
            )}

            {PHASES.map((phase, i) => {
              const x = padding + leftAttestLabelW + i * (bandInnerW + bandGap);
              return (
                <g key={phase}>
                  <rect
                    data-dismiss-bg="1"
                    x={x}
                    y={0}
                    width={bandInnerW}
                    height={canvasHeight}
                    fill={PHASE_FILL[phase]}
                    fillOpacity={0.14}
                    stroke={PHASE_MID[phase]}
                    strokeOpacity={0.12}
                    onClick={onDismissSurfaceClick}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      zoomReset();
                    }}
                  />
                  <text
                    x={x + bandInnerW / 2}
                    y={22}
                    textAnchor="middle"
                    className="pointer-events-none fill-slate-500"
                    style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}
                  >
                    {phase}
                  </text>
                </g>
              );
            })}

            {(attestationBands || []).map((band) => (
              <g key={`lbl-${band.name}`} className="pointer-events-none">
                <text
                  x={padding + 4}
                  y={band.labelY}
                  className="fill-slate-400"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase"
                  }}
                >
                  {band.name}
                </text>
                <text
                  x={canvasWidth - padding - 4}
                  y={band.labelY}
                  textAnchor="end"
                  className="fill-slate-500"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  ({band.count})
                </text>
                {band.empty && (
                  <text
                    x={canvasWidth / 2}
                    y={band.y0 + (band.y1 - band.y0) / 2 + 4}
                    textAnchor="middle"
                    className="fill-slate-500"
                    style={{ fontSize: 12, fontStyle: "italic" }}
                  >
                    No use cases at this level
                  </text>
                )}
              </g>
            ))}

            {endeOn &&
              endeEdges.map((e, idx) => {
                const a = nodeById[e.from];
                const b = nodeById[e.to];
                if (!a || !b) return null;
                const d = quadPath(a.x, a.y, b.x, b.y, 95, e.spread || 0);
                const op = endeOpacity(e, idx);
                if (op <= 0) return null;
                const key = `ende-${idx}`;
                const hoverActive = activeEnDeKey === key;
                const pinned = lockedEnDeKey === key;
                const thick = hoverActive && !pinned;
                const lightPin =
                  typeof window !== "undefined" &&
                  window.matchMedia("(prefers-color-scheme: light)").matches;
                return (
                  <path
                    key={`ende-vis-${idx}`}
                    d={d}
                    fill="none"
                    stroke={
                      pinned
                        ? lightPin
                          ? "#1a1a1a"
                          : "#FFFFFF"
                        : "#BA7517"
                    }
                    strokeWidth={pinned ? 3.5 : thick ? 3 : 1.75}
                    markerEnd={
                      pinned
                        ? lightPin
                          ? "url(#arrow-pinned-light)"
                          : "url(#arrow-pinned-dark)"
                        : "url(#arrow-ende)"
                    }
                    opacity={pinned || thick ? 1 : op}
                    filter={
                      pinned
                        ? lightPin
                          ? "url(#edgePinGlowLight)"
                          : "url(#edgePinGlow)"
                        : undefined
                    }
                    style={{ pointerEvents: "none" }}
                  />
                );
              })}

            {wfsqOn &&
              wfsqEdges.map((e, idx) => {
                const a = nodeById[e.from];
                const b = nodeById[e.to];
                if (!a || !b) return null;
                const d = quadPath(a.x, a.y, b.x, b.y, -88, e.spread || 0);
                const op = wfsqOpacity(e);
                if (op <= 0) return null;
                const pathHover = activeWfPathIdState === e.pathId;
                const pinned = lockedWfPathId === e.pathId;
                const lightPin =
                  typeof window !== "undefined" &&
                  window.matchMedia("(prefers-color-scheme: light)").matches;
                const thick = pathHover && !pinned;
                return (
                  <path
                    key={`wf-vis-${idx}`}
                    d={d}
                    fill="none"
                    stroke={
                      pinned
                        ? lightPin
                          ? "#1a1a1a"
                          : "#FFFFFF"
                        : "#0F6E56"
                    }
                    strokeWidth={pinned ? 3.5 : thick ? 3 : 1.75}
                    strokeDasharray="8 5"
                    markerEnd={
                      pinned
                        ? lightPin
                          ? "url(#arrow-pinned-light)"
                          : "url(#arrow-pinned-dark)"
                        : "url(#arrow-wf)"
                    }
                    opacity={pinned || thick ? 1 : op}
                    filter={
                      pinned
                        ? lightPin
                          ? "url(#edgePinGlowLight)"
                          : "url(#edgePinGlow)"
                        : undefined
                    }
                    style={{ pointerEvents: "none" }}
                  />
                );
              })}

            {sclOn &&
              sclEdges.map((e, idx) => {
                const a = nodeById[e.from];
                const b = nodeById[e.to];
                if (!a || !b) return null;
                const d = quadPath(a.x, a.y, b.x, b.y, 55, e.spread * 0.08);
                let op = 0.5;
                if (selectedId && !edgeTouchesSelected({ from: e.from, to: e.to }))
                  op = 0;
                if (op <= 0) return null;
                return (
                  <path
                    key={`scl-${idx}`}
                    d={d}
                    fill="none"
                    stroke="#888780"
                    strokeWidth={1}
                    strokeDasharray="2 5"
                    opacity={op}
                    style={{ pointerEvents: "none" }}
                  />
                );
              })}

            {nodes.map((n) => {
              const phase = n.phase;
              const fillBase = PHASE_FILL[phase] || "#f1f5f9";
              const hoverNode = !selectedId && hoveredNode === n.id;
              const edgeBoost = edgeEndpointBoostIds.has(n.id);
              let fill = fillBase;
              if (edgeBoost) fill = d3.color(fill).brighter(0.1).formatHex();
              if (hoverNode) fill = d3.color(fill).brighter(0.12).formatHex();
              const level = n.uc.arrangement?.level ?? 2;
              const b = arrangementBorderStyle(level);
              const selected = n.id === selectedId;
              const attest = normalizeAttestationLevel(n.uc);
              const badge = ATTEST_BADGE[attest] || ATTEST_BADGE.Emerging;
              const line1 = `${n.id} · ${roleAbbr(n.uc.arrangement?.role)}`;
              const name = displayName(n.uc.name);
              const showFullName =
                selected ||
                (selectedId && selectedNeighbors.has(n.id)) ||
                (!selectedId && brightNodeIds.has(n.id));
              const nameTrunc = showFullName ? truncate(name, 28) : truncate(name, 22);
              const gx = n.x;
              const gy = n.y;

              return (
                <g
                  key={n.id}
                  opacity={nodeOpacity(n.id)}
                  className="cursor-pointer"
                  transform={
                    selected
                      ? `translate(${gx},${gy}) scale(1.05) translate(${-gx},${-gy})`
                      : undefined
                  }
                  filter={selected ? "url(#nodeSelGlow)" : undefined}
                  onMouseEnter={(ev) => {
                    setHoveredNode(n.id);
                    if (!selectedId)
                      setNodeTip({
                        clientX: ev.clientX,
                        clientY: ev.clientY,
                        name,
                        phase: n.phase,
                        activity: n.uc.activity
                      });
                  }}
                  onMouseMove={(ev) => {
                    if (!selectedId)
                      setNodeTip({
                        clientX: ev.clientX,
                        clientY: ev.clientY,
                        name,
                        phase: n.phase,
                        activity: n.uc.activity
                      });
                  }}
                  onMouseLeave={() => {
                    setHoveredNode(null);
                    setNodeTip(null);
                  }}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedId(n.id);
                  }}
                >
                  {selected && (
                    <circle
                      cx={n.x - hw + 6}
                      cy={n.y - hh + 6}
                      r={6}
                      fill="#3b82f6"
                      className="pointer-events-none"
                    />
                  )}
                  <rect
                    x={n.x - hw}
                    y={n.y - hh}
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    ry={8}
                    fill={fill}
                    stroke={b.color}
                    strokeWidth={b.width}
                    strokeDasharray={b.dash || undefined}
                  />
                  <rect
                    x={n.x + hw - 36}
                    y={n.y - hh - 6}
                    width={32}
                    height={16}
                    rx={4}
                    ry={4}
                    fill={badge.fill}
                    stroke={badge.stroke}
                    strokeWidth={1}
                  />
                  <text
                    x={n.x + hw - 20}
                    y={n.y - hh + 4}
                    textAnchor="middle"
                    className="pointer-events-none"
                    style={{ fontSize: 9, fontWeight: 700, fill: badge.text }}
                  >
                    {badge.abbr}
                  </text>
                  <text
                    x={n.x + hw - 8}
                    y={n.y - hh + 20}
                    textAnchor="end"
                    className="pointer-events-none fill-slate-500"
                    style={{ fontSize: 10 }}
                  >
                    {line1}
                  </text>
                  <text
                    x={n.x - hw + 8}
                    y={n.y - hh + 36}
                    className="pointer-events-none fill-slate-900"
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >
                    {nameTrunc}
                  </text>
                  {n.secondaryPhase && (
                    <g transform={`translate(${n.x}, ${n.y + hh + 8})`}>
                      <rect
                        x={-36}
                        y={-10}
                        width={72}
                        height={18}
                        rx={4}
                        fill={PHASE_FILL[n.secondaryPhase] || "#f1f5f9"}
                        stroke={PHASE_MID[n.secondaryPhase] || "#94a3b8"}
                        strokeWidth={1}
                      />
                      <text
                        y={4}
                        textAnchor="middle"
                        className="pointer-events-none fill-slate-600"
                        style={{ fontSize: 8, fontWeight: 700 }}
                      >
                        {n.secondaryPhase}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {endeOn &&
              endeEdges.map((e, idx) => {
                const a = nodeById[e.from];
                const b = nodeById[e.to];
                if (!a || !b) return null;
                const d = quadPath(a.x, a.y, b.x, b.y, 95, e.spread || 0);
                const op = endeOpacity(e);
                if (op <= 0) return null;
                const key = `ende-${idx}`;
                return (
                  <path
                    key={`ende-hit-${idx}`}
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={HITBOX_STROKE}
                    opacity={0}
                    style={{
                      pointerEvents: hitboxPointer(e),
                      cursor: "grab"
                    }}
                    onMouseEnter={(ev) => onHitboxEnter(ev, e, false, key)}
                    onMouseMove={(ev) => onHitboxMove(ev, e, false, key)}
                    onMouseLeave={onHitboxLeave}
                    onClick={(ev) => onHitboxClick(ev, key, e, false)}
                  />
                );
              })}

            {wfsqOn &&
              wfsqEdges.map((e, idx) => {
                const a = nodeById[e.from];
                const b = nodeById[e.to];
                if (!a || !b) return null;
                const d = quadPath(a.x, a.y, b.x, b.y, -88, e.spread || 0);
                const op = wfsqOpacity(e);
                if (op <= 0) return null;
                const key = `wf-${idx}`;
                return (
                  <path
                    key={`wf-hit-${idx}`}
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={HITBOX_STROKE}
                    opacity={0}
                    style={{
                      pointerEvents: hitboxPointer(e),
                      cursor: "grab"
                    }}
                    onMouseEnter={(ev) => onHitboxEnter(ev, e, true, key)}
                    onMouseMove={(ev) => onHitboxMove(ev, e, true, key)}
                    onMouseLeave={onHitboxLeave}
                    onClick={(ev) => onHitboxClick(ev, key, e, true)}
                  />
                );
              })}
          </g>
        </svg>
        <EdgeControls
          endeCount={endeEdges.length}
          wfsqPathCount={wfsqPathCount}
          endeOn={endeOn}
          setEndeOn={setEndeOn}
          wfsqOn={wfsqOn}
          setWfsqOn={setWfsqOn}
          sclOn={sclOn}
          setSclOn={setSclOn}
          sclDimension={sclDimension}
          setSclDimension={setSclDimension}
          sclValue={sclValue}
          setSclValue={setSclValue}
          sclOptions={sclOptions}
        />
        <div className="pointer-events-auto absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-950/95 px-2 py-1.5 text-xs text-slate-200 shadow-lg">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-600 hover:bg-slate-800"
            aria-label="Zoom in"
            onClick={zoomIn}
          >
            +
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-600 hover:bg-slate-800"
            aria-label="Zoom out"
            onClick={zoomOut}
          >
            −
          </button>
          <button
            type="button"
            className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
            aria-label="Reset zoom"
            onClick={zoomReset}
          >
            ⟲
          </button>
          <span className="min-w-[2.5rem] tabular-nums text-slate-400">
            {zoomPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

function truncate(str, max) {
  if (!str || str.length <= max) return str || "";
  return str.slice(0, max - 1) + "…";
}
