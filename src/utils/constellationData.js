/**
 * Pre-computed graph data for Constellation View.
 * WfSq: pairwise edges from path sequences, deduped by source|target|pathId.
 * EnDe: enablement edges as-is.
 */
import endeJson from "../../data/DwAI_UC_EnDe.json";
import wfsqJson from "../../data/DwAI_UC_WfSq.json";

/** Raw WfSq paths for overview connectivity layout (12 paths). */
export const WFSQ_PATHS = (wfsqJson || []).map((p) => ({
  path_id: p.path_id,
  label: p.label || "",
  sequence: Array.isArray(p.sequence) ? p.sequence : []
}));

function dedupeWfSqEdges() {
  const seen = new Set();
  const edges = [];
  (wfsqJson || []).forEach((path) => {
    const seq = path.sequence || [];
    const pathId = path.path_id;
    const pathLabel = path.label || "";
    for (let i = 0; i < seq.length - 1; i++) {
      const source = seq[i];
      const target = seq[i + 1];
      const key = `${source}|${target}|${pathId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        source,
        target,
        pathId,
        pathLabel,
        description: pathLabel
      });
    }
  });
  return edges;
}

function buildAdjacency(wfsqEdges, endeEdges) {
  const wfSqNeighbors = new Map();
  const enDeNeighbors = new Map();
  const add = (map, a, b) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a).add(b);
  };
  wfsqEdges.forEach((e) => {
    add(wfSqNeighbors, e.source, e.target);
    add(wfSqNeighbors, e.target, e.source);
  });
  endeEdges.forEach((e) => {
    add(enDeNeighbors, e.source, e.target);
    add(enDeNeighbors, e.target, e.source);
  });
  return { wfSqNeighbors, enDeNeighbors };
}

export const WFSQ_EDGES = dedupeWfSqEdges();

export const ENDE_EDGES = (endeJson || []).map((e) => ({
  source: e.from,
  target: e.to,
  label: e.label || "",
  type: "Enablement dependency"
}));

const { wfSqNeighbors, enDeNeighbors } = buildAdjacency(WFSQ_EDGES, ENDE_EDGES);

export function getWfSqNeighbors(id) {
  return wfSqNeighbors.get(id) || new Set();
}

export function getEnDeNeighbors(id) {
  return enDeNeighbors.get(id) || new Set();
}

/** Union of WfSq + EnDe neighbors (undirected membership). */
export function focusNeighborhood(id) {
  const s = new Set([id]);
  getWfSqNeighbors(id).forEach((n) => s.add(n));
  getEnDeNeighbors(id).forEach((n) => s.add(n));
  return s;
}

/** WfSq edges incident to node (for overview hover ghost). */
export function wfsqEdgesForNode(nodeId) {
  return WFSQ_EDGES.filter(
    (e) => e.source === nodeId || e.target === nodeId
  );
}

/** EnDe + WfSq edges with both endpoints in neighborhood (focus mode). */
export function edgesInFocusSet(nodeIds) {
  const set = new Set(nodeIds);
  const ende = ENDE_EDGES.filter(
    (e) => set.has(e.source) && set.has(e.target)
  );
  const wf = WFSQ_EDGES.filter(
    (e) => set.has(e.source) && set.has(e.target)
  );
  return { ende, wf };
}

/** Path indices that contain this node (for overview full-path hover). */
export function getPathsContainingNode(nodeId) {
  const pathIds = new Set();
  WFSQ_PATHS.forEach((path, idx) => {
    if (path.sequence.includes(nodeId)) pathIds.add(path.path_id);
  });
  return pathIds;
}

/** All node IDs that appear in any of the given path IDs. */
export function getNodeIdsInPaths(pathIds) {
  const set = new Set();
  const ids = new Set(pathIds);
  WFSQ_PATHS.forEach((path) => {
    if (ids.has(path.path_id)) path.sequence.forEach((id) => set.add(id));
  });
  return set;
}

/** All WfSq edges that belong to any of the given path IDs (for ghost drawing). */
export function getEdgesInPaths(pathIds) {
  const ids = new Set(pathIds);
  return WFSQ_EDGES.filter((e) => ids.has(e.pathId));
}
