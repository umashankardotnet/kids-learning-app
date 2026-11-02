import type { Activity, Module, SpeechPart, Subject } from '../types';
import { english } from './english';
import { hindi } from './hindi';

export const subjects: Subject[] = [
  english,
  hindi,
  { id: 'math', title: 'Math', world: 'Number Jungle', emoji: '🌴', color: '#6c5ce7', modules: [] },
];

/** Every recorded clip the app can play. Hindi sentences stay with the device voice. */
export function audioClips(): { sounds: string[]; words: string[]; hindi: string[] } {
  const sounds = new Set<string>();
  const words = new Set<string>();
  const hindiClips = new Set<string>();
  const add = (parts: SpeechPart[]) => {
    for (const part of parts) {
      if ('sound' in part) sounds.add(part.sound);
      if ('word' in part) words.add(part.word);
      if ('hi' in part && !part.hi.includes(' ')) hindiClips.add(part.hi);
    }
  };
  for (const subject of subjects) {
    for (const lesson of subject.modules.flatMap((m) => m.lessons)) {
      for (const a of lesson.activities) {
        if (a.kind === 'see' || a.kind === 'spell' || a.kind === 'pop') add(a.speech);
        if (a.kind === 'match') a.pairs.forEach((p) => add(p.speech));
        if (a.kind === 'pick') add(a.prompt);
        if (a.kind === 'blend') {
          const blended: SpeechPart[] = a.lang === 'hi'
            ? [...a.sounds, a.word].map((hi) => ({ hi }))
            : [...a.sounds.map((sound) => ({ sound })), { word: a.word }];
          add(blended);
        }
        if (a.kind === 'speak' && a.lang === 'hi') add([{ hi: a.say }]);
      }
    }
  }
  return { sounds: [...sounds].sort(), words: [...words].sort(), hindi: [...hindiClips].sort() };
}

export const activityKey =(lessonId: string, index: number): string => `${lessonId}#${index}`;

export function findActivity(key: string): Activity | undefined {
  const [lessonId, index] = key.split('#');
  for (const subject of subjects) {
    for (const mod of subject.modules) {
      const lesson = mod.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson.activities[Number(index)];
    }
  }
  return undefined;
}

export interface TestItem {
  key: string;
  activity: Activity;
}

const shuffle = <T,>(items: T[], random: () => number): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const testable = (mod: Module): TestItem[] =>
  mod.lessons.flatMap((lesson) =>
    lesson.activities.flatMap((activity, i) => (activity.kind === 'see' ? [] : [{ key: activityKey(lesson.id, i), activity }])),
  );

/** Mostly reading questions, always with some writing and speaking when the module has them. */
export function buildModuleTest(mod: Module, size = 8, random: () => number = Math.random): TestItem[] {
  const all = shuffle(testable(mod), random);
  const take = (kinds: Activity['kind'][], count: number) => all.filter((t) => kinds.includes(t.activity.kind)).slice(0, count);
  const chosen = [...take(['trace', 'spell'], 2), ...take(['speak'], 1)];
  for (const item of take(['pick', 'blend'], size)) {
    if (chosen.length >= size) break;
    chosen.push(item);
  }
  for (const item of all) {
    if (chosen.length >= size) break;
    if (!chosen.includes(item)) chosen.push(item);
  }
  return shuffle(chosen, random).slice(0, size);
}

export function buildFinalTest(subject: Subject, random: () => number = Math.random): TestItem[] {
  const perModule = subject.modules.map((mod) => buildModuleTest(mod, 2, random));
  return shuffle(perModule.flat(), random);
}

export const starsFor = (correct: number, total: number): number => {
  const ratio = total === 0 ? 1 : correct / total;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
};
