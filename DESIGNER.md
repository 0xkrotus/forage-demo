# Forage demo: designer handoff

Live: https://forage-demo.vercel.app · Code: https://github.com/0xkrotus/forage-demo (public; every push to `main` deploys)

An interactive 3D story that sells Forage to investors. One page, Three.js, no build step.

## Run it locally (2 minutes)

The 3D models only load over http, not by double-clicking the file.

```
cd forage-demo
python3 -m http.server 8765
```

Open http://127.0.0.1:8765. Keep the tab in front: the scene pauses in background tabs.

## What's in this kit

| Path | What it is |
|---|---|
| `index.html` | The whole demo: styles, copy, 3D scene, story logic. |
| `brand/mark.svg`, `brand/lockup.svg` | The forked-root mark and the FORAGE lockup. |
| `brand/marks.html` | The three mark concepts we explored (A forked root was chosen). |
| `assets/` | 3D models (.glb), the sky photo (`sky.hdr`), `CREDITS.md`. |
| `screens/` | A screenshot of every chapter, for reference. |
| `source/` | The two Forage PDFs the brand comes from. |
| `CONTEXT.md` | Glossary: buyer, app, AI company, vault, running total, settlement, fee. |

## Brand

- **Wordmark:** bold all-caps FORAGE (Arimo / Helvetica 700), ink #111. From the Forage PDFs.
- **Mark:** forked root. One stem splits three ways: heavy ink branch = the AI company's 91%, fine purple = Forage's 4%, fine grey = the app's 5%. In 3D it is the money tree at the centre.
- **Colours** (CSS variables at the top of `index.html`):
  - page `--bg #FFFEFB`, ink `--ink #111111`, body text `#374151`, muted `#6B7280`, rules `#E5E3DD`
  - lanes: Forage / $FORAGE purple `#6D28D9`, AI company teal `#0B5563`, buyer orange `#C2410C`, app grey `#4B5563`
- **Type:** Oxanium (headlines), Geist Mono (labels, numbers, step chips), Arimo (body). All Google Fonts.
- **Inspiration:** Antseed's site (off-white, numbered step chips, dotted ant trail). Forage = ants foraging along a trail.

## The story (chapter navigator, right edge)

I Forage · II Problem · III Bigger picture · 1 Start · 2 Fund · 3 Call · 4 Sign · 5 Settle and split · $FORAGE (proposed) · Why Forage.
"Watch the story" auto-plays all of it (about 90 s).

The money: Mia deposits $1.00. Five calls at real treg.to prices total $0.0579 (signed, not paid). One settlement pays SearchCo $0.0527 (91%), Forage $0.0023 (4%), Scout $0.0029 (5%); the vault ends at $0.9421.

## Where to change things in `index.html`

| Change | Look for |
|---|---|
| Colours, fonts, spacing | `:root { ... }` and the CSS below it |
| Chapter copy (eyebrow, headline, body) | `const CH = [` |
| The five calls, results, prices | `const SEARCHES = [` |
| Party names, roles, positions | `const NODES = {` |
| Camera shot per chapter | `const SHOT = {` |
| Animation speed | `BASE_PACE` (clicking) and `PLAY_PACE` (Watch the story) |
| 3D models and their size/rotation | `const MODELS = {` |
| The mark's shape | `const MARK = [` (same curves as `brand/mark.svg`) |

## Ideas we have not done yet

- A proper Forage logo pass (the mark is a first sketch), and favicon / OG image.
- Real "Talk to us" contact (the button is a placeholder).
- The safe door opening at settlement (the model has no door rig).
- Exact leaf thinning on the money tree (it is a token 9/2/2 today).
- A mobile-first layout pass; phones work but the desktop is the main target.

## Licences

Sketchfab models are CC-BY 4.0 and need credit (kept in `assets/CREDITS.md` and linked from the footer). The Poly Haven sky is CC0. Per-call prices are from treg.to's public catalog, Oct 2026. Amounts are simulated.
