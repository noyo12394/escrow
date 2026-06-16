# S.T.A.R. Earthquake Rescue Lab

A browser-based **3D educational escape-room game** built with **Vite + vanilla
JavaScript + Three.js**. The theme is a teamwork survival exercise: you and three
coworkers are trapped in the basement of a damaged multi-story office building
after a magnitude 7.4 earthquake. The exit is buried in rubble, power and phones
are dead, but air comes in through cracks — and you have a basement full of
supplies. Investigate each station, answer survival questions, then rank all 12
survival actions and compare your judgment with the rescue experts.

All 3D content is **procedural Three.js geometry** — no external models, images,
or textures are required.

---

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To create a production build:

```bash
npm run build
npm run preview
```

---

## How to play

1. **Enter the basement.** Drag the mouse to orbit the room, scroll to zoom.
2. **Click the glowing markers.** Each hotspot opens a modal with a short
   survival question, three answer choices, instant feedback, and an *expert
   clue* explaining the reasoning.
3. **Open the Ranking Board.** Drag (or use the ▲ ▼ buttons) to order all 12
   action cards from **1 = best / most helpful** to **12 = worst / most
   dangerous**.
4. **Submit & Score.** Your order is compared with the official expert ranking.

---

## Scoring (the worksheet method)

For every card we compute the **absolute difference** between your rank and the
expert rank, then **sum all 12 differences**. **Lower is better** — a perfect
match scores **0** (the worst possible is 72).

The results screen shows a full score table with **Player Rank · Action · Expert
Rank · |Diff.|**, an overall rating band, and a **downloadable `.txt` report**
that includes the table plus all expert reasoning. An **instructor "Expert Key"**
view reveals the full expert order and rationale at any time.

### Expert ranking (answer key)

| Rank | Action |
|----:|--------|
| 1 | Shut off all utilities. |
| 2 | Check for injuries and administer first-aid. |
| 3 | Assign someone to monitor the radio and listen for updates. |
| 4 | Locate and secure a water supply. |
| 5 | Develop day and night signaling techniques / begin signaling immediately. |
| 6 | Discuss long-term survival strategies as a group. |
| 7 | Divide the sandwiches and eat them this evening. |
| 8 | Purify the water source. |
| 9 | Pound the pipes with the steel wrench. |
| 10 | Divide the sandwiches and ration them over the next few days. |
| 11 | Attempt to remove the rubble from the entrance from the first floor. |
| 12 | Light the candles so you can see and rescuers will be able to locate you. |

---

## Features

- **3D basement scene** — walls, concrete floor, cracked concrete + air gaps,
  blocked stairwell rubble, overhead pipes, utility panel, radio desk, water
  station, refrigerator/food station, candle shelf, first-aid cabinet,
  purification supplies, signal board, planning table, and **four low-poly human
  characters**.
- **Glowing clickable hotspots** with Three.js **raycasting** (hover + click),
  animated bob/spin/pulse markers that dim once investigated.
- **Quiz modals** — question, three choices, correct/incorrect feedback, expert
  clue.
- **HUD** — mission checklist, rescue-readiness progress bar, hover scanner, and
  buttons for Ranking Board, Expert Key, Help, Enable Alerts, and Reset.
- **Drag-and-drop ranking board** with accessible ▲ ▼ controls and a shuffle.
- **Worksheet scoring**, score table, rating bands, and `.txt` report export.
- **One-time name sign-in** with per-player activity logging to **Supabase**
  (graceful local-only fallback when not configured).
- **Procedural audio** (Web Audio API) — ambient rumble, drips/creaks, UI clicks,
  and correct/incorrect/submit cues, with a mute toggle.
- **Scene realism** — drifting dust motes and a flashlight light pool.
- **Locked instructor Expert Key** — hidden until the player submits, or an
  instructor enters the key.
- **Background notifications** (see below).
- Responsive layout, keyboard-accessible buttons, ARIA live announcements,
  reduced-motion support, and a mission-complete celebration.

---

## Sign-in &amp; activity logging (Supabase)

This is the **week-one** activity. Each player signs in once with their name
(stored in `localStorage`, so returning users skip it), and their activity is
recorded to **Supabase**:

- **`players`** — one row per name (one-time registration; existing names are
  recognized, not duplicated).
- **`activity`** — a stream of events (`login`/`register`, `investigate`,
  `answer`, `submit`, `view_expert`, `download`, `reset`), each tagged with the
  `week`.
- **`submissions`** — each completed ranking with its worksheet `score`, the
  full ordered ranking, and which questions were answered correctly.

### Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql)
   (creates the tables and Row Level Security policies).
3. Provide the project credentials as environment variables (see `.env.example`):

   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

   - **Local:** copy `.env.example` to `.env` and fill these in.
   - **Vercel:** Project → **Settings → Environment Variables** → add both keys,
     then redeploy.

The browser uses the public **anon key**, which is safe to expose when Row Level
Security is on (the schema enables it). Without these variables the game runs in
**local-only mode**: fully playable, but nothing is recorded (the HUD shows a
`local` tag).

### Expert Key lock

The instructor Expert Key is hidden until a player **submits their ranking**, or
an instructor enters the key **`instruct26`** (configurable as `INSTRUCTOR_KEY`
in `src/main.js`).

---

## Background notifications ("Enable Alerts")

The toolbar **Enable Alerts** button requests notification permission and
registers a **Service Worker** (`public/sw.js`). Because a service worker runs
independently of any open tab, it can show **rescue-drill reminder
notifications even after you close the site**.

How "even when closed" works, in order of robustness:

1. **Periodic Background Sync** (Chromium browsers): the service worker is woken
   on a schedule with *no tab open* and shows a reminder. This is the primary
   closed-site path; it activates once permission is granted (installing the app
   as a PWA improves reliability).
2. **Push API**: the service worker already handles `push` events, so if you add
   a web-push backend (VAPID keys + a server), server-sent notifications will
   arrive while the site is fully closed. No backend is needed for the local
   demo.
3. **Scheduled reminders**: the page asks the service worker to schedule timed
   reminders that it displays itself; these surface even when the tab is only
   backgrounded.

Clicking **Enable Alerts** again (once on) sends a **test notification** so you
can confirm it works. Notes:

- Requires a **secure context** — `https://` or `http://localhost`. `npm run dev`
  on `localhost` qualifies.
- Browser support varies. Periodic Background Sync is Chromium-only; on other
  browsers you still get foreground/backgrounded reminders and the in-app test
  alert. If notifications are blocked the button reflects that state.

---

## Project structure

```
.
├── index.html                # App shell, HUD, overlays
├── styles.css                # All UI styling (responsive, accessible)
├── package.json              # Vite + Three.js
├── README.md
├── .env.example              # Supabase env vars (optional)
├── supabase/
│   └── schema.sql            # Tables + RLS policies for activity logging
├── public/
│   ├── sw.js                 # Service worker: notifications, push, periodic sync
│   ├── manifest.webmanifest  # PWA manifest (installability for background sync)
│   └── icon.svg              # App / notification icon (procedural SVG)
└── src/
    ├── gameData.js           # Scenario, 12 cards, expert ranking, hotspots, quizzes
    ├── main.js               # Three.js scene, raycasting, HUD, board, scoring, sign-in
    ├── audio.js              # Procedural Web Audio sounds + ambient bed
    ├── supabase.js           # Player registration + activity/submission logging
    └── notify.js             # Enable-Alerts flow + service worker wiring
```

---

## Tech notes

- **Three.js** is imported from npm; `OrbitControls` comes from
  `three/addons/...` (the bundled examples, resolved by Vite).
- Everything in the scene is generated from primitive geometry
  (`BoxGeometry`, `CylinderGeometry`, `CapsuleGeometry`, `IcosahedronGeometry`,
  `DodecahedronGeometry`, etc.) — there are **no external 3D assets**.
- Game content lives entirely in `src/gameData.js`, so questions, clues, and
  rankings can be edited without touching the engine code.

---

## Deploying

The app is a static Vite build (`npm run build` → `dist/`), so it deploys to any
static host. HTTPS is recommended (and required for the notification service
worker — local `localhost` also counts).

### Vercel (recommended, included config)

A `vercel.json` is included (framework `vite`, build `npm run build`, output
`dist`, plus headers so the service worker is never stale and is allowed root
scope).

1. Push this branch to GitHub (already done).
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** the
   `noyo12394/escrow` repository.
3. Vercel auto-detects Vite — keep the defaults and click **Deploy**.
4. You get a public URL like `https://escrow-xxxx.vercel.app`.

Or with the CLI:

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

### Other hosts

- **Netlify** — build command `npm run build`, publish directory `dist`.
- **GitHub Pages** — build with Vite `base: '/escrow/'` and publish `dist` via a
  Pages workflow.

---

## License

Created for classroom and educational use.
