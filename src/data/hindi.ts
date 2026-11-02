import type { Activity, Lesson, Module, PickOption, Prompt, Subject } from '../types';
import { enrich } from './enrich';
import { others } from './english';

type Letter = [letter: string, word?: string, emoji?: string];

const P = {
  starts: { en: 'Which picture starts with this letter?', hi: 'कौन सी तस्वीर इस अक्षर से शुरू होती है?' },
  has: { en: 'Which picture has this letter?', hi: 'किस तस्वीर के नाम में यह अक्षर है?' },
  letter: { en: 'Tap the letter you hear.', hi: 'जो अक्षर सुनाई दे, उसे दबाओ।' },
  word: { en: 'Tap the picture for this word.', hi: 'इस शब्द की तस्वीर दबाओ।' },
  syllable: { en: 'Tap what you hear.', hi: 'जो सुनाई दे, उसे दबाओ।' },
  sentence: { en: 'Which picture shows this?', hi: 'कौन सी तस्वीर यह दिखाती है?' },
  reply: { en: 'What do you say back?', hi: 'जवाब में क्या कहोगे?' },
} satisfies Record<string, Prompt>;

const pieces = (word: string): string[] =>
  Array.from(new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(word), (s) => s.segment);

const FILLERS = 'क ग च ज त द न प ब म र ल स ह का की मा रा ना पी सु रे लो'.split(' ');

function pick(label: string, visiblePrompt: Prompt, hi: string, correct: PickOption, wrong: PickOption[], focus?: string): Activity {
  return { kind: 'pick', label, visiblePrompt, focus, prompt: [{ prompt: visiblePrompt }, { hi }], options: [{ ...correct, correct: true }, ...wrong] };
}

function letterActivities([letter, word, emoji]: Letter, all: Letter[], seed: number): Activity[] {
  const letterChoices = others(all, ([l]) => l === letter, seed, 2);
  const activities: Activity[] = [
    { kind: 'see', title: letter, emoji, caption: word, speech: word ? [{ hi: letter }, { hi: letter }, { hi: word }] : [{ hi: letter }, { hi: letter }] },
    pick(`Hear ${letter}`, P.letter, letter, { label: letter }, letterChoices.map(([l]): PickOption => ({ label: l })), letter),
    { kind: 'trace', letter },
  ];
  if (word && emoji) {
    const pictures = all.filter((l) => l[1] && l[2]);
    const wrong = others(pictures, ([l, w]) => l === letter || w === word || Boolean(w?.includes(letter)), seed + 1, 2);
    activities.splice(1, 0, pick(`Find ${letter} in a word`, word.startsWith(letter) ? P.starts : P.has, letter, { emoji, label: word }, wrong.map(([, w, e]): PickOption => ({ emoji: e, label: w })), letter));
    activities.push({ kind: 'speak', say: word, emoji, lang: 'hi' });
  }
  return activities;
}

function letterModule(number: number, title: string, emoji: string, sticker: string, outcome: string, letters: Letter[], perLesson: number): Module {
  const id = `hi-${number}`;
  const lessons: Lesson[] = [];
  for (let i = 0; i < letters.length; i += perLesson) {
    const group = letters.slice(i, i + perLesson);
    lessons.push({
      id: `${id}-${lessons.length + 1}`,
      title: group.map(([l]) => l).join(' '),
      emoji: group.find((l) => l[2])?.[2] ?? '🔤',
      activities: group.flatMap((letter, n) => letterActivities(letter, letters, i + n + number)),
    });
  }
  return { id, number, title, emoji, sticker, outcome, lessons };
}

const SWAR: Letter[] = [
  ['अ', 'अनानास', '🍍'], ['आ', 'आम', '🥭'], ['इ', 'इमारत', '🏢'], ['ई', 'ईंट', '🧱'], ['उ', 'उल्लू', '🦉'], ['ऊ', 'ऊन', '🧶'],
  ['ऋ', 'ऋषि', '🧘'], ['ए', 'एक', '1️⃣'], ['ऐ', 'ऐनक', '👓'], ['ओ', 'ओखली', '🥣'], ['औ', 'औरत', '👩'], ['अं', 'अंगूर', '🍇'], ['अः', 'नमः', '🙏'],
];
const KA_VARG: Letter[] = [
  ['क', 'कबूतर', '🕊️'], ['ख', 'खरगोश', '🐰'], ['ग', 'गाय', '🐄'], ['घ', 'घर', '🏠'], ['ङ'],
  ['च', 'चम्मच', '🥄'], ['छ', 'छाता', '☂️'], ['ज', 'जहाज़', '🚢'], ['झ', 'झंडा', '🚩'], ['ञ'],
];
const TA_VARG: Letter[] = [
  ['ट', 'टमाटर', '🍅'], ['ठ', 'ठेला', '🛒'], ['ड', 'डमरू', '🥁'], ['ढ', 'ढोल', '🪘'], ['ण', 'बाण', '🏹'],
  ['त', 'तरबूज़', '🍉'], ['थ', 'थाली', '🍽️'], ['द', 'दरवाज़ा', '🚪'], ['ध', 'धनुष', '🏹'], ['न', 'नल', '🚰'],
];
const PA_VARG: Letter[] = [
  ['प', 'पतंग', '🪁'], ['फ', 'फूल', '🌸'], ['ब', 'बकरी', '🐐'], ['भ', 'भालू', '🐻'], ['म', 'मछली', '🐟'],
  ['य', 'यान', '🚀'], ['र', 'रस्सी', '🧵'], ['ल', 'लड़की', '👧'], ['व', 'वन', '🌳'],
  ['श', 'शेर', '🦁'], ['ष', 'षट्कोण', '🔯'], ['स', 'सेब', '🍎'], ['ह', 'हाथी', '🐘'],
];
const EXTRA: Letter[] = [
  ['क्ष', 'कक्षा', '🏫'], ['त्र', 'त्रिशूल', '🔱'], ['ज्ञ', 'ज्ञानी', '🧑‍🏫'], ['श्र', 'श्रमिक', '👷'], ['ड़', 'पहाड़', '⛰️'], ['ढ़', 'बढ़ई', '🪚'],
];

type Word = [word: string, emoji: string];

function wordActivities([word, emoji]: Word, pool: Word[], seed: number): Activity[] {
  const parts = pieces(word);
  const wrong = others(pool, ([w]) => w === word, seed, 2);
  return [
    { kind: 'blend', sounds: parts, word, emoji, lang: 'hi' },
    pick(`Read ${word}`, P.word, word, { emoji, label: word }, wrong.map(([w, e]): PickOption => ({ emoji: e, label: w }))),
    { kind: 'spell', parts, extras: others(FILLERS, (f) => parts.includes(f), seed + 2, 2), emoji, speech: [{ hi: word }] },
    { kind: 'speak', say: word, emoji, lang: 'hi' },
  ];
}

const wordLesson = (id: string, title: string, emoji: string, words: Word[], pool: Word[], intro: Activity[] = []): Lesson => ({
  id,
  title,
  emoji,
  activities: [...intro, ...words.flatMap((word, i) => wordActivities(word, pool, i * 3 + id.length))],
});

const PLAIN: Word[][] = [
  [['घर', '🏠'], ['नल', '🚰'], ['फल', '🍎']],
  [['जल', '💧'], ['बस', '🚌'], ['वन', '🌳']],
  [['हल', '🚜'], ['नव', '9️⃣'], ['पर', '🪶']],
  [['कमल', '🌸'], ['कलम', '🖊️'], ['नमक', '🧂']],
  [['मगर', '🐊'], ['बतख', '🦆'], ['शहर', '🏙️']],
  [['गरम', '🔥'], ['अचकन', '🧥'], ['सड़क', '🛣️']],
];

const module6: Module = {
  id: 'hi-6',
  number: 6,
  title: 'बिना मात्रा के शब्द',
  emoji: '🧩',
  sticker: '🪷',
  outcome: 'Read and write कमल, घर, नमक',
  lessons: PLAIN.map((words, i) => wordLesson(`hi-6-${i + 1}`, words[0][0], words[0][1], words, PLAIN.flat())),
};

interface Matra { mark: string; name: string; sample: string; words: Word[] }

function matraLessons(number: number, matras: Matra[], pool: Word[]): Lesson[] {
  return matras.flatMap((m, i): Lesson[] => {
    const intro: Activity[] = [
      { kind: 'see', title: `क + ${m.mark} = ${m.sample}`, caption: m.name, speech: [{ hi: 'क' }, { hi: m.sample }, { hi: m.sample }] },
      { kind: 'trace', letter: m.sample },
    ];
    const mid = Math.ceil(m.words.length / 2);
    return [
      wordLesson(`hi-${number}-${i * 2 + 1}`, `${m.name} 1`, m.words[0][1], m.words.slice(0, mid), pool, intro),
      wordLesson(`hi-${number}-${i * 2 + 2}`, `${m.name} 2`, m.words[mid][1], m.words.slice(mid), pool),
    ];
  });
}

const M7: Matra[] = [
  { mark: 'ा', name: 'आ की मात्रा', sample: 'का', words: [['नाक', '👃'], ['कान', '👂'], ['हाथ', '✋'], ['ताला', '🔒']] },
  { mark: 'ि', name: 'इ की मात्रा', sample: 'कि', words: [['दिन', '🌞'], ['दिल', '❤️'], ['सिर', '🧑'], ['किला', '🏰']] },
  { mark: 'ी', name: 'ई की मात्रा', sample: 'की', words: [['नदी', '🏞️'], ['तीर', '🏹'], ['खीर', '🍮'], ['सीप', '🐚']] },
];
const M8: Matra[] = [
  { mark: 'ु', name: 'उ की मात्रा', sample: 'कु', words: [['गुलाब', '🌹'], ['पुल', '🌉'], ['मुकुट', '👑'], ['चुप', '🤫']] },
  { mark: 'ू', name: 'ऊ की मात्रा', sample: 'कू', words: [['आलू', '🥔'], ['भालू', '🐻'], ['सूरज', '☀️'], ['फूल', '🌸']] },
  { mark: 'ृ', name: 'ऋ की मात्रा', sample: 'कृ', words: [['मृग', '🦌'], ['गृह', '🏡'], ['कृषि', '🌾'], ['वृक्ष', '🌲']] },
];
const M9: Matra[] = [
  { mark: 'े', name: 'ए की मात्रा', sample: 'के', words: [['सेब', '🍎'], ['मेज़', '🪑'], ['रेल', '🚂'], ['केला', '🍌']] },
  { mark: 'ै', name: 'ऐ की मात्रा', sample: 'कै', words: [['पैर', '🦶'], ['बैल', '🐂'], ['थैला', '👜'], ['मैना', '🐦']] },
  { mark: 'ो', name: 'ओ की मात्रा', sample: 'को', words: [['मोर', '🦚'], ['तोता', '🦜'], ['रोटी', '🫓'], ['घोड़ा', '🐴']] },
  { mark: 'ौ', name: 'औ की मात्रा', sample: 'कौ', words: [['नौका', '⛵'], ['कौआ', '🐦'], ['मौसम', '🌦️'], ['चौका', '4️⃣']] },
];

const wordsOf = (matras: Matra[]) => matras.flatMap((m) => m.words);

const matraModule = (number: number, title: string, sticker: string, outcome: string, matras: Matra[]): Module => ({
  id: `hi-${number}`,
  number,
  title,
  emoji: '🎀',
  sticker,
  outcome,
  lessons: matraLessons(number, matras, wordsOf(matras)),
});

const NASAL: Word[][] = [
  [['चंदा', '🌙'], ['पंखा', '🌀'], ['बंदर', '🐒']],
  [['अंडा', '🥚'], ['शंख', '🐚'], ['गेंद', '⚽']],
  [['चाँद', '🌜'], ['आँख', '👁️'], ['ऊँट', '🐫'], ['दाँत', '🦷']],
];

const VOWEL_SIGNS = ['', 'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः'];

function barahkhadiLesson(id: string, base: string): Lesson {
  const row = VOWEL_SIGNS.map((sign) => base + sign);
  return {
    id,
    title: `बारहखड़ी ${base}`,
    emoji: '🔠',
    activities: [
      ...row.map((syllable): Activity => ({ kind: 'see', title: syllable, speech: [{ hi: syllable }] })),
      ...row.slice(1, 7).map((syllable, i): Activity => pick(`Hear ${syllable}`, P.syllable, syllable, { label: syllable }, others(row, (s) => s === syllable, i + 2, 2).map((s): PickOption => ({ label: s })), syllable)),
      { kind: 'speak', say: row.slice(0, 4).join(' '), lang: 'hi' },
    ],
  };
}

const module10: Module = {
  id: 'hi-10',
  number: 10,
  title: 'अनुस्वार, चंद्रबिंदु और बारहखड़ी',
  emoji: '🌙',
  sticker: '🦚',
  outcome: 'Read and write चंदा, चाँद, and say the बारहखड़ी',
  lessons: [
    wordLesson('hi-10-1', 'अनुस्वार ं 1', '🌙', NASAL[0], NASAL.flat(), [{ kind: 'see', title: 'ं', caption: 'चंदा', emoji: '🌙', speech: [{ hi: 'चंदा' }] }]),
    wordLesson('hi-10-2', 'अनुस्वार ं 2', '🥚', NASAL[1], NASAL.flat()),
    wordLesson('hi-10-3', 'चंद्रबिंदु ँ', '🌜', NASAL[2], NASAL.flat(), [{ kind: 'see', title: 'ँ', caption: 'चाँद', emoji: '🌜', speech: [{ hi: 'चाँद' }] }]),
    barahkhadiLesson('hi-10-4', 'क'),
    barahkhadiLesson('hi-10-5', 'ग'),
    barahkhadiLesson('hi-10-6', 'म'),
  ],
};

const SENTENCES: [string, string, string, string][] = [
  ['यह मेरा घर है', '🏠', '🚌', '🌳'],
  ['गाय घास खाती है', '🐄', '🐟', '🦜'],
  ['सूरज निकला', '☀️', '🌙', '🌧️'],
  ['मोर नाच रहा है', '🦚', '🐻', '🐘'],
  ['बस आ गई', '🚌', '⛵', '🚂'],
  ['मछली पानी में है', '🐟', '🐐', '🐒'],
  ['मुझे आम पसंद है', '🥭', '🥔', '🍅'],
  ['चाँद चमक रहा है', '🌜', '☀️', '🔥'],
  ['हाथी बड़ा है', '🐘', '🐜', '🐭'],
  ['बच्चा दूध पीता है', '🥛', '🍅', '🧂'],
  ['पतंग उड़ रही है', '🪁', '⚽', '🚪'],
  ['तोता हरा है', '🦜', '🐻', '🐄'],
];

const FILL_WORDS = ['नल', 'घर', 'फूल', 'लाल', 'बस'];

function sentenceActivities([sentence, picture, wrong1, wrong2]: (typeof SENTENCES)[number], seed: number): Activity[] {
  const words = sentence.split(' ');
  return [
    { kind: 'see', title: `${sentence}।`, emoji: picture, speech: [{ hi: sentence }] },
    pick(`Read: ${sentence}`, P.sentence, sentence, { emoji: picture }, [{ emoji: wrong1 }, { emoji: wrong2 }], `${sentence}।`),
    { kind: 'spell', parts: words, extras: others(FILL_WORDS, (w) => words.includes(w), seed, 1), emoji: picture, speech: [{ hi: sentence }], joinWithSpace: true },
    { kind: 'speak', say: sentence, emoji: picture, lang: 'hi' },
  ];
}

interface Story { title: string; emoji: string; lines: string[]; question: string; right: Word; wrong: Word[] }

const STORIES: Story[] = [
  { title: 'राजू की बकरी', emoji: '🐐', lines: ['राजू के पास एक बकरी है', 'बकरी का रंग सफ़ेद है', 'बकरी घास खाती है'], question: 'बकरी क्या खाती है?', right: ['घास', '🌿'], wrong: [['मछली', '🐟'], ['रोटी', '🫓']] },
  { title: 'मीना की पतंग', emoji: '🪁', lines: ['मीना के पास पतंग है', 'पतंग लाल है', 'पतंग आसमान में उड़ती है'], question: 'पतंग कहाँ उड़ती है?', right: ['आसमान में', '☁️'], wrong: [['पानी में', '🌊'], ['घर में', '🏠']] },
];

const module11: Module = {
  id: 'hi-11',
  number: 11,
  title: 'वाक्य और छोटी कहानियाँ',
  emoji: '📖',
  sticker: '🦋',
  outcome: 'Read and write simple sentences',
  lessons: [
    ...[0, 1, 2, 3].map((n): Lesson => ({
      id: `hi-11-${n + 1}`,
      title: `वाक्य ${n + 1}`,
      emoji: SENTENCES[n * 3][1],
      activities: SENTENCES.slice(n * 3, n * 3 + 3).flatMap((s, i) => sentenceActivities(s, n + i)),
    })),
    ...STORIES.map((story, n): Lesson => ({
      id: `hi-11-${n + 5}`,
      title: story.title,
      emoji: story.emoji,
      activities: [
        ...story.lines.map((line): Activity => ({ kind: 'see', title: `${line}।`, emoji: story.emoji, speech: [{ hi: line }] })),
        pick(story.question, { en: 'Listen and choose.', hi: 'सुनो और चुनो।' }, story.question, { label: story.right[0], emoji: story.right[1] }, story.wrong.map(([label, emoji]): PickOption => ({ label, emoji })), story.question),
        { kind: 'speak', say: story.lines[0], emoji: story.emoji, lang: 'hi' },
      ],
    })),
  ],
};

interface Talk { id: string; title: string; emoji: string; hear: string; reply: string; wrong: string[] }

const TALKS: Talk[] = [
  { id: 'hi-12-1', title: 'नमस्ते', emoji: '🙏', hear: 'नमस्ते!', reply: 'नमस्ते!', wrong: ['फिर मिलेंगे!', 'मुझे भूख लगी है।'] },
  { id: 'hi-12-2', title: 'आप कैसे हैं?', emoji: '😊', hear: 'आप कैसे हैं?', reply: 'मैं ठीक हूँ।', wrong: ['यह लाल है।', 'मैं बस हूँ।'] },
  { id: 'hi-12-3', title: 'मेरा नाम', emoji: '🧒', hear: 'आपका नाम क्या है?', reply: 'मेरा नाम …', wrong: ['मैं छह साल का हूँ।', 'धन्यवाद।'] },
  { id: 'hi-12-4', title: 'धन्यवाद', emoji: '💐', hear: 'यह लो तुम्हारी किताब।', reply: 'धन्यवाद!', wrong: ['शुभ रात्रि!', 'यह घर है।'] },
  { id: 'hi-12-5', title: 'मेरा परिवार', emoji: '👨‍👩‍👧', hear: 'ये कौन हैं?', reply: 'ये मेरी माँ हैं।', wrong: ['यह बिल्ली है।', 'मैं दौड़ता हूँ।'] },
  { id: 'hi-12-6', title: 'मुझे चाहिए', emoji: '💧', hear: 'तुम्हें क्या चाहिए?', reply: 'मुझे पानी चाहिए।', wrong: ['मैं ठीक हूँ।', 'सुप्रभात!'] },
  { id: 'hi-12-7', title: 'माफ़ करना', emoji: '🥺', hear: 'तुमने मेरा पैर दबा दिया।', reply: 'मुझे माफ़ करना।', wrong: ['यह लाल है।', 'शुभ रात्रि!'] },
  { id: 'hi-12-8', title: 'मेरी उम्र', emoji: '🎂', hear: 'तुम कितने साल के हो?', reply: 'मैं पाँच साल का हूँ।', wrong: ['मैं घर पर हूँ।', 'धन्यवाद!'] },
  { id: 'hi-12-9', title: 'मुझे पसंद है', emoji: '🥭', hear: 'तुम्हें क्या पसंद है?', reply: 'मुझे आम पसंद है।', wrong: ['मेरा नाम आम है।', 'माफ़ करना!'] },
  { id: 'hi-12-10', title: 'फिर मिलेंगे', emoji: '🤗', hear: 'अच्छा, चलते हैं!', reply: 'फिर मिलेंगे!', wrong: ['नमस्ते!', 'मैं ठीक हूँ।'] },
];

const module12: Module = {
  id: 'hi-12',
  number: 12,
  title: 'रोज़ की बातचीत',
  emoji: '🗣️',
  sticker: '🏆',
  outcome: 'Speak about themselves, their family and daily life',
  lessons: TALKS.map((talk): Lesson => {
    const plain = talk.reply.replace(' …', '').replace(/[!।]/g, '');
    return {
      id: talk.id,
      title: talk.title,
      emoji: talk.emoji,
      activities: [
        { kind: 'see', title: talk.reply, emoji: talk.emoji, speech: [{ hi: plain }] },
        { kind: 'speak', say: plain, emoji: talk.emoji, lang: 'hi' },
        pick(`Reply to: ${talk.hear}`, P.reply, talk.hear, { label: talk.reply, emoji: talk.emoji }, talk.wrong.map((label): PickOption => ({ label })), talk.hear),
        { kind: 'speak', say: plain, emoji: talk.emoji, lang: 'hi' },
      ],
    };
  }),
};

export const hindi: Subject = {
  id: 'hindi',
  title: 'Hindi',
  world: 'अक्षर Garden',
  emoji: '🌻',
  color: '#fd9644',
  modules: [
    letterModule(1, 'स्वर', '🥭', '🌻', 'Read, write and say all vowels', SWAR, 2),
    letterModule(2, 'व्यंजन क–ञ', '🕊️', '🕊️', 'Read, write and say क to ञ', KA_VARG, 2),
    letterModule(3, 'व्यंजन ट–न', '🍅', '🍅', 'Read, write and say ट to न', TA_VARG, 2),
    letterModule(4, 'व्यंजन प–ह', '🐘', '🐘', 'Read, write and say प to ह', PA_VARG, 2),
    letterModule(5, 'क्ष, त्र, ज्ञ, श्र, ड़, ढ़', '🔱', '🔱', 'Finish the full वर्णमाला', EXTRA, 1),
    module6,
    matraModule(7, 'मात्राएँ ा ि ी', '🎀', 'Read and write words such as नाक, दिन, नदी', M7),
    matraModule(8, 'मात्राएँ ु ू ृ', '🌹', 'Read and write words such as गुलाब, फूल', M8),
    matraModule(9, 'मात्राएँ े ै ो ौ', '🦜', 'Read and write words such as मोर, केला', M9),
    module10,
    module11,
    module12,
  ].map(enrich),
};
