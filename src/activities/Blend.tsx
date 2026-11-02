import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { motion } from 'motion/react';
import { readTime, say, sfxRight } from '../lib/audio';
import type { Activity } from '../types';
import type { ActivityProps } from './types';

const PROMPT = { en: 'Slide along the letters to join the sounds.', hi: 'अक्षरों पर उँगली चलाकर आवाज़ें जोड़ो।' };

export function Blend({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'blend' }>>) {
  const track = useRef<HTMLDivElement>(null);
  const furthest = useRef(-1);
  const played = useRef(-1);
  const playing = useRef(false);
  const [reached, setReached] = useState(-1);
  const [joined, setJoined] = useState(false);
  const count = activity.sounds.length;
  const hindi = activity.lang === 'hi';

  useEffect(() => void say([{ prompt: PROMPT }]), [activity]);

  /** Plays every sound fully, in order, however fast the finger moves. */
  const playUpTo = async () => {
    if (playing.current) return;
    playing.current = true;
    while (played.current < furthest.current) {
      played.current += 1;
      setReached(played.current);
      const piece = activity.sounds[played.current];
      await say([hindi ? { hi: piece } : { sound: piece }]);
    }
    playing.current = false;
    if (played.current === count - 1) {
      setJoined(true);
      await new Promise((resolve) => setTimeout(resolve, readTime(400)));
      sfxRight();
      const whole = hindi ? { hi: activity.word } : { word: activity.word };
      await say([whole, whole]);
      setTimeout(() => onDone(null), readTime(300));
    }
  };

  const slide = (event: PointerEvent) => {
    if (joined || (event.pointerType === 'mouse' && event.buttons === 0 && event.type === 'pointermove')) return;
    const box = track.current?.getBoundingClientRect();
    if (!box) return;
    const at = Math.min(count - 1, Math.floor(((event.clientX - box.left) / box.width) * count));
    if (at <= furthest.current) return;
    furthest.current = at;
    void playUpTo();
  };

  return (
    <div className="activity blend">
      <button className="prompt" onClick={() => void say([{ prompt: PROMPT }])}>🔊 👉 {activity.sounds.join(' - ')}</button>
      <motion.span className="big-emoji" animate={joined ? { scale: [0.8, 1.3, 1] } : { opacity: 0.25 }}>
        {activity.emoji}
      </motion.span>
      <div
        ref={track}
        className="blend-track"
        data-word={activity.word}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          slide(e);
        }}
        onPointerMove={slide}
      >
        {activity.sounds.map((s, i) => (
          <motion.span
            key={i}
            className={`tile ${i <= reached ? 'lit' : ''}`}
            animate={joined ? { x: ((count - 1) / 2 - i) * 14 } : {}}
          >
            {s}
          </motion.span>
        ))}
      </div>
      {joined && <div className="big-word">{activity.word}</div>}
    </div>
  );
}
