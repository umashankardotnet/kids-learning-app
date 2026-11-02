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
  let open = true;

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
          const moduleOpen = open;
          const test = tests[mod.id];
          const nodes = mod.lessons.map((lesson, i) => {
            const done = lessonsDone[lesson.id];
            const unlocked = open;
            if (!done) open = false;
            return (
              <motion.button
                key={lesson.id}
                className={`node ${done ? 'done' : ''} ${unlocked && !done ? 'next' : ''}`}
                style={{ position: 'relative', left: OFFSETS[i % OFFSETS.length] }}
                disabled={!unlocked}
                onClick={() => onLesson(mod, lesson)}
                animate={unlocked && !done ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.4 }}
                aria-label={lesson.title}
                data-lesson={lesson.id}
              >
                {unlocked ? lesson.emoji : '🔒'}
              </motion.button>
            );
          });
          const testUnlocked = open;
          if (!test) open = false;
          return (
            <section key={mod.id} className={`road-module ${moduleOpen ? '' : 'locked'}`}>
              <div className="module-sign" style={{ borderColor: subject.color }}>
                <strong>{mod.number}. {mod.title}</strong>
                <span>{mod.outcome}</span>
              </div>
              {nodes}
              <button className={`node test ${test ? 'done' : ''} ${testUnlocked && !test ? 'next' : ''}`} disabled={!testUnlocked} onClick={() => onTest(mod)} aria-label={`${mod.title} test`} data-test={mod.id}>
                {testUnlocked ? '🏅' : '🔒'}
              </button>
              {test && <Stars count={test.stars} />}
            </section>
          );
        })}
        <button className="node test final" disabled={!open} onClick={onFinalTest} aria-label="Big test">
          {open ? '🏆' : '🔒'}
        </button>
        {tests[`${subject.id}-final`] && <Stars count={tests[`${subject.id}-final`].stars} />}
      </div>
    </div>
  );
}
