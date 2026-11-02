# Khelo Seekho

A learning app for children aged 3 to 6. English and Hindi are built (12 modules each). Math comes next.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Commands

- `npm run build`: production build in `dist`
- `npm test`: content and logic tests
- `npx playwright test`: plays the app at phone and tablet sizes in Microsoft Edge
- `npm run clips`: updates `docs/audio-clips.md`
- `npm run deploy`: publishes the site to GitHub Pages

## Adding content

Lessons are data in `src/data`. Letter handwriting paths are in `src/data/strokes.ts`.
Recorded audio goes in `src/audio/phonics`, `src/audio/words` and `src/audio/hindi`. See `docs/audio-clips.md`.
