import { useMemo } from 'react';
import { motion } from 'motion/react';

const PIECES = ['⭐', '🎉', '🌟', '💛', '🎈', '✨'];

export function Confetti({ count = 24 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: PIECES[i % PIECES.length],
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        spin: (Math.random() - 0.5) * 540,
      })),
    [count],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          style={{ left: `${p.left}%` }}
          initial={{ y: -40, opacity: 1, rotate: 0 }}
          animate={{ y: '105vh', opacity: [1, 1, 0], rotate: p.spin }}
          transition={{ duration: 1.8, delay: p.delay, ease: 'easeIn' }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}
