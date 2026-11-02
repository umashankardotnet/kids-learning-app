import { useEffect } from 'react';
import { motion } from 'motion/react';
import { say } from '../lib/audio';
import { subjects } from '../data/course';
import { useApp } from '../lib/store';
import { Mascot } from '../components/Mascot';
import type { Subject } from '../types';

interface Props {
  onSubject: (subject: Subject) => void;
  onRewards: () => void;
  onParent: () => void;
}

export function Home({ onSubject, onRewards, onParent }: Props) {
  const { profile, tests } = useApp();
  const stars = Object.values(tests).reduce((sum, t) => sum + t.stars, 0);

  useEffect(() => void say([{ text: 'Where shall we go?' }]), []);

  return (
    <div className="screen home">
      <header className="top-bar">
        <span className="me">{profile?.avatar} {profile?.name}</span>
        <button className="round wide" onClick={onRewards} aria-label="My stickers">⭐ {stars}</button>
        <button className="round" onClick={onParent} aria-label="Parent area">🔒</button>
      </header>
      <Mascot size={96} message={profile?.name ? `Hi ${profile.name}! Where shall we go?` : 'Where shall we go?'} />
      <div className="worlds">
        {subjects.map((subject, i) => {
          const open = subject.modules.length > 0;
          return (
            <motion.button
              key={subject.id}
              className={`world ${open ? '' : 'soon'}`}
              style={{ background: subject.color }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.12 }}
              whileHover={open ? { scale: 1.03 } : {}}
              whileTap={open ? { scale: 0.96 } : {}}
              disabled={!open}
              onClick={() => onSubject(subject)}
            >
              <motion.span className="world-emoji" animate={{ y: [0, -7, 0] }} transition={{ duration: 2 + i * 0.4, repeat: Infinity }}>
                {subject.emoji}
              </motion.span>
              <span className="world-name">{subject.world}</span>
              <span className="world-sub">{open ? subject.title : `${subject.title} · Coming soon`}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
