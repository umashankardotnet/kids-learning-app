import { useState } from 'react';
import { activityKey, buildFinalTest, buildModuleTest, findActivity, starsFor } from './data/course';
import { getState, update, useApp } from './lib/store';
import { Home } from './screens/Home';
import { Parent } from './screens/Parent';
import { Player, type PlayerResult } from './screens/Player';
import { Result } from './screens/Result';
import { Rewards } from './screens/Rewards';
import { SubjectPath } from './screens/SubjectPath';
import { Welcome } from './screens/Welcome';
import { Worksheet } from './screens/Worksheet';
import type { Activity, Lesson, Module, Subject } from './types';

type Item = { key: string; activity: Activity };

type View =
  | { name: 'home' }
  | { name: 'subject'; subject: Subject }
  | { name: 'play'; subject: Subject; items: Item[]; finish: (results: PlayerResult[]) => void }
  | { name: 'result'; subject: Subject; stars?: number; sticker?: string }
  | { name: 'rewards' }
  | { name: 'parent' }
  | { name: 'worksheet'; mod: Module };

const labelFor = (activity: Activity): string => {
  switch (activity.kind) {
    case 'pick': return activity.label;
    case 'trace': return `Write ${activity.letter}`;
    case 'speak': return `Say "${activity.say}"`;
    case 'spell': return `Build "${activity.parts.join(activity.joinWithSpace ? ' ' : '')}"`;
    case 'blend': return `Blend ${activity.word}`;
    case 'see': return activity.title;
    case 'pop': return `Find ${activity.target}`;
    case 'match': return `Match ${activity.pairs[0].text} and others`;
  }
};

function recordTest(id: string, results: PlayerResult[]): number {
  const scored = results.filter((r) => r.firstTry !== null);
  const stars = starsFor(scored.filter((r) => r.firstTry).length, scored.length);
  const misses = scored.filter((r) => !r.firstTry);
  update((s) => {
    const missed = { ...s.missed };
    for (const miss of misses) {
      const label = labelFor(miss.activity);
      missed[miss.key] = { label, count: (missed[miss.key]?.count ?? 0) + 1 };
    }
    return {
      missed,
      review: [...new Set([...s.review, ...misses.map((m) => m.key)])],
      tests: { ...s.tests, [id]: { stars: Math.max(stars, s.tests[id]?.stars ?? 0), attempts: (s.tests[id]?.attempts ?? 0) + 1 } },
    };
  });
  return stars;
}

export function App() {
  const { profile } = useApp();
  const [view, setView] = useState<View>({ name: 'home' });

  if (!profile) return <Welcome />;

  // Hindi is narrated in Hindi; every other subject in English.
  const narrate = (subject: Subject) => update(() => ({ lang: subject.id === 'hindi' ? 'hi' : 'en' }));

  const startLesson = (subject: Subject, lesson: Lesson) => {
    narrate(subject);
    // Up to two missed test questions from this subject come back at the start of the next lesson.
    const review = getState().review.filter((key) => key.startsWith(subject.id.slice(0, 2))).slice(0, 2);
    const reviewItems = review.flatMap((key): Item[] => {
      const activity = findActivity(key);
      return activity ? [{ key, activity }] : [];
    });
    setView({
      name: 'play',
      subject,
      items: [...reviewItems, ...lesson.activities.map((activity, i) => ({ key: activityKey(lesson.id, i), activity }))],
      finish: () => {
        update((s) => ({
          lessonsDone: { ...s.lessonsDone, [lesson.id]: true },
          review: s.review.filter((key) => !review.includes(key)),
        }));
        setView({ name: 'result', subject });
      },
    });
  };

  const startTest = (subject: Subject, mod: Module) => {
    narrate(subject);
    setView({
      name: 'play',
      subject,
      items: buildModuleTest(mod),
      finish: (results) => setView({ name: 'result', subject, stars: recordTest(mod.id, results), sticker: mod.sticker }),
    });
  };

  const startFinal = (subject: Subject) => {
    narrate(subject);
    setView({
      name: 'play',
      subject,
      items: buildFinalTest(subject),
      finish: (results) => setView({ name: 'result', subject, stars: recordTest(`${subject.id}-final`, results) }),
    });
  };

  switch (view.name) {
    case 'home':
      return (
        <Home
          onSubject={(subject) => setView({ name: 'subject', subject })}
          onRewards={() => setView({ name: 'rewards' })}
          onParent={() => setView({ name: 'parent' })}
        />
      );
    case 'subject':
      return (
        <SubjectPath
          subject={view.subject}
          onBack={() => setView({ name: 'home' })}
          onLesson={(_, lesson) => startLesson(view.subject, lesson)}
          onTest={(mod) => startTest(view.subject, mod)}
          onFinalTest={() => startFinal(view.subject)}
        />
      );
    case 'play':
      return <Player key={view.items[0]?.key} items={view.items} onExit={() => setView({ name: 'subject', subject: view.subject })} onFinish={view.finish} />;
    case 'result':
      return <Result stars={view.stars} sticker={view.sticker} onNext={() => setView({ name: 'subject', subject: view.subject })} />;
    case 'rewards':
      return <Rewards onBack={() => setView({ name: 'home' })} />;
    case 'parent':
      return <Parent onBack={() => setView({ name: 'home' })} onWorksheet={(mod) => setView({ name: 'worksheet', mod })} />;
    case 'worksheet':
      return <Worksheet mod={view.mod} onBack={() => setView({ name: 'parent' })} />;
  }
}
