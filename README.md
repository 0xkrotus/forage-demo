# Forage site

The investor-facing site for Forage, *the open market for AI tools*. One HTML file, Three.js, no build step, nothing
loaded from a CDN. The 3D world is the product story; the rest of the site sits below it.

Live: https://forage-demo.vercel.app · Code: https://github.com/0xkrotus/forage-demo (every push to `main` deploys).

This file is the handoff: how to run it, how it is put together, how to change each part, what to check before a
release, and what we would do next. `CONTEXT.md` is the glossary (buyer, app, AI company, vault, running total,
settlement, fee); use its words in all copy.

---

## 1. Run it

The page uses ES modules, so it must be served over http. Double-clicking `index.html` shows a blank stage.

```
cd forage-demo
python3 -m http.server 8765        # or: npx serve .
```

Open http://127.0.0.1:8765. Keep the tab in front: the scene pauses in background tabs and while the site below
covers it.

**Deploy.** Push to `main`; Vercel serves the folder as static files. There is no build, no env, no server. If you
move hosts, any static host works (Netlify, Cloudflare Pages, GitHub Pages, an S3 bucket): upload the folder as is.

---

## 2. What is in the folder

| Path | What it is |
|---|---|
| `index.html` | Everything: styles, header, the 3D scene, the story engine, the site sections, the footer. ~1,500 lines, in the order below. |
| `vendor/three/` | Three.js 0.169 (`three.module.js`, MIT) and the four addons the scene imports. Vendored so the demo never depends on unpkg being up. |
| `brand/mark.svg`, `brand/lockup.svg` | The forked-root mark and the FORAGE lockup. |
| `brand/marks.html` | The three mark concepts explored; A (forked root) was chosen. |
| `source/` | The two Forage PDFs (one-pager, competitor map) every line of copy comes from. |
| `tools/shoot.mjs` | Headless screenshot and console-error check (section 7). |
| `CONTEXT.md` | Glossary. |
| `README.md` | This file. |

There is no `assets/` folder any more: every model, the coins, the tree and the stage are generated in code, so there
are no third-party licences to credit.

---

## 3. How the page works

Read this once before touching `index.html`; it is the mental model.

### 3.1 Three layers, one scroll

```
z-index 6   <header class="top">          fixed. Brand, section links, Watch the story, Talk to us.
z-index 2-3 #story, #nav, #split, #hint    fixed. The chapter card (left), the chapter dots (right), the split bar, the scroll hint.
z-index 1   #track                         in flow, transparent, pointer-events:none. Ten empty spacers, one per chapter.
z-index 0   #map (canvas + #labels)        fixed. The 3D stage and the HTML pills that float over it.
z-index 4   #site                          in flow, solid background. Who it's for, $FORAGE, The field, Stack, Talk to us, footer.
```

The page scrolls normally. While you are inside `#track`, the stage shows through the transparent spacers. When
`#site` reaches 35% of the window height, `body.site` is set: the stage, the card, the dots and the hint fade out and
the render loop stops (`checkSite()`). Scroll back up and it all resumes. Clicks and drags go through the spacers to
the canvas, so every mechanic in the scene still works.

### 3.2 Scroll → chapter

`progress()` turns the scroll position into a continuous chapter number, `prog` (3.0 = exactly at Start, 3.5 = halfway
to Fund). It is recomputed on every scroll event.

Two things read `prog`:

- **The chapter engine.** An `IntersectionObserver` with a 45% top-and-bottom margin reports which spacer is in the
  middle of the window; that becomes `want`. `sync()` calls the original `goTo(want)` until the scene's chapter `ch`
  matches. If the viewer jumps several chapters at once, `goTo` catches up instantly (`quick` mode: the state is
  applied with no flights). The engine (`goTo`, `show`, `fund`, `call`, `settle`, `advance`, `userAct`) is the demo's
  original code and is unchanged.
- **The camera rail** (3.3).

Prev, Next, the chapter dots, arrow keys and "Watch the story" all call `turn(i)`, which scrolls the spacer into
view. Nothing changes the chapter any other way, so the scroll position and the scene can never disagree.
`scroll-snap-type: y proximity` on `html` makes stops settle on a chapter without trapping the viewer.

### 3.3 The camera rail

`RAIL` is a list of ten `[position, lookAt, driftAmplitude]` knots, one per chapter, in chapter order. Two
`CatmullRomCurve3`s run through them (`RAIL_P` for the camera, `RAIL_L` for the point it looks at). Every frame:

```
railT  → eased toward prog           (wall-clock time, so a slow laptop never lags the scroll)
u      = railT / 9                   (knot i sits exactly at chapter i)
camera → eased toward RAIL_P(u), focus toward RAIL_L(u), plus a slow breath when the viewer rests
```

There are no camera cuts. `shot()` is kept only so the chapter code still compiles; it now just records the drift
amplitude. The one exception is the **chase**: while a packet, coin or signature flies, the camera follows it
(`chase`), then eases back onto the rail. Dragging the ground (OrbitControls) overrides the rail until you let go.
On phones the camera stands further back along the same look vector, by a per-chapter amount (`RAIL_PHONE`), and the
flight close-up stands 1.6× further back.

To reposition a chapter's view, edit its knot. To add a chapter, add a knot *and* a spacer *and* a `CH` entry: all
three lists must stay the same length and order.

### 3.4 The world

Everything in the scene is built in the `if (gl) { … }` block, in this order:

1. **Studio.** Renderer, scene, fog in the page colour, camera, hemisphere light, one shadow-casting sun, a fill,
   `RoomEnvironment` for reflections. No sky, no horizon.
2. **Ground.** An infinite plane in the page colour that takes shadows, plus the **stage**: a 19-unit disc in a
   slightly warmer tone whose alpha fades to nothing at the edge (a canvas radial gradient as `alphaMap`). It does not
   receive shadows; the ground under it does.
3. **The four parties** (`party(key, group)`): Mia's agent (cream robot, orange band), Scout (ink app slab on a grey
   stand), the Forage vault (rounded ink safe, silver dial in a purple ring, the mark on the door), SearchCo (teal
   server tower, five slots, gold lights). All `RoundedBoxGeometry`, cylinders, spheres and tori in `matte()`
   materials. Each sets `NODES[key].h` (its height; labels and flights use it); the vault also sets `VAULT_TOP`.
4. **The money tree**: the forked-root mark as tubes (`markMesh`), with instanced coin leaves along each branch
   (`LEAF_*`), tinted gold, purple-gold and silver. Settlement thins the leaves and drops one coin per branch.
5. **Coins, stamps, signpost, lever, pulse ring, packet geometry.**
6. **The trail**: dots along a Catmull-Rom loop from Mia around the tree to the fork; the fork is the mark laid flat;
   three payee pads at the branch tips; five station placards (`STN`); the **ants** (28 instanced dots walking the
   trail while the viewer rests at the first or last chapter).
7. **Chapter props**: the six padlocked dead ends (Problem), the many-agents web (Bigger picture), the self-dealing
   loop ($FORAGE).

HTML pills over the canvas (`#labels`) are positioned every frame by `place()`: party labels with live balances,
station placards, payee pads, and anything that rides a flying object (`tagFor`).

### 3.5 The money

Amounts are integers in micro-USDC, exactly like the token, so the split never has float dust. `FEE_BPS = 400`,
`APP_BPS = 500`: Forage 4%, the app 5%, the AI company keeps the rest. `split()` asserts the three parts add up.
Mia deposits $1.00; five calls at treg.to's real per-call prices total $0.0579; one settlement pays SearchCo $0.0527,
Forage $0.0023, Scout $0.0029; the vault ends at $0.9421. If you change `SEARCHES` or the basis points, every number on
the page, the signpost and the split bar follow; nothing is hard-coded except the two sentences in the Who-it's-for
section that quote 91% / 5%.

---

## 4. How to change things

All in `index.html`. Search for the anchor in the second column.

| Change | Anchor |
|---|---|
| Colours, fonts, spacing | `:root {` at the top of the stylesheet; the lane colours are repeated as hex in `NODES` for the 3D |
| Header links, header buttons | `<header class="top">` |
| Chapter copy: eyebrow, headline, body, CTA label | `const CH = [`. Wrap the purple word in `*stars*`. `hold` is how long Watch the story rests there (ms). |
| The five calls: task, result, price | `const SEARCHES = [` (prices in micro-USDC; 10000 = $0.0100) |
| Fee and app cut | `const FEE_BPS`, `APP_BPS` |
| Party names, roles, hover text, ground positions | `const NODES = {` |
| A party's look | the block after `// The four parties, one designed set`; each is a small `Group` of `rbox()`/`at()` calls |
| Camera view per chapter | `const RAIL = [` (ten knots; `SHOT` holds the named ones) |
| Scroll length per chapter | `.track .ch { min-height }`; add class `long` to a spacer to give a chapter more room (Call and Settle have it) |
| Station placard text | `const STN = [` — `w` is the name, `f` the fact that opens as you arrive |
| Ants: count, size, speed | `const ANTS`, the sphere radius, `dt * 0.03` in `antsTick` |
| Tree leaves: how many, where, tint | `LEAF_C`, `LEAF_N`, `LEAF_R`, `TINT` |
| Leaves that fall per settlement | `LEAF_FALL` (shared by the split: 50 gives 46 / 2 / 3) |
| How far the vault door opens | `DOOR_OPEN` (radians) |
| Phone camera distance per chapter | `const RAIL_PHONE = [` (one number per chapter, same order as `RAIL`) |
| Sound: the tick and the chord | `const sound = {` (off by default; the header toggle is `#sound`) |
| Stage pool size and tone | `new THREE.CircleGeometry(19, …)` and `0xEFECE4` after `// Ground:` |
| Lighting | after `// Studio:` (hemisphere, `sun`, `fill`, `environmentIntensity`) |
| Animation speed | `BASE_PACE` (viewer driving) and `PLAY_PACE` (Watch the story) |
| Site sections below the story | `<div class="site" id="site">`; each `<section class="sec" id="…">` is one header link |
| Contact address | `[CONTACT EMAIL]` (two places; both have a `TODO` comment) |
| Footer | `<footer>` inside `#site` |
| The mark's shape | `const MARK = [` (the same curves as `brand/mark.svg`; the 3D tree, the fork and every coin stamp derive from it) |

### Conventions

- **One file.** Resist splitting it until there is a second page. Styles at the top, markup in the middle, one
  `<script type="module">` at the bottom. Within the script: constants and copy first, scene construction, then the
  story engine, then wiring.
- **Copy comes from the PDFs.** If a sentence is not in `source/`, it does not go on the page. Use the glossary's
  words: buyer, app, AI company, vault, running total, settlement, fee. Never "user", "seller", "provider", "customer".
- **Facts over adjectives.** Placards, labels and stat tiles carry numbers from the demo or the one-pager. No invented
  stats, no testimonials, no logos we do not have the right to show.
- **Colours are the lanes.** Purple is only Forage and $FORAGE; teal only the AI company; orange only the buyer; grey
  only the app. Do not use them decoratively.
- **Emphasis is one purple word** per headline (`*stars*` in `CH`, `<i>` in the site sections). Not two.
- **Matte materials, rounded geometry.** New 3D pieces go through `matte()` and `rbox()` so they match the set.
  No textures, no glossy plastic, no emoji, no photos.
- **Everything editable is a constant.** If you find yourself changing a number inside a function, lift it next to
  the others at the top.
- **Reduced motion is respected.** `reduced` is true when the OS asks for it: no flights, no drift, no ants, instant
  camera. Keep new motion behind the same flag.
- **Accessibility.** Real `<button>` and `<a href>` for anything clickable; `aria-label` on icon-only controls; the
  story card is `aria-live`; the stage has a text description in its `aria-label`.

---

## 5. Before you ship

- [ ] Replace both `[CONTACT EMAIL]` placeholders with the real address (search the file; both carry a `TODO`).
- [ ] Decide whether `source/` (the two PDFs) should be public. The "Read the one-pager" button links to it; if the
      PDF stays private, point the button elsewhere or remove it.
- [x] Favicons (`brand/favicon-32.png`, `favicon-512.png`, `apple-touch-icon.png`) and the OG image
      (`brand/og.png`, 1200×630) with its `<meta>` tags. If the domain changes, update `og:url` and `og:image`.
- [ ] Run `node tools/shoot.mjs` (section 7) and look at every screenshot. No console errors is the bar.
- [ ] Open it on a real phone. The card sits at the bottom, the dots along the bottom edge; dragging the search and
      pulling the lever must work with a finger.
- [ ] Hard-refresh the live URL after deploy; the vendored Three.js is cached aggressively by Vercel.

---

## 6. The story, for reference

Chapters (the dots on the right): I Forage · II Problem · III Bigger picture · 1 Start · 2 Fund · 3 Call · 4 Sign ·
5 Settle and split · $FORAGE (proposed) · Why Forage. "Watch the story" plays all of it in about 90 seconds; any
scroll, click or key stops it.

What the viewer can do: click the vault to deposit (2 Fund); drag the first search from Mia's agent onto SearchCo,
then click her agent for the other four (3 Call); pull the lever on the vault toward you to settle (5 Settle). Each
has a Next button as the keyboard route.

---

## 7. Testing

`tools/shoot.mjs` loads the site in headless Chromium with software WebGL, scrolls to each chapter and section, saves
a screenshot of each, and prints any console error or warning. It is how every change in this repo was checked.

```
npm i playwright@1.47.2            # once, anywhere; the script uses the Chromium it ships with
python3 -m http.server 8765 &      # the site
node tools/shoot.mjs ./shots       # screenshots land in ./shots
```

Software WebGL runs at a few frames a second, so a screenshot taken mid-glide shows the camera on its way, not where
it ends up; wait times in the script are generous for that reason. Treat the shots as a smoke test (does it render,
is anything missing or overlapping, any errors), not as the final look.

For the final look, open it in Chrome and Safari on a laptop with a real GPU and scroll slowly through the trail
once, then fast, then backwards.

---

## 8. Next

In the order we would do them:

Done (October 2026): favicons and the OG image; the vault door (hinged, opens on the lever pull, coins leave from
the gold inside); leaf thinning by the real split (`LEAF_FALL`); the lockup's wordmark outlined to a path; the phone
pass (bottom sheet, dots on its foot, `RAIL_PHONE`); sound, off by default.

Still open, in order:

1. **Contact address** (section 5). The site is not finished without it.
2. **Fast scrolling past Call.** One scroll past Call before the viewer has made the calls plays all five at full
   speed (about 29 s) while the page has moved on. `goTo` animates any jump of one chapter; a scroll jump should catch
   up instantly (`quick`) like a jump of several.
3. **The mark itself.** The wordmark is outlined, but the forked root is still a first sketch.
4. **A live-market mode after the story.** The ants are the seed of it: many agents, many calls, a ticker of
   settlements across the real catalog once there is one. Wait for the catalog; an invented ticker breaks the
   facts-over-adjectives rule.

---

## 9. Licences

All 3D is generated in code; there are no third-party models, textures or photos. Three.js is MIT
(`vendor/three/LICENSE`). Fonts are Google Fonts (Oxanium, Geist Mono, Arimo; OFL). Per-call prices are from
treg.to's public catalog, October 2026. All amounts are simulated. $FORAGE is a working name and its terms are
proposals.
