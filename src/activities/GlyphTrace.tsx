import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { readTime, say, sfxRight } from '../lib/audio';
import { coverage, markCovered, type Point } from '../lib/trace';
import type { Activity } from '../types';
import type { ActivityProps } from './types';

const PROMPT = { en: 'Trace the letter with your finger.', hi: 'उँगली से अक्षर पर चलो।' };
const WIDTH = 300;
const HEIGHT = 330;
/** Finger reach in canvas units. Hindi letters have thick, close strokes. */
const REACH = 24;
const GLYPH_DONE = 0.8;
const GRID = 6;

/** Traces any letter from its font shape, for scripts without stroke paths. */
export function GlyphTrace({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'trace' }>>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const samples = useRef<Point[]>([]);
  const covered = useRef<boolean[]>([]);
  const last = useRef<Point | null>(null);
  const finished = useRef(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => void say([{ prompt: PROMPT }]), [activity]);

  const drawLetter = (context: CanvasRenderingContext2D, color: string) => {
    let size = 230;
    context.font = `700 ${size}px "Baloo 2"`;
    const width = context.measureText(activity.letter).width;
    if (width > WIDTH - 30) size = Math.floor((size * (WIDTH - 30)) / width);
    context.font = `700 ${size}px "Baloo 2"`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    context.fillText(activity.letter, WIDTH / 2, HEIGHT / 2);
  };

  useEffect(() => {
    let alive = true;
    void document.fonts.load('700 230px "Baloo 2"', activity.letter).then(() => {
      const context = canvas.current?.getContext('2d', { willReadFrequently: true });
      if (!alive || !context) return;
      context.clearRect(0, 0, WIDTH, HEIGHT);
      drawLetter(context, '#000');
      const { data } = context.getImageData(0, 0, WIDTH, HEIGHT);
      const points: Point[] = [];
      for (let y = 0; y < HEIGHT; y += GRID) {
        for (let x = 0; x < WIDTH; x += GRID) {
          if (data[(y * WIDTH + x) * 4 + 3] > 128) points.push({ x, y });
        }
      }
      samples.current = points;
      covered.current = points.map(() => false);
      context.clearRect(0, 0, WIDTH, HEIGHT);
      drawLetter(context, '#ffe28a');
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity]);

  const toCanvas = (event: PointerEvent): Point => {
    const box = canvas.current!.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * WIDTH, y: ((event.clientY - box.top) / box.height) * HEIGHT };
  };

  const record = (point: Point) => {
    if (finished.current || samples.current.length === 0) return;
    const context = canvas.current?.getContext('2d');
    if (context && last.current) {
      context.strokeStyle = '#6c5ce7';
      context.lineWidth = 14;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(last.current.x, last.current.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }
    last.current = point;
    covered.current = markCovered(samples.current, covered.current, point, REACH);
    const done = coverage(covered.current);
    setProgress(done);
    if (done < GLYPH_DONE) return;
    finished.current = true;
    if (context) {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      drawLetter(context, '#00b894');
    }
    sfxRight();
    setTimeout(() => onDone(true), readTime(1000));
  };

  return (
    <div className="activity trace">
      <button className="prompt" onClick={() => void say([{ prompt: PROMPT }])}>🔊 ✏️ {activity.letter}</button>
      <canvas
        ref={canvas}
        className="trace-pad glyph"
        width={WIDTH}
        height={HEIGHT}
        data-letter={activity.letter}
        aria-label={`Trace ${activity.letter}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = toCanvas(e);
          record(last.current);
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'touch') {
            if (last.current) record(toCanvas(e));
          }
        }}
        onPointerUp={() => {
          last.current = null;
        }}
      />
      <div className="trace-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, (progress / GLYPH_DONE) * 100)}%` }} /></div>
    </div>
  );
}
