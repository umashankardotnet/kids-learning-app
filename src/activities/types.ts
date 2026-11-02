import type { Activity } from '../types';

export interface ActivityProps<A extends Activity = Activity> {
  activity: A;
  /** true: right first time. false: needed help. null: not something to score. */
  onDone: (firstTry: boolean | null) => void;
}
