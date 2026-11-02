import { Howl } from 'howler';
import { hindiToRoman } from './hindiRoman';
import { getState, type SpeechSpeed } from './store';
import type { SpeechPart } from '../types';

/**
 * Temporary stand-ins for phonics sounds. Device voices cannot make pure sounds,
 * so these are only used until the recorded clip exists in public/audio/phonics.
 */
const SOUND_STANDIN: Record<string, string> = {
  s: 'sss', a: 'ah', t: 'tuh', p: 'puh', i: 'ih', n: 'nnn', m: 'mmm', d: 'duh', g: 'guh', o: 'aw', c: 'kuh', k: 'kuh',
  e: 'eh', u: 'uh', r: 'rrr', h: 'huh', b: 'buh', f: 'fff', l: 'lll', j: 'juh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh',
  z: 'zzz', qu: 'kwuh', q: 'kuh', sh: 'shh', ch: 'chuh', th: 'thh', 'th-voiced': 'the', ng: 'ng', ck: 'kuh', ee: 'ee', oo: 'oo', ai: 'ay', oa: 'oh',
};

/** Voice speed and the quiet gap after each sound or word, so children can take it in. */
const PACE: Record<SpeechSpeed, { rate: number; pause: number }> = {
  normal: { rate: 1, pause: 500 },
  slow: { rate: 0.9, pause: 900 },
  slower: { rate: 0.8, pause: 1400 },
};

const pace = () => PACE[getState().speed];

/** A wait after an answer, stretched to match the chosen speech speed. */
export const readTime = (ms: number): number => ms + pace().pause;

/** The way teachers name these vowels, which also stops voices misreading them alone. */
const HINDI_LETTER_NAMES: Record<string, string> = { इ: 'छोटी इ', ई: 'बड़ी ई', उ: 'छोटा उ', ऊ: 'बड़ा ऊ' };

let run = 0;
let current: Howl | null = null;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Recorded clips bundled with the app. Anything not here goes straight to the device voice. */
const CLIPS = import.meta.glob('/src/audio/**/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const langOf = (voice: SpeechSynthesisVoice) => voice.lang.replace('_', '-').toLowerCase();

/** Picks the first match, with the better-sounding online voices ahead of the rest. */
function bestVoice(lang: string): SpeechSynthesisVoice | undefined {
  const matches = speechSynthesis.getVoices().filter((v) => langOf(v) === lang);
  return matches.find((v) => /natural|neural/i.test(v.name)) ?? matches.find((v) => /online|google/i.test(v.name)) ?? matches[0];
}

/** English prefers an Indian voice. A Hindi voice reading English also sounds Indian. */
const voiceFor = (lang: 'en' | 'hi') =>
  lang === 'hi'
    ? bestVoice('hi-in')
    : bestVoice('en-in') ?? bestVoice('hi-in') ?? speechSynthesis.getVoices().find((v) => langOf(v).startsWith('en'));

export const hasHindiVoice = (): boolean => 'speechSynthesis' in window && Boolean(bestVoice('hi-in'));
export const hasIndianEnglishVoice = (): boolean => 'speechSynthesis' in window && Boolean(bestVoice('en-in') ?? bestVoice('hi-in'));

/** Browsers fill the voice list a moment after the page loads. */
function voicesReady(): Promise<void> {
  if (speechSynthesis.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    speechSynthesis.addEventListener('voiceschanged', () => resolve(), { once: true });
    setTimeout(resolve, 1000);
  });
}

async function speakDevice(spoken: string, spokenLang: 'en-IN' | 'hi-IN', isCurrent: () => boolean): Promise<void> {
  if (!('speechSynthesis' in window) || !isCurrent()) return;
  await voicesReady();
  if (!isCurrent()) return;
  const noHindi = spokenLang === 'hi-IN' && !hasHindiVoice();
  const text = noHindi ? hindiToRoman(spoken) : spoken;
  const lang = noHindi ? 'en-IN' : spokenLang;
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = pace().rate;
    const voice = voiceFor(lang === 'hi-IN' ? 'hi' : 'en');
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    // Some devices never fire onend, so a lesson must not wait forever.
    setTimeout(finish, 2000 + (text.length * 120) / pace().rate);
    speechSynthesis.speak(utterance);
  });
}

function playClip(path: string, isCurrent: () => boolean): Promise<boolean> {
  const url = CLIPS[`/src/audio/${path}.mp3`];
  if (!url) return Promise.resolve(false);
  if (!isCurrent()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const howl = new Howl({
      src: [url],
      onend: () => resolve(true),
      onloaderror: () => resolve(false),
      onplayerror: () => resolve(false),
    });
    current = howl;
    howl.play();
  });
}

async function playPart(part: SpeechPart, isCurrent: () => boolean): Promise<void> {
  const lang = getState().lang;
  if ('prompt' in part) {
    const hindi = lang === 'hi' && hasHindiVoice();
    return speakDevice(part.prompt[hindi ? 'hi' : 'en'], hindi ? 'hi-IN' : 'en-IN', isCurrent);
  }
  if ('text' in part) return speakDevice(part.text, 'en-IN', isCurrent);
  if ('hi' in part) {
    const played = await playClip(`hindi/${part.hi}`, isCurrent);
    if (!played) await speakDevice(HINDI_LETTER_NAMES[part.hi] ?? part.hi, 'hi-IN', isCurrent);
    return;
  }
  if ('sound' in part) {
    const played = await playClip(`phonics/${part.sound}`, isCurrent);
    if (!played) await speakDevice(SOUND_STANDIN[part.sound] ?? part.sound, 'en-IN', isCurrent);
    return;
  }
  const played = await playClip(`words/${part.word}`, isCurrent);
  if (!played) await speakDevice(part.word, 'en-IN', isCurrent);
}

export function stopSpeech(): void {
  run++;
  current?.stop();
  current = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/** Says each part in turn. Starting a new one stops whatever was playing. */
export async function say(parts: SpeechPart[]): Promise<void> {
  stopSpeech();
  if (getState().muted) return;
  const mine = run;
  const isCurrent = () => mine === run;
  // Chrome can drop speech queued straight after a cancel.
  await delay(120);
  for (const part of parts) {
    if (!isCurrent()) return;
    await playPart(part, isCurrent);
    await delay(pace().pause);
  }
}

let sfx: AudioContext | null = null;

function tones(notes: [number, number][], type: OscillatorType = 'triangle'): void {
  if (getState().muted) return;
  sfx ??= new AudioContext();
  const context = sfx;
  void context.resume();
  let at = context.currentTime;
  for (const [frequency, length] of notes) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.12, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + length);
    osc.connect(gain).connect(context.destination);
    osc.start(at);
    osc.stop(at + length);
    at += length * 0.8;
  }
}

export const sfxRight = () => tones([[523, 0.12], [659, 0.12], [784, 0.2]]);
export const sfxTryAgain = () => tones([[330, 0.14], [294, 0.18]], 'sine');
export const sfxTap = () => tones([[660, 0.06]]);
export const sfxWin = () => tones([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.32]]);
