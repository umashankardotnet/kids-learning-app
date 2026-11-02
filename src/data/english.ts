import type { Activity, Lesson, Module, Mouth, PickOption, Prompt, SpeechPart, Subject } from '../types';
import { enrich } from './enrich';

interface SoundItem {
  id: string;
  letter: string;
  word: string;
  emoji: string;
  mouth: Mouth;
  bridge?: string;
  ends?: boolean;
  tip?: Prompt;
}

const VW_TIP: Prompt = {
  en: 'Top teeth touch your bottom lip for v. Round lips for w.',
  hi: 'v में ऊपर के दाँत नीचे के होंठ को छूते हैं। w में होंठ गोल होते हैं।',
};

export const SOUNDS: SoundItem[] = [
  { id: 's', letter: 's', word: 'sun', emoji: '☀️', mouth: 'teeth', bridge: 'स' },
  { id: 'a', letter: 'a', word: 'ant', emoji: '🐜', mouth: 'open', tip: { en: 'A short sound, like in ant.', hi: 'छोटी आवाज़, जैसे ant में।' } },
  { id: 't', letter: 't', word: 'tiger', emoji: '🐯', mouth: 'tongue', bridge: 'ट' },
  { id: 'p', letter: 'p', word: 'pig', emoji: '🐷', mouth: 'lips', bridge: 'प' },
  { id: 'i', letter: 'i', word: 'insect', emoji: '🐞', mouth: 'smile', bridge: 'इ' },
  { id: 'n', letter: 'n', word: 'nose', emoji: '👃', mouth: 'tongue', bridge: 'न' },
  { id: 'm', letter: 'm', word: 'mouse', emoji: '🐭', mouth: 'lips', bridge: 'म' },
  { id: 'd', letter: 'd', word: 'dog', emoji: '🐶', mouth: 'tongue', bridge: 'ड' },
  { id: 'g', letter: 'g', word: 'goat', emoji: '🐐', mouth: 'open', bridge: 'ग' },
  { id: 'o', letter: 'o', word: 'octopus', emoji: '🐙', mouth: 'round', tip: { en: 'A short sound, like in octopus.', hi: 'छोटी आवाज़, जैसे octopus में।' } },
  { id: 'c', letter: 'c', word: 'cat', emoji: '🐱', mouth: 'open', bridge: 'क' },
  { id: 'k', letter: 'k', word: 'kite', emoji: '🪁', mouth: 'open', bridge: 'क' },
  { id: 'e', letter: 'e', word: 'egg', emoji: '🥚', mouth: 'smile', bridge: 'ए' },
  { id: 'u', letter: 'u', word: 'umbrella', emoji: '☂️', mouth: 'open', bridge: 'अ' },
  { id: 'r', letter: 'r', word: 'rabbit', emoji: '🐰', mouth: 'tongue', bridge: 'र' },
  { id: 'h', letter: 'h', word: 'hat', emoji: '🎩', mouth: 'open', bridge: 'ह' },
  { id: 'b', letter: 'b', word: 'ball', emoji: '⚽', mouth: 'lips', bridge: 'ब' },
  { id: 'f', letter: 'f', word: 'fish', emoji: '🐟', mouth: 'teeth', bridge: 'फ़' },
  { id: 'l', letter: 'l', word: 'lion', emoji: '🦁', mouth: 'tongue', bridge: 'ल' },
  { id: 'j', letter: 'j', word: 'juice', emoji: '🧃', mouth: 'teeth', bridge: 'ज' },
  { id: 'v', letter: 'v', word: 'van', emoji: '🚐', mouth: 'teeth', tip: VW_TIP },
  { id: 'w', letter: 'w', word: 'watch', emoji: '⌚', mouth: 'round', tip: VW_TIP },
  { id: 'x', letter: 'x', word: 'fox', emoji: '🦊', mouth: 'teeth', ends: true },
  { id: 'y', letter: 'y', word: 'yo-yo', emoji: '🪀', mouth: 'smile', bridge: 'य' },
  { id: 'z', letter: 'z', word: 'zebra', emoji: '🦓', mouth: 'teeth', bridge: 'ज़' },
  { id: 'qu', letter: 'q', word: 'queen', emoji: '👸', mouth: 'round', bridge: 'क्व' },
];

const LETTER_ORDER = 'abcdefghijklmnopqrstuvwxyz'.split('');

const soundBy = (id: string): SoundItem => {
  const found = SOUNDS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown sound ${id}`);
  return found;
};

const P = {
  starts: { en: 'Which picture starts with this sound?', hi: 'कौन सी तस्वीर इस आवाज़ से शुरू होती है?' },
  ends: { en: 'Which picture ends with this sound?', hi: 'कौन सी तस्वीर इस आवाज़ पर ख़त्म होती है?' },
  letter: { en: 'Tap the letter that makes this sound.', hi: 'इस आवाज़ वाला अक्षर दबाओ।' },
  rhyme: { en: 'Which one rhymes?', hi: 'कौन सा शब्द इससे मिलता-जुलता लगता है?' },
  same: { en: 'Which one starts with the same sound?', hi: 'कौन सा शब्द इसी आवाज़ से शुरू होता है?' },
  word: { en: 'Tap the picture for this word.', hi: 'इस शब्द की तस्वीर दबाओ।' },
  findWord: { en: 'Find this word.', hi: 'यह शब्द ढूँढो।' },
  small: { en: 'Find the small letter for this capital.', hi: 'इस बड़े अक्षर का छोटा अक्षर ढूँढो।' },
  sentence: { en: 'Which picture shows this?', hi: 'कौन सी तस्वीर यह दिखाती है?' },
  question: { en: 'Listen and choose.', hi: 'सुनो और चुनो।' },
  reply: { en: 'What do you say back?', hi: 'जवाब में क्या कहोगे?' },
} satisfies Record<string, Prompt>;

/** Options built from a fixed list, using a stable spread so data stays deterministic. */
export function others<T>(all: T[], avoid: (item: T) => boolean, seed: number, count: number): T[] {
  const pool = all.filter((item) => !avoid(item));
  const step = 7 % pool.length || 1;
  return Array.from({ length: count }, (_, i) => pool[(seed + i * step) % pool.length]);
}

/** A second example word for each sound. */
const SECOND_WORD: Record<string, [string, string]> = {
  s: ['snake', '🐍'], a: ['apple', '🍎'], t: ['tree', '🌳'], p: ['pen', '🖊️'], i: ['ink', '🖋️'], n: ['nut', '🌰'],
  m: ['moon', '🌙'], d: ['duck', '🦆'], g: ['girl', '👧'], o: ['ox', '🐂'], c: ['car', '🚗'], k: ['key', '🔑'],
  e: ['elephant', '🐘'], u: ['up', '⬆️'], r: ['ring', '💍'], h: ['hen', '🐔'], b: ['bus', '🚌'], f: ['frog', '🐸'], l: ['leaf', '🍃'],
  j: ['jeep', '🚙'], v: ['violin', '🎻'], w: ['web', '🕸️'], x: ['box', '📦'], y: ['yellow', '🟡'], z: ['zoo', '🦁'], qu: ['quack', '🦆'],
};

function soundActivities(item: SoundItem, seed: number): Activity[] {
  const second = SECOND_WORD[item.id];
  const wrong = others(SOUNDS, (s) => s.letter === item.letter || (item.ends ? false : s.word.startsWith(item.word[0])), seed, 2);
  const lettersWrong = others(SOUNDS, (s) => s.letter === item.letter, seed + 3, 2);
  const sound: SpeechPart = { sound: item.id };
  return [
    {
      kind: 'see',
      title: item.letter,
      emoji: item.emoji,
      caption: item.word,
      mouth: item.mouth,
      bridge: item.bridge,
      tip: item.tip,
      speech: [sound, sound, { word: item.word }],
    },
    {
      kind: 'pick',
      label: `Hear /${item.id}/ in a word`,
      visiblePrompt: item.ends ? P.ends : P.starts,
      prompt: [{ prompt: item.ends ? P.ends : P.starts }, sound],
      focus: item.letter,
      options: [
        { emoji: item.emoji, label: item.word, correct: true },
        ...wrong.map((s): PickOption => ({ emoji: s.emoji, label: s.word })),
      ],
    },
    {
      kind: 'pick',
      label: `Match /${item.id}/ to its letter`,
      visiblePrompt: P.letter,
      prompt: [{ prompt: P.letter }, sound],
      focus: item.letter,
      options: [
        { label: item.letter, correct: true },
        ...lettersWrong.map((s): PickOption => ({ label: s.letter })),
      ],
    },
    { kind: 'trace', letter: item.letter },
    { kind: 'speak', say: item.word, emoji: item.emoji, accept: [item.word.replace('-', '')] },
    { kind: 'see', title: item.letter, emoji: second[1], caption: second[0], speech: [sound, { word: second[0] }] },
    { kind: 'speak', say: second[0], emoji: second[1] },
  ];
}

function soundModule(number: number, title: string, emoji: string, sticker: string, ids: string[], extra: Lesson[] = []): Module {
  const id = `en-${number}`;
  return {
    id,
    number,
    title,
    emoji,
    sticker,
    outcome: 'Say, recognise and write these sounds',
    lessons: [
      ...ids.map((sid, i): Lesson => {
        const item = soundBy(sid);
        return { id: `${id}-${i + 1}`, title: `Sound ${item.letter}`, emoji: item.emoji, activities: soundActivities(item, number * 5 + i) };
      }),
      ...extra,
    ],
  };
}

function matchPick(label: string, visiblePrompt: Prompt, target: SpeechPart, correct: PickOption, wrong: PickOption[], focus?: string): Activity {
  return { kind: 'pick', label, visiblePrompt, focus, prompt: [{ prompt: visiblePrompt }, target], options: [{ ...correct, correct: true }, ...wrong] };
}

type W = [string, string];

function rhymeLesson(id: string, sets: [W, W, W, W][], title: string): Lesson {
  return {
    id,
    title,
    emoji: '🎵',
    activities: sets.flatMap(([[w, e], [r, re], [x1, e1], [x2, e2]]): Activity[] => [
      { kind: 'see', title: `${w} · ${r}`, emoji: `${e} ${re}`, speech: [{ word: w }, { word: r }] },
      matchPick(`Rhyme with ${w}`, P.rhyme, { word: w }, { emoji: re, label: r }, [{ emoji: e1, label: x1 }, { emoji: e2, label: x2 }], w),
    ]),
  };
}

function firstSoundLesson(id: string, sets: [W, W, W, W][], title: string): Lesson {
  return {
    id,
    title,
    emoji: '👂',
    activities: sets.map(([[w], [r, re], [x1, e1], [x2, e2]]): Activity =>
      matchPick(`Same first sound as ${w}`, P.same, { word: w }, { emoji: re, label: r }, [{ emoji: e1, label: x1 }, { emoji: e2, label: x2 }], w),
    ).flatMap((a, i): Activity[] => [
      { kind: 'see', title: sets[i][0][0], emoji: sets[i][0][1], speech: [{ word: sets[i][0][0] }] },
      a,
    ]),
  };
}

const rhymeLessons: Lesson[] = [
  rhymeLesson('en-7-7', [[['cat', '🐱'], ['hat', '🎩'], ['dog', '🐶'], ['sun', '☀️']], [['bee', '🐝'], ['tree', '🌳'], ['cup', '☕'], ['fish', '🐟']]], 'Rhymes 1'),
  rhymeLesson('en-7-8', [[['pen', '🖊️'], ['hen', '🐔'], ['bus', '🚌'], ['moon', '🌙']], [['frog', '🐸'], ['dog', '🐶'], ['star', '⭐'], ['egg', '🥚']]], 'Rhymes 2'),
  rhymeLesson('en-7-9', [[['car', '🚗'], ['star', '⭐'], ['pig', '🐷'], ['boat', '⛵']], [['bed', '🛏️'], ['red', '🔴'], ['cat', '🐱'], ['sun', '☀️']]], 'Rhymes 3'),
];

const firstSoundLessons: Lesson[] = [
  firstSoundLesson('en-3-7', [[['ball', '⚽'], ['bus', '🚌'], ['cat', '🐱'], ['sun', '☀️']], [['moon', '🌙'], ['mouse', '🐭'], ['dog', '🐶'], ['pen', '🖊️']]], 'First sounds 1'),
  firstSoundLesson('en-3-8', [[['sun', '☀️'], ['star', '⭐'], ['frog', '🐸'], ['hat', '🎩']], [['pig', '🐷'], ['pen', '🖊️'], ['tree', '🌳'], ['bee', '🐝']]], 'First sounds 2'),
  firstSoundLesson('en-3-9', [[['dog', '🐶'], ['duck', '🦆'], ['fish', '🐟'], ['car', '🚗']], [['fish', '🐟'], ['frog', '🐸'], ['moon', '🌙'], ['bus', '🚌']]], 'First sounds 3'),
];

const vwLesson: Lesson = {
  id: 'en-5-8',
  title: 'v and w',
  emoji: '🚐',
  activities: [
    { kind: 'see', title: 'v · w', emoji: '🚐 ⌚', caption: 'van · watch', mouth: 'teeth', tip: VW_TIP, speech: [{ sound: 'v' }, { word: 'van' }, { sound: 'w' }, { word: 'watch' }] },
    matchPick('Tell v from w: van', P.word, { word: 'van' }, { emoji: '🚐', label: 'van' }, [{ emoji: '⌚', label: 'watch' }]),
    matchPick('Tell v from w: web', P.word, { word: 'web' }, { emoji: '🕸️', label: 'web' }, [{ emoji: '🎻', label: 'violin' }]),
    matchPick('Tell v from w: violin', P.word, { word: 'violin' }, { emoji: '🎻', label: 'violin' }, [{ emoji: '🌊', label: 'wave' }]),
    { kind: 'speak', say: 'van', emoji: '🚐' },
    { kind: 'speak', say: 'watch', emoji: '⌚' },
  ],
};

const CAP_GROUPS = ['abcd', 'efgh', 'ijkl', 'mnop', 'qrstu', 'vwxyz'];

const module6: Module = {
  id: 'en-6',
  number: 6,
  title: 'Capital and Small Letters',
  emoji: '🔠',
  sticker: '🐘',
  outcome: 'Write and name A–Z and a–z',
  lessons: CAP_GROUPS.map((group, g): Lesson => ({
    id: `en-6-${g + 1}`,
    title: `${group[0].toUpperCase()} to ${group[group.length - 1].toUpperCase()}`,
    emoji: '🔠',
    activities: group.split('').flatMap((l, i): Activity[] => {
      const cap = l.toUpperCase();
      const wrong = others(LETTER_ORDER, (x) => x === l, g * 4 + i, 2);
      return [
        { kind: 'see', title: `${cap} ${l}`, caption: `The letter ${cap}`, speech: [{ text: `Capital ${cap}. Small ${cap}.` }] },
        matchPick(`Match ${cap} to ${l}`, P.small, { text: cap }, { label: l }, wrong.map((x): PickOption => ({ label: x })), cap),
        { kind: 'trace', letter: cap },
      ];
    }),
  })),
};

const WORD_EMOJI: Record<string, string> = {
  at: '📍', an: '1️⃣', it: '👉', in: '📥', am: '🙋', on: '💡', up: '⬆️', if: '❓',
  cat: '🐱', hat: '🎩', bat: '🦇', van: '🚐', map: '🗺️', rat: '🐀',
  hen: '🐔', pen: '🖊️', bed: '🛏️', net: '🥅', leg: '🦵', web: '🕸️',
  pig: '🐷', bib: '👶', lip: '👄', pin: '📌', six: '6️⃣', zip: '🤐',
  dog: '🐶', fox: '🦊', box: '📦', log: '🪵', mop: '🧹', pot: '🍲',
  sun: '☀️', bus: '🚌', cup: '☕', nut: '🌰', mug: '🍺', rug: '🧶',
  ship: '🚢', shop: '🏪', fish: '🐟', dish: '🍽️', chin: '🧔', chick: '🐥', bench: '🪑', lunch: '🍱',
  thin: '📏', moth: '🦋', bath: '🛁', three: '3️⃣', this: '👉', that: '👈', ring: '💍', king: '🤴', wing: '🪽', swing: '🛝',
  duck: '🦆', sock: '🧦', clock: '🕐', rock: '🪨', tree: '🌳', bee: '🐝', feet: '🦶', sheep: '🐑',
  moon: '🌙', spoon: '🥄', boot: '🥾', zoo: '🦁', rain: '🌧️', tail: '🐒', snail: '🐌', train: '🚆', boat: '⛵', goat: '🐐', coat: '🧥', soap: '🧼',
};

const pictureOf = (word: string): string => {
  const emoji = WORD_EMOJI[word];
  if (!emoji) throw new Error(`No picture for ${word}`);
  return emoji;
};

function wordActivities(word: string, sounds: string[], allWords: string[], seed: number): Activity[] {
  const emoji = pictureOf(word);
  const wrong = others(allWords, (w) => w === word, seed, 2);
  return [
    { kind: 'blend', sounds, word, emoji },
    matchPick(`Read the word ${word}`, P.word, { word }, { emoji, label: word }, wrong.map((w): PickOption => ({ emoji: pictureOf(w), label: w }))),
    {
      kind: 'spell',
      parts: sounds,
      extras: others(LETTER_ORDER, (l) => sounds.includes(l), seed + 2, 2),
      emoji,
      speech: [{ word }],
    },
    { kind: 'speak', say: word, emoji },
  ];
}

const TWO_LETTER = ['at', 'an', 'it', 'in', 'am', 'on', 'up', 'if'];

const twoLetterLesson = (id: string, title: string, words: string[], pool: string[]): Lesson => ({
  id,
  title,
  emoji: pictureOf(words[0]),
  activities: words.flatMap((word, i) => wordActivities(word, word.split(''), pool, i + 1)),
});

/** Comes straight after the first six sounds, using only those sounds. */
const module2 = (): Module => {
  const pool = TWO_LETTER.slice(0, 4);
  return {
    id: 'en-2',
    number: 2,
    title: 'Two-Letter Words',
    emoji: '✌️',
    sticker: '🐝',
    outcome: 'Join two sounds to say and read at, an, it, in',
    lessons: [
      twoLetterLesson('en-2-1', 'at', ['at'], pool),
      twoLetterLesson('en-2-2', 'an', ['an'], pool),
      twoLetterLesson('en-2-3', 'at, an', ['at', 'an'], pool),
      twoLetterLesson('en-2-4', 'it', ['it'], pool),
      twoLetterLesson('en-2-5', 'in', ['in'], pool),
      twoLetterLesson('en-2-6', 'it, in', ['it', 'in'], pool),
    ],
  };
};

const blendLesson = (id: string, title: string, emoji: string, words: string[][], pool: string[]): Lesson => ({
  id,
  title,
  emoji,
  activities: words.flatMap((sounds, i) => wordActivities(sounds.join(''), sounds, pool, i * 3 + id.length)),
});

const split3 = (words: string): string[][] => words.split(' ').map((w) => w.split(''));

const CVC = { a: 'cat hat van map', e: 'hen pen bed net', i: 'pig lip pin six', o: 'dog fox box mop', u: 'sun bus cup nut' };
const cvcPool = Object.values(CVC).join(' ').split(' ');

const module7: Module = {
  id: 'en-7',
  number: 7,
  title: 'Blending 3-Letter Words',
  emoji: '🧩',
  sticker: '🦋',
  outcome: 'Read and write cat, sun, pen',
  lessons: [
    blendLesson('en-7-1', 'Words with a', '🐱', split3(CVC.a), cvcPool),
    blendLesson('en-7-2', 'Words with e', '🐔', split3(CVC.e), cvcPool),
    blendLesson('en-7-3', 'Words with i', '🐷', split3(CVC.i), cvcPool),
    blendLesson('en-7-4', 'Words with o', '🐶', split3(CVC.o), cvcPool),
    blendLesson('en-7-5', 'Words with u', '☀️', split3(CVC.u), cvcPool),
    blendLesson('en-7-6', 'Mixed words', '🧩', split3('bat leg zip pot rug'), [...cvcPool, 'bat', 'leg', 'pot', 'rug']),
    ...rhymeLessons,
  ],
};

interface Team { id: string; letters: string; words: string[][]; mouth: Mouth; bridge?: string; tip?: Prompt }

function teamLesson(lessonId: string, team: Team, pool: string[]): Lesson {
  const first = team.words[0].join('');
  return {
    id: lessonId,
    title: `Sound ${team.letters}`,
    emoji: pictureOf(first),
    activities: [
      {
        kind: 'see',
        title: team.letters,
        emoji: pictureOf(first),
        caption: first,
        mouth: team.mouth,
        bridge: team.bridge,
        tip: team.tip,
        speech: [{ sound: team.id }, { sound: team.id }, { word: first }],
      },
      ...team.words.flatMap((sounds, i) => wordActivities(sounds.join(''), sounds, pool, i * 3 + 1)),
    ],
  };
}

const TH_TIP: Prompt = {
  en: 'Put your tongue gently between your teeth and blow.',
  hi: 'जीभ को दाँतों के बीच हल्के से रखो और हवा छोड़ो।',
};

const m8Pool = 'ship shop fish dish chin chick lunch bench bath moth ring king duck sock clock'.split(' ');

const module8: Module = {
  id: 'en-8',
  number: 8,
  title: 'Two Letters, One Sound',
  emoji: '🤝',
  sticker: '🐬',
  outcome: 'Read and write ship, chin, duck',
  lessons: [
    teamLesson('en-8-1', { id: 'sh', letters: 'sh', mouth: 'round', bridge: 'श', words: [['sh', 'i', 'p'], ['f', 'i', 'sh'], ['sh', 'o', 'p']] }, m8Pool),
    teamLesson('en-8-2', { id: 'ch', letters: 'ch', mouth: 'round', bridge: 'च', words: [['ch', 'i', 'n'], ['l', 'u', 'n', 'ch'], ['b', 'e', 'n', 'ch']] }, m8Pool),
    teamLesson('en-8-3', { id: 'th', letters: 'th', mouth: 'tongue', tip: TH_TIP, words: [['b', 'a', 'th'], ['m', 'o', 'th'], ['th', 'i', 'n']] }, [...m8Pool, 'thin']),
    {
      id: 'en-8-4',
      title: 'Soft th',
      emoji: '👉',
      activities: [
        { kind: 'see', title: 'th', emoji: '👉', caption: 'this', mouth: 'tongue', tip: { en: 'The same tongue, but your voice buzzes.', hi: 'जीभ वही रहती है, पर आवाज़ में गूँज आती है।' }, speech: [{ sound: 'th-voiced' }, { sound: 'th-voiced' }, { word: 'this' }] },
        { kind: 'speak', say: 'this', emoji: '👉' },
        { kind: 'speak', say: 'that', emoji: '👈' },
        { kind: 'spell', parts: ['th', 'i', 's'], extras: ['n', 'p'], emoji: '👉', speech: [{ word: 'this' }] },
        { kind: 'spell', parts: ['th', 'a', 't'], extras: ['m', 'o'], emoji: '👈', speech: [{ word: 'that' }] },
      ],
    },
    teamLesson('en-8-5', { id: 'ng', letters: 'ng', mouth: 'open', bridge: 'ङ', words: [['r', 'i', 'ng'], ['k', 'i', 'ng']] }, m8Pool),
    teamLesson('en-8-6', { id: 'ck', letters: 'ck', mouth: 'open', bridge: 'क', words: [['d', 'u', 'ck'], ['s', 'o', 'ck'], ['c', 'l', 'o', 'ck']] }, m8Pool),
  ],
};

const m9Pool = 'tree bee feet sheep moon spoon boot zoo rain tail snail train boat goat coat soap'.split(' ');

const module9: Module = {
  id: 'en-9',
  number: 9,
  title: 'Long Sounds',
  emoji: '🌈',
  sticker: '🦚',
  outcome: 'Read and write tree, moon, rain, boat',
  lessons: [
    teamLesson('en-9-1', { id: 'ee', letters: 'ee', mouth: 'smile', bridge: 'ई', words: [['t', 'r', 'ee'], ['b', 'ee'], ['f', 'ee', 't']] }, m9Pool),
    teamLesson('en-9-2', { id: 'oo', letters: 'oo', mouth: 'round', bridge: 'ऊ', words: [['m', 'oo', 'n'], ['s', 'p', 'oo', 'n'], ['b', 'oo', 't']] }, m9Pool),
    teamLesson('en-9-3', { id: 'ai', letters: 'ai', mouth: 'smile', bridge: 'ए', words: [['r', 'ai', 'n'], ['t', 'ai', 'l'], ['t', 'r', 'ai', 'n']] }, m9Pool),
    teamLesson('en-9-4', { id: 'oa', letters: 'oa', mouth: 'round', bridge: 'ओ', words: [['b', 'oa', 't'], ['g', 'oa', 't'], ['c', 'oa', 't']] }, m9Pool),
    blendLesson('en-9-5', 'ee and oo', '🌳', [['sh', 'ee', 'p'], ['z', 'oo']], m9Pool),
    blendLesson('en-9-6', 'ai and oa', '⛵', [['s', 'n', 'ai', 'l'], ['s', 'oa', 'p']], m9Pool),
  ],
};

const SIGHT_SETS = [
  ['the', 'a', 'I', 'is'],
  ['my', 'you', 'we', 'he'],
  ['she', 'to', 'and', 'in'],
  ['it', 'on', 'can', 'see'],
  ['go', 'no', 'yes', 'me'],
  ['this', 'that', 'for', 'are'],
];
const SIGHT_ALL = SIGHT_SETS.flat();

const module10: Module = {
  id: 'en-10',
  number: 10,
  title: 'Sight Words',
  emoji: '👀',
  sticker: '🦉',
  outcome: 'Read and write the, is, my, we',
  lessons: SIGHT_SETS.map((set, s): Lesson => ({
    id: `en-10-${s + 1}`,
    title: `Words: ${set[0]}, ${set[1]}…`,
    emoji: '👀',
    activities: set.flatMap((word, i): Activity[] => {
      const wrong = others(SIGHT_ALL, (w) => w === word, s * 4 + i, 2);
      return [
        { kind: 'see', title: word, speech: [{ word }] },
        matchPick(`Read the word ${word}`, P.findWord, { word }, { label: word }, wrong.map((w): PickOption => ({ label: w }))),
        { kind: 'spell', parts: word.split(''), extras: others(LETTER_ORDER, (l) => word.toLowerCase().includes(l), s + i, 2), speech: [{ word }] },
        { kind: 'speak', say: word },
      ];
    }),
  })),
};

const SENTENCES: [string, string, string, string][] = [
  ['I see a cat', '🐱', '🐶', '🐟'],
  ['I see a dog', '🐶', '🐷', '🐔'],
  ['The sun is hot', '☀️', '🌙', '🌧️'],
  ['The fish is in the dish', '🐟', '🚌', '🐝'],
  ['We can go on the bus', '🚌', '⛵', '🐐'],
  ['She can see the moon', '🌙', '☀️', '🌳'],
  ['He is in the boat', '⛵', '🚆', '🛏️'],
  ['This is my hat', '🎩', '🧦', '☕'],
  ['My pen is red', '🖊️', '🥚', '🐭'],
  ['The hen is on the bed', '🐔', '🐐', '🐜'],
  ['I can see a bee', '🐝', '🦊', '🚐'],
  ['The goat is in the rain', '🐐', '🐱', '🦁'],
];

function sentenceActivities([sentence, picture, wrong1, wrong2]: (typeof SENTENCES)[number], seed: number): Activity[] {
  const words = sentence.split(' ');
  return [
    { kind: 'see', title: `${sentence}.`, emoji: picture, speech: [{ text: sentence }] },
    matchPick(`Read: ${sentence}`, P.sentence, { text: sentence }, { emoji: picture }, [{ emoji: wrong1 }, { emoji: wrong2 }], `${sentence}.`),
    { kind: 'spell', parts: words, extras: others(SIGHT_ALL, (w) => words.includes(w), seed, 1), emoji: picture, speech: [{ text: sentence }], joinWithSpace: true },
    { kind: 'speak', say: sentence, emoji: picture },
  ];
}

interface Story { title: string; emoji: string; lines: string; question: string; right: [string, string]; wrong: [string, string][] }

const STORIES: Story[] = [
  { title: 'The Red Hen', emoji: '🐔', lines: 'This is a hen. The hen is red. The hen is on the bed.', question: 'Where is the hen?', right: ['on the bed', '🛏️'], wrong: [['in the bus', '🚌'], ['on the boat', '⛵']] },
  { title: 'Tom and the Dog', emoji: '🐶', lines: 'Tom has a dog. The dog can run. Tom and the dog see a duck.', question: 'What do they see?', right: ['a duck', '🦆'], wrong: [['a fish', '🐟'], ['a pig', '🐷']] },
];

const module11: Module = {
  id: 'en-11',
  number: 11,
  title: 'Sentences and Tiny Stories',
  emoji: '📖',
  sticker: '🦄',
  outcome: 'Read and write short sentences',
  lessons: [
    ...[0, 1, 2, 3].map((n): Lesson => ({
      id: `en-11-${n + 1}`,
      title: `Sentences ${n + 1}`,
      emoji: SENTENCES[n * 3][1],
      activities: SENTENCES.slice(n * 3, n * 3 + 3).flatMap((s, i) => sentenceActivities(s, n + i)),
    })),
    ...STORIES.map((story, n): Lesson => ({
      id: `en-11-${n + 5}`,
      title: story.title,
      emoji: story.emoji,
      activities: [
        ...story.lines.split('. ').map((line): Activity => {
          const text = line.replace(/\.$/, '');
          return { kind: 'see', title: `${text}.`, emoji: story.emoji, speech: [{ text }] };
        }),
        matchPick(story.question, P.question, { text: story.question }, { emoji: story.right[1], label: story.right[0] }, story.wrong.map(([label, emoji]): PickOption => ({ emoji, label })), story.question),
        { kind: 'speak', say: story.lines.split('. ')[0], emoji: story.emoji },
      ],
    })),
  ],
};

interface Talk { id: string; title: string; emoji: string; hear: string; reply: string; replyEmoji: string; wrong: string[]; hi: string }

const TALKS: Talk[] = [
  { id: 'en-12-1', title: 'Saying hello', emoji: '👋', hear: 'Hello!', reply: 'Hello!', replyEmoji: '👋', wrong: ['Bye!', 'Sorry!'], hi: 'नमस्ते / हैलो' },
  { id: 'en-12-2', title: 'How are you?', emoji: '😊', hear: 'How are you?', reply: 'I am fine.', replyEmoji: '😊', wrong: ['I am a bus.', 'It is red.'], hi: 'आप कैसे हैं? मैं ठीक हूँ।' },
  { id: 'en-12-3', title: 'My name', emoji: '🧒', hear: 'What is your name?', reply: 'My name is …', replyEmoji: '🧒', wrong: ['I am hot.', 'Yes, thank you.'], hi: 'आपका नाम क्या है?' },
  { id: 'en-12-4', title: 'Please and thank you', emoji: '🙏', hear: 'Here is your book.', reply: 'Thank you!', replyEmoji: '🙏', wrong: ['Good night!', 'I am six.'], hi: 'धन्यवाद' },
  { id: 'en-12-5', title: 'My family', emoji: '👨‍👩‍👧', hear: 'Who is this?', reply: 'This is my mother.', replyEmoji: '👩', wrong: ['This is a cat.', 'I can run.'], hi: 'ये मेरी माँ हैं।' },
  { id: 'en-12-6', title: 'Things I need', emoji: '💧', hear: 'What do you want?', reply: 'I want water, please.', replyEmoji: '💧', wrong: ['I am fine.', 'Good morning!'], hi: 'मुझे पानी चाहिए।' },
  { id: 'en-12-7', title: 'Saying sorry', emoji: '🥺', hear: 'You stepped on my foot.', reply: 'I am sorry.', replyEmoji: '🥺', wrong: ['I am red.', 'Good night!'], hi: 'मुझे माफ़ करना।' },
  { id: 'en-12-8', title: 'My age', emoji: '🎂', hear: 'How old are you?', reply: 'I am five years old.', replyEmoji: '🎂', wrong: ['I am at home.', 'Thank you!'], hi: 'मैं पाँच साल का हूँ।' },
  { id: 'en-12-9', title: 'What I like', emoji: '🥭', hear: 'What do you like?', reply: 'I like mangoes.', replyEmoji: '🥭', wrong: ['My name is Mango.', 'Sorry!'], hi: 'मुझे आम पसंद है।' },
  { id: 'en-12-10', title: 'Saying goodbye', emoji: '🤗', hear: 'Bye bye!', reply: 'Goodbye! See you soon.', replyEmoji: '🤗', wrong: ['Hello!', 'I am fine.'], hi: 'फिर मिलेंगे।' },
];

const module12: Module = {
  id: 'en-12',
  number: 12,
  title: 'Everyday Speaking',
  emoji: '🗣️',
  sticker: '🏆',
  outcome: 'Greet, say their name, ask and answer simple questions',
  lessons: TALKS.map((talk): Lesson => ({
    id: talk.id,
    title: talk.title,
    emoji: talk.emoji,
    activities: [
      { kind: 'see', title: talk.reply, emoji: talk.replyEmoji, caption: talk.hi, speech: [{ text: talk.reply.replace('…', '') }] },
      { kind: 'speak', say: talk.reply.replace(' …', ''), emoji: talk.replyEmoji },
      matchPick(`Reply to: ${talk.hear}`, P.reply, { text: talk.hear }, { label: talk.reply, emoji: talk.replyEmoji }, talk.wrong.map((label): PickOption => ({ label })), talk.hear),
      { kind: 'speak', say: talk.reply.replace(' …', ''), emoji: talk.replyEmoji },
    ],
  })),
};

export const english: Subject = {
  id: 'english',
  title: 'English',
  world: 'Alphabet Island',
  emoji: '🏝️',
  color: '#00b894',
  modules: [
    soundModule(1, 'First Sounds', '🐜', '🦜', ['s', 'a', 't', 'p', 'i', 'n']),
    module2(),
    soundModule(3, 'More Sounds', '🐶', '🐢', ['m', 'd', 'g', 'o', 'c', 'k'], [
      ...firstSoundLessons,
      twoLetterLesson('en-3-10', 'am, on', ['am', 'on'], TWO_LETTER),
    ]),
    soundModule(4, 'Even More Sounds', '🥚', '🦒', ['e', 'u', 'r', 'h', 'b', 'f', 'l'], [
      twoLetterLesson('en-4-8', 'up, if', ['up', 'if'], TWO_LETTER),
    ]),
    soundModule(5, 'All 26 Sounds', '🦓', '🐼', ['j', 'v', 'w', 'x', 'y', 'z', 'qu'], [vwLesson]),
    module6,
    module7,
    module8,
    module9,
    module10,
    module11,
    module12,
  ].map(enrich),
};
