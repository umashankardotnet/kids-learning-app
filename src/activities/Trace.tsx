import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { STROKES } from '../data/strokes';
import { readTime, say, sfxRight, sfxTap } from '../lib/audio';
import { coverage, markCovered, STROKE_DONE, type Point } from '../lib/trace';
import type { Activity } from '../types';
import type { ActivityProps } from './types';

const PROMPT = { en: 'Follow the dot with your finger.', hi: 'उँगली से बिंदु के पीछे चलो।' };

export function Trace({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'trace' }>>) {
  const strokes = STROKES[activity.letter];
  const svg = useRef<SVGSVGElement>(null);
  const activePath = useRef<SVGPathElement>(null);
  const samples = useRef<Point[]>([]);
  const covered = useRef<boolean[]>([]);
  const drawing = useRef(false);
  const [stroke, setStroke] = useState(0);
  const [ink, setInk] = useState<Point[][]>([]);

  useEffect(() => void say([{ prompt: PROMPT }]), [activity]);

  useLayoutEffect(() => {
    const path = activePath.current;
    if (!path) return;
    const length = path.getTotalLength();
    const count = Math.max(3, Math.ceil(length / 3));
    samples.current = Array.from({ length: count + 1 }, (_, i) => {
      const p = path.getPointAtLength((length * i) / count);
      return { x: p.x, y: p.y };
    });
    covered.current = samples.current.map(() => false);
  }, [stroke, activity]);

  const toGrid = (event: PointerEvent): Point => {
    const matrix = svg.current?.getScreenCTM()?.inverse();
    if (!matrix) return { x: 0, y: 0 };
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    return { x: p.x, y: p.y };
  };

  const record = (point: Point) => {
    covered.current = markCovered(samples.current, covered.current, point);
    setInk((lines) => [...lines.slice(0, -1), [...(lines[lines.length - 1] ?? []), point]]);
    if (coverage(covered.current) < STROKE_DONE) return;
    drawing.current = false;
    if (stroke + 1 < strokes.length) {
      sfxTap();
      setStroke(stroke + 1);
    } else {
      sfxRight();
      setStroke(strokes.length);
      setTimeout(() => onDone(true), readTime(1000));
    }
  };

  const finished = stroke >= strokes.length;
  const pathFor = (d: string, className: string, key: number) => <path key={key} d={d} className={className} />;

  return (
    <div className="activity trace">
      <button className="prompt" onClick={() => void say([{ prompt: PROMPT }])}>🔊 ✏️ {activity.letter}</button>
      <svg
        ref={svg}
        className={`trace-pad ${finished ? 'finished' : ''}`}
        viewBox="0 0 100 110"
        data-letter={activity.letter}
        data-stroke={stroke}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          setInk((lines) => [...lines, []]);
          record(toGrid(e));
        }}
        onPointerMove={(e) => {
          if (drawing.current) record(toGrid(e));
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
      >
        <line x1="4" x2="96" y1="15" y2="15" className="guide-line" />
        <line x1="4" x2="96" y1="40" y2="40" className="guide-line" />
        <line x1="4" x2="96" y1="80" y2="80" className="guide-line base" />
        {strokes.map((d, i) => pathFor(d, 'track', i))}
        {strokes.slice(0, stroke).map((d, i) => pathFor(d, 'stroke-done', i))}
        {ink.map((line, i) => (
          <polyline key={i} points={line.map((p) => `${p.x},${p.y}`).join(' ')} className="ink" />
        ))}
        {!finished && (
          <>
            <path ref={activePath} d={strokes[stroke]} className="active" />
            <circle r="5" className="guide-dot">
              <animateMotion dur="2.4s" repeatCount="indefinite" path={strokes[stroke]} />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}
