import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { sfxWin, stopSpeech } from '../lib/audio';
import { STROKES } from '../data/strokes';
import { Blend } from '../activities/Blend';
import { GlyphTrace } from '../activities/GlyphTrace';
import { Match } from '../activities/Match';
import { Pick } from '../activities/Pick';
import { Pop } from '../activities/Pop';
import { SeeListen } from '../activities/SeeListen';
import { Speak } from '../activities/Speak';
import { Spell } from '../activities/Spell';
import { Trace } from '../activities/Trace';
import { Confetti } from '../components/Confetti';
import { Mascot } from '../components/Mascot';
import type { Activity } from '../types';

export interface PlayerResult {
  key: string;
  activity: Activity;
  firstTry: boolean | null;
}

interface Props {
  items: { key: string; activity: Activity }[];
  onExit: () => void;
  onFinish: (results: PlayerResult[]) => void;
}

function ActivityView({ activity, onDone }: { activity: Activity; onDone: (firstTry: boolean | null) => void }) {
  switch (activity.kind) {
    case 'see': return <SeeListen activity={activity} onDone={onDone} />;
    case 'pick': return <Pick activity={activity} onDone={onDone} />;
    case 'trace': return STROKES[activity.letter] ? <Trace activity={activity} onDone={onDone} /> : <GlyphTrace activity={activity} onDone={onDone} />;
    case 'speak': return <Speak activity={activity} onDone={onDone} />;
    case 'blend': return <Blend activity={activity} onDone={onDone} />;
    case 'spell': return <Spell activity={activity} onDone={onDone} />;
    case 'pop': return <Pop activity={activity} onDone={onDone} />;
    case 'match': return <Match activity={activity} onDone={onDone} />;
  }
}

const SKIPPABLE: Activity['kind'][] = ['trace', 'blend', 'spell', 'pop', 'match'];

/** Runs a list of activities; used by both lessons and tests. */
export function Player({ items, onExit, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [burst, setBurst] = useState(0);

  const alive = useRef(true);
  const handled = useRef(-1);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopSpeech();
    };
  }, []);

  // A child who cannot finish an activity gets a way forward instead of being stuck.
  useEffect(() => {
    setStuck(false);
    if (!SKIPPABLE.includes(items[index].activity.kind)) return;
    const timer = setTimeout(() => setStuck(true), 45_000);
    return () => clearTimeout(timer);
  }, [index, items]);

  const done = (firstTry: boolean | null) => {
    // Activities finish on a timer, which may fire after leaving or after a skip.
    if (!alive.current || handled.current === index) return;
    handled.current = index;
    const item = items[index];
    const next = [...results, { ...item, firstTry }];
    setResults(next);
    if (firstTry) setBurst((b) => b + 1);
    if (index + 1 < items.length) {
      setIndex(index + 1);
    } else {
      sfxWin();
      onFinish(next);
    }
  };

  const item = items[index];

  return (
    <div className="player">
      <header className="player-bar">
        <button className="round" onClick={onExit} aria-label="Go back">🏠</button>
        <div className="progress" role="progressbar" aria-valuenow={index} aria-valuemax={items.length}>
          <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${(index / items.length) * 100}%` }} />
        </div>
        <Mascot size={44} />
      </header>
      <AnimatePresence mode="wait">
        <motion.main
          key={index}
          className="stage"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-kind={item.activity.kind}
        >
          <ActivityView activity={item.activity} onDone={done} />
        </motion.main>
      </AnimatePresence>
      {stuck && <button className="go skip" onClick={() => done(false)} aria-label="Skip">➡️</button>}
      {burst > 0 && <Confetti key={burst} count={10} />}
    </div>
  );
}
