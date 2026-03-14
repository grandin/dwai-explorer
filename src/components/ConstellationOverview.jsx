import React, { useMemo, useState, useEffect, useRef } from "react";
import { ConstellationNode } from "./ConstellationNode";
import { ConstellationEdge } from "./ConstellationEdge";
import {
  getPathsContainingNode,
  getNodeIdsInPaths,
  getEdgesInPaths
} from "../utils/constellationData";
import {
  NODE_W,
  estimateCardHeight,
  computeEdgePath,
  getGlueSides
} from "../utils/constellationLayout";

const PHASES = ["Explore", "Define", "Concept", "Validate", "Deliver", "Improve"];

export function ConstellationOverview({
  matrixLayout,
  onNodeClick,
  setSelectedId
}) {
  const { positions, canvasW, canvasH } = matrixLayout;
  const [hoverId, setHoverId] = useState(null);
  const [pathIdsForEdges, setPathIdsForEdges] = useState(null);
  const leaveTimerRef = useRef(null);

  useEffect(() => {
    if (hoverId) {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      setPathIdsForEdges(getPathsContainingNode(hoverId));
    } else {
      leaveTimerRef.current = setTimeout(() => {
        setPathIdsForEdges(null);
        leaveTimerRef.current = null;
      }, 350);
    }
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, [hoverId]);

  const pathIdsForHover = hoverId ? getPathsContainingNode(hoverId) : null;
  const brightSet = useMemo(() => {
    if (!pathIdsForHover || pathIdsForHover.size === 0) {
      return hoverId ? new Set([hoverId]) : null;
    }
    return getNodeIdsInPaths(pathIdsForHover);
  }, [hoverId, pathIdsForHover]);

  const ghostEdges = useMemo(() => {
    if (!pathIdsForEdges || pathIdsForEdges.size === 0) return [];
    return getEdgesInPaths(pathIdsForEdges);
  }, [pathIdsForEdges]);

  const allNodesForOrtho = useMemo(() => {
    return Array.from(positions.entries()).map(([id, p]) => ({
      id,
      x: p.x,
      y: p.y,
      w: NODE_W,
      h: estimateCardHeight(p.uc)
    }));
  }, [positions]);

  const pos = (id) => positions.get(id);

  const edgeStagger = useMemo(() => {
    const byKey = new Map();
    ghostEdges.forEach((e) => {
      const a = pos(e.source);
      const b = pos(e.target);
      if (!a || !b) return;
      const sourceBox = { x: a.x, y: a.y };
      const targetBox = { x: b.x, y: b.y };
      const { exit: exitSide } = getGlueSides(sourceBox, targetBox);
      const key = `${e.source}:${exitSide}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ key: `${e.source}|${e.target}`, exitSide });
    });
    byKey.forEach((arr) => arr.sort((x, y) => x.key.localeCompare(y.key)));
    const indexMap = new Map();
    const countMap = new Map();
    byKey.forEach((arr, key) => {
      countMap.set(key, arr.length);
      arr.forEach((o, idx) => indexMap.set(o.key, { idx, count: arr.length, exitSide: o.exitSide }));
    });
    return (sourceId, targetId, sourceW, sourceH) => {
      const o = indexMap.get(`${sourceId}|${targetId}`);
      if (!o) return 0;
      const edgeLength = o.exitSide === "top" || o.exitSide === "bottom" ? sourceW : sourceH;
      return ((o.idx + 1) / (o.count + 1) - 0.5) * edgeLength;
    };
  }, [ghostEdges, positions]);

  const containerWidth = matrixLayout.canvasW;
  const containerHeight = matrixLayout.canvasH;

  return (
    <>
      <rect
        x={0}
        y={0}
        width={containerWidth}
        height={containerHeight}
        fill="transparent"
        style={{ cursor: "default" }}
      />
      <g className="lower-zone-nodes" style={{ opacity: 1 }}>
        {PHASE_LABELS(canvasW).map(({ x, label }) => (
          <text
            key={label}
            x={x}
            y={22}
            textAnchor="middle"
            className="fill-slate-500"
            style={{ fontSize: 12 }}
          >
            {label}
          </text>
        ))}
        {Array.from(positions.entries()).map(([id, p]) => (
          <ConstellationNode
            key={id}
            uc={p.uc}
            x={p.x}
            y={p.y}
            phase={p.phase}
            attestation={p.attestation}
            cardHeight={estimateCardHeight(p.uc)}
            overviewHoverDim={Boolean(hoverId && brightSet && !brightSet.has(id))}
            onClick={(nid) => {
              setSelectedId?.(nid);
              onNodeClick(nid);
            }}
            onMouseEnter={() => setHoverId(id)}
            onMouseLeave={() => setHoverId(null)}
          />
        ))}
      </g>
      <g className="edges">
      {ghostEdges.map((e, i) => {
        const a = pos(e.source);
        const b = pos(e.target);
        if (!a || !b) return null;
        const sourceBox = {
          id: e.source,
          x: a.x,
          y: a.y,
          w: NODE_W,
          h: estimateCardHeight(a.uc)
        };
        const targetBox = {
          id: e.target,
          x: b.x,
          y: b.y,
          w: NODE_W,
          h: estimateCardHeight(b.uc)
        };
        const exitOffset = edgeStagger(e.source, e.target, sourceBox.w, sourceBox.h);
        const dPath = computeEdgePath(
          sourceBox,
          targetBox,
          allNodesForOrtho,
          [],
          { exitOffset, padding: 16 }
        );
        return (
          <ConstellationEdge
            key={`g-${e.source}-${e.target}-${e.pathId}-${i}`}
            dPath={dPath}
            kind="wfsq"
            description={e.pathLabel}
            nameA={a.uc?.name}
            idA={e.source}
            nameB={b.uc?.name}
            idB={e.target}
            pathLabel={e.pathLabel}
            ghost
            ghostOpacity={hoverId ? 0.6 : 0}
            ghostTransition={hoverId ? "0.3s ease-out" : "0.35s ease-in"}
          />
        );
      })}
      </g>
    </>
  );
}

function PHASE_LABELS(canvasW) {
  const pad = 40;
  const colW = (canvasW - 2 * pad) / 6;
  return PHASES.map((label, i) => ({
    x: pad + colW / 2 + i * colW,
    label
  }));
}
