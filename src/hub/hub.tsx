import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { HubMove } from './hub-scene';
const Scene = lazy(() => import('./hub-scene'));
export function Hub({ move = 'idle', className = '' }: { move?: HubMove; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState<{ color: string; eyes: string } | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return;
    const css = getComputedStyle(ref.current);
    setColors({ color: css.getPropertyValue('--hub-material').trim(), eyes: css.getPropertyValue('--hub-eyes').trim() });
  }, []);
  return <div ref={ref} className={`hub-character ${className}`}><Suspense fallback={<div className="hub-fallback"><i /><i /></div>}>{colors && <Scene move={move} color={colors.color} eyes={colors.eyes} reduced={Boolean(reduced)} />}</Suspense></div>;
}