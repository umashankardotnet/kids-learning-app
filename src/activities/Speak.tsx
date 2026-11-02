import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { readTime, say, sfxRight, stopSpeech } from '../lib/audio';
import { listen } from '../lib/recognition';
import { Mascot } from '../components/Mascot';
import type { Activity, Prompt, SpeechPart } from '../types';
import type { ActivityProps } from './types';
import { useApp } from '../lib/store';

const COPY: Record<'ready' | 'listening' | 'great' | 'again' | 'good', Prompt> = {
  ready: { en: 'Listen, then tap the mic and say it!', hi: 'सुनो, फिर माइक दबाकर बोलो!' },
  listening: { en: "I'm listening…", hi: 'मैं सुन रहा हूँ…' },
  great: { en: 'Great speaking!', hi: 'बहुत बढ़िया बोला!' },
  again: { en: 'Nice try! Say it once more.', hi: 'अच्छी कोशिश! एक बार और बोलो।' },
  good: { en: 'Good try!', hi: 'शाबाश, अच्छी कोशिश!' },
};

export function Speak({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'speak' }>>) {
  const { lang } = useApp();
  const [status, setStatus] = useState<keyof typeof COPY>('ready');
  const [tries, setTries] = useState(0);
  const target: SpeechPart = activity.lang === 'hi' ? { hi: activity.say } : { text: activity.say };
  const model = () => void say([target]);

  useEffect(model, [activity]);

  const finish = (next: 'great' | 'good', score: boolean | null) => {
    setStatus(next);
    sfxRight();
    void say([{ prompt: COPY[next] }]).then(() => setTimeout(() => onDone(score), readTime(400)));
  };

  const mic = async () => {
    if (status === 'listening' || status === 'great' || status === 'good') return;
    stopSpeech();
    setStatus('listening');
    const result = await listen(activity.say, activity.accept, activity.lang);
    if (result === 'heard') return finish('great', true);
    if (result === 'unavailable') return finish('good', null);
    if (tries >= 1) return finish('good', false);
    setTries(tries + 1);
    setStatus('again');
    void say([{ prompt: COPY.again }, target]);
  };

  const cheer = status === 'great' || status === 'good';

  return (
    <div className="activity speak">
      <button className="see-card" onClick={model} aria-label="Hear it again">
        {activity.emoji && <span className="big-emoji">{activity.emoji}</span>}
        <span className="say-text">{activity.say}</span>
      </button>
      <Mascot size={72} message={COPY[status][lang]} cheer={cheer} />
      <motion.button
        className={`mic ${status === 'listening' ? 'on' : ''}`}
        onClick={() => void mic()}
        animate={status === 'listening' ? { scale: [1, 1.15, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.9 }}
        aria-label="Tap and speak"
      >
        🎤
      </motion.button>
    </div>
  );
}
