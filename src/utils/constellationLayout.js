/**
 * Constellation layout: X = phase (6 bands), Y = attestation maturity (4 bands).
 * Grid within each (phase × attestation) cell; sort by arrangement level (1→5).
 */

const PHASES = ["Explore", "Define", "Concept", "Validate", "Deliver", "Improve"];
const ATTESTATION_BANDS = ["Established", "Developing", "Emerging", "Speculative"];

const PADDING = 48;
const BAND_GAP = 8;
const LEFT_ATTEST_LABEL_W = 96;
const TOP_PHASE_H = 32;
const ATTESTATION_BAND_GAP = 40;
const NODE_W = 150;
const NODE_H = 52;
const CELL_GAP_X = 12;
const CELL_GAP_Y = 10;
const CELL_PAD = 8;
const EMPTY_BAND_H = 60;

function normalizeAttestation(uc) {
  const L = (uc.attestation?.level || "").trim();
  const key = L.toLowerCase();
  if (key === "established") return "Established";
  if (key === "developing") return "Developing";
  if (key === "emerging") return "Emerging";
  if (key === "speculative") return "Speculative";
  return "Emerging";
}

export function buildConstellationLayout(useCases) {
  const byPhaseAttest = {};
  PHASES.forEach((p) => {
    byPhaseAttest[p] = {};
    ATTESTATION_BANDS.forEach((a) => {
      byPhaseAttest[p][a] = [];
    });
  });

  useCases.forEach((uc) => {
    const phase = uc.primaryPhase || uc.phase?.split("/")[0]?.trim();
    if (!byPhaseAttest[phase]) return;
    const a = normalizeAttestation(uc);
    byPhaseAttest[phase][a].push(uc);
  });

  const numPhases = PHASES.length;
  const minCanvasW = 1280;
  const bandInnerW = Math.max(
    NODE_W + 2 * CELL_PAD,
    (minCanvasW - 2 * PADDING - LEFT_ATTEST_LABEL_W - (numPhases - 1) * BAND_GAP) /
      numPhases
  );
  const canvasWidth =
    PADDING + LEFT_ATTEST_LABEL_W + numPhases * bandInnerW + (numPhases - 1) * BAND_GAP + PADDING;

  const nodes = [];
  const nodeById = {};
  const attestationBands = [];
  let y = PADDING + TOP_PHASE_H;

  ATTESTATION_BANDS.forEach((attestName) => {
    const bandTop = y;
    let bandTotalNodes = 0;
    PHASES.forEach((phase) => {
      bandTotalNodes += byPhaseAttest[phase][attestName].length;
    });

    const empty = bandTotalNodes === 0;
    let maxCellH = empty ? EMPTY_BAND_H : CELL_PAD * 2;

    if (!empty) {
      PHASES.forEach((phase, phaseIndex) => {
        const bandLeft =
          PADDING + LEFT_ATTEST_LABEL_W + phaseIndex * (bandInnerW + BAND_GAP);
        const list = byPhaseAttest[phase][attestName].slice().sort((a, b) => {
          const la = a.arrangement?.level ?? 99;
          const lb = b.arrangement?.level ?? 99;
          if (la !== lb) return la - lb;
          return a.id.localeCompare(b.id);
        });
        const innerW = bandInnerW - 2 * CELL_PAD;
        const colW = NODE_W + CELL_GAP_X;
        const ncols = Math.max(1, Math.floor((innerW + CELL_GAP_X) / colW));
        const rows = Math.ceil(list.length / ncols);
        const gridH = rows * (NODE_H + CELL_GAP_Y) - CELL_GAP_Y;
        maxCellH = Math.max(maxCellH, gridH + 2 * CELL_PAD);

        list.forEach((uc, i) => {
          const col = i % ncols;
          const row = Math.floor(i / ncols);
          const x =
            bandLeft + CELL_PAD + col * (NODE_W + CELL_GAP_X) + NODE_W / 2;
          const yy =
            bandTop + CELL_PAD + row * (NODE_H + CELL_GAP_Y) + NODE_H / 2;
          const node = {
            id: uc.id,
            x,
            y: yy,
            phase,
            attestation: attestName,
            uc,
            secondaryPhase: uc.secondaryPhase
          };
          nodes.push(node);
          nodeById[uc.id] = node;
        });
      });
    }

    const bandH = maxCellH;
    const bandBottom = bandTop + bandH;
    attestationBands.push({
      name: attestName,
      y0: bandTop,
      y1: bandBottom,
      labelY: bandTop + 16,
      count: bandTotalNodes,
      empty
    });
    y = bandBottom + ATTESTATION_BAND_GAP;
  });

  const canvasHeight = Math.max(720, y + PADDING);
  return {
    nodes,
    nodeById,
    attestationBands,
    canvasWidth,
    canvasHeight,
    bandInnerW,
    bandGap: BAND_GAP,
    padding: PADDING,
    leftAttestLabelW: LEFT_ATTEST_LABEL_W,
    topPhaseH: TOP_PHASE_H,
    phases: PHASES,
    attestationBandNames: ATTESTATION_BANDS
  };
}

export { PHASES, NODE_W, NODE_H };
