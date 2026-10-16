# Blockchain Case Study Lab: When Blockchain Projects Fail

A presentation-ready, fully offline web app for a university case study. It compares two blockchain projects that did not reach their goals, TradeLens and the ASX CHESS replacement, using two interactive simulators.

> Educational simulation. All shipments, participants, transactions and balances are fictional. This does not reproduce the internal systems of IBM, Maersk or ASX, and it is not a real blockchain.

Built with Vite, React, TypeScript, Tailwind CSS and lucide-react. No backend, wallet, API calls or real blockchain.

## Run

```
npm install
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173).

## Test and build

```
npm test        # Vitest unit tests for the simulator reducers
npm run build   # type-check + production build into dist/
npm run preview # serve the production build locally
```

## Presenter shortcuts

| Key | Action |
| --- | --- |
| 1-4 | Switch section (Overview, TradeLens, ASX CHESS, Failure Analysis) |
| N | Next scripted step in the current simulator |
| R | Reset the current simulator |

Shortcuts are ignored while typing in an input. The Presentation Mode toggle (bottom right) hides the top navigation and enlarges the main area. Each simulator keeps its state when you switch sections.

## Structure

- `src/sim/tradelens.ts`, `src/sim/chess.ts`: pure reducers and helpers, no React.
- `src/sim/sim.test.ts`: reducer tests.
- `src/sections/`: Overview, TradeLens, Chess, Analysis screens.
- `src/components/ui.tsx`: shared UI pieces.
