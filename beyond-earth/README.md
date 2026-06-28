# Beyond Earth — Journey Through the Future of Space Civilization

A single-page, scroll-driven storytelling site built for a Techfest competition.
Pure HTML5, CSS3, and vanilla JavaScript — no frameworks, no build step.

## Running it

Just open `index.html` in a browser. No server, no install, no dependencies.
(An internet connection is needed once, to load the Google Fonts; everything
else — all animation, all visuals — is self-contained in these three files.)

```
beyond-earth/
├── index.html      → structure & content for all 7 sections + hero + finale
├── style.css       → all visual design, layout, responsive rules, animation keyframes
├── script.js       → all interactivity: canvases, scroll logic, nav, reveals
├── assets/         → reserved for any future image/audio assets (currently empty —
│                     every visual in this build is CSS/SVG/Canvas, so no image
│                     assets were required)
└── README.md       → this file
```

## What's inside

1. **Hero** — animated starfield canvas, drifting nebula blobs, parallax layers
   that respond to mouse movement, a floating SVG astronaut, and a staggered
   title reveal.
2. **Solar System** — eight planets on slowly rotating orbit rings (pure CSS),
   each clickable/keyboard-focusable and linked to a glassmorphism info card
   below.
3. **Mars Colony, 2075** — an SVG skyline silhouette, a canvas layer of drones
   with blinking lights drifting across it, and five scroll-revealed cards
   covering transportation, energy, population, AI, and architecture.
4. **The Black Hole** — the site's signature element: a canvas particle system
   simulating matter spiraling into an event horizon, with intensity tied to
   scroll position, plus a cinematic blurred-text reveal.
5. **Future Technology** — five tilting, glowing cards (AI, quantum computing,
   fusion energy, space elevators, robotics), with a cursor-tracked 3D tilt.
6. **Timeline (2026 → 2100)** — a vertical timeline whose connecting line
   fills in as you scroll past each milestone.
7. **Explore the Galaxy** — a hover-zoom gallery grid of CSS/gradient-rendered
   "deep space" scenes.
8. **Finale CTA** — ambient drifting particles behind a closing call to action
   that loops back to the hero.

## Interaction & motion systems (script.js)

- Animated loading screen (skipped automatically if the user has reduced
  motion enabled)
- Custom cursor with a hover "spotlight" state (disabled on touch devices)
- Sticky/blurring navbar with scroll-position active-link highlighting and a
  mobile hamburger menu
- Top-of-page scroll progress bar + back-to-top button
- IntersectionObserver-driven scroll reveals across every section
- Five independent `<canvas>` systems (hero stars/meteors, Mars drones, the
  black hole, the finale particles) — each one pauses itself via
  IntersectionObserver when off-screen, and via the Page Visibility API when
  the tab isn't active, to keep things at 60fps without burning CPU when
  it's not visible
- All motion respects `prefers-reduced-motion`: with it enabled, canvases
  render once statically instead of looping, and CSS animations are cut to
  near-zero duration globally

## Accessibility

- Semantic landmarks (`header`, `main`, `section`, `footer`), one `h1`, and a
  logical heading hierarchy throughout
- All decorative SVG/canvas elements are `aria-hidden`
- Visible focus rings (`:focus-visible`) sitewide
- Planets in the orbit diagram are keyboard-focusable buttons (Enter/Space
  activates them)
- Color choices keep body text at or above WCAG AA contrast against their
  backgrounds

## Customizing

- **Colors / type / spacing**: all defined as CSS custom properties at the
  top of `style.css` under `:root` — change a token once, it updates
  everywhere.
- **Copy**: every section's text lives directly in `index.html`, no JSON or
  external data files to manage.
- **Section count**: each section is a self-contained `<section>` block; you
  can reorder, remove, or duplicate them without touching JavaScript, since
  all scroll-reveal logic targets `[data-reveal]` generically.

## Browser support

Built and tested against current Chrome, Firefox, Safari, and Edge. Uses
`backdrop-filter`, CSS custom properties, `IntersectionObserver`, and
Canvas 2D — all standard in any browser shipped in the last several years.
