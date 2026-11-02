import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { readTime, say, sfxRight, sfxTryAgain } from '../lib/audio';
import { useApp } from '../lib/store';
import type { Activity, PickOption } from '../types';
import type { ActivityProps } from './types';

export function Pick({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'pick' }>>) {
  const { lang } = useApp();
  const options = useMemo(() => [...activity.options].sort(() => Math.random() - 0.5), [activity]);
  const [wrong, setWrong] = useState<PickOption[]>([]);
  const [solved, setSolved] = useState(false);

  useEffect(() => void say(activity.prompt), [activity]);

  const choose = (option: PickOption) => {
    if (solved) return;
    if (option.correct) {
      setSolved(true);
      sfxRight();
      setTimeout(() => onDone(wrong.length === 0), readTime(900));
    } else {
      sfxTryAgain();
      setWrong((w) => [...w, option]);
      void say(activity.prompt);
    }
  };

  const showHint = wrong.length >= 1;

  return (
    <div className="activity pick">
      <button className="prompt" onClick={() => void say(activity.prompt)}>
        🔊 {activity.visiblePrompt[lang]}
      </button>
      {activity.focus && <div className={`focus ${activity.focus.length > 6 ? 'long' : ''}`}>{activity.focus}</div>}
      <button className="hear" onClick={() => void say(activity.prompt.slice(1))} aria-label="Hear it again">🔊</button>
      <div className="options">
        {options.map((option, i) => {
          const isWrong = wrong.includes(option);
          return (
            <motion.button
              key={i}
              className={`option ${solved && option.correct ? 'right' : ''} ${isWrong ? 'dim' : ''} ${showHint && option.correct && !solved ? 'hint' : ''}`}
              onClick={() => choose(option)}
              whileTap={{ scale: 0.92 }}
              animate={isWrong ? { x: [0, -8, 8, -8, 0] } : solved && option.correct ? { scale: [1, 1.15, 1] } : {}}
              disabled={isWrong}
            >
              {option.emoji && <span className="option-emoji">{option.emoji}</span>}
              {option.label && <span className={option.emoji ? 'option-small' : 'option-big'}>{option.label}</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
