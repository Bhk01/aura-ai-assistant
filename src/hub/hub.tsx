import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { HubMove } from "./hub-scene";
const Scene = lazy(() => import("./hub-scene"));
export function Hub({ move = "idle", className = "" }: { move?: HubMove; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [colors, setColors] = useState<{ color: string; eyes: string } | null>(null);
  const [reaction, setReaction] = useState<HubMove | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return;
    const css = getComputedStyle(ref.current);
    setColors({
      color: css.getPropertyValue("--hub-material").trim(),
      eyes: css.getPropertyValue("--hub-eyes").trim(),
    });
  }, []);
  useEffect(
    () => () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (move !== "idle") {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      reactionTimer.current = null;
      setReaction(null);
    }
  }, [move]);

  function reactToTap() {
    if (move !== "idle") return;
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setReaction("celebrate");
    reactionTimer.current = setTimeout(() => {
      setReaction(null);
      reactionTimer.current = null;
    }, 1800);
  }

  return (
    <div
      ref={ref}
      className={`hub-character cursor-pointer ${className}`}
      onClick={reactToTap}
    >
      <Suspense
        fallback={
          <div className="hub-fallback">
            <i />
            <i />
          </div>
        }
      >
        {colors && (
          <Scene
            move={reaction ?? move}
            color={colors.color}
            eyes={colors.eyes}
            reduced={Boolean(reduced)}
          />
        )}
      </Suspense>
    </div>
  );
}
