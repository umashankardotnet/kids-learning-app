import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../lib/store';
import type { Lesson, Module, Subject } from '../types';

interface Props {
  subject: Subject;
  onBack: () => void;
  onLesson: (mod: Module, lesson: Lesson) => void;
  onTest: (mod: Module) => void;
  onFinalTest: () => void;
}

const Stars = ({ count }: { count: number }) => <span className="stars">{'⭐'.repeat(count)}</span>;
const OFFSETS = [0, 34, 52, 34, 0, -34, -52, -34];

export function SubjectPath({ subject, onBack, onLesson, onTest, onFinalTest }: Props) {
  const { lessonsDone, tests } = useApp();

  // Everything is open; the first unfinished step is still highlighted as a suggestion.
  let foundNext = false;
  const isNext = (done: unknown) => {
    if (done || foundNext) return false;
    foundNext = true;
    return true;
  };

  // Bring the next step into view, so a child never has to hunt down a long road.
  useEffect(() => {
    document.querySelector('.node.next')?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div className="screen path">
      <header className="top-bar" style={{ background: subject.color }}>
        <button className="round" onClick={onBack} aria-label="Go back">🏠</button>
        <h2>{subject.emoji} {subject.world}</h2>
      </header>
      <div className="road">
        {subject.modules.map((mod) => {
          const test = tests[mod.id];
          const nodes = mod.lessons.map((lesson, i) => {
            const done = lessonsDone[lesson.id];
            const next = isNext(done);
            return (
              <motion.button
                key={lesson.id}
                className={`node ${done ? 'done' : ''} ${next ? 'next' : ''}`}
                style={{ position: 'relative', left: OFFSETS[i % OFFSETS.length] }}
                onClick={() => onLesson(mod, lesson)}
                animate={next ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.4 }}
                aria-label={lesson.title}
                data-lesson={lesson.id}
              >
                {lesson.emoji}
              </motion.button>
            );
          });
          return (
            <section key={mod.id} className="road-module">
              <div className="module-sign" style={{ borderColor: subject.color }}>
                <strong>{mod.number}. {mod.title}</strong>
                <span>{mod.outcome}</span>
              </div>
              {nodes}
              <button className={`node test ${test ? 'done' : ''} ${isNext(test) ? 'next' : ''}`} onClick={() => onTest(mod)} aria-label={`${mod.title} test`} data-test={mod.id}>
                🏅
              </button>
              {test && <Stars count={test.stars} />}
            </section>
          );
        })}
        <button className="node test final" onClick={onFinalTest} aria-label="Big test">🏆</button>
        {tests[`${subject.id}-final`] && <Stars count={tests[`${subject.id}-final`].stars} />}
      </div>
    </div>
  );
}
