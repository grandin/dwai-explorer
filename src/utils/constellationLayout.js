/**
 * Overview matrix + focus drawer. Layout sized to container (no user zoom).
 */

export const PHASES = [
  "Explore",
  "Define",
  "Concept",
  "Validate",
  "Deliver",
  "Improve"
];
export const ATTESTATIONS = [
  "Established",
  "Developing",
  "Emerging",
  "Speculative"
];

export const NODE_W = 150;
/** Default / overview matrix row step; focus drawer uses per-UC height */
export const NODE_H = 60;
export const ACTIVE_NODE_SCALE = 1.1;
export const ACTIVE_NODE_W = NODE_W * ACTIVE_NODE_SCALE;

function displayNameForEstimate(name) {
  return (name || "").replace(/\s*SUMMARY VIEW[\s\S]*$/i, "").trim();
}

/**
 * Card height for layout/routing (~150px wide, 13px name, multi-line wrap).
 * Matches wrapped name lines; clamp so layout stays bounded.
 */
export function estimateCardHeight(uc) {
  const name = displayNameForEstimate(uc?.name);
  const charsPerLine = 16;
  const nameLines = Math.max(1, Math.ceil(name.length / charsPerLine));
  const idLine = 14;
  const pad = 20;
  const lineH = 18;
  const h = pad + idLine + nameLines * lineH + 8;
  return Math.min(140, Math.max(52, Math.round(h)));
}

export function activeCardHeight(uc) {
  return estimateCardHeight(uc) * ACTIVE_NODE_SCALE;
}

const CELL_PAD = 10;
const TOP_LABEL = 36;
const LEFT_LABEL = 88;
const DIVIDER_H = 2;

/** Overview: scrollable canvas, natural height from spacing */
const OVERVIEW_PAD = 40;
const OVERVIEW_TOP = 44;
const OVERVIEW_BOTTOM_PAD = 40;
const OVERVIEW_MIN_NODE_GAP = 40;
const OVERVIEW_MIN_COLUMN_GAP = 60;
const ORTHO_STUB = 24;
const ORTHO_BRIDGE_PAD = 16;
const ORTHO_CORNER_R = 6;
const ORTHO_PARALLEL_OFFSET = 10;
const ORTHO_STAGGER_X = 8;
const ORTHO_STAGGER_Y = 6;

const DRAWER_HINT_H = 36;
const DRAWER_PAD = 40;
const DRAWER_MIN_H = 200;
const DRAWER_MIN_NODE_GAP = 48;
const V_GAP_EDGE = 48;
/** Min gap between active node edge and nearest column (centers) */
const GAP_ACTIVE_COLUMN = 28;

function normalizeAttestation(uc) {
  const L = (uc.attestation?.level || "").trim().toLowerCase();
  if (L === "established") return "Established";
  if (L === "developing") return "Developing";
  if (L === "emerging") return "Emerging";
  if (L === "speculative") return "Speculative";
  return "Emerging";
}

function phaseIndex(phase) {
  const i = PHASES.indexOf(phase);
  return i < 0 ? 3 : i;
}

/** Vertical centers for a column of nodes with per-id heights; uses DRAWER_MIN_NODE_GAP (48px). */
function stackCentersFromHeights(ids, idToH, yMid) {
  if (ids.length === 0) return [];
  const heights = ids.map((id) => idToH(id));
  const gap = DRAWER_MIN_NODE_GAP;
  const span =
    heights.reduce((a, b) => a + b, 0) + Math.max(0, ids.length - 1) * gap;
  let yTop = yMid - span / 2;
  const centers = [];
  for (let i = 0; i < ids.length; i++) {
    const h = heights[i];
    centers.push(yTop + h / 2);
    yTop += h + gap;
  }
  return centers;
}

/**
 * Evenly spaced centers from a to b inclusive (n points, n>=1).
 */
function spaceBetween(a, b, n) {
  if (n <= 0) return [];
  if (n === 1) return [(a + b) / 2];
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(a + (i / (n - 1)) * (b - a));
  }
  return out;
}

/**
 * Full-width drawer: space-between columns; active shifts when one side empty.
 */
export function computeDrawerLayout(focusId, neighborhood, matrixLayout) {
  const { positions, canvasW } = matrixLayout;
  const focusPositions = new Map();

  const activePos = positions.get(focusId);
  if (!activePos) {
    return { focusPositions, focusBandH: DRAWER_MIN_H };
  }

  const activePhase = activePos.phase;
  const aIdx = phaseIndex(activePhase);
  const halfA = ACTIVE_NODE_W / 2;

  const leftByPhase = new Map();
  const rightByPhase = new Map();
  const sameIds = [];

  neighborhood.forEach((id) => {
    if (id === focusId) return;
    const p = positions.get(id);
    if (!p) return;
    const d = phaseIndex(p.phase) - aIdx;
    if (d < 0) {
      if (!leftByPhase.has(p.phase)) leftByPhase.set(p.phase, []);
      leftByPhase.get(p.phase).push(id);
    } else if (d > 0) {
      if (!rightByPhase.has(p.phase)) rightByPhase.set(p.phase, []);
      rightByPhase.get(p.phase).push(id);
    } else {
      sameIds.push(id);
    }
  });
  sameIds.sort();
  leftByPhase.forEach((arr) => arr.sort());
  rightByPhase.forEach((arr) => arr.sort());

  const leftPhases = [...leftByPhase.keys()].sort(
    (a, b) => phaseIndex(a) - phaseIndex(b)
  );
  const rightPhases = [...rightByPhase.keys()].sort(
    (a, b) => phaseIndex(a) - phaseIndex(b)
  );

  const nL = leftPhases.length;
  const nR = rightPhases.length;
  const nSame = sameIds.length;

  const innerLeft = DRAWER_PAD + NODE_W / 2;
  const innerRight = canvasW - DRAWER_PAD - NODE_W / 2;

  let xActive;
  const span = innerRight - innerLeft;
  if (nL > 0 && nR > 0) {
    xActive = canvasW / 2;
  } else if (nL > 0 && nR === 0) {
    /** Only upstream (left): empty on right → shift active right */
    xActive = innerLeft + 0.72 * span;
    xActive = Math.min(xActive, innerRight - halfA - 12);
    xActive = Math.max(xActive, innerLeft + halfA + NODE_W + GAP_ACTIVE_COLUMN);
  } else if (nR > 0 && nL === 0) {
    /** Only downstream (right): empty on left → shift active left */
    xActive = innerLeft + 0.28 * span;
    xActive = Math.max(xActive, innerLeft + halfA + 12);
    xActive = Math.min(xActive, innerRight - halfA - NODE_W - GAP_ACTIVE_COLUMN);
  } else {
    xActive = canvasW / 2;
  }

  const leftBandRight = xActive - halfA - GAP_ACTIVE_COLUMN - NODE_W / 2;
  const rightBandLeft = xActive + halfA + GAP_ACTIVE_COLUMN + NODE_W / 2;

  const leftCenters =
    nL === 0
      ? []
      : spaceBetween(innerLeft, Math.max(innerLeft, leftBandRight), nL);
  const rightCenters =
    nR === 0
      ? []
      : spaceBetween(
          Math.min(innerRight, rightBandLeft),
          innerRight,
          nR
        );

  const hFor = (id) => {
    const p = positions.get(id);
    return p ? estimateCardHeight(p.uc) : NODE_H;
  };
  const hActive = activeCardHeight(activePos.uc);
  const columnSpanH = (ids) => {
    if (!ids.length) return 0;
    const hs = ids.map(hFor);
    return hs.reduce((a, b) => a + b, 0) + Math.max(0, ids.length - 1) * DRAWER_MIN_NODE_GAP;
  };
  let maxSideH = hActive;
  leftPhases.forEach((ph) => {
    maxSideH = Math.max(maxSideH, columnSpanH(leftByPhase.get(ph)));
  });
  rightPhases.forEach((ph) => {
    maxSideH = Math.max(maxSideH, columnSpanH(rightByPhase.get(ph)));
  });
  const nAbove = Math.ceil(nSame / 2);
  const nBelow = nSame - nAbove;
  const aboveIds = sameIds.slice(0, nAbove);
  const belowIds = sameIds.slice(nAbove);
  const sameColumnH =
    nSame === 0
      ? hActive
      : columnSpanH(aboveIds) +
        DRAWER_MIN_NODE_GAP +
        hActive +
        DRAWER_MIN_NODE_GAP +
        columnSpanH(belowIds);

  const contentH = Math.max(
    maxSideH,
    sameColumnH,
    DRAWER_MIN_H - DRAWER_HINT_H - 2 * DRAWER_PAD
  );
  const focusBandH = Math.max(
    DRAWER_MIN_H,
    DRAWER_HINT_H + DRAWER_PAD + contentH + DRAWER_PAD
  );
  const yMid = DRAWER_HINT_H + DRAWER_PAD + contentH / 2;

  focusPositions.set(focusId, {
    x: xActive,
    y: yMid,
    scale: ACTIVE_NODE_SCALE,
    phase: activePhase,
    h: hActive
  });

  leftPhases.forEach((ph, colIdx) => {
    const ids = leftByPhase.get(ph);
    const ys = stackCentersFromHeights(ids, hFor, yMid);
    const cx = leftCenters[colIdx];
    ids.forEach((id, i) => {
      const h = hFor(id);
      focusPositions.set(id, { x: cx, y: ys[i], scale: 1, phase: ph, h });
    });
  });

  rightPhases.forEach((ph, colIdx) => {
    const ids = rightByPhase.get(ph);
    const ys = stackCentersFromHeights(ids, hFor, yMid);
    const cx = rightCenters[colIdx];
    ids.forEach((id, i) => {
      const h = hFor(id);
      focusPositions.set(id, { x: cx, y: ys[i], scale: 1, phase: ph, h });
    });
  });

  const sameColGap = DRAWER_MIN_NODE_GAP;
  let yTopAbove = yMid - hActive / 2 - sameColGap;
  for (let i = aboveIds.length - 1; i >= 0; i--) {
    const id = aboveIds[i];
    const h = hFor(id);
    yTopAbove -= h;
    focusPositions.set(id, {
      x: xActive,
      y: yTopAbove + h / 2,
      scale: 1,
      phase: activePhase,
      h
    });
    yTopAbove -= sameColGap;
  }
  let yTopBelow = yMid + hActive / 2 + sameColGap;
  belowIds.forEach((id) => {
    const h = hFor(id);
    focusPositions.set(id, {
      x: xActive,
      y: yTopBelow + h / 2,
      scale: 1,
      phase: activePhase,
      h
    });
    yTopBelow += h + sameColGap;
  });

  return { focusPositions, focusBandH };
}

/**
 * Connectivity-driven overview: 6 columns with 60px gap, 40px vertical gap; natural height (scrollable).
 */
export function computeOverviewLayout(useCases, wfSqPaths, containerWidth = 1200) {
  const canvasW = Math.max(800, containerWidth);
  const availableWidth = canvasW - 2 * OVERVIEW_PAD;
  const contentTop = OVERVIEW_TOP;
  const nCols = PHASES.length;
  const totalGap = (nCols - 1) * OVERVIEW_MIN_COLUMN_GAP;
  const colContentW = (availableWidth - totalGap) / nCols;
  const columnCenterX = (phase) => {
    const i = PHASES.indexOf(phase);
    return i < 0 ? canvasW / 2 : OVERVIEW_PAD + colContentW / 2 + i * (colContentW + OVERVIEW_MIN_COLUMN_GAP);
  };

  const idToUc = new Map();
  const byPhase = new Map();
  PHASES.forEach((p) => byPhase.set(p, []));
  useCases.forEach((uc) => {
    const phase = uc.primaryPhase || uc.phase?.split("/")[0]?.trim();
    if (!PHASES.includes(phase)) return;
    const attestation = normalizeAttestation(uc);
    idToUc.set(uc.id, { ...uc, phase, attestation });
    byPhase.get(phase).push(uc.id);
  });

  const paths = (wfSqPaths || []).filter((p) => p.sequence && p.sequence.length);
  const pathLaneY = [];
  for (let i = 0; i < paths.length; i++) {
    pathLaneY[i] = paths.length <= 1 ? 0.5 : i / (paths.length - 1);
  }

  const nodeToPathIndices = new Map();
  paths.forEach((path, idx) => {
    path.sequence.forEach((id) => {
      if (!nodeToPathIndices.has(id)) nodeToPathIndices.set(id, []);
      nodeToPathIndices.get(id).push(idx);
    });
  });

  const hFor = (id) => {
    const uc = idToUc.get(id);
    return uc ? estimateCardHeight(uc) : NODE_H;
  };

  const initialY = new Map();
  idToUc.forEach((uc, id) => {
    const indices = nodeToPathIndices.get(id) || [];
    if (indices.length === 1) {
      initialY.set(id, pathLaneY[indices[0]]);
    } else if (indices.length > 1) {
      const avg = indices.reduce((s, i) => s + pathLaneY[i], 0) / indices.length;
      initialY.set(id, avg);
    } else {
      initialY.set(id, 0.5);
    }
  });

  const positions = new Map();
  const gap = OVERVIEW_MIN_NODE_GAP;
  let maxColumnBottom = contentTop;

  PHASES.forEach((phase) => {
    const ids = byPhase.get(phase).slice().sort((a, b) => initialY.get(a) - initialY.get(b));
    const n = ids.length;
    if (n === 0) return;
    const heights = ids.map((id) => hFor(id));
    const columnHeight = heights.reduce((a, b) => a + b, 0) + (n - 1) * gap;
    let yCursor = contentTop;
    ids.forEach((id, i) => {
      const h = heights[i];
      const y = yCursor + h / 2;
      yCursor += h + gap;
      const uc = idToUc.get(id);
      positions.set(id, {
        x: columnCenterX(phase),
        y,
        phase: uc.phase,
        attestation: uc.attestation,
        uc
      });
    });
    maxColumnBottom = Math.max(maxColumnBottom, yCursor - gap);
  });

  const canvasH = Math.max(500, maxColumnBottom + OVERVIEW_BOTTOM_PAD);

  return {
    positions,
    canvasW,
    canvasH
  };
}

/** Target-aware glue: choose exit (source) and entry (target) side from angle S→T. */
export function getGlueSides(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const a = angleDeg;
  if (a >= -60 && a < 60) return { exit: "right", entry: "left" };
  if (a >= -150 && a < -60) return { exit: "top", entry: dx >= 0 ? "bottom" : "right" };
  if (a >= 60 && a < 150) return { exit: "bottom", entry: dx >= 0 ? "top" : "right" };
  return { exit: "left", entry: "right" };
}

/** Bounding box with center; allNodeBounds items have id, left, right, top, bottom or x,y,w,h. */
function nodeBounds(node) {
  const w = node.w ?? NODE_W;
  const h = node.h ?? NODE_H;
  const cx = node.x ?? (node.left + node.right) / 2;
  const cy = node.y ?? (node.top + node.bottom) / 2;
  const left = node.left ?? cx - w / 2;
  const right = node.right ?? cx + w / 2;
  const top = node.top ?? cy - h / 2;
  const bottom = node.bottom ?? cy + h / 2;
  return {
    id: node.id,
    centerX: cx,
    centerY: cy,
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top
  };
}

function gluePointFromBounds(bounds, side, exitOffset = 0) {
  const { centerX, centerY, left, right, top, bottom } = bounds;
  if (side === "right") return { x: right, y: centerY + exitOffset };
  if (side === "left") return { x: left, y: centerY + exitOffset };
  if (side === "top") return { x: centerX + exitOffset, y: top };
  return { x: centerX + exitOffset, y: bottom };
}

function moveStub(point, direction, distance) {
  if (direction === "right") return { x: point.x + distance, y: point.y };
  if (direction === "left") return { x: point.x - distance, y: point.y };
  if (direction === "up") return { x: point.x, y: point.y - distance };
  return { x: point.x, y: point.y + distance };
}

const STUB_LEN = 24;
const EDGE_PADDING = 16;
const CORNER_R = 6;

function findClearVerticalChannel(preferredX, y1, y2, allNodeBounds, padding) {
  let minY = Math.min(y1, y2);
  let maxY = Math.max(y1, y2);
  let x = preferredX;
  for (const node of allNodeBounds) {
    const left = node.left - padding;
    const right = node.right + padding;
    const top = node.top - padding;
    const bottom = node.bottom + padding;
    if (x > left && x < right && !(maxY < top || minY > bottom)) {
      const leftOption = node.left - padding - 4;
      const rightOption = node.right + padding + 4;
      if (Math.abs(leftOption - preferredX) < Math.abs(rightOption - preferredX)) {
        x = leftOption;
      } else {
        x = rightOption;
      }
    }
  }
  return x;
}

function findClearHorizontalChannel(preferredY, x1, x2, allNodeBounds, padding) {
  let minX = Math.min(x1, x2);
  let maxX = Math.max(x1, x2);
  let y = preferredY;
  for (const node of allNodeBounds) {
    const left = node.left - padding;
    const right = node.right + padding;
    const top = node.top - padding;
    const bottom = node.bottom + padding;
    if (y > top && y < bottom && !(maxX < left || minX > right)) {
      const topOption = node.top - padding - 4;
      const bottomOption = node.bottom + padding + 4;
      if (Math.abs(topOption - preferredY) < Math.abs(bottomOption - preferredY)) {
        y = topOption;
      } else {
        y = bottomOption;
      }
    }
  }
  return y;
}

function segmentIntersectsNode(x1, y1, x2, y2, node, padding, excludeIds) {
  if (excludeIds && (excludeIds.has(node.id))) return false;
  const left = node.left - padding;
  const right = node.right + padding;
  const top = node.top - padding;
  const bottom = node.bottom + padding;
  const vert = Math.abs(x2 - x1) < 1e-6;
  if (vert) {
    if (x1 < left || x1 > right) return false;
    const segMin = Math.min(y1, y2);
    const segMax = Math.max(y1, y2);
    return !(segMax < top || segMin > bottom);
  }
  const segMin = Math.min(x1, x2);
  const segMax = Math.max(x1, x2);
  if (y1 < top || y1 > bottom) return false;
  return !(segMax < left || segMin > right);
}

function waypointsToSVGPath(waypoints, r = CORNER_R) {
  if (!waypoints || waypoints.length < 2) return "";
  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    if (dist < 1e-6) continue;
    const ux = (curr.x - prev.x) / dist;
    const uy = (curr.y - prev.y) / dist;
    if (i < waypoints.length - 1 && dist >= 2 * r) {
      const next = waypoints[i + 1];
      const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
      const u2x = d2 < 1e-6 ? ux : (next.x - curr.x) / d2;
      const u2y = d2 < 1e-6 ? uy : (next.y - curr.y) / d2;
      const stopX = curr.x - ux * r;
      const stopY = curr.y - uy * r;
      const arcEndX = curr.x + u2x * r;
      const arcEndY = curr.y + u2y * r;
      path += ` L ${stopX} ${stopY}`;
      path += ` Q ${curr.x} ${curr.y} ${arcEndX} ${arcEndY}`;
    } else {
      path += ` L ${curr.x} ${curr.y}`;
    }
  }
  return path;
}

/**
 * Returns SVG path string. sourceNode/targetNode: { id, x, y, w, h } or bounds.
 * allNodeBounds: array of node bounds (with left, right, top, bottom, id).
 * existingPaths: reserved for future use.
 * options: { exitOffset, padding } = offset along exit edge for stagger, padding (default 16).
 */
export function computeEdgePath(sourceNode, targetNode, allNodeBounds, existingPaths, options = {}) {
  const padding = options.padding ?? EDGE_PADDING;
  const exitOffset = options.exitOffset ?? 0;
  const src = nodeBounds(sourceNode);
  const tgt = nodeBounds(targetNode);
  const dx = tgt.centerX - src.centerX;
  const dy = tgt.centerY - src.centerY;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  let exitPoint;
  let entryPoint;
  let exitDirection;
  let entryDirection;

  if (angle >= -60 && angle < 60) {
    exitPoint = gluePointFromBounds(src, "right", exitOffset);
    entryPoint = gluePointFromBounds(tgt, "left");
    exitDirection = "right";
    entryDirection = "left";
  } else if (angle >= -150 && angle < -60) {
    exitPoint = gluePointFromBounds(src, "top", exitOffset);
    entryPoint = dx >= 0
      ? gluePointFromBounds(tgt, "bottom")
      : gluePointFromBounds(tgt, "right");
    entryDirection = dx >= 0 ? "bottom" : "right";
    exitDirection = "up";
  } else if (angle >= 60 && angle < 150) {
    exitPoint = gluePointFromBounds(src, "bottom", exitOffset);
    entryPoint = dx >= 0
      ? gluePointFromBounds(tgt, "top")
      : gluePointFromBounds(tgt, "right");
    entryDirection = dx >= 0 ? "top" : "right";
    exitDirection = "down";
  } else {
    exitPoint = gluePointFromBounds(src, "left", exitOffset);
    entryPoint = gluePointFromBounds(tgt, "right");
    exitDirection = "left";
    entryDirection = "right";
  }

  const exitStubEnd = moveStub(exitPoint, exitDirection, STUB_LEN);
  const entryStubStart = moveStub(
    entryPoint,
    entryDirection === "left" ? "left" : entryDirection === "right" ? "right" : entryDirection === "top" ? "up" : "down",
    STUB_LEN
  );

  const boundsList = allNodeBounds.map(nodeBounds).filter((b) => b.id !== src.id && b.id !== tgt.id);
  const excludeIds = new Set([src.id, tgt.id]);

  let waypoints;

  const exitHorz = exitDirection === "left" || exitDirection === "right";
  const entryHorz = entryDirection === "left" || entryDirection === "right";

  if (exitHorz && entryHorz) {
    let midX = (exitStubEnd.x + entryStubStart.x) / 2;
    midX = findClearVerticalChannel(midX, exitStubEnd.y, entryStubStart.y, boundsList, padding);
    waypoints = [
      exitPoint,
      exitStubEnd,
      { x: midX, y: exitStubEnd.y },
      { x: midX, y: entryStubStart.y },
      entryStubStart,
      entryPoint
    ];
  } else if (!exitHorz && entryHorz) {
    const midY = (exitStubEnd.y + entryStubStart.y) / 2;
    waypoints = [
      exitPoint,
      exitStubEnd,
      { x: exitStubEnd.x, y: entryStubStart.y },
      entryStubStart,
      entryPoint
    ];
  } else if (exitHorz && !entryHorz) {
    const midX = (exitStubEnd.x + entryStubStart.x) / 2;
    waypoints = [
      exitPoint,
      exitStubEnd,
      { x: midX, y: exitStubEnd.y },
      { x: midX, y: entryStubStart.y },
      entryStubStart,
      entryPoint
    ];
  } else {
    let midY = (exitStubEnd.y + entryStubStart.y) / 2;
    midY = findClearHorizontalChannel(midY, exitStubEnd.x, entryStubStart.x, boundsList, padding);
    waypoints = [
      exitPoint,
      exitStubEnd,
      { x: exitStubEnd.x, y: midY },
      { x: entryStubStart.x, y: midY },
      entryStubStart,
      entryPoint
    ];
  }

  for (let s = 0; s < waypoints.length - 1; s++) {
    const x1 = waypoints[s].x;
    const y1 = waypoints[s].y;
    const x2 = waypoints[s + 1].x;
    const y2 = waypoints[s + 1].y;
    for (const node of boundsList) {
      const b = node;
      if (!segmentIntersectsNode(x1, y1, x2, y2, b, padding, excludeIds)) continue;
      const vert = Math.abs(x2 - x1) < 1e-6;
      if (vert) {
        const shiftRight = b.right + padding + 4;
        const shiftLeft = b.left - padding - 4;
        const newX = Math.abs(shiftRight - x1) < Math.abs(shiftLeft - x1) ? shiftRight : shiftLeft;
        waypoints[s] = { ...waypoints[s], x: newX };
        waypoints[s + 1] = { ...waypoints[s + 1], x: newX };
      } else {
        const shiftDown = b.bottom + padding + 4;
        const shiftUp = b.top - padding - 4;
        const newY = Math.abs(shiftDown - y1) < Math.abs(shiftUp - y1) ? shiftDown : shiftUp;
        waypoints[s] = { ...waypoints[s], y: newY };
        waypoints[s + 1] = { ...waypoints[s + 1], y: newY };
      }
    }
  }

  return waypointsToSVGPath(waypoints, CORNER_R);
}

/** Convert waypoints to SVG path d with rounded corners (default 6px). */
export function orthogonalPathToD(waypoints, cornerR = ORTHO_CORNER_R) {
  return waypointsToSVGPath(waypoints || [], cornerR);
}

/** @deprecated Use computeOverviewLayout for overview; focus uses same positions. */
export function buildMatrixLayout(useCases, containerW = 1200) {
  return computeOverviewLayout(useCases, [], containerW);
}

export function layoutFocusBand(focusId, neighborhoodIds, matrixLayout) {
  return computeDrawerLayout(focusId, neighborhoodIds, matrixLayout);
}

export { DIVIDER_H };
export const FOCUS_HINT_H = DRAWER_HINT_H;
