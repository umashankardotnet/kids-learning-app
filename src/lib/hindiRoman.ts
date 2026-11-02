const VOWELS: Record<string, string> = {
  अ: 'a', आ: 'aa', इ: 'i', ई: 'ee', उ: 'u', ऊ: 'oo', ऋ: 'ri', ए: 'ay', ऐ: 'ai', ओ: 'o', औ: 'au',
};
const MATRAS: Record<string, string> = {
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri', 'े': 'ay', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
};
const CONSONANTS: Record<string, string> = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'ng', च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'ny',
  ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n', त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n',
  प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm', य: 'y', र: 'r', ल: 'l', व: 'v',
  श: 'sh', ष: 'sh', स: 's', ह: 'h',
};
const VIRAMA = '्';
const NUKTA = '़';
const MARKS: Record<string, string> = { 'ं': 'n', 'ँ': 'n', 'ः': 'h' };

/** English voices read a lone "i" or "a" as the letter's English name, so vowels alone get sound spellings. */
const LONE_VOWELS: Record<string, string> = {
  अ: 'uh', आ: 'aah', इ: 'ih', ई: 'ee', उ: 'oo', ऊ: 'oooo', ए: 'ay', ऐ: 'ae', ओ: 'oh', औ: 'aw', अं: 'ung', अः: 'uh-h',
};

function romanWord(word: string): string {
  if (LONE_VOWELS[word]) return LONE_VOWELS[word];
  const chars = Array.from(word).filter((c) => c !== NUKTA);
  let out = '';
  let lastSchwa = -1;
  chars.forEach((c, i) => {
    const next = chars[i + 1];
    if (CONSONANTS[c]) {
      out += CONSONANTS[c];
      if (next !== VIRAMA && !(next && MATRAS[next])) {
        out += 'a';
        lastSchwa = out.length - 1;
      }
    } else if (MATRAS[c]) out += MATRAS[c];
    else if (VOWELS[c]) out += VOWELS[c];
    else if (MARKS[c]) out += MARKS[c];
    else if (c !== VIRAMA) out += c;
  });
  // Spoken Hindi drops the final "a": कमल is "kamal", but क alone stays "ka".
  const syllables = chars.filter((c) => CONSONANTS[c] || VOWELS[c]).length;
  return syllables > 1 && lastSchwa === out.length - 1 ? out.slice(0, -1) : out;
}

/** Spells Hindi in Latin letters so an English voice can say it on devices with no Hindi voice. */
export const hindiToRoman = (text: string): string => text.replace(/।/g, '.').split(' ').map(romanWord).join(' ');
