import React, { useMemo } from "react";
import { ConstellationNode } from "./ConstellationNode";
import { ConstellationEdge } from "./ConstellationEdge";
import { focusNeighborhood, edgesInFocusSet } from "../utils/constellationData";
import {
  computeDrawerLayout,
  NODE_W,
  estimateCardHeight,
  activeCardHeight,
  DIVIDER_H,
  computeEdgePath,
  getGlueSides
} from "../utils/constellationLayout";

function geom(id, focusPositions, positions) {
  const fp = focusPositions.get(id);
  if (!fp) return null;
  const sc = fp.scale ?? 1;
  const p = positions.get(id);
  const uc = p?.uc;
  const h =
    fp.h ??
    (sc > 1 ? activeCardHeight(uc || {}) : estimateCardHeight(uc || {}));
  const w = sc > 1 ? NODE_W * sc : NODE_W;
  return { id, x: fp.x, y: fp.y, w, h };
}

export function ConstellationFocus({
  focusId,
  matrixLayout,
  containerWidth,
  totalLayoutHeight,
  onNodeClick,
  onExitFocus,
  setSelectedId,
  edgeOpacity = 1,
  onEdgeHover
}) {
  const neighborhood = useMemo(() => focusNeighborhood(focusId), [focusId]);
  const { focusPositions, focusBandH } = useMemo(
    () => computeDrawerLayout(focusId, neighborhood, matrixLayout),
    [focusId, neighborhood, matrixLayout]
  );
  const { ende, wf } = useMemo(
    () => edgesInFocusSet(neighborhood),
    [neighborhood]
  );
  const allEdges = useMemo(() => [...wf, ...ende], [wf, ende]);

  const { positions, canvasW, canvasH } = matrixLayout;
  const matrixOffsetY = focusBandH + DIVIDER_H;

  const obstacles = useMemo(() => {
    const list = [];
    neighborhood.forEach((id) => {
      const g = geom(id, focusPositions, positions);
      if (g) list.push({ id, x: g.x, y: g.y, w: g.w, h: g.h });
    });
    return list;
  }, [neighborhood, focusPositions, positions]);

  const nameId = (id) => {
    const p = positions.get(id);
    return p ? { name: p.uc.name, id } : { name: "", id };
  };

  const { edgePorts } = useMemo(() => {
    const bySide = new Map();
    allEdges.forEach((e) => {
      const ga = geom(e.source, focusPositions, positions);
      const gb = geom(e.target, focusPositions, positions);
      if (!ga || !gb) return;
      const { exit: sideA } = getGlueSides(ga, gb);
      const kA = `${e.source}:${sideA}`;
      if (!bySide.has(kA)) bySide.set(kA, []);
      bySide.get(kA).push(e);
    });

    bySide.forEach((list) => {
      list.sort((a, b) =>
        `${a.source}|${a.target}`.localeCompare(`${b.source}|${b.target}`)
      );
    });

    const outPorts = new Map();
    allEdges.forEach((e) => {
      const ga = geom(e.source, focusPositions, positions);
      const gb = geom(e.target, focusPositions, positions);
      if (!ga || !gb) return;
      const { exit: sideA } = getGlueSides(ga, gb);
      const na = bySide.get(`${e.source}:${sideA}`) || [];
      const ia = na.indexOf(e);
      const edgeLength = sideA === "top" || sideA === "bottom" ? ga.w : ga.h;
      const exitOffset = ((ia + 1) / (na.length + 1) - 0.5) * edgeLength;
      outPorts.set(`${e.source}|${e.target}`, { exitOffset });
    });
    return { edgePorts: outPorts };
  }, [allEdges, focusPositions, positions]);

  const obstacleBounds = obstacles.map((o) => ({
    id: o.id,
    left: o.x - o.w / 2,
    right: o.x + o.w / 2,
    top: o.y - o.h / 2,
    bottom: o.y + o.h / 2,
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h
  }));

  return (
    <>
      <rect
        x={0}
        y={0}
        width={canvasW}
        height={totalLayoutHeight}
        fill="transparent"
        style={{ cursor: "default" }}
        onClick={onExitFocus}
      />
      <g className="lower-zone-nodes" style={{ opacity: 0.3 }} transform={`translate(0,${matrixOffsetY})`}>
        <rect
          x={0}
          y={0}
          width={canvasW}
          height={canvasH}
          fill="transparent"
          onClick={onExitFocus}
        />
        {["Explore", "Define", "Concept", "Validate", "Deliver", "Improve"].map(
          (label, i) => {
            const pad = 40;
            const colW = (canvasW - 2 * pad) / 6;
            return (
              <text
                key={label}
                x={pad + colW / 2 + i * colW}
                y={22}
                textAnchor="middle"
                className="pointer-events-none fill-slate-600"
                style={{ fontSize: 11 }}
              >
                {label}
              </text>
            );
          }
        )}
        {Array.from(positions.entries()).map(([id, p]) => {
          if (neighborhood.has(id)) return null;
          return (
            <ConstellationNode
              key={`mat-${id}`}
              uc={p.uc}
              x={p.x}
              y={p.y}
              phase={p.phase}
              attestation={p.attestation}
              dimmed
              cardHeight={estimateCardHeight(p.uc)}
              onClick={(nid) => {
                setSelectedId?.(nid);
                onNodeClick(nid);
              }}
            />
          );
        })}
      </g>
      <line
        x1={0}
        x2={canvasW}
        y1={focusBandH}
        y2={focusBandH}
        stroke="#334155"
        strokeWidth={1}
        opacity={0.45}
        className="pointer-events-none"
      />
      <g className="drawer-nodes">
        <defs>
          <linearGradient id="focusBandFade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x={0}
          y={0}
          width={canvasW}
          height={focusBandH}
          fill="url(#focusBandFade)"
          className="pointer-events-none"
        />
        <text
          x={canvasW / 2}
          y={22}
          textAnchor="middle"
          className="pointer-events-none fill-slate-500"
          style={{ fontSize: 11 }}
        >
          Click a dimmed card to refocus · Click empty space or press Esc to return to overview
        </text>
        {Array.from(neighborhood).map((id) => {
          const fp = focusPositions.get(id);
          const p = positions.get(id);
          if (!fp || !p) return null;
          const cardH =
            fp.h ??
            (fp.scale > 1
              ? activeCardHeight(p.uc)
              : estimateCardHeight(p.uc));
          return (
            <ConstellationNode
              key={`band-${id}`}
              uc={p.uc}
              x={fp.x}
              y={fp.y}
              phase={p.phase}
              attestation={p.attestation}
              active={id === focusId}
              scale={fp.scale ?? 1}
              cardHeight={cardH / (fp.scale ?? 1)}
              onClick={(nid) => {
                setSelectedId?.(nid);
                onNodeClick(nid);
              }}
            />
          );
        })}
      </g>
      <g className="edges" style={{ opacity: edgeOpacity, transition: "opacity 0.2s ease" }}>
        {wf.map((e, i) => {
          const sourceBox = geom(e.source, focusPositions, positions);
          const targetBox = geom(e.target, focusPositions, positions);
          const ports = edgePorts.get(`${e.source}|${e.target}`);
          if (!sourceBox || !targetBox) return null;
          const dPath = computeEdgePath(
            sourceBox,
            targetBox,
            obstacleBounds,
            [],
            { exitOffset: ports?.exitOffset ?? 0, padding: 16 }
          );
          const mid = { x: (sourceBox.x + targetBox.x) / 2, y: (sourceBox.y + targetBox.y) / 2 };
          const nodeRectsInSvg = obstacles.map((o) => ({
            left: o.x - o.w / 2,
            top: o.y - o.h / 2,
            right: o.x + o.w / 2,
            bottom: o.y + o.h / 2
          }));
          return (
            <ConstellationEdge
              key={`wf-${i}`}
              dPath={dPath}
              kind="wfsq"
              description={e.pathLabel}
              pathLabel={e.pathLabel}
              nameA={nameId(e.source).name}
              idA={e.source}
              nameB={nameId(e.target).name}
              idB={e.target}
              onHoverChange={onEdgeHover}
              nodeRectsInSvg={nodeRectsInSvg}
              edgeMidpointSvg={mid}
            />
          );
        })}
        {ende.map((e, i) => {
          const sourceBox = geom(e.source, focusPositions, positions);
          const targetBox = geom(e.target, focusPositions, positions);
          const ports = edgePorts.get(`${e.source}|${e.target}`);
          if (!sourceBox || !targetBox) return null;
          const dPath = computeEdgePath(
            sourceBox,
            targetBox,
            obstacleBounds,
            [],
            { exitOffset: ports?.exitOffset ?? 0, padding: 16 }
          );
          const mid = { x: (sourceBox.x + targetBox.x) / 2, y: (sourceBox.y + targetBox.y) / 2 };
          const nodeRectsInSvg = obstacles.map((o) => ({
            left: o.x - o.w / 2,
            top: o.y - o.h / 2,
            right: o.x + o.w / 2,
            bottom: o.y + o.h / 2
          }));
          return (
            <ConstellationEdge
              key={`en-${i}`}
              dPath={dPath}
              kind="ende"
              description={e.label}
              nameA={nameId(e.source).name}
              idA={e.source}
              nameB={nameId(e.target).name}
              idB={e.target}
              onHoverChange={onEdgeHover}
              nodeRectsInSvg={nodeRectsInSvg}
              edgeMidpointSvg={mid}
            />
          );
        })}
      </g>
    </>
  );
}

export function focusCanvasHeight(matrixLayout, focusId) {
  const n = focusNeighborhood(focusId);
  const { focusBandH } = computeDrawerLayout(focusId, n, matrixLayout);
  return focusBandH + DIVIDER_H + matrixLayout.canvasH;
}
