import { useMemo, useState } from 'react';
import { subjects } from '../data/course';
import { hasHindiVoice, hasIndianEnglishVoice } from '../lib/audio';
import { canCheckSpeech } from '../lib/recognition';
import { update, useApp, type SpeechSpeed } from '../lib/store';
import type { Module } from '../types';

interface Props {
  onBack: () => void;
  onWorksheet: (mod: Module) => void;
}

function Gate({ onOpen, onBack }: { onOpen: () => void; onBack: () => void }) {
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 3 + Math.floor(Math.random() * 6)], []);
  const [answer, setAnswer] = useState('');
  return (
    <div className="screen parent gate">
      <h2>For grown-ups</h2>
      <p>What is {a} × {b}?</p>
      <input
        inputMode="numeric"
        value={answer}
        aria-label="Answer"
        onChange={(e) => {
          setAnswer(e.target.value);
          if (Number(e.target.value) === a * b) onOpen();
        }}
      />
      <button className="plain" onClick={onBack}>Back</button>
    </div>
  );
}

export function Parent({ onBack, onWorksheet }: Props) {
  const app = useApp();
  const [open, setOpen] = useState(false);
  if (!open) return <Gate onOpen={() => setOpen(true)} onBack={onBack} />;

  const practice = Object.values(app.missed).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="screen parent">
      <header className="top-bar">
        <button className="round" onClick={onBack} aria-label="Go back">🏠</button>
        <h2>Parent area</h2>
      </header>

      {subjects.filter((subject) => subject.modules.length > 0).map((subject) => (
        <section className="panel" key={subject.id}>
          <h3>{subject.title} progress</h3>
          <table>
            <thead><tr><th>Module</th><th>Lessons</th><th>Test</th><th>Worksheet</th></tr></thead>
            <tbody>
              {subject.modules.map((mod) => (
                <tr key={mod.id}>
                  <td>{mod.number}. {mod.title}</td>
                  <td>{mod.lessons.filter((l) => app.lessonsDone[l.id]).length}/{mod.lessons.length}</td>
                  <td>{app.tests[mod.id] ? '⭐'.repeat(app.tests[mod.id].stars) : '–'}</td>
                  <td><button className="plain" onClick={() => onWorksheet(mod)}>Print</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <section className="panel">
        <h3>Needs more practice</h3>
        {practice.length === 0 ? <p>Nothing yet. Missed test questions appear here.</p> : (
          <ul>{practice.map((m) => <li key={m.label}>{m.label} ({m.count})</li>)}</ul>
        )}
      </section>

      <section className="panel">
        <h3>Settings</h3>
        <label>
          Speech speed{' '}
          <select value={app.speed} onChange={(e) => update(() => ({ speed: e.target.value as SpeechSpeed }))}>
            <option value="slower">Very slow</option>
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
          </select>
        </label>
        <label><input type="checkbox" checked={app.bridge} onChange={(e) => update(() => ({ bridge: e.target.checked }))} /> Show Hindi letter hints</label>
        <label><input type="checkbox" checked={app.muted} onChange={(e) => update(() => ({ muted: e.target.checked }))} /> Mute all sound</label>
        {(!hasHindiVoice() || !hasIndianEnglishVoice()) && (
          <p className="note">
            This device is missing a Hindi or Indian English voice, so speech may sound foreign or wrong.
            Use the Microsoft Edge browser, or add English (India) and Hindi under Windows Settings › Time &amp; language › Speech.
            On Android, install Hindi in Text-to-speech settings.
          </p>
        )}
        <p className="note">
          Speech checking on this device: {canCheckSpeech() ? 'available (needs internet)' : 'not available, so speaking practice just cheers the child on'}.
          Voice recordings are never saved by this app. Phonics sounds are temporary until recorded clips are added.
        </p>
      </section>
    </div>
  );
}
