import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { readTime, say, sfxRight, sfxTap, sfxTryAgain } from '../lib/audio';
import { useApp } from '../lib/store';
import type { Activity } from '../types';
import type { ActivityProps } from './types';

const PROMPT = { en: 'Tap the pieces in the right order.', hi: 'टुकड़ों को सही क्रम में दबाओ।' };

export function Spell({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'spell' }>>) {
  const { lang } = useApp();
  const tiles = useMemo(
    () => [...activity.parts, ...activity.extras].map((text, id) => ({ text, id })).sort(() => Math.random() - 0.5),
    [activity],
  );
  const [used, setUsed] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const placed = used.length;
  const solved = placed === activity.parts.length;

  useEffect(() => void say(activity.speech), [activity]);

  const tap = (tile: { text: string; id: number }) => {
    if (solved || used.includes(tile.id)) return;
    if (tile.text !== activity.parts[placed]) {
      sfxTryAgain();
      setShake(tile.id);
      setMistakes((m) => m + 1);
      return;
    }
    setShake(null);
    const next = [...used, tile.id];
    setUsed(next);
    if (next.length === activity.parts.length) {
      sfxRight();
      void say(activity.speech).then(() => setTimeout(() => onDone(mistakes === 0), readTime(600)));
    } else {
      sfxTap();
    }
  };

  return (
    <div className="activity spell">
      <button className="prompt" onClick={() => void say(activity.speech)}>🔊 {PROMPT[lang]}</button>
      {activity.emoji && <span className="big-emoji small">{activity.emoji}</span>}
      <div className={`slots ${activity.joinWithSpace ? 'sentence' : ''}`}>
        {activity.parts.map((part, i) => (
          <span key={i} className={`slot ${i < placed ? 'filled' : ''}`}>{i < placed ? part : ''}</span>
        ))}
      </div>
      <div className="tiles">
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            className={`tile ${used.includes(tile.id) ? 'gone' : ''} ${mistakes >= 2 && tile.text === activity.parts[placed] ? 'hint' : ''}`}
            onClick={() => tap(tile)}
            whileTap={{ scale: 0.9 }}
            animate={shake === tile.id ? { x: [0, -7, 7, -7, 0] } : {}}
            data-text={tile.text}
          >
            {tile.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
