import React, { useState, useMemo, useRef, useLayoutEffect } from "react";
import { NODE_W, NODE_H } from "../utils/constellationLayout";

/** Triangle size; refX = ARROW places tip flush on path end */
const ARROW = 6;
const OBSTACLE_PAD = 12;
const TRUNK_LEN = 44;

export function ConstellationEdgeDefs() {
  return (
    <defs>
      <marker id="en-m" markerWidth={ARROW} markerHeight={ARROW} refX={ARROW} refY={ARROW / 2} orient="auto" markerUnits="userSpaceOnUse">
        <path d={`M0,0 L${ARROW},${ARROW / 2} L0,${ARROW} Z`} fill="#F59E0B" />
      </marker>
      <marker id="wf-m" markerWidth={ARROW} markerHeight={ARROW} refX={ARROW} refY={ARROW / 2} orient="auto" markerUnits="userSpaceOnUse">
        <path d={`M0,0 L${ARROW},${ARROW / 2} L0,${ARROW} Z`} fill="#14B8A6" />
      </marker>
    </defs>
  );
}

function rectEdges(o) {
  const w = o.w ?? NODE_W;
  const h = o.h ?? NODE_H;
  const left = o.x - w / 2 - OBSTACLE_PAD;
  const right = o.x + w / 2 + OBSTACLE_PAD;
  const top = o.y - h / 2 - OBSTACLE_PAD;
  const bottom = o.y + h / 2 + OBSTACLE_PAD;
  return { left, right, top, bottom };
}

function segIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (Math.abs(d) < 1e-10) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function lineHitsRect(x1, y1, x2, y2, r) {
  const { left, right, top, bottom } = r;
  const edges = [
    [left, top, right, top],
    [right, top, right, bottom],
    [right, bottom, left, bottom],
    [left, bottom, left, top]
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segIntersect(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

function segmentClear(x1, y1, x2, y2, obstacles, srcId, tgtId) {
  for (const o of obstacles) {
    if (o.id === srcId || o.id === tgtId) continue;
    if (lineHitsRect(x1, y1, x2, y2, rectEdges(o))) return false;
  }
  return true;
}

/** First obstacle whose padded rect intersects open segment (excluding endpoints slightly) */
function firstBlocker(x1, y1, x2, y2, obstacles, srcId, tgtId) {
  for (const o of obstacles) {
    if (o.id === srcId || o.id === tgtId) continue;
    const r = rectEdges(o);
    if (lineHitsRect(x1, y1, x2, y2, r)) return { o, r };
  }
  return null;
}

/**
 * Build waypoint list from p0 to p1 avoiding obstacles (axis-aligned detours).
 */
function detourRoute(p0, p1, obstacles, srcId, tgtId, depth = 0) {
  if (depth > 14) return [p0, p1];
  if (segmentClear(p0.x, p0.y, p1.x, p1.y, obstacles, srcId, tgtId)) {
    return [p0, p1];
  }
  const hit = firstBlocker(p0.x, p0.y, p1.x, p1.y, obstacles, srcId, tgtId);
  if (!hit) return [p0, p1];
  const { r } = hit;
  const mx = (Math.max(r.left, Math.min(r.right, (p0.x + p1.x) / 2)) + (p0.x + p1.x) / 2) / 2;
  const my = (p0.y + p1.y) / 2;
  const above = { x: mx, y: r.top - 16 };
  const below = { x: mx, y: r.bottom + 16 };
  const left = { x: r.left - 20, y: my };
  const right = { x: r.right + 20, y: my };
  const opts = [above, below, left, right];
  let best = null;
  let bestLen = Infinity;
  for (const w of opts) {
    const a = detourRoute(p0, w, obstacles, srcId, tgtId, depth + 1);
    const b = detourRoute(w, p1, obstacles, srcId, tgtId, depth + 1);
    const len = polylineLength(a) + polylineLength(b) - 1;
    if (len < bestLen) {
      bestLen = len;
      best = [...a.slice(0, -1), ...b];
    }
  }
  return best || [p0, p1];
}

function polylineLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    L += Math.hypot(dx, dy);
  }
  return L;
}

/** Smooth SVG path through points (cubic beziers). */
function smoothPathThrough(points) {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const pPrev = points[Math.max(0, i - 2)];
    const pNext = points[Math.min(points.length - 1, i + 1)];
    const t = 0.35;
    const c1x = p0.x + (p1.x - pPrev.x) * t;
    const c1y = p0.y + (p1.y - pPrev.y) * t;
    const c2x = p1.x - (pNext.x - p0.x) * t;
    const c2y = p1.y - (pNext.y - p0.y) * t;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p1.x} ${p1.y}`;
  }
  return d;
}

/**
 * Full drawer edge: optional bundle trunk, then detour-smoothed path.
 * @param {{x,y}} start
 * @param {{x,y}} end
 * @param bundle — if set, merge staggered start to (bundle.x + TRUNK_LEN, bundle.y) then route
 */
export function buildDrawerEdgePath(
  start,
  end,
  obstacles,
  srcId,
  tgtId,
  bundle
) {
  let pts = [{ x: start.x, y: start.y }];
  if (bundle) {
    const sign = bundle.dir === "left" ? -1 : 1;
    const trunkX = bundle.edgeX + sign * TRUNK_LEN;
    const trunkY = bundle.trunkY;
    pts.push({ x: start.x + sign * Math.min(TRUNK_LEN, 36), y: start.y });
    pts.push({ x: trunkX, y: start.y });
    pts.push({ x: trunkX, y: trunkY });
  }
  pts.push({ x: end.x, y: end.y });

  const refined = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = refined[refined.length - 1];
    const b = pts[i];
    const mid = detourRoute(a, b, obstacles, srcId, tgtId);
    for (let j = 1; j < mid.length; j++) {
      refined.push(mid[j]);
    }
  }
  dedupeClose(refined);
  return smoothPathThrough(refined);
}

function dedupeClose(pts, eps = 6) {
  for (let i = pts.length - 1; i > 0; i--) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    if (dx * dx + dy * dy < eps * eps) pts.splice(i, 1);
  }
}

export function buildObstaclePath(x1, y1, x2, y2, obstacles, srcId, tgtId) {
  return buildDrawerEdgePath(
    { x: x1, y: y1 },
    { x: x2, y: y2 },
    obstacles,
    srcId,
    tgtId,
    null
  );
}

export function ConstellationEdge({
  dPath,
  kind,
  description,
  nameA,
  idA,
  nameB,
  idB,
  pathLabel,
  opacity = 1,
  ghost = false,
  ghostOpacity = 0.3,
  ghostTransition = "0.3s ease-out",
  onHoverChange,
  nodeRectsInSvg,
  edgeMidpointSvg
}) {
  const [hover, setHover] = useState(false);
  const isWf = kind === "wfsq";
  const color = isWf ? "#14B8A6" : "#F59E0B";
  const strokeW = ghost ? 4 : hover ? 4 : 2.5;

  const buildPayload = (e) => {
    const base = {
      show: true,
      clientX: e.clientX,
      clientY: e.clientY,
      kind,
      description,
      nameA,
      idA,
      nameB,
      idB,
      pathLabel
    };
    const svg = e?.target?.ownerSVGElement;
    if (svg && nodeRectsInSvg?.length) {
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        const toClient = (x, y) => {
          pt.x = x;
          pt.y = y;
          const c = pt.matrixTransform(ctm);
          return { x: c.x, y: c.y };
        };
        const avoidRects = nodeRectsInSvg.map((r) => {
          const a = toClient(r.left, r.top);
          const b = toClient(r.right, r.bottom);
          return {
            left: Math.min(a.x, b.x),
            top: Math.min(a.y, b.y),
            right: Math.max(a.x, b.x),
            bottom: Math.max(a.y, b.y)
          };
        });
        base.avoidRects = avoidRects;
      }
    }
    if (svg && edgeMidpointSvg && edgeMidpointSvg.x != null && edgeMidpointSvg.y != null) {
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = edgeMidpointSvg.x;
        pt.y = edgeMidpointSvg.y;
        const c = pt.matrixTransform(ctm);
        base.edgeMidpoint = { x: c.x, y: c.y };
      }
    }
    return base;
  };

  return (
    <g
      opacity={ghost ? ghostOpacity : opacity}
      style={
        ghost && ghostTransition
          ? { transition: `opacity ${ghostTransition}` }
          : undefined
      }
    >
      <path
        d={dPath}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        style={{ cursor: ghost ? "default" : "pointer" }}
        onMouseEnter={(e) => {
          if (ghost) return;
          setHover(true);
          onHoverChange?.(buildPayload(e));
        }}
        onMouseMove={(e) => {
          if (ghost || !hover) return;
          onHoverChange?.(buildPayload(e));
        }}
        onMouseLeave={() => {
          setHover(false);
          onHoverChange?.({ show: false });
        }}
      />
      <path
        d={dPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={isWf ? "8 4" : undefined}
        markerEnd={ghost ? undefined : isWf ? "url(#wf-m)" : "url(#en-m)"}
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
}

const TOOLTIP_MAX_WIDTH = 320;
const TOOLTIP_PAD = 12;
const VIEWPORT_PAD = 8;

function rectsOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

export function EdgeTooltip({
  clientX,
  clientY,
  kind,
  description,
  nameA,
  idA,
  nameB,
  idB,
  pathLabel,
  avoidRects = [],
  edgeMidpoint
}) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ left: clientX + TOOLTIP_PAD, top: clientY + TOOLTIP_PAD });

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el || typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();
    const w = Math.min(rect.width, TOOLTIP_MAX_WIDTH);
    const h = rect.height;
    const refPoint = edgeMidpoint ? { x: edgeMidpoint.x, y: edgeMidpoint.y } : { x: clientX, y: clientY };
    const candidates = [
      { left: refPoint.x - w / 2, top: refPoint.y + TOOLTIP_PAD },
      { left: refPoint.x - w / 2, top: refPoint.y - h - TOOLTIP_PAD },
      { left: refPoint.x + TOOLTIP_PAD, top: refPoint.y - h / 2 },
      { left: refPoint.x - w - TOOLTIP_PAD, top: refPoint.y - h / 2 }
    ];
    const tooltipRect = (left, top) => ({ left, top, right: left + w, bottom: top + h });
    const inViewport = (r) =>
      r.left >= VIEWPORT_PAD && r.right <= vw - VIEWPORT_PAD &&
      r.top >= VIEWPORT_PAD && r.bottom <= vh - VIEWPORT_PAD;
    const clearOfNodes = (r) => !avoidRects.some((n) => rectsOverlap(r, n));
    for (const { left, top } of candidates) {
      const r = tooltipRect(left, top);
      const clamped = {
        left: Math.max(VIEWPORT_PAD, Math.min(vw - w - VIEWPORT_PAD, left)),
        top: Math.max(VIEWPORT_PAD, Math.min(vh - h - VIEWPORT_PAD, top)),
        right: 0,
        bottom: 0
      };
      clamped.right = clamped.left + w;
      clamped.bottom = clamped.top + h;
      if (inViewport(clamped) && clearOfNodes(clamped)) {
        setPosition({ left: clamped.left, top: clamped.top });
        return;
      }
    }
    setPosition({
      left: Math.max(VIEWPORT_PAD, Math.min(vw - w - VIEWPORT_PAD, clientX + TOOLTIP_PAD)),
      top: Math.max(VIEWPORT_PAD, Math.min(vh - h - VIEWPORT_PAD, clientY + TOOLTIP_PAD))
    });
  }, [clientX, clientY, edgeMidpoint, avoidRects]);

  const display = (n) => (n || "").replace(/\s*SUMMARY VIEW[\s\S]*$/i, "").trim();
  const verb = kind === "wfsq" ? "then →" : "enables →";
  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-[300] rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-left shadow-xl"
      style={{
        left: position.left,
        top: position.top,
        maxWidth: TOOLTIP_MAX_WIDTH
      }}
    >
      <div className="text-sm font-medium text-slate-100">
        {display(nameA)} <span className="text-xs text-slate-500">({idA})</span>
      </div>
      <div className="text-xs italic text-slate-500">{verb}</div>
      <div className="text-sm font-medium text-slate-100">
        {display(nameB)} <span className="text-xs text-slate-500">({idB})</span>
      </div>
      <div className="mt-2 border-t border-slate-700 pt-2 text-xs leading-snug text-slate-400">
        {kind === "wfsq" ? (
          <>
            <span className="font-semibold text-slate-300">Workflow:</span>{" "}
            {pathLabel || description || "—"}
          </>
        ) : (
          display(description) || "—"
        )}
      </div>
    </div>
  );
}

export function useEdgePath(x1, y1, x2, y2, obstacles, idA, idB) {
  return useMemo(
    () => buildObstaclePath(x1, y1, x2, y2, obstacles, idA, idB),
    [x1, y1, x2, y2, obstacles, idA, idB]
  );
}
