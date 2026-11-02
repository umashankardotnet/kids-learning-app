export type Lang = 'en' | 'hi';

/** A pair of spoken/visible instructions; the parent picks the language. */
export type Prompt = Record<Lang, string>;

/** One part of something the app says aloud. */
export type SpeechPart =
  | { prompt: Prompt }
  /** English text read by the device voice. */
  | { text: string }
  /** A pure phonics sound, played from a recorded clip. */
  | { sound: string }
  /** A whole word, played from a recorded clip. */
  | { word: string }
  /** A Hindi letter, word or sentence, from a recorded clip when one exists. */
  | { hi: string };

export type Mouth = 'open' | 'round' | 'smile' | 'teeth' | 'tongue' | 'lips';

export interface PickOption {
  label?: string;
  emoji?: string;
  correct?: boolean;
}

export type Activity =
  | {
      kind: 'see';
      title: string;
      emoji?: string;
      caption?: string;
      mouth?: Mouth;
      /** A familiar Hindi letter with the same sound, shown when the bridge is on. */
      bridge?: string;
      tip?: Prompt;
      speech: SpeechPart[];
    }
  | { kind: 'pick'; prompt: SpeechPart[]; visiblePrompt: Prompt; focus?: string; options: PickOption[]; label: string }
  | { kind: 'trace'; letter: string }
  | { kind: 'speak'; say: string; emoji?: string; accept?: string[]; lang?: Lang }
  | { kind: 'blend'; sounds: string[]; word: string; emoji: string; lang?: Lang }
  | { kind: 'spell'; parts: string[]; extras: string[]; emoji?: string; speech: SpeechPart[]; joinWithSpace?: boolean }
  /** Pop every balloon showing the target. */
  | { kind: 'pop'; target: string; speech: SpeechPart[]; balloons: string[] }
  /** Join each text to its picture. */
  | { kind: 'match'; pairs: { text: string; emoji: string; speech: SpeechPart[] }[] };

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  activities: Activity[];
}

export interface Module {
  id: string;
  number: number;
  title: string;
  emoji: string;
  outcome: string;
  sticker: string;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  title: string;
  world: string;
  emoji: string;
  color: string;
  modules: Module[];
}
