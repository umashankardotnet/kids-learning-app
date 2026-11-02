import { motion } from 'motion/react';
import type { Mouth } from '../types';

const SHAPES: Record<Mouth, { rx: number; ry: number; teeth?: boolean; tongue?: boolean }> = {
  open: { rx: 24, ry: 20 },
  round: { rx: 13, ry: 15 },
  smile: { rx: 30, ry: 8, teeth: true },
  teeth: { rx: 26, ry: 10, teeth: true },
  tongue: { rx: 22, ry: 13, teeth: true, tongue: true },
  lips: { rx: 26, ry: 2 },
};

/** A big animated mouth showing how to shape the sound. */
export function MouthGuide({ mouth }: { mouth: Mouth }) {
  const shape = SHAPES[mouth];
  return (
    <motion.svg viewBox="0 0 100 80" className="mouth-guide" role="img" aria-label={`Mouth shape: ${mouth}`}>
      <circle cx="50" cy="40" r="38" fill="#ffd9b3" />
      <motion.g animate={{ scale: [0.75, 1, 0.75] }} transition={{ duration: 1.3, repeat: Infinity }} style={{ originX: '50px', originY: '50px' }}>
        <ellipse cx="50" cy="50" rx={shape.rx + 4} ry={shape.ry + 4} fill="#e8505b" />
        <ellipse cx="50" cy="50" rx={shape.rx} ry={shape.ry} fill="#6d1a2b" />
        {shape.teeth && <rect x={50 - shape.rx * 0.75} y={50 - shape.ry} width={shape.rx * 1.5} height={Math.max(4, shape.ry * 0.7)} rx="2" fill="#fff" />}
        {shape.tongue && <ellipse cx="50" cy="54" rx={shape.rx * 0.6} ry="6" fill="#ff8fa3" />}
      </motion.g>
    </motion.svg>
  );
}
