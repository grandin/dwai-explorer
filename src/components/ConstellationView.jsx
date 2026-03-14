import React, { useEffect, useMemo, useRef, useState } from "react";
import ucData from "../../data/DwAI_UC_Data_v4.json";
import { useExplorer } from "../context/ExplorerContext";
import { computeOverviewLayout } from "../utils/constellationLayout";
import { WFSQ_PATHS } from "../utils/constellationData";
import { ConstellationOverview } from "./ConstellationOverview";
import { ConstellationFocus, focusCanvasHeight } from "./ConstellationFocus";
import { EdgeTooltip, ConstellationEdgeDefs } from "./ConstellationEdge";

const PHASES = ["Explore", "Define", "Concept", "Validate", "Deliver", "Improve"];

function normalizePhases(uc) {
  const parts = (uc.phase || "").split("/").map((p) => p.trim());
  return {
    ...uc,
    primaryPhase: parts[0],
    secondaryPhase: parts[1]
  };
}

export function ConstellationView() {
  const { setSelectedId } = useExplorer();
  const [focusId, setFocusId] = useState(null);
  const [edgeTip, setEdgeTip] = useState(null);
  const [edgeOpacity, setEdgeOpacity] = useState(1);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 1200, h: 700 });

  const allUseCases = useMemo(
    () => (ucData || []).map(normalizePhases).filter((uc) => PHASES.includes(uc.primaryPhase)),
    []
  );

  const matrixLayout = useMemo(
    () => computeOverviewLayout(allUseCases, WFSQ_PATHS, size.w),
    [allUseCases, size.w]
  );

  const containerWidth = size.w;
  const totalLayoutHeight = focusId
    ? focusCanvasHeight(matrixLayout, focusId)
    : matrixLayout.canvasH;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.floor(cr.width);
      const h = Math.floor(cr.height);
      if (w >= 32 && h >= 32) setSize({ w, h });
    });
    ro.observe(el);
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w >= 32 && h >= 32) setSize({ w, h });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && focusId) {
        setFocusId(null);
        setEdgeTip(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId]);

  const enterFocus = (id) => {
    setEdgeOpacity(0);
    setFocusId(id);
    requestAnimationFrame(() => {
      setTimeout(() => setEdgeOpacity(1), 320);
    });
  };

  const exitFocus = () => {
    setEdgeOpacity(0);
    setFocusId(null);
    setEdgeTip(null);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  const onEdgeHover = (tip) => {
    if (tip?.show) setEdgeTip(tip);
    else setEdgeTip(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative"
      }}
      className="flex flex-col bg-slate-950 min-h-0"
    >
      {edgeTip?.show && (
        <EdgeTooltip
          clientX={edgeTip.clientX}
          clientY={edgeTip.clientY}
          kind={edgeTip.kind}
          description={edgeTip.description}
          nameA={edgeTip.nameA}
          idA={edgeTip.idA}
          nameB={edgeTip.nameB}
          idB={edgeTip.idB}
          pathLabel={edgeTip.pathLabel}
          avoidRects={edgeTip.avoidRects}
          edgeMidpoint={edgeTip.edgeMidpoint}
        />
      )}
      <svg
          width={containerWidth}
          height={totalLayoutHeight}
          style={{ overflow: "visible", display: "block" }}
        >
          <defs>
            <ConstellationEdgeDefs />
          </defs>
          {!focusId ? (
            <ConstellationOverview
              matrixLayout={matrixLayout}
              containerWidth={containerWidth}
              onNodeClick={enterFocus}
              setSelectedId={setSelectedId}
            />
          ) : (
            <ConstellationFocus
              focusId={focusId}
              matrixLayout={matrixLayout}
              containerWidth={containerWidth}
              totalLayoutHeight={totalLayoutHeight}
              onNodeClick={enterFocus}
              onExitFocus={exitFocus}
              setSelectedId={setSelectedId}
              edgeOpacity={edgeOpacity}
              onEdgeHover={onEdgeHover}
            />
          )}
        </svg>
    </div>
  );
}
