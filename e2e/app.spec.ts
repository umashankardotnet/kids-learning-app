import { expect, test, type Page } from '@playwright/test';

/** Stands in for the microphone: the recogniser always hears the wanted words. */
async function fakeHearing(page: Page, heard: string) {
  await page.addInitScript((text) => {
    (window as unknown as { __heard: string }).__heard = text;
    class FakeRecognition {
      onresult?: (e: unknown) => void;
      onend?: () => void;
      start() {
        const words = (window as unknown as { __heard: string }).__heard || document.querySelector('.say-text')?.textContent || '';
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: words }]] });
          this.onend?.();
        }, 50);
      }
      stop() {}
    }
    (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = FakeRecognition;
    Object.defineProperty(window, 'SpeechRecognition', { value: undefined });
  }, heard);
}

async function seed(page: Page, testsDone: number) {
  await page.goto('/');
  await page.evaluate(async (count) => {
    const lessons: Record<string, boolean> = {};
    for (let m = 1; m <= 12; m++) {
      for (let l = 1; l <= 10; l++) {
        lessons[`en-${m}-${l}`] = true;
        lessons[`hi-${m}-${l}`] = true;
        lessons[`en-${m}-p${l}`] = true;
        lessons[`hi-${m}-p${l}`] = true;
      }
    }
    const tests: Record<string, { stars: number; attempts: number }> = {};
    for (let n = 1; n <= count; n++) {
      tests[`en-${n}`] = { stars: 3, attempts: 1 };
      tests[`hi-${n}`] = { stars: 3, attempts: 1 };
    }
    const state = { profile: { name: 'Riya', avatar: '🐼' }, lang: 'en', bridge: true, muted: true, lessonsDone: lessons, tests, review: [], missed: {} };
    await new Promise((resolve, reject) => {
      const open = indexedDB.open('keyval-store');
      open.onsuccess = () => {
        const tx = open.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(state, 'khelo-seekho-v1');
        tx.oncomplete = resolve;
        tx.onerror = reject;
      };
    });
  }, testsDone);
  await page.reload();
}

async function noSideways(page: Page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide).toBeLessThanOrEqual(0);
}

async function fitsOnScreen(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  const size = page.viewportSize()!;
  expect(box, selector).not.toBeNull();
  expect(box!.y + box!.height, `${selector} bottom`).toBeLessThanOrEqual(size.height + 1);
  expect(box!.x + box!.width, `${selector} right`).toBeLessThanOrEqual(size.width + 1);
}

/** Sweeps across the whole letter, row by row. */
async function traceGlyph(page: Page) {
  const pad = page.locator('.trace-pad');
  const box = (await pad.boundingBox())!;
  await page.waitForTimeout(800); // the letter font loads first
  for (let sweep = 0; sweep < 3 && (await pad.count()); sweep++) {
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.1);
    await page.mouse.down();
    for (let row = 1; row < 16 && (await pad.count()); row++) {
      const y = box.y + (box.height * row) / 16;
      const from = row % 2 ? 0.05 : 0.95;
      await page.mouse.move(box.x + box.width * from, y);
      await page.mouse.move(box.x + box.width * (1 - from), y, { steps: 14 });
    }
    await page.mouse.up();
    if (await pad.count() === 0) return;
    if (((await page.locator('.trace-meter i').getAttribute('style')) ?? '').includes('100%')) return;
  }
}

async function trace(page: Page) {
  if (await page.locator('.trace-pad.glyph').count()) return traceGlyph(page);
  const pad = page.locator('.trace-pad');
  for (let guard = 0; guard < 6 && (await page.locator('.trace-pad .active').count()); guard++) {
    const points = await pad.evaluate((svg: SVGSVGElement) => {
      const path = svg.querySelector<SVGPathElement>('.active')!;
      const matrix = svg.getScreenCTM()!;
      const length = path.getTotalLength();
      return Array.from({ length: 25 }, (_, i) => {
        const p = path.getPointAtLength((length * i) / 24);
        const s = new DOMPoint(p.x, p.y).matrixTransform(matrix);
        return { x: s.x, y: s.y };
      });
    });
    const before = await pad.getAttribute('data-stroke');
    await page.mouse.move(points[0].x, points[0].y);
    await page.mouse.down();
    for (const p of points) await page.mouse.move(p.x, p.y);
    await page.mouse.up();
    await expect(pad).not.toHaveAttribute('data-stroke', before!);
  }
}

async function blend(page: Page) {
  const track = page.locator('.blend-track');
  const box = (await track.boundingBox())!;
  const count = await track.locator('.tile').count();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / (2 * count), y);
  await page.mouse.down();
  for (let i = 1; i < count; i++) await page.mouse.move(box.x + (box.width * (i + 0.5)) / count, y, { steps: 4 });
  await page.mouse.up();
}

/** Plays whatever is on stage; pick questions try options in order, so some are missed. */
async function playStage(page: Page): Promise<string> {
  const stage = page.locator('.stage');
  await page.waitForTimeout(350); // let the slide-in finish before measuring
  const kind = (await stage.getAttribute('data-kind'))!;
  switch (kind) {
    case 'see':
      await fitsOnScreen(page, '.go');
      await page.locator('.go').click();
      break;
    case 'pick': {
      await fitsOnScreen(page, '.option');
      const options = page.locator('.option');
      for (let i = 0; i < (await options.count()); i++) {
        const option = options.nth(i);
        if (await option.isDisabled()) continue;
        await option.click();
        if ((await option.getAttribute('class'))?.includes('right')) break;
      }
      break;
    }
    case 'trace':
      await fitsOnScreen(page, '.trace-pad');
      await trace(page);
      break;
    case 'speak':
      await fitsOnScreen(page, '.mic');
      await page.locator('.mic').click();
      await expect(page.locator('.bubble')).toContainText(/Great|Good try|Nice try|बढ़िया|शाबाश|कोशिश/);
      if ((await page.locator('.bubble').innerText()).match(/Nice try|एक बार और/)) await page.locator('.mic').click();
      break;
    case 'blend':
      await fitsOnScreen(page, '.blend-track');
      await blend(page);
      await expect(page.locator('.big-word')).toBeVisible();
      break;
    case 'pop':
      while (await page.locator('.balloon[data-right="true"]').count()) {
        await page.locator('.balloon[data-right="true"]').first().click({ force: true });
        await page.waitForTimeout(250);
      }
      break;
    case 'match':
      for (const left of await page.locator('.match-left').all()) {
        const pair = (await left.getAttribute('data-pair'))!;
        await left.click();
        await page.locator(`.match-right[data-pair="${pair}"]`).click();
      }
      break;
    case 'spell': {
      await fitsOnScreen(page, '.tiles');
      const slots = await page.locator('.slot').count();
      for (let round = 0; round <= slots && (await page.locator('.slot.filled').count()) < slots; round++) {
        const tiles = page.locator('.tiles .tile:not(.gone)');
        for (let i = (await tiles.count()) - 1; i >= 0; i--) {
          if ((await page.locator('.slot.filled').count()) >= slots) break;
          await tiles.nth(i).click({ timeout: 2000 }).catch(() => undefined);
        }
      }
      break;
    }
  }
  return kind;
}

async function playToEnd(page: Page, onStage?: (index: number) => Promise<void>): Promise<string[]> {
  const kinds: string[] = [];
  for (let i = 0; i < 80; i++) {
    const stage = page.locator('.stage');
    await Promise.race([stage.waitFor({ timeout: 8000 }), page.locator('.result').waitFor({ timeout: 8000 })]);
    if (await page.locator('.result').isVisible()) return kinds;
    await onStage?.(i);
    const handle = await stage.elementHandle();
    kinds.push(await playStage(page));
    await page.waitForFunction((old) => !old || !old.isConnected, handle, { timeout: 10_000 });
  }
  throw new Error('Lesson never finished');
}

test.beforeEach(({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

test('first visit: pick an avatar, reach the map and finish a lesson', async ({ page }) => {
  await fakeHearing(page, '');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled();
  await page.getByRole('button', { name: '🐼' }).click();
  await page.getByPlaceholder(/Name/).fill('Riya');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByText('Hi Riya!')).toBeVisible();
  await noSideways(page);
  await page.getByText('Alphabet Island').click();
  await expect(page.locator('[data-lesson="en-1-2"]')).toBeDisabled();
  await page.locator('[data-lesson="en-1-1"]').click({ force: true });
  await playToEnd(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('[data-lesson="en-1-2"]')).toBeEnabled();
  await page.reload();
  await page.getByText('Alphabet Island').click();
  await expect(page.locator('[data-lesson="en-1-2"]')).toBeEnabled();
});

for (const lesson of ['en-1-1', 'en-12-p1', 'en-2-3', 'en-3-7', 'en-3-10', 'en-6-1', 'en-7-1', 'en-7-7', 'en-8-4', 'en-9-5', 'en-10-1', 'en-11-1', 'en-11-5', 'en-12-1']) {
  test(`plays lesson ${lesson}`, async ({ page }) => {
    await fakeHearing(page, '');
    await seed(page, 11);
    await page.getByText('Alphabet Island').click();
    await page.locator(`[data-lesson="${lesson}"]`).click();
    const kinds = await playToEnd(page, () => noSideways(page));
    expect(kinds.length).toBeGreaterThan(2);
  });
}

for (const lesson of ['hi-1-1', 'hi-2-3', 'hi-5-p1', 'hi-5-1', 'hi-6-4', 'hi-7-1', 'hi-9-7', 'hi-10-3', 'hi-10-4', 'hi-11-1', 'hi-11-5', 'hi-12-3']) {
  test(`plays Hindi lesson ${lesson}`, async ({ page }) => {
    await fakeHearing(page, '');
    await seed(page, 11);
    await page.getByText('अक्षर Garden').click();
    await page.locator(`[data-lesson="${lesson}"]`).click();
    const kinds = await playToEnd(page, async () => {
      await noSideways(page);
      if (test.info().project.name === 'phone' && (await page.locator('.trace-pad.glyph').count())) {
        await page.waitForTimeout(400);
        await page.screenshot({ path: `test-results/${lesson}-trace.png` });
      }
    });
    expect(kinds.length).toBeGreaterThan(2);
  });
}

test('Hindi module test, stickers and worksheet', async ({ page }) => {
  await fakeHearing(page, '');
  await seed(page, 1);
  await page.getByText('अक्षर Garden').click();
  await page.locator('[data-test="hi-2"]').click();
  await playToEnd(page);
  await expect(page.locator('.result-stars')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.getByRole('button', { name: 'Parent area' }).click();
  const [, a, b] = (await page.locator('.gate p').innerText()).match(/(\d+) × (\d+)/)!;
  await page.getByLabel('Answer').fill(String(Number(a) * Number(b)));
  await expect(page.getByText('Hindi progress')).toBeVisible();
  await page.getByRole('button', { name: 'Print' }).nth(13).click();
  await expect(page.locator('.ws-letter').first()).toBeVisible();
  if (test.info().project.name === 'phone') await page.screenshot({ path: 'test-results/hi-worksheet.png' });
});

test('wrong speech gets a kind second chance, and test misses reach the parent area', async ({ page }) => {
  await fakeHearing(page, 'banana');
  await seed(page, 1);
  await page.getByText('Alphabet Island').click();
  await page.locator('[data-test="en-2"]').click();
  await playToEnd(page);
  await expect(page.locator('.result-stars')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.getByRole('button', { name: 'My stickers' }).click();
  await expect(page.getByText('🐝')).toBeVisible();
  await page.getByRole('button', { name: 'Go back' }).click();

  await page.getByRole('button', { name: 'Parent area' }).click();
  const question = await page.locator('.gate p').innerText();
  const [, a, b] = question.match(/(\d+) × (\d+)/)!;
  await page.getByLabel('Answer').fill(String(Number(a) * Number(b)));
  await expect(page.getByText('Needs more practice')).toBeVisible();
  await expect(page.locator('.panel ul li').first()).toBeVisible();
  await page.getByRole('button', { name: 'Print' }).nth(0).click();
  await expect(page.locator('.ws-letter').first()).toBeVisible();
});

test('the lesson road fits the screen', async ({ page }) => {
  await seed(page, 3);
  await page.getByText('Alphabet Island').click();
  await expect(page.locator('.module-sign').first()).toBeVisible();
  await noSideways(page);
  await fitsOnScreen(page, '.module-sign');
  await page.locator('.top-bar h2').waitFor();
  await fitsOnScreen(page, '.top-bar h2');
  const size = page.viewportSize()!;
  const widest = await page.locator('.node').evaluateAll((nodes) => Math.max(...nodes.map((n) => n.getBoundingClientRect().right)));
  expect(widest).toBeLessThanOrEqual(size.width);
});

test('the big test opens only after all module tests', async ({ page }) => {
  await seed(page, 11);
  await page.getByText('Alphabet Island').click();
  await expect(page.getByRole('button', { name: 'Big test' })).toBeDisabled();
  await page.evaluate(() => undefined);
  await seed(page, 12);
  await page.getByText('Alphabet Island').click();
  await expect(page.getByRole('button', { name: 'Big test' })).toBeEnabled();
});

test('Hindi questions say the letter out loud and show it', async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { spoken: string[] }).spoken = spoken;
    window.speechSynthesis.speak = (u) => {
      spoken.push(u.text);
      setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 30);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: '🐼' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByText('अक्षर Garden').click();
  await page.locator('[data-lesson="hi-1-1"]').click({ force: true });
  await page.locator('.go').click();
  await expect(page.locator('.focus')).toHaveText('अ');
  await page.waitForTimeout(3500);
  await page.evaluate(() => { (window as unknown as { spoken: string[] }).spoken.length = 0; });
  await page.getByRole('button', { name: 'Hear it again' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { spoken: string[] }).spoken.join('|'))).toMatch(/^(अ|uh)$/);


});

test('English speech prefers an Indian voice', async ({ page }) => {
  await page.addInitScript(() => {
    const fake = (name: string, lang: string) => ({ name, lang, default: false, localService: true, voiceURI: name });
    window.speechSynthesis.getVoices = () => [fake('US Voice', 'en-US'), fake('India Voice', 'en-IN'), fake('Hindi Voice', 'hi-IN')] as unknown as SpeechSynthesisVoice[];
    const used: string[] = [];
    (window as unknown as { used: string[] }).used = used;
    window.speechSynthesis.speak = (u) => {
      used.push(u.lang);
      setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 30);
    };
    const Real = window.SpeechSynthesisUtterance;
    window.SpeechSynthesisUtterance = class extends Real {
      set voice(v: SpeechSynthesisVoice | null) { (this as unknown as { picked: unknown }).picked = v; }
    } as typeof Real;
  });
  await page.goto('/');
  await page.getByRole('button', { name: '🐼' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByText('Alphabet Island').click();
  await page.locator('[data-lesson="en-1-1"]').click({ force: true });
  await expect.poll(() => page.evaluate(() => (window as unknown as { used: string[] }).used.join(','))).toContain('en-IN');
  const used = await page.evaluate(() => (window as unknown as { used: string[] }).used);
  expect(used).not.toContain('en-US');
});

test('narration follows the subject', async ({ page }) => {
  await seed(page, 0);
  await page.getByText('Alphabet Island').click();
  await page.locator('[data-lesson="en-1-1"]').click({ force: true });
  await page.locator('.go').click();
  await expect(page.locator('.prompt')).toContainText('Which picture');
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.getByText('अक्षर Garden').click();
  await page.locator('[data-lesson="hi-1-1"]').click({ force: true });
  await page.locator('.go').click();
  await expect(page.locator('.prompt')).toContainText('कौन सी तस्वीर');
});

test('leaving a lesson early does not finish it, and the road shows the next step', async ({ page }) => {
  await seed(page, 8);
  await page.evaluate(async () => {
    const open = indexedDB.open('keyval-store');
    await new Promise((resolve) => { open.onsuccess = resolve; });
    const store = open.result.transaction('keyval', 'readwrite').objectStore('keyval');
    const read = store.get('khelo-seekho-v1');
    await new Promise((resolve) => { read.onsuccess = resolve; });
    delete read.result.lessonsDone['en-9-2'];
    open.result.transaction('keyval', 'readwrite').objectStore('keyval').put(read.result, 'khelo-seekho-v1');
  });
  await page.reload();
  await page.getByText('Alphabet Island').click();
  await expect(page.locator('.node.next').first()).toHaveAttribute('data-lesson', 'en-9-2');
  await expect(page.locator('.node.next').first()).toBeInViewport();
  const lesson = page.locator('.node.next').first();
  await lesson.click({ force: true });
  await page.locator('.go').click();
  await page.locator('.blend-track').waitFor();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.waitForTimeout(2500);
  await expect(page.locator('.road')).toBeVisible();
  await expect(page.locator('.result')).toHaveCount(0);
});
