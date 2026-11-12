# Responsive Frontend Guidelines (MANDATORY)

Applies to every new page, component, and edit in `frontend/` (plain HTML + CSS + JS, Arabic RTL).
Every page must work from **320px phones to 4K** with **no layout breakage, no horizontal scroll, no console errors**.

## Project context
- Pages: `frontend/pages/*.html` (`<html lang="ar" dir="rtl">`)
- CSS load order: `variables.css, base.css, layout.css, components.css, <page>.css, enhancements.css, styles.css, mobile-pwa.css` in `frontend/css/`
- Reuse existing variables/classes in these files. Do not duplicate styles. Put page-specific rules in that page's CSS file.
- See also `docs/ui-ux-design-guide.md`.

## 1. Foundations
- Every page has `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. Never use `user-scalable=no`.
- Mobile-first: base styles target mobile; enhance with `@media (min-width: …)`.
- Global `*, *::before, *::after { box-sizing: border-box; }`.
- Breakpoints (define once in `variables.css` as documentation, use consistently): `480, 768, 1024, 1280, 1536`.
- Prefer content-driven layouts (`auto-fit`/`minmax`) over many breakpoints.

## 2. Layout
- Use Flexbox/Grid with `gap`, `flex-wrap: wrap`, `grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr))`.
- No fixed px `width`/`height` on containers. Use `%`, `rem`, `fr`, `max-width`, `min()`, `clamp()`.
- Use `min-height: 100dvh` (with `100vh` fallback before it), never bare `100vh`.
- Flex/grid children that hold text/tables/inputs: `min-width: 0`.
- **No horizontal page scroll at any width.** Find and fix the cause. Never hide it with `overflow-x: hidden` on `body`.
- Avoid `position: absolute/fixed` for general layout. Fixed bars (header, bottom nav) must not cover content: add matching padding and `env(safe-area-inset-*)`.

## 3. Typography & spacing
- `rem` units. Fluid sizes: `font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`.
- Body/input text >= 16px on mobile (prevents iOS zoom).
- Long text/URLs/names: `overflow-wrap: anywhere`. Limit line length (~60-75ch) for paragraphs.
- Use spacing variables with `clamp()` for paddings/margins, not large fixed px.

## 4. Components
- **Tables:** wrap in `.table-scroll { overflow-x: auto; }` or convert to stacked cards below 768px. Only the wrapper scrolls, not the page.
- **Forms:** inputs `width: 100%` on mobile, correct `type`/`inputmode`, labels visible, touch targets >= 44x44px.
- **Navigation:** collapses on mobile (hamburger or bottom nav), toggle is a `<button>` with `aria-expanded`.
- **Modals/dropdowns/toasts:** `max-width: calc(100vw - 2rem)`, `max-height: 90dvh`, internal scroll, never off-screen.
- **Images/video/iframes/maps/charts:** `max-width: 100%; height: auto;`, use `aspect-ratio`, `loading="lazy"`, `srcset` where useful. Charts must resize with their container.
- **Cards/buttons/badges:** never clipped, never overlapping; text wraps instead of overflowing.
- **Large media:** do not reference or ship oversized files (e.g. `frontend/assets/Videos/`) in pages. Compress them or lazy-load.

## 5. RTL (Arabic)
- Use logical properties: `margin-inline`, `padding-inline`, `inset-inline-start/end`, `text-align: start`, `border-inline-start`.
- Avoid `left`/`right` in new CSS. Mirror directional icons (arrows, chevrons) in RTL.
- Test every page in RTL. Keep Latin numbers/emails in `dir="ltr"` spans when needed.

## 6. Robustness
- Handle: very long names, empty states, 100+ list items, missing images, slow-loading data (skeleton/min-height, no layout shift).
- Support landscape, 200% zoom, safe areas (`env(safe-area-inset-*)`), and `prefers-reduced-motion`.
- Do not rely on hover for essential actions; support touch.

## 7. Forbidden
- `!important` to force layouts (allowed only to override third-party CSS, with a comment)
- Fixed-px layouts, `user-scalable=no`, `overflow-x: hidden` on `html/body` to mask bugs
- Hiding content on mobile to "fix" overflow
- Inline `style=` for layout; duplicating CSS already in shared files
- Per-device hacks (user-agent sniffing)

## 8. Verification checklist (must complete before finishing any frontend task)
Test in the browser at widths **320, 375, 414, 768, 1024, 1280, 1440, 1920**, in portrait and landscape for mobile sizes:
- [ ] No horizontal scrollbar (`document.documentElement.scrollWidth <= window.innerWidth`)
- [ ] No overlapping, clipped, or off-screen elements
- [ ] Text readable, nothing truncated unintentionally
- [ ] Tables, modals, forms, nav, charts work at every size
- [ ] RTL layout correct
- [ ] No console errors or 404s for CSS/JS/assets
- [ ] Touch targets >= 44px

Quick console check for overflow culprits:
```js
[...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 || e.getBoundingClientRect().left < -1)
```

## 9. Workflow for the agent
1. Read this file and the existing shared CSS before editing.
2. Build mobile-first, reusing shared variables/components.
3. Take screenshots at the widths above and fix every issue found.
4. In the final report, list the widths tested and any known limitations.
5. When asked to audit, list violations per page with file and line, then fix them.
