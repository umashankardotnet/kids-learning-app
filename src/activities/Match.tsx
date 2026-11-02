import { useEffect, useMemo, useState } from 'react';
import { readTime, say, sfxRight, sfxTap, sfxTryAgain } from '../lib/audio';
import { useApp } from '../lib/store';
import type { Activity, Prompt } from '../types';
import type { ActivityProps } from './types';

const PROMPT: Prompt = { en: 'Tap a word, then its picture.', hi: 'पहले शब्द दबाओ, फिर उसकी तस्वीर।' };

export function Match({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'match' }>>) {
  const { lang } = useApp();
  const left = useMemo(() => [...activity.pairs].sort(() => Math.random() - 0.5), [activity]);
  const right = useMemo(() => [...activity.pairs].sort(() => Math.random() - 0.5), [activity]);
  const [selected, setSelected] = useState<string | null>(null);
  const [joined, setJoined] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => void say([{ prompt: PROMPT }]), [activity]);

  const choose = (text: string) => {
    const pair = activity.pairs.find((p) => p.text === text);
    if (!pair) return;
    sfxTap();
    setSelected(text);
    void say(pair.speech);
  };

  const join = (text: string) => {
    if (!selected) return void say([{ prompt: PROMPT }]);
    if (selected !== text) {
      sfxTryAgain();
      setMistakes((m) => m + 1);
      return;
    }
    const next = [...joined, text];
    setJoined(next);
    setSelected(null);
    sfxRight();
    if (next.length === activity.pairs.length) setTimeout(() => onDone(mistakes === 0), readTime(500));
  };

  return (
    <div className="activity match">
      <button className="prompt" onClick={() => void say([{ prompt: PROMPT }])}>🔊 {PROMPT[lang]}</button>
      <div className="match-board">
        <div className="match-col">
          {left.map((pair) => (
            <button
              key={pair.text}
              className={`match-card match-left ${selected === pair.text ? 'chosen' : ''} ${joined.includes(pair.text) ? 'joined' : ''}`}
              data-pair={pair.text}
              disabled={joined.includes(pair.text)}
              onClick={() => choose(pair.text)}
            >
              {pair.text}
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((pair) => (
            <button
              key={pair.text}
              className={`match-card match-right ${joined.includes(pair.text) ? 'joined' : ''}`}
              data-pair={pair.text}
              disabled={joined.includes(pair.text)}
              onClick={() => join(pair.text)}
              aria-label={`Picture for ${pair.text}`}
            >
              {pair.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
