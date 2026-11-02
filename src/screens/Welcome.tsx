import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { say, sfxTap } from '../lib/audio';
import { Mascot } from '../components/Mascot';
import { update } from '../lib/store';

const AVATARS = ['🦁', '🐼', '🐰', '🦊', '🐯', '🐸', '🦄', '🐵'];

export function Welcome() {
  const [avatar, setAvatar] = useState('');
  const [name, setName] = useState('');

  useEffect(() => void say([{ text: 'Hello! I am Gappu. Pick your friend.' }]), []);

  return (
    <div className="screen welcome">
      <h1>Khelo Seekho</h1>
      <Mascot size={130} message="Hello! I am Gappu. Who are you?" />
      <div className="avatars">
        {AVATARS.map((a) => (
          <motion.button
            key={a}
            className={`avatar ${avatar === a ? 'chosen' : ''}`}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              sfxTap();
              setAvatar(a);
            }}
          >
            {a}
          </motion.button>
        ))}
      </div>
      <input
        className="name-input"
        placeholder="Name (a grown-up can type this)"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        className="go"
        disabled={!avatar}
        aria-label="Start"
        onClick={() => update(() => ({ profile: { name: name.trim(), avatar } }))}
      >
        ▶️
      </button>
    </div>
  );
}
