import type { Activity, Lesson, Module, SpeechPart } from '../types';

/** Rough seconds a young child spends on each activity at the default speech speed. */
const SECONDS: Record<Activity['kind'], number> = { see: 12, pick: 14, trace: 30, speak: 18, blend: 18, spell: 25, pop: 30, match: 35 };

export const estimateMinutes = (mod: Module): number =>
  mod.lessons.flatMap((l) => l.activities).reduce((sum, a) => sum + SECONDS[a.kind], 0) / 60;

const TARGET_MINUTES = 12;
const MAX_LESSONS = 14;
const PRACTICE_SIZE = 8;

interface Item { text: string; emoji?: string; speech: SpeechPart[] }

function itemsOf(activities: Activity[]): Item[] {
  const items = new Map<string, Item>();
  for (const a of activities) {
    if (a.kind === 'see' && !/[+·]/.test(a.title) && !/^\p{M}/u.test(a.title)) {
      items.set(a.title, { text: a.title, emoji: a.emoji, speech: a.speech.slice(0, 1) });
    }
    if (a.kind === 'blend') {
      items.set(a.word, { text: a.word, emoji: a.emoji, speech: [a.lang === 'hi' ? { hi: a.word } : { word: a.word }] });
    }
  }
  return [...items.values()];
}

function popFor(target: Item, pool: Item[], seed: number): Activity | null {
  const short = pool.filter((i) => i.text !== target.text && i.text.length <= 8);
  if (target.text.length > 8 || short.length < 2) return null;
  const distractors = Array.from({ length: 5 }, (_, i) => short[(seed + i * 3) % short.length].text);
  return { kind: 'pop', target: target.text, speech: target.speech, balloons: [target.text, target.text, target.text, ...distractors] };
}

function matchFor(pool: Item[], seed: number): Activity | null {
  const pictured = pool.filter((i) => i.emoji && i.text.length <= 24);
  const pairs = new Map<string, Item>();
  const emojis = new Set<string>();
  for (let i = 0; i < pictured.length && pairs.size < 4; i++) {
    const item = pictured[(seed + i * 5) % pictured.length];
    if (!pairs.has(item.text) && !emojis.has(item.emoji!)) {
      pairs.set(item.text, item);
      emojis.add(item.emoji!);
    }
  }
  if (pairs.size < 3) return null;
  return { kind: 'match', pairs: [...pairs.values()].map((p) => ({ text: p.text, emoji: p.emoji!, speech: p.speech })) };
}

const present = (activities: (Activity | null)[]): Activity[] => activities.filter((a): a is Activity => a !== null);

/** Gives every lesson a game, then adds mixed practice until the module is long enough. */
export function enrich(mod: Module): Module {
  const original = mod.lessons.flatMap((l) => l.activities);
  const pool = itemsOf(original);
  const lessons = mod.lessons.map((lesson, i): Lesson => {
    const first = itemsOf(lesson.activities)[0];
    return { ...lesson, activities: present([...lesson.activities, first ? popFor(first, pool, i) : null]) };
  });
  const practiceFrom = original.filter((a) => a.kind !== 'see');
  const enriched: Module = { ...mod, lessons };
  for (let n = 1; estimateMinutes(enriched) < TARGET_MINUTES && lessons.length < MAX_LESSONS; n++) {
    // A wide stride spreads each practice across the whole module.
    const stride = Math.max(1, Math.floor(practiceFrom.length / PRACTICE_SIZE));
    const mixed = Array.from({ length: Math.min(PRACTICE_SIZE, practiceFrom.length) }, (_, i) => practiceFrom[(n * 3 + i * stride) % practiceFrom.length]);
    lessons.push({
      id: `${mod.id}-p${n}`,
      title: `Practice ${n}`,
      emoji: '🎯',
      activities: present([
        pool.length ? popFor(pool[n % pool.length], pool, n) : null,
        ...new Set(mixed),
        matchFor(pool, n),
      ]),
    });
  }
  return enriched;
}
