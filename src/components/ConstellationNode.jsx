import React from "react";
import { NODE_W, estimateCardHeight } from "../utils/constellationLayout";

const PHASE_STROKE = {
  Explore: "#38bdf8",
  Define: "#22c55e",
  Concept: "#a855f7",
  Validate: "#f97316",
  Deliver: "#eab308",
  Improve: "#ec4899"
};

const ROLE_ABBR = {
  Director: "DIR",
  "Co-creator": "COC",
  Challenger: "CHL",
  Approver: "APP",
  Auditor: "AUD"
};

const ATTEST_BADGE = {
  Established: { t: "Est", bg: "rgba(34,197,94,0.2)" },
  Developing: { t: "Dev", bg: "rgba(59,130,246,0.2)" },
  Emerging: { t: "Emr", bg: "rgba(234,179,8,0.22)" },
  Speculative: { t: "Spc", bg: "rgba(148,163,184,0.25)" }
};

function displayName(name) {
  return (name || "").replace(/\s*SUMMARY VIEW[\s\S]*$/i, "").trim();
}

function borderStyle(level) {
  const L = level ?? 2;
  if (L <= 1) return { w: 3, dash: null };
  if (L === 2) return { w: 2.5, dash: null };
  if (L === 3) return { w: 2, dash: null };
  if (L === 4) return { w: 1.5, dash: "6 4" };
  return { w: 1, dash: "2 4" };
}

export function ConstellationNode({
  uc,
  x,
  y,
  phase,
  attestation,
  dimmed = false,
  overviewHoverDim = false,
  active = false,
  scale = 1,
  cardHeight,
  onClick,
  onMouseEnter,
  onMouseLeave,
  tabIndex = -1
}) {
  const phaseColor = PHASE_STROKE[phase] || "#64748b";
  const level = uc.arrangement?.level ?? 2;
  const b = borderStyle(level);
  const role = ROLE_ABBR[uc.arrangement?.role] || "—";
  const badge = ATTEST_BADGE[attestation] || ATTEST_BADGE.Emerging;
  const name = displayName(uc.name);
  const h =
    cardHeight != null
      ? cardHeight
      : Math.round(estimateCardHeight(uc) * scale);
  const hw = NODE_W / 2;
  const hh = h / 2;
  const opacity = dimmed ? 0.3 : overviewHoverDim ? 0.5 : 1;
  const ringPad = 6;
  const ringW = NODE_W * scale + ringPad * 2;
  const ringH = h + ringPad * 2;

  return (
    <g
      transform={`translate(${x},${y}) scale(${scale})`}
      opacity={opacity}
      style={{
        filter: dimmed ? "saturate(0.7)" : undefined,
        transition: overviewHoverDim
          ? "opacity 0.25s ease-out, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
          : "opacity 0.3s ease-in, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: "auto",
        cursor: "pointer"
      }}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(uc.id);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      tabIndex={tabIndex}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(uc.id);
        }
      }}
    >
      {active && (
        <rect
          x={-hw - ringPad / scale}
          y={-hh - ringPad / scale}
          width={ringW / scale}
          height={ringH / scale}
          rx={8}
          fill="none"
          stroke="#f8fafc"
          strokeWidth={2 / scale}
          className="pointer-events-none"
          style={{
            filter: "drop-shadow(0 0 10px rgba(248,250,252,0.35))"
          }}
        />
      )}
      <foreignObject
        x={-hw}
        y={-hh}
        width={NODE_W}
        height={h}
        className="overflow-visible"
        style={{ pointerEvents: "auto", overflow: "visible" }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className="box-border flex w-full min-h-[52px] flex-col rounded-md border bg-slate-800 shadow-md"
          style={{
            minHeight: 52,
            borderLeftWidth: 4,
            borderLeftColor: phaseColor,
            borderTopWidth: b.w,
            borderRightWidth: b.w,
            borderBottomWidth: b.w,
            borderTopColor: phaseColor,
            borderRightColor: phaseColor,
            borderBottomColor: phaseColor,
            borderStyle: b.dash ? "dashed" : "solid",
            borderTopStyle: b.dash ? "dashed" : "solid",
            borderRightStyle: b.dash ? "dashed" : "solid",
            borderBottomStyle: b.dash ? "dashed" : "solid",
            pointerEvents: "auto",
            cursor: "pointer"
          }}
        >
          <div
            className="pointer-events-none absolute right-1 top-1 rounded px-1 py-0.5 text-[9px] font-bold leading-none text-slate-900"
            style={{ background: badge.bg }}
          >
            {badge.t}
          </div>
          <div className="flex flex-col justify-center px-2 py-1.5 pr-7">
            <div className="text-[10px] font-medium leading-tight text-slate-400">
              {uc.id} {role}
            </div>
            <div className="mt-0.5 text-[13px] font-semibold leading-snug text-slate-100 break-words">
              {name}
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
}
