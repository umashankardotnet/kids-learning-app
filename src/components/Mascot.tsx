import { motion } from 'motion/react';

interface Props {
  size?: number;
  message?: string;
  cheer?: boolean;
}

/** Gappu the baby elephant, the guide who appears on every screen. */
export function Mascot({ size = 96, message, cheer }: Props) {
  return (
    <div className="mascot">
      <motion.svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        role="img"
        aria-label="Gappu the elephant"
        animate={cheer ? { y: [0, -18, 0], rotate: [0, -6, 6, 0] } : { y: [0, -4, 0] }}
        transition={{ duration: cheer ? 0.7 : 2.4, repeat: cheer ? 2 : Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="60" cy="108" rx="30" ry="6" fill="#000" opacity="0.08" />
        <circle cx="20" cy="50" r="19" fill="#a9bde0" />
        <circle cx="20" cy="50" r="11" fill="#f7b6c2" />
        <circle cx="100" cy="50" r="19" fill="#a9bde0" />
        <circle cx="100" cy="50" r="11" fill="#f7b6c2" />
        <ellipse cx="60" cy="86" rx="28" ry="22" fill="#8fa8d4" />
        <circle cx="60" cy="50" r="34" fill="#9fb4dc" />
        <circle cx="46" cy="44" r="6" fill="#2d3047" />
        <circle cx="74" cy="44" r="6" fill="#2d3047" />
        <circle cx="48" cy="42" r="2" fill="#fff" />
        <circle cx="76" cy="42" r="2" fill="#fff" />
        <circle cx="36" cy="56" r="5" fill="#f7b6c2" opacity="0.7" />
        <circle cx="84" cy="56" r="5" fill="#f7b6c2" opacity="0.7" />
        <path d="M60 54 C60 76 54 84 68 92" fill="none" stroke="#9fb4dc" strokeWidth="11" strokeLinecap="round" />
        <path d="M46 16 L60 2 L74 16 Z" fill="#fd9644" />
        <circle cx="60" cy="3" r="4" fill="#ffd32a" />
      </motion.svg>
      {message && (
        <motion.div className="bubble" key={message} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {message}
        </motion.div>
      )}
    </div>
  );
}
