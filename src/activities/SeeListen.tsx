import { useEffect } from 'react';
import { motion } from 'motion/react';
import { say } from '../lib/audio';
import { useApp } from '../lib/store';
import { MouthGuide } from '../components/MouthGuide';
import type { Activity } from '../types';
import type { ActivityProps } from './types';

export function SeeListen({ activity, onDone }: ActivityProps<Extract<Activity, { kind: 'see' }>>) {
  const { lang, bridge } = useApp();
  useEffect(() => void say(activity.speech), [activity]);

  return (
    <div className="activity see">
      <button className="see-card" onClick={() => void say(activity.speech)} aria-label="Hear it again">
        {activity.emoji && (
          <motion.span className="big-emoji" animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            {activity.emoji}
          </motion.span>
        )}
        <motion.span className="big-letter" initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }}>
          {activity.title}
        </motion.span>
        {activity.caption && <span className="caption">{activity.caption}</span>}
      </button>
      {activity.mouth && <MouthGuide mouth={activity.mouth} />}
      {bridge && activity.bridge && <div className="bridge">हिंदी: {activity.bridge}</div>}
      {activity.tip && <p className="tip">{activity.tip[lang]}</p>}
      <button className="go" onClick={() => onDone(null)} aria-label="Next">➡️</button>
    </div>
  );
}
