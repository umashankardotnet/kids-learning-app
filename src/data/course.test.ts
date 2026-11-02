import { describe, expect, it } from 'vitest';
import { estimateMinutes } from './enrich';
import { hindiToRoman } from '../lib/hindiRoman';
import { audioClips, buildFinalTest, buildModuleTest, findActivity, activityKey, starsFor } from './course';
import { english } from './english';
import { hindi } from './hindi';
import { STROKES } from './strokes';
import { coverage, markCovered } from '../lib/trace';
import { matchesSpeech } from '../lib/recognition';
import { worksheetContent } from '../screens/Worksheet';

const lessons = english.modules.flatMap((m) => m.lessons);
const activities = lessons.flatMap((l) => l.activities);

describe('English course', () => {
  it('has 12 modules of 6 to 14 lessons each', () => {
    expect(english.modules).toHaveLength(12);
    for (const mod of english.modules) {
      expect(mod.lessons.length).toBeGreaterThanOrEqual(6);
      expect(mod.lessons.length).toBeLessThanOrEqual(14);
    }
  });

  it('uses unique lesson ids', () => {
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('teaches all 26 letters, small and capital', () => {
    const traced = new Set(activities.flatMap((a) => (a.kind === 'trace' ? [a.letter] : [])));
    expect(traced.size).toBe(52);
  });

  it('has handwriting strokes for every traced letter', () => {
    for (const a of activities) if (a.kind === 'trace') expect(STROKES[a.letter], a.letter).toBeDefined();
  });

  it('gives every question exactly one right answer and no repeated options', () => {
    for (const a of activities) {
      if (a.kind !== 'pick') continue;
      expect(a.options.filter((o) => o.correct), a.label).toHaveLength(1);
      const shown = a.options.map((o) => `${o.emoji}|${o.label}`);
      expect(new Set(shown).size, `${a.label}: ${shown}`).toBe(shown.length);
      expect(a.options.length, a.label).toBeGreaterThanOrEqual(2);
    }
  });

  it('never uses a right piece as a wrong spelling tile', () => {
    for (const a of activities) {
      if (a.kind !== 'spell') continue;
      for (const extra of a.extras) expect(a.parts, a.parts.join('')).not.toContain(extra);
    }
  });

  it('blends join up to the word', () => {
    for (const a of activities) if (a.kind === 'blend') expect(a.sounds.join('')).toBe(a.word);
  });

  it('lists the audio to record', () => {
    const { sounds, words } = audioClips();
    expect(sounds).toEqual(expect.arrayContaining(['s', 'qu', 'sh', 'th', 'th-voiced', 'ee']));
    expect(words.length).toBeGreaterThan(50);
  });
});

describe('tests and scoring', () => {
  it('builds a varied 8-question test for every module', () => {
    for (const mod of english.modules) {
      const test = buildModuleTest(mod);
      expect(test, mod.title).toHaveLength(8);
      expect(new Set(test.map((t) => t.key)).size).toBe(8);
      expect(test.some((t) => t.activity.kind === 'see')).toBe(false);
    }
  });

  it('builds a final test across all modules', () => {
    expect(buildFinalTest(english)).toHaveLength(24);
  });

  it('awards at least one star', () => {
    expect(starsFor(0, 8)).toBe(1);
    expect(starsFor(5, 8)).toBe(2);
    expect(starsFor(7, 8)).toBe(3);
    expect(starsFor(0, 0)).toBe(3);
  });

  it('finds an activity from its key', () => {
    const lesson = lessons[3];
    expect(findActivity(activityKey(lesson.id, 1))).toBe(lesson.activities[1]);
  });
});

describe('tracing', () => {
  it('only counts points near the finger', () => {
    const samples = [{ x: 0, y: 0 }, { x: 50, y: 0 }];
    const covered = markCovered(samples, [false, false], { x: 2, y: 2 });
    expect(covered).toEqual([true, false]);
    expect(coverage(covered)).toBe(0.5);
  });
});

describe('speech matching', () => {
  it('accepts the word within a longer phrase and ignores punctuation', () => {
    expect(matchesSpeech(['a cat'], 'cat')).toBe(true);
    expect(matchesSpeech(['Hello!'], 'Hello!')).toBe(true);
  });

  it('allows a small slip in a sentence but not a different word', () => {
    expect(matchesSpeech(['the sun is hot today'], 'The sun is hot')).toBe(true);
    expect(matchesSpeech(['sun hot is'], 'The sun is hot')).toBe(true);
    expect(matchesSpeech(['dog'], 'cat')).toBe(false);
  });
});

describe('worksheets', () => {
  it('has something to print for every module', () => {
    for (const mod of english.modules) {
      const { letters, words } = worksheetContent(mod);
      expect(letters.length + words.length, mod.title).toBeGreaterThan(0);
    }
  });
});

describe('Hindi course', () => {
  const hindiLessons = hindi.modules.flatMap((m) => m.lessons);
  const all = hindiLessons.flatMap((l) => l.activities);

  it('has 12 modules of 5 to 14 lessons each', () => {
    expect(hindi.modules).toHaveLength(12);
    for (const mod of hindi.modules) {
      expect(mod.lessons.length, mod.title).toBeGreaterThanOrEqual(5);
      expect(mod.lessons.length, mod.title).toBeLessThanOrEqual(14);
    }
  });

  it('uses unique lesson ids', () => {
    const ids = hindiLessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('teaches the whole alphabet', () => {
    const traced = new Set(all.flatMap((a) => (a.kind === 'trace' ? [a.letter] : [])));
    for (const letter of 'अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह') expect(traced, letter).toContain(letter);
    for (const letter of ['अं', 'अः', 'क्ष', 'त्र', 'ज्ञ', 'श्र', 'ड़', 'ढ़']) expect(traced, letter).toContain(letter);
  });

  it('gives every question exactly one right answer and no repeated options', () => {
    for (const a of all) {
      if (a.kind !== 'pick') continue;
      expect(a.options.filter((o) => o.correct), a.label).toHaveLength(1);
      const shown = a.options.map((o) => `${o.emoji}|${o.label}`);
      expect(new Set(shown).size, `${a.label}: ${shown}`).toBe(shown.length);
      expect(new Set(a.options.map((o) => o.emoji ?? o.label)).size, `${a.label}: same picture`).toBe(shown.length);
    }
  });

  it('builds words from pieces that join up', () => {
    for (const a of all) {
      if (a.kind === 'blend') expect(a.sounds.join('')).toBe(a.word);
      if (a.kind === 'spell') for (const extra of a.extras) expect(a.parts, a.parts.join('')).not.toContain(extra);
    }
  });

  it('builds tests and has worksheets for every module', () => {
    for (const mod of hindi.modules) {
      expect(new Set(buildModuleTest(mod).map((t) => t.key)).size, mod.title).toBe(8);
      expect(worksheetContent(mod).letters.length + worksheetContent(mod).words.length, mod.title).toBeGreaterThan(0);
    }
  });

  it('matches Hindi speech', () => {
    expect(matchesSpeech(['मैं ठीक हूँ।'], 'मैं ठीक हूँ')).toBe(true);
    expect(matchesSpeech(['घर'], 'नल')).toBe(false);
  });

  it('lists Hindi clips', () => {
    expect(audioClips().hindi).toEqual(expect.arrayContaining(['क', 'कमल']));
  });
});

describe('questions show what they ask about', () => {
  it('shows the letter, word or sentence the question is about', () => {
    const everything = [...english.modules, ...hindi.modules].flatMap((m) => m.lessons).flatMap((l) => l.activities);
    const needsFocus = /makes this sound|you hear|starts with|ends with|has this letter|rhymes|same sound|small letter|shows this|say back|Listen and choose/;
    for (const a of everything) {
      if (a.kind === 'pick' && needsFocus.test(a.visiblePrompt.en)) expect(a.focus, a.label).toBeTruthy();
      if (a.kind === 'pick') expect(a.prompt.length, a.label).toBeGreaterThan(1);
    }
  });
});

describe('English order', () => {
  it('starts with phonics, then two-letter words', () => {
    expect(english.modules[0].title).toBe('First Sounds');
    expect(english.modules[1].title).toBe('Two-Letter Words');
    const firstSounds = new Set('satpin');
    for (const a of english.modules[1].lessons.flatMap((l) => l.activities)) {
      if (a.kind === 'blend') for (const sound of a.sounds) expect(firstSounds, sound).toContain(sound);
    }
  });
});

describe('Hindi spelled for an English voice', () => {
  it('reads letters and words', () => {
    expect(hindiToRoman('क')).toBe('ka');
    expect(hindiToRoman('कमल')).toBe('kamal');
    expect(hindiToRoman('आम')).toBe('aam');
    expect(hindiToRoman('मोर')).toBe('mor');
  });
});

describe('module length and games', () => {
  const modules = [...english.modules, ...hindi.modules];

  it('gives every module at least 10 minutes', () => {
    for (const mod of modules) expect(estimateMinutes(mod), mod.id).toBeGreaterThanOrEqual(10);
  });

  it('has valid balloon and matching games', () => {
    let games = 0;
    for (const a of modules.flatMap((m) => m.lessons).flatMap((l) => l.activities)) {
      if (a.kind === 'pop') {
        games++;
        expect(a.balloons.filter((b) => b === a.target)).toHaveLength(3);
        expect(new Set(a.balloons).size, a.target).toBeGreaterThan(1);
      }
      if (a.kind === 'match') {
        games++;
        expect(new Set(a.pairs.map((p) => p.text)).size).toBe(a.pairs.length);
        expect(new Set(a.pairs.map((p) => p.emoji)).size).toBe(a.pairs.length);
      }
    }
    expect(games).toBeGreaterThan(50);
  });

  it('prints the module lengths', () => {
    console.log(modules.map((m) => m.id + ':' + m.lessons.length + 'L/' + Math.round(estimateMinutes(m)) + 'm').join(' '));
  });
});

describe('Hindi vowels spoken alone', () => {
  it('uses sound spellings, not English letter names', () => {
    expect(hindiToRoman('छोटी इ')).toBe('chhotee ih');
    expect(hindiToRoman('अ')).toBe('uh');
    expect(hindiToRoman('ए')).toBe('ay');
  });
});
