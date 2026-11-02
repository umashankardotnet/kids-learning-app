import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { readTime, say, sfxRight, sfxTap, sfxTryAgain } from '../lib/audio';
import { useApp } from '../lib/store';
import type { Activity, Prompt } from '../types';
import type { ActivityProps } from './types';

const PROMPT: Prompt = { en: 'Pop all these balloons!', hi: 'ऐसे सारे गुब्बारे फोड़ो!' };
const COLORS = ['#ff7eb6', '#74b9ff', '#ffd32a', '#55efc4', '#fd9644', '#a29bfe'];

export function Pop({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'pop' }>>) {
  const { lang } = useApp();
  const balloons = useMemo(() => activity.balloons.map((text, id) => ({ text, id })).sort(() => Math.random() - 0.5), [activity]);
  const [popped, setPopped] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const total = balloons.filter((b) => b.text === activity.target).length;

  useEffect(() => void say([{ prompt: PROMPT }, ...activity.speech]), [activity]);

  const tap = (balloon: { text: string; id: number }) => {
    if (balloon.text !== activity.target) {
      sfxTryAgain();
      setShake(balloon.id);
      setMistakes((m) => m + 1);
      void say(activity.speech);
      return;
    }
    setShake(null);
    const next = [...popped, balloon.id];
    setPopped(next);
    if (next.length < total) return sfxTap();
    sfxRight();
    setTimeout(() => onDone(mistakes === 0), readTime(500));
  };

  return (
    <div className="activity pop">
      <button className="prompt" onClick={() => void say(activity.speech)}>🔊 {PROMPT[lang]}</button>
      <div className="focus">{activity.target}</div>
      <div className="balloons">
        <AnimatePresence>
          {balloons.filter((b) => !popped.includes(b.id)).map((balloon, i) => (
            <motion.button
              key={balloon.id}
              className="balloon"
              data-right={balloon.text === activity.target}
              style={{ background: COLORS[balloon.id % COLORS.length] }}
              onClick={() => tap(balloon)}
              exit={{ scale: 1.6, opacity: 0, transition: { duration: 0.2, repeat: 0 } }}
              animate={shake === balloon.id ? { x: [0, -7, 7, -7, 0] } : { y: [0, -6, 0] }}
              transition={shake === balloon.id ? { duration: 0.3 } : { duration: 2 + (i % 3) * 0.4, repeat: Infinity }}
            >
              {balloon.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
