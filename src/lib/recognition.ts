/** Minimal shape of the browser speech recogniser, which TypeScript does not ship. */
interface Recognizer {
  lang: string;
  maxAlternatives: number;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognizerClass = new () => Recognizer;

const getRecognizer = (): RecognizerClass | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecognizerClass; webkitSpeechRecognition?: RecognizerClass };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export const canCheckSpeech = (): boolean => Boolean(getRecognizer());

export const normalize = (text: string): string =>
  text.toLowerCase().replace(/[^\p{L}\p{M}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

/** Small children get partial credit: most of the words heard is good enough. */
export function matchesSpeech(heard: string[], target: string, accept: string[] = []): boolean {
  const options = [target, ...accept].map(normalize);
  return heard.map(normalize).some((said) =>
    options.some((want) => {
      if (said === want || ` ${said} `.includes(` ${want} `)) return true;
      const words = want.split(' ');
      if (words.length < 3) return false;
      const saidWords = said.split(' ');
      return words.filter((w) => saidWords.includes(w)).length / words.length >= 0.7;
    }),
  );
}

export type SpeechResult = 'heard' | 'unclear' | 'unavailable';

/** Audio goes only to the browser's recogniser. The app keeps no recording or text. */
export function listen(target: string, accept?: string[], lang: 'en' | 'hi' = 'en'): Promise<SpeechResult> {
  const Recognizer = getRecognizer();
  if (!Recognizer) return Promise.resolve('unavailable');
  return new Promise((resolve) => {
    const recognizer = new Recognizer();
    recognizer.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognizer.maxAlternatives = 5;
    recognizer.interimResults = false;
    let result: SpeechResult | null = null;
    const timer = setTimeout(() => recognizer.stop(), 6000);
    recognizer.onresult = (event) => {
      const heard = Array.from(event.results[0]).map((alt) => alt.transcript);
      result = matchesSpeech(heard, target, accept) ? 'heard' : 'unclear';
    };
    recognizer.onerror = () => {
      result ??= 'unavailable';
    };
    recognizer.onend = () => {
      clearTimeout(timer);
      resolve(result ?? 'unclear');
    };
    try {
      recognizer.start();
    } catch {
      clearTimeout(timer);
      resolve('unavailable');
    }
  });
}
