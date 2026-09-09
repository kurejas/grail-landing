# Grail — landing page

Static one-pager built from the Figma file **🟡 Gr. Temp. — LBR ADDDed**
(`OLoNFPaCpr7VEcQiJ8D5c5`, page *Landing 2 sept '26*). No build step, no
framework, no dependencies — upload the folder as-is over FTP.

```
index.html
css/style.css
js/main.js
assets/img/…        logo, card, avatar, beanie, heart, phone bezel, GU screens
assets/video/…      ← drop chest-reveal.mp4 here
```

`index.old.html` is the previous page in this folder, kept as a backup. Delete
it when you no longer need it — it is not referenced by anything.

## The uncropped card and fan

The slide 4 card and the slide 6 fan are cut off in their ORIGINAL frames —
the slide clips them, so every Figma export (download_assets, get_screenshot,
exportAsync alike) came back truncated at the slide's edge. The old
avatar-card.png ended mid-shoe; no CSS could have fixed that, because the
bottom of the card was not in the file.

Darius added two taller frames for exporting: 96:32022 (1680x1372) and
96:32410 (2372x1336), where nothing clips. Their artwork nodes carry
instance-scoped ids (`I96:32022;50:21476`) which the export tools cannot
address, so the assets were made this way:

1. export the whole tall frame at 2x
2. crop the artwork's rotated bbox (card 644.1x1049.7 at 925.9,114.7;
   fan 970.5x975.5 at 1219.5,31.8)
3. remove the gradient behind it with an edge-stopping flood fill from the
   border — a neighbour joins the background only if it is within 7 (card) /
   10 (fan) of the pixel it spread from, so a smooth gradient stays connected
   while the artwork's outline stops it

Tolerance matters: at 14 the fill walked straight into the card's dark tail
and ate it. 7 keeps the tail and still clears the corners.

Result: avatar-card-full.png 1289x2100 and season-cards-full.png 1941x1951,
both fully transparent outside the artwork. They are the WHOLE rotated
artwork, so their CSS box is the frame's rotated bbox and they carry no
rotation of their own.

Verified fully visible at 1680 (519x845 / 915x920, both ending flush on the
card's bottom edge at 960), 834 (432x703 / 656x659) and 402 (163x266 /
265x266).

## The greyscale iPhone (slide 3 only)

Slide 3's bezel image fill carries `saturation: -1` in Figma — the design
desaturates it. Figma's export does not bake that filter in (and comes back
composited and opaque), so `phone-frame-grey.png` is the existing transparent
bezel drawn through a `grayscale(1)` canvas filter, which is the same
transform. Measured saturation 0.0000, 86% transparent.

ONLY slide 3 uses it. Every other slide keeps the colour bezel.

## Artwork is fixed size — the bottom crops

RULE: the card and the fan are NEVER scaled. They sit at their exact Figma
pixel size — full size on desktop and tablet, exactly half on mobile — and
when the screen is too short to show all of it, the bottom is simply hidden by
the card's clip. On a tall screen the whole thing is visible.

|         | desktop / tablet     | mobile              | position in R |
|---------|----------------------|---------------------|---------------|
| card s4 | 644.1 x 1049.7       | 322.05 x 524.85     | 45.9, 74.7 (centre 368 of 660) |
| fan s6  | 661.9 x 834.3        | 330.95 x 417.15     | 65, 124.1 (centre 395.9 of 680) |

No `object-fit: contain`, no `max-height` tied to the column — fitting to the
column would be scaling. Measured: 644.1x1049.7 at 46,74.7 and 661.9x834.3 at
64.9,124.1, matching the frame exactly; half-size on mobile to 0.01px. At
1680x1000 the card's last 204px are hidden and the fan's last 38px; at
1680x1260 both are fully visible.

This REPLACES the earlier shrink-to-fit approach, which was wrong: fitting the
artwork to a short column is scaling, and scaling is banned.

## Inline artwork: transparent PNGs

Every small inline image is a 2x PNG with a genuinely transparent background:

| slide | asset | size |
|-------|-------|------|
| 3 | gem2x.png    | 116x116 |
| 4 | beanie2x.png | 348x276 |
| 5 | streak2x.png | 92x176  |
| 6 | dice2x.png   | 240x270 |
| 7 | heart2x.png  | 262x228 |

Figma's node export composites against whatever is behind it, so a naive
export arrives with the slide baked in. `dice.svg` and `streak.svg` came back
with a #333333 canvas rect, the frame's 1680x1000 black rect AND the slide's
gradient card path in front of the icon — which is the grey box that showed
up behind the dice.

The fix: strip those three elements from the SVG, then rasterise it to PNG on
a transparent canvas at 2x. ALWAYS check the alpha channel afterwards — a
fully opaque corner pixel means the export is still composited. All five were
verified: corner alpha 0 and 32-49% of pixels fully clear.

There is no SVG rasteriser on this machine (no rsvg-convert, inkscape,
ImageMagick or cairosvg), so the conversion ran in the browser via canvas,
posting the result to a temporary PHP endpoint. That endpoint has been
deleted.

## signup.php needs PHP 7.x compatibility

MAMP here runs PHP 7.4.33. `signup.php` used two PHP 8 constructs and was a
FATAL ERROR on every request:

- `str_contains()` (8.0+) -> now `strpos(...) !== false`
- the `never` return type (8.1+) -> now omitted

This passed earlier testing because that ran against `php -S`, which was on a
newer PHP. Re-tested on MAMP: empty name, invalid email and the honeypot all
respond correctly.

## Slides 3-7 — the split system

S3 44:18215 · S4 24:8304 · S5 44:18944 · S6 60:29227 · S7 24:8273

All five are the hero's layout again, so they share one set of rules
(`.sec--split`). The hero's structural classes were renamed to neutral ones —
`split__col`, `split__copy`, `split__heading`, `split__body` — and the type,
gaps and breakpoints now live on `.sec--split` rather than `.sec--hero`.

Each frame is a 1600x920 slide, HORIZONTAL, gap 80, 100 side margins, two
equal `flex: 1` columns. Heading lines stack with a -6 gap (-2 mobile);
48/50 kicker, 144/150 display, optional 48/50 tail, 18/26 body.

Column order alternates, exactly as the frames do:

| slide | 3 | 4 | 5 | 6 | 7 |
|-------|---|---|---|---|---|
| copy  | right | left | right | left | right |

The markup is always copy-first (the order the small-screen frames use) and
`.sec--flip` reverses it on desktop only.

Verified against the frames at 1680: Heading and Body boxes match EXACTLY on
s3, s4, s5 and s6, and within 2px on s7 (its Button/L bbox is 59 in Figma
because Figma grows an auto-layout to fit a rotated child; CSS transforms
never do). Every inline pictogram lands on its exact frame x.

Corrections this pass, all read from the file:

- SLIDE 3's theme is a neutral grey (#505050), not the blue it had.
- SLIDE 6's theme is slate (#464f75), not blue.
- SLIDE 5's copy was wrong: it is "Trade and Sell" / "your" / "Gems and
  Cosmetics" — the display word is YOUR, not GEMS.
- SLIDE 5's pictogram is "Pictogram / Streak", not a gem. Exported as
  streak.svg.
- SLIDE 6 needed "Pictogram / Dice". Exported as dice.svg.
- SLIDE 6's opening line is drawn as two wrapped lines and its two body
  paragraphs sit 12 apart, not 32 (there is no button on that slide).
- SLIDE 4's card and SLIDE 6's fan are exported ALREADY ROTATED, so they are
  placed by their render bounds and get no transform of their own. Rotating
  again would double it.

Slide 6 also differs structurally: 80 side margins and 680 columns, not
100/660.

In-slide scrolling is on for all of them (`SCROLLS` in js/main.js). Verified
on s3 at 1440x700: one gesture scrolls 0 -> 200, the next advances to s4.

Type measured identical at 1680 / 1440 / 834 (48/50, 144/150, 18/26) and
switching once to 28/32, 72/75, 14/22 below 760. No `vw` or `em` sizing
remains anywhere in the split system.

## Promo banner

Read off the frames (desktop Banner 38:16271, mobile 47:20486). The banner
element maps to Figma's "Inner Banner".

|                  | Desktop        | Mobile         |
|------------------|----------------|----------------|
| box              | 504x145        | 382x162        |
| banner rotation  | -2deg          | -1.5deg        |
| kicker           | 18.7, 26.6 · 20/22 · rot -2deg | same, 18.5, 26.8 |
| headline         | 16.7, 60.3 · 26/28 · rot -4deg | same, 16.2, 60.4 |
| headline box     | 406.5 wide, 2 lines | 306.5 wide, 3 lines |

Three things were wrong and are fixed:

- The box was 500x128 against the frame's 504x145. Being 17px short squashed
  the contents and pushed the headline up into the kicker.
- Both text origins were off (17.76,22.17 and 14.56,46.6).
- `transform-origin` was `left center`; the origins above come from each
  node's own transform matrix, so it has to be `0 0` or the rotation lands
  the line somewhere else.

The two lines carry DIFFERENT rotations — 2deg on the kicker, 4deg on the
headline — which is what gives the banner its hand-lettered look.

Line breaks now match the frames at both sizes: 2 lines on desktop,
"FOUNDING MEMBER / COSMETIC, AND 500 / GRAILGOLD" on mobile.

The whole banner is a link to the form: `.promo__hit` covers the inner box at
z-index 1, with the close button at z-index 2 above it. Clicking anywhere goes
to slide 9 (and retires the banner); the X still only dismisses.

Mobile now uses the mobile frame's own text values rather than inheriting
desktop's — kicker 18.5,26.8 and headline 16.2,60.4 at 306.5 wide.

Residual difference, and it is NOT positional: overlaying the Figma render at
1:1 with difference blending shows each line starting aligned and drifting a
couple of px by its right end. That is font metrics — the browser's Inter
renders roughly 0.7% wider than Figma's (our kicker measures 294 against the
frame's 292), so the error accumulates along a line. It cannot be fixed by
moving anything; only letter-spacing would close it, and it is present on
desktop too.

The gold bars are scaled per breakpoint: the frame's "Pictogram / Go" is
95x95 at 282,62 on desktop and 76x76 at 164,106 on mobile — a 0.8 scale.
Mobile was inheriting the desktop size, so the bars sat too big, too far left
and too high. Height keeps gold-bars.svg's own 95:84 aspect rather than the
square node box.

NOT matched by number: the jacket artwork. `jacket.png` is a different crop
from the frame's "jacket" rect — ours carries the whole sleeve, the frame's
shows only the hands — so placing it by its node box (148x129 at 329,-18)
makes it far too large and central. It stays placed by eye against the Figma
render. Same for the gold bars.

## Slide height and scrolling

Slides carry NO min-height. Each is exactly the viewport (`.sec` is
`position:absolute; inset:0`), so the deck behaves as it always did: one
gesture, one slide.

The in-slide scrolling machinery in `js/main.js` section 5b is still there but
inert — overflow is `slideHeight - innerHeight`, which is now always 0, so
`scrollWithin()` returns false immediately and the deck handles every event.
It stays in place in case a slide is ever allowed to exceed the viewport
again; nothing has to be re-derived if so.

Verified at 1440x700: slide height 700, overflow 0, and three gestures walk
s1 -> s2 -> s3 -> s4 with one more going back up to s3.

## Layout: fixed constants, flexible containers (slide 1 done)

Slide 1 is rebuilt as a direct translation of the Figma auto-layout, read
from the file: Desktop 47:19832, Tablet 60:28881, iPhone 50:22433.

Nothing scales with the viewport — no `vw` in a font-size, no `em` on
artwork. The containers flex; every size is a literal px constant.

Frame sizes as read from the file: Desktop 1728x1000 (slide 1648x920, two
684 columns), Tablet 834x1194, iPhone 402x814. The desktop frame was widened
from 1680 partway through; `flex: 1` absorbed it with no code change.

|              | Desktop >=1366   | Tablet 760-1365  | Mobile <=759   |
|--------------|------------------|------------------|----------------|
| slide        | ROW gap 80 pad 0 100 | COLUMN gap 40 pad 80 0 | COLUMN gap 28 pad 70 0 |
| phone in R   | 55.63% / top 96  | centred / top 0  | centred / top 6 |
| kicker       | 48 / 50          | **28 / 32**      | 28 / 32        |
| wordmark     | 144 / 150        | **72 / 75**      | 72 / 75        |
| body         | 18 / 26          | **14 / 22**      | 14 / 22        |
| Content gap  | 20               | **10**           | 10             |
| Body gap     | 32               | **16**           | 16             |
| Heading gap  | -6               | **-2**           | -2             |
| Mantle card  | 100x146          | **50x73**        | 50x73          |
| body max-w   | (column, 580)    | **480**          | 480            |

TABLET NOW USES MOBILE TYPE. The tablet frame 60:28881 was redrawn: its
desktop-sized copy column is switched off (`visible=false`) and the live one
carries the mobile set, with a HUGGING wordmark so the Mantle card sits ON TOP
of the letters rather than in a gap. Card offset from the heading centre is
+57 on both tablet and mobile, so the same `calc(50% + 32px)` serves both.
Only the container widths and the artwork stay tablet-sized.

Verified at 834x1194: L 40,120 754x222 (frame 224), Heading 60,120 714x103
(frame 105), card 449,156 (frame 449,158). All six split slides report
28/32, 72/75, 14/22 with the body capped at 480.

Desktop and tablet are numerically identical — only the direction of the
slide changes. Mobile is the single place the numbers move.

The phone is anchored to the TOP of the R column at every breakpoint, by a
px offset, never by a percentage of R. R is the leftover height, so a
percentage walked the phone up over the copy on a short tablet and pushed it
down and right on desktop. Horizontally it is centred in its column on tablet
and mobile, and sits at 55.63% on desktop.

Three things the frames do not say outright:

- The Mantle card is placed from the CENTRE (+66px), not from the Heading's
  left edge. A left offset only lands in the letter gap at the frame's exact
  width; at 1000px it drifted onto the "A".
- `hero__actions` carries a min-height (62 / 62 / 90). Figma grows an
  auto-layout to fit a ROTATED child, CSS transforms never affect layout, so
  without it the row is 8px short and the centred stack sits 4px low.

- A leftover `.phone` rule from the old stacked fallback was leaking a 30px
  margin-top and a vw width into the hero. It is now scoped to
  `.sec:not(.sec--hero)`.

Verified box-for-box against all three frames, and type measured identical at
1680 / 1440 / 1366 / 1000 / 834 / 760 (switching once at 759) with no overflow
at 360x640.

## Layout: fluid, never scaled (slides 2-9, still to convert)

No slide is transform-scaled. The Figma frames (1600x920 desktop, 754x1114
tablet, 362x774 mobile) are references for PROPORTIONS only:

- positions are percentages of that surface (x/1600, y/920)
- type is real px, clamped against vw, so it stays readable at any width
- artwork widths are vw with a px ceiling
- copy blocks stack in flow with `em` offsets, so they reflow as auto-layout does
- art that hangs off a word (beanie, heart, gem, gold bars, jacket) is `em`
  from that word's own box, which is `width: fit-content` — so it tracks the
  glyphs at every size instead of drifting with the column

The one remaining `scale()` is the slide transition itself: an outgoing slide
recedes to 0.9. That is motion, not layout.

Verified with no clipping and real px type at 1920x1080, 1680x1000, 1440x900,
1366x768, 1366x1400, 1000x1300, 834x1194, 759x900, 402x814, 390x1300 and
360x640.

## Hero video and HTTP Range

The video starts at FRAME 3, not frame 1. Frames 1 and 2 are a white flash
fading in (mean luma 253 and 143 against 29 for frame 3), so starting there
would flash white every time. `hero-poster.jpg` is that same frame 3, so the
still and the first played frame match.

This needs the server to honour HTTP Range requests. Apache and any real host
do; PHP's built-in dev server (`php -S`) does NOT — it answers 200 instead of
206, `video.seekable` comes back empty, the seek is silently ignored and the
white first frame plays. Test video behaviour on MAMP (port 8888), not on
`php -S`.

## Favicon

`assets/img/favicon2x.png` — the Grail G, 32x32 with transparency, linked as
both the browser icon and the Apple touch icon.

At 32px it is a 2x asset for a 16px favicon, which is what browser tabs use, so
tabs are sharp. It is small for the other two places an icon gets used: iOS
home-screen shortcuts want 180x180 and PWA installs want 512x512, and both will
upscale it. If either matters, export the G at those sizes and add them
alongside — no code change beyond two more `<link>` tags.

## Hero video

`assets/video/reveal_short.mp4` (804x1748, 37.5s) plays in the hero phone.
Muted, `playsinline`, **no loop**, `preload="none"` — nothing is fetched until
the hero is on screen, so it never competes with first paint.

`assets/img/hero-poster.jpg` is frame 1 of that video, extracted with ffmpeg,
and shows while the file loads.

Behaviour, all in `playVideo()` in `js/main.js`:

- plays once when its slide becomes current;
- leaving the slide **pauses it where it is**;
- coming back **resumes from that point**;
- if it had already finished, coming back **starts it again from 0**.

The file still carries its audio track. It is played muted, so stripping the
audio (`ffmpeg -i in.mp4 -c:v copy -an out.mp4`) would cut the download for
free if you want it.


## Slide transitions

Taken from the **slide transition up down** prototype (`38:16308`). Moving
forward, the incoming slide rises from below the viewport while the outgoing
one recedes to 0.9 behind it; going back reverses it. Timings are the
prototype's own reaction values — **600ms forward, 300ms back, ease-in-out**.

Scaling the whole section by 0.9 about its centre reproduces Figma's state B
exactly: a 1680×1000 frame at 0.9 puts the 40px-inset card at 120,86 sized
1440×828, which is what the frame shows.

The deck no longer scrolls — it is a fixed stack driven by wheel/trackpad,
touch swipe, arrow/Page/Home/End keys, the dot rail and any in-page link.
Jumping straight from slide 1 to slide 4 animates only those two — the slides
in between are repositioned with transitions suppressed, so they don't fan past.

### Arriving and leaving

**Leaving.** The outgoing slide recedes to 0.9 *and* fades out completely as a
single unit — contents and gradient together, on one clock. Its contents are
held at full opacity on the way out (the `is-past` rules) precisely so they
*don't* fade separately; two fades at different speeds read as the copy
dissolving off its own background.

**Arriving.** The incoming slide's card starts full-bleed — running edge to
edge, no side margins — and the margins ease in as it rises, matching the
prototype where the incoming slide is 1680 wide at (0,1000) and settles to 1600
at (40,40). Only the sides animate: the vertical movement is the slide's own
travel, and section 2's card sets its own top and bottom. The margin is
`--inset`, not a literal 40px, so the narrower mobile margin (14px at 402px
wide) is honoured without a second rule.

Its contents then fade in over 420ms, staggered 110ms apart, which is what
gives each slide its entrance. Everything keys off `.is-current` rather than a
one-shot class, so this plays every time a slide is visited, in both directions.

Sections carry no background of their own — the black surround comes from
`<body>`, so a slide never paints an opaque plate over the one behind it.

### The deck is now nine slides

| # | id | Slide | Figma |
|---|---|---|---|
| 1 | s1 | Welcome to Grail | `47:19832` |
| 2 | s2 | How Grail works | `24:10412` |
| 3 | s3 | Collect gems | `44:18215` |
| 4 | s4 | Customize your avatar | `24:8304` |
| 5 | s5 | Trade and sell gems | `44:18944` |
| 6 | s6 | End of season | `44:18979` |
| 7 | s7 | Grail University | `24:8273` |
| 8 | s8 | We choose you! | `32:13550` |
| 9 | s9 | Join Grail today | `38:14439` |

The dot rail is now nine real dots — no placeholders.

**State of play.** Slide 1 is built against all three frames and verified.
Slides 3, 5, 6 and 9 have been **diff-verified against their frames on desktop**
and every heading and body block now lands on its measured position. Slide 8's
title has a small horizontal offset on its second line that is not resolved.
Slides 2, 4 and 7 are unchanged from the earlier build and not re-verified.

Below 900px, slides 3, 5, 6 and 9 **reflow into a readable stack** — copy first,
artwork beneath — rather than using their Figma tablet/mobile frames, which are
not built yet. Scaling the 1600x920 surface down was tried first and rejected:
it puts body copy at roughly 4px.

Known gaps to pick up next:

- Tablet/mobile frames exist for slides 2, 3, 7, 8 and 9 and are not built yet.
- The gem icon beside "GEMS" on slide 3 is not exported.
- The slide 9 form fields are styled to match the frame's shape but the exact
  field treatment has not been checked against `Form / Set`.
- `We choose you!` wraps to two lines by design, so it opts out of the
  `.display` nowrap rule.
- Phone screens on slides 3 and 5 come from the raw image fills at 804x1748 —
  1.5x for their 535px display box, not 2x. That is the resolution of the
  source upload; `download_assets` at scale 2 returns a clipped region.

### Breakpoints

| Range | Layout |
|---|---|
| ≥ 1366px | Desktop |
| 760 – 1365px | Tablet |
| ≤ 759px | Mobile |

Card inset is 40px on desktop and tablet, 20px on mobile.

### The five main slides alternate sides

Slides 3–7 swap which side the copy sits on, so the eye zig-zags down the deck:

| Slide | Copy | Visual |
|---|---|---|
| 3 Collect gems | right | left |
| 4 Customize your avatar | **left** | right |
| 5 Trade and sell | right | left |
| 6 End of season | **left** | right |
| 7 Grail University | right | left |

Slides 4 and 7 were mirrored from the earlier build to follow that rhythm —
their vertical layout is unchanged, only the horizontal side moved, measured
off the current frames.

### Why the artwork is no longer cut off

The compositions deliberately run past the bottom of their surface — the hero
phone reaches y≈1330 inside a 920-tall surface. The stage used to be centred,
which split that overflow evenly and clipped the artwork at *both* ends
regardless of how much room the device had.

The stage is now anchored to the **top** of the card, so any spare height goes
where the design puts the artwork. That reproduces both iPhone frames from one
rule: on a short device the phone crops exactly as drawn, and on a tall one it
comes fully into view. Measured: at 402x960 the phone overhangs by 74px, at
402x1120 it is **fully visible with nothing cut**.

Height is still a factor in the scale (`k = min(cardW/stageW, cardH/stageH)`),
so a short viewport shrinks the whole composition rather than eating the copy.

### Slide 9 has three states

Driven by `data-state` on the section, which also shifts the copy block to the
top the frames give it:

| State | Copy top | What is on screen |
|---|---|---|
| `form` | 185px | Name + email, two fields |
| `extended` | 81px | …plus the three optional questions |
| `done` | 268px | "Thanks for joining!" and Sign up again |

The three optional questions (`What do you collect?`, `Favourite team`,
`How long have you been collecting for?`) appear only once a **usable email**
has been typed — the note on the frame asks for this so the first view is not
five fields deep. Once revealed they stay.

Fields follow `Form / Input`: 640x68, black, square corners, a 14px gold label
that sits centred as the placeholder and rises to y=10 when the field has
content, and the whole field turning gold on focus with black text.

A successful submit swaps to the thank-you panel rather than printing a line of
status text; **Sign up again** resets the form and returns to `form`.

Note: the success copy reads "You'll getting a Founding Member Cosmetic" —
that is verbatim from the frame, typo and all. Worth fixing in Figma.

### Slide 1

Rebuilt from the updated frames: desktop `47:19832` (1680x1000), tablet
`47:19977` (834x1194) and mobile `50:22433` (402x814).

Each breakpoint has its own Figma reference surface — 1600x920, 754x1114 and
362x774 — declared as `--stage-w` / `--stage-h` on `.stage--fixed`. The CSS
picks which is active and `main.js` reads it, scaling against the card's real
box. So all three layouts are positioned in literal Figma pixels rather than
one of them being a fluid approximation. Desktop and tablet run the two calls
to action side by side; mobile stacks them and drops to `Button / M`.

The card inset is a fixed 40px in the desktop and tablet frames and 20px in the
iPhone frame, so it is set per breakpoint rather than as a fluid clamp.

Slides 2–4 still use the earlier flow-based mobile layout below 900px — they
are unchanged here, and are due a rework against the new 9-slide structure.

### Promo banner

Fixed bottom-left, outside `.deck` so it never travels with the slides.
Hidden on load, rises after **3 seconds** (`PROMO_DELAY`), and drops away when
the X is clicked. Dismissal lasts for that page view only — nothing is stored,
so a reload shows it again 3 seconds later.

It also **retires itself on the form slide**: if the visitor reaches slide 9
with the banner still up, it slides away rather than covering the form it was
inviting them to. The banner is an invitation to sign up, so once the signup
form is on screen it has done its job.

**It follows the slide theme.** Gradients cannot be transitioned in CSS, so the
two themed stops are custom properties registered with `@property`, which can
be — they animate on the same clock as the slide (`--slide-dur`) instead of
popping. Browsers without `@property` still get the right colour, just
instantly. Blue slides give `#328195`, slate slides `#5D699C`.

### Where the buttons go

`SIGN UP` (header), `GET EARLY ACCESS` (hero) and `START NOW` (banner) all jump
to the form on slide 9. `Grail University` and `Privacy Policy` are `href="#"`
— they hover like links but do not navigate, and the click handler swallows
the event so no stray `#` lands in the address bar. Point them at real
destinations when they exist.

The reveal is driven by a timer rather than `requestAnimationFrame`: rAF is
suspended while a tab is hidden, which would leave the banner un-shown with the
element already un-hidden. Two numbers worth knowing: `PROMO_DELAY` at the top
of the promo block sets the 4s wait, and the headline box is 416px rather than
Figma's 406 — `FOUNDING MEMBER COSMETIC,` measures 408px in the browser against
Figma's tighter fit, so at 406 it broke a word early onto a third line.

### Display words never break

GRAIL / AVATAR / HOBBY carry `white-space: nowrap` on the shared `.display`
class, so they hold one line at every width. It matters most for the hero
wordmark, which is split into spans around the overlapping card and would
otherwise be free to break between them. It was previously declared only in
the desktop block, leaving all of them breakable below 900px.

Checked down to 320px: at the clamp floor the longest word (AVATAR) inks
189px, so nothing overflows once it can no longer wrap.

### The section 2 title (Safari)

The gradient on HOW / GRAIL / WORKS lives on **each line**, not on the `<h2>`.
Two separate bugs forced that, both of which render the words invisible:

- **Safari** drops `-webkit-background-clip: text` when the clipped element
  also carries a `transform`. The title used to be centred with
  `left:50%` + `translateX(-50%)`, which is exactly that. It is now centred
  with `left/right:0` + `text-align`, so nothing transforms the clipped box.
- With the clip on the parent, the three lines are block boxes that inherit a
  transparent fill but have no background of their own, so the parent's
  text-clipped gradient never reaches their glyphs. Chromium showed this the
  moment the first fix landed.

Both go away by putting the background and the glyphs on the same element.
The design's gradient still runs unbroken across all three lines: each line
paints a backdrop three lines tall (`background-size: 100% 300%`) and shows
its own third of it via `background-position` 0% / 50% / 100%.

The stagger animation stays on the wrapping `.how__w`, so the clipped
`.how__g` never has a transform of its own.

### Theme colours

Each slide names a theme (`data-theme` on the section) and the deck copies it
to `<html>` on arrival. The per-slide gradients are static — each card carries
its own — but the fixed chrome outside the deck is shared, so the nav link
colour and the dot rail have to travel between themes: `#328195`/`#204C68` on
the blue slides, `#5D699C`/`#464F75` on the slate ones.

Those transition on `--slide-dur`, the same clock as the slide itself, so the
colour change lands exactly as the new slide settles. `--slide-dur` is set on
`:root` rather than the deck for this reason — the chrome and dot rail are not
inside the deck and would not otherwise see it.

### Reading the wheel

Two things arrive as identical events and have to be told apart: the decaying
tail of a flick that has already been counted, and a person still actively
scrolling. Get it wrong in one direction and one flick skips three slides; get
it wrong in the other and the deck ignores you until you stop dead and wait.

A fixed lock cannot do it — however long you make it, a flick's tail is still
arriving when it lifts and instantly trips the threshold again. So the deck
disarms whenever it moves, and re-arms on either of two signals:

- the wheel goes **quiet** for `WHEEL_REARM` (160ms) — the gesture ended; or
- an event arrives **larger than the one before it** — inertia only ever
  decays, so growth means the hand is pushing again.

That second test compares against the *previous event*, not the largest delta
of the gesture. Comparing against the peak looks equivalent and is the reason
an earlier build felt stuck: after a hard flick peaking near 110, ordinary
continued scrolling around 40 never beats that peak, so nothing moved until you
stopped completely. The growth must also clear `WHEEL_RISE_PCT` (15%), so
jitter partway down a decay curve doesn't spend one flick twice.

Re-arming is suppressed while a slide is still moving: the opening ramp of the
flick just counted is itself rising, and would otherwise be read as a new push.

Timing comes from the events' own timestamps rather than a `setTimeout`,
because background tabs clamp timers to ~1s — exactly when a timer-based lock
would need to be accurate. The busy lock is released 120ms before the slide
finishes settling; the tail of an ease-in-out is visually done, and waiting the
full 600ms is what makes a deck feel unresponsive.

All four constants sit together at the top of that block if the feel needs
tuning on real hardware.

Without JavaScript the stack never engages and the page falls back to an
ordinary scrolling document, one section per screen.

## Two switches

Both live at the top of `js/main.js`:

| Switch | Default | What it does |
|---|---|---|
| `section2` | `"animated"` | `"animated"` staggers HOW / GRAIL / WORKS in on arrival. `"static"` renders the frame exactly as drawn, plain fade only. |
| `phoneCrossfade` | `true` | The Grail University phone crossfades from the topic list to the article. Both screens are in the Figma file; `false` shows only the article, which is what the static frame shows. |

`DUR_FWD` and `DUR_BACK` just below them set the slide timings.

## How the layout holds its proportions

The Figma frame is 1680×1000 with a 40px-inset card, so the drawing surface is
exactly **1600×920**. At ≥900px every element is positioned in those literal
Figma pixels inside `.stage`, and the stage is uniformly scaled by `--k`
(computed in JS). At a 1680×1000 viewport `--k` is exactly `1` and the render
matches the frame pixel for pixel; at any other size it scales proportionally
rather than distorting. Below 900px the stage is dropped and each section
reflows to the stacked layout from the iPhone frames.

Verified against the Figma frames by difference-blend overlay: text metrics land
within ~1px of the reference, and the wordmark, avatar card, heart, phone and
chrome are all on their exact coordinates.

## Two things worth improving later

1. **WebP.** `phone-frame.png` (507 KB) and `avatar-card.png` (780 KB) are the
   two heavy assets — together about two thirds of the page. This machine's
   ffmpeg has no `libwebp` and there is no `cwebp`, so they shipped as PNG.
   After `brew install webp` they convert to roughly 90 KB and 140 KB:

   ```bash
   cwebp -q 86 assets/img/phone-frame.png -o assets/img/phone-frame.webp
   ```

   then swap the `<img>` tags for `<picture>` with a PNG fallback.

2. ~~Retina avatar.~~ Done — `download_assets` exports at a chosen scale, which
   `get_screenshot` cannot do. Every raster asset is now 2× its on-screen size:

   | file | source | on screen |
   |---|---|---|
   | avatar-card.png | 1306×1696 | 653×848 |
   | beanie.png | 167×132 | 83.5×65.6 |
   | card-mantle.jpg | 168×270 | 79×135 |
   | phone-frame.png | 1234×2484 | 600×1218 |
   | gu-list / gu-article.jpg | 1070×2327 | 535×1164 |

   `heart.svg` and `logo.svg` are vector, and every raster with a cut-out
   (avatar, beanie, phone bezel) is RGBA with a genuinely transparent
   background.

   **Getting a 2× export that is also transparent took two passes.**
   `download_assets` is the only tool here that can export at a chosen scale,
   but it renders the node *in context* — the slide's gradient is baked into
   the result, so both the avatar and the beanie shipped briefly as opaque
   rectangles. `get_screenshot` with `contentsOnly` isolates the node properly
   but refuses to upscale past 1×. Neither alone does the job:

   - **Avatar** — colour from the 2× export, alpha from the isolated 1× export
     upscaled, and the 31k partially-transparent edge pixels un-blended against
     the baked gradient (`fg = (obs − bg·(1−a)) / a`, with `bg` sampled per row
     from a fully transparent column). Result is a true RGBA cut-out with soft
     edges and no dark fringe.
   - **Beanie** — pure vector, so it was exported as SVG via the plugin API
     (`download_assets` puts a grey `<rect>` behind its SVG too) and rasterised
     at 2× on a canvas. `beanie.svg` is kept alongside as the vector source and
     is the better asset if you would rather reference it directly.

   `avatar-card.png` is 2.9MB — true alpha rules out palette quantisation, and
   the artwork carries film grain that PNG cannot compress. WebP would take it
   to a few hundred KB (see below); it is lazy-loaded, so it never delays the
   hero.

## Signup form → email

`signup.php` takes the slide 9 form and emails it to **kurejas@gmail.com**.
Dependency-free plain `mail()` — no composer, no SMTP library — which is what
works on almost every shared host.

It also validates, blocks header injection (a newline in name or email is
rejected outright), carries a honeypot field that bots fill and people never
see, and appends every submission to `signups.log` so there is a local record
even if mail is not wired up on the box.

The form posts over `fetch` so the deck is not navigated away from; without
JavaScript the plain POST still works and `signup.php` redirects back with
`?signup=ok`.

**Change `$TO` at the top of `signup.php`** to route the mail elsewhere.

### Delivery — read this before trusting a local test

The endpoint is verified working. Whether the mail *arrives* is a separate
question, and a local Mac is the worst possible place to test it:

- The From domain has no SPF or DKIM record.
- The sending IP is residential.

Gmail rejects or silently drops mail with that profile, so a test from
localhost proves the code path, not deliverability. Test on the real test URL
instead — most shared hosts have `mail()` wired to an MTA whose IP and SPF are
already trusted.

If your host does not, or mail lands in spam, switch to authenticated SMTP:
drop in PHPMailer and point it at your host's SMTP (or a service like Postmark
or SendGrid). Only the `mail()` call near the bottom of `signup.php` changes.
