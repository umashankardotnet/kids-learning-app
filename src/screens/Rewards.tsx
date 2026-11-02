import { motion } from 'motion/react';
import { subjects } from '../data/course';
import { useApp } from '../lib/store';

export function Rewards({ onBack }: { onBack: () => void }) {
  const { tests } = useApp();
  return (
    <div className="screen rewards">
      <header className="top-bar">
        <button className="round" onClick={onBack} aria-label="Go back">🏠</button>
        <h2>My Stickers</h2>
      </header>
      <div className="sticker-grid">
        {subjects.flatMap((s) => s.modules).map((mod) => {
          const won = Boolean(tests[mod.id]);
          return (
            <motion.div key={mod.id} className={`sticker ${won ? 'won' : ''}`} whileHover={won ? { scale: 1.1, rotate: 4 } : {}}>
              {won ? mod.sticker : '❔'}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
