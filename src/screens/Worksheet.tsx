import { STROKES } from '../data/strokes';
import type { Module } from '../types';

export function worksheetContent(mod: Module): { letters: string[]; words: string[] } {
  const letters = new Set<string>();
  const words = new Set<string>();
  for (const lesson of mod.lessons) {
    for (const a of lesson.activities) {
      if (a.kind === 'trace') letters.add(a.letter);
      if (a.kind === 'spell') words.add(a.parts.join(a.joinWithSpace ? ' ' : ''));
      if (a.kind === 'speak' && mod.number === 12) words.add(a.say);
    }
  }
  return { letters: [...letters], words: [...words].slice(0, 12) };
}

const Dashed = ({ letter }: { letter: string }) => (
  <svg viewBox="0 0 100 110" className="ws-letter" aria-label={letter}>
    <line x1="0" x2="100" y1="80" y2="80" stroke="#999" strokeWidth="0.6" />
    {STROKES[letter]
      ? STROKES[letter].map((d, i) => <path key={i} d={d} fill="none" stroke="#555" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />)
      : <text x="50" y="78" fontSize="68" fontWeight="700" textAnchor="middle" fill="none" stroke="#555" strokeWidth="1" strokeDasharray="3 3">{letter}</text>}
  </svg>
);

export function Worksheet({ mod, onBack }: { mod: Module; onBack: () => void }) {
  const { letters, words } = worksheetContent(mod);
  return (
    <div className="worksheet">
      <div className="no-print">
        <button className="plain" onClick={onBack}>Back</button>
        <button className="plain" onClick={() => window.print()}>Print</button>
      </div>
      <h1>{mod.number}. {mod.title}</h1>
      <p>Name: ____________________  Date: ____________</p>
      {letters.length > 0 && <h2>Trace with a pencil, then write your own</h2>}
      {letters.map((letter) => (
        <div className="ws-row" key={letter}>
          {[0, 1, 2, 3, 4, 5].map((i) => <Dashed key={i} letter={letter} />)}
        </div>
      ))}
      {words.length > 0 && <h2>Copy on the line</h2>}
      {words.map((word) => (
        <div className="ws-word" key={word}><span>{word}</span><i /></div>
      ))}
    </div>
  );
}
