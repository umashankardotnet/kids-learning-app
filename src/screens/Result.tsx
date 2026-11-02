import { useEffect } from 'react';
import { motion } from 'motion/react';
import { say } from '../lib/audio';
import { useApp } from '../lib/store';
import { Confetti } from '../components/Confetti';
import { Mascot } from '../components/Mascot';

interface Props {
  stars?: number;
  sticker?: string;
  onNext: () => void;
}

const WELL_DONE = { en: 'Well done!', hi: 'शाबाश!' };
const SUPERSTAR = { en: 'Superstar!', hi: 'तुम तो सुपरस्टार हो!' };
const KEEP_GOING = { en: 'Great work! Keep going!', hi: 'बहुत बढ़िया! ऐसे ही आगे बढ़ो!' };

export function Result({ stars, sticker, onNext }: Props) {
  const { lang } = useApp();
  const message = stars === undefined ? WELL_DONE : stars === 3 ? SUPERSTAR : KEEP_GOING;
  useEffect(() => void say([{ prompt: message }]), [message]);

  return (
    <div className="screen result">
      <Confetti />
      <Mascot size={130} cheer message={message[lang]} />
      {stars !== undefined && (
        <div className="result-stars" aria-label={`${stars} stars`}>
          {[1, 2, 3].map((n) => (
            <motion.span key={n} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: n * 0.25, type: 'spring', bounce: 0.6 }} className={n > stars ? 'faded' : ''}>
              ⭐
            </motion.span>
          ))}
        </div>
      )}
      {sticker && (
        <motion.div className="sticker won" initial={{ rotate: -30, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 1, type: 'spring' }}>
          {sticker}
        </motion.div>
      )}
      <button className="go" onClick={onNext} aria-label="Continue">➡️</button>
    </div>
  );
}
