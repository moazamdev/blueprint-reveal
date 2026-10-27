# Next.js integration validation

The skill workflow was exercised on a separate small Next.js App Router project using Next.js 16.4.3, React 19.3.1, Tailwind CSS 4 and daisyUI 5.7.50. React Strict Mode was enabled. The source of the landing page was completed and preserved as a baseline before the skill integration was added.

## Component coverage

The test page contained six different interactive families: SVG revenue chart, date/calendar widget, editorial/project card with clipped geometric artwork, team list, plan selector, and notification/settings panel. Each received a factory based on its own measured text/layout and source-known geometry, not the original three-card demo's geometry.

The integration used one client provider and per-component registration/unregistration. A dedicated empty overlay mount held imperative animation nodes separately from React content. Content mutation refreshes excluded the animated overlay and style attributes to avoid refresh loops.

## Results

- A production build compiled and statically rendered the page successfully. The locally served production build had six frames/layers, zero development panels, and no logged browser errors/warnings during the check.
- Development browser logs showed no hydration errors/warnings during the checked interactions.
- Six mounted components had six animation layers and one controls panel, including with Strict Mode enabled.
- Filtering to three components removed three layers; returning to all restored six without duplicate panels.
- Revenue-period, date-selection and save actions continued to update React state after the reveal.
- Desktop (1280px) and mobile (390px) layouts were inspected. No horizontal document overflow was found at the mobile viewport.
- A global direction change and timeline inspection affected all six components. Paused inspection retained its boundary after viewport changes.

## Corrections carried into the reusable assets

The engine and coordinator now accept optional `overlayMount` for framework-reserved DOM. Manual pause/inspection also suppresses viewport-triggered automatic playback until replay, preventing a resize from unexpectedly restarting an entrance. Both Codex and Claude Code copies contain the same corrections.

Clipped artwork in the test page needed component-specific arc paths cropped to its actual cover; bounding-circle outlines alone did not represent the clipped design accurately. This was handled in that component's authored blueprint and is a useful example of why a matching blueprint requires source-aware work.

## Limits

This was a Chromium-based local integration check, not a claim that every Next.js app, browser or framework is covered. OS/browser reduced-motion media emulation was not performed; the engine retains its reduced-motion autoplay branch. The repository's GitHub workflow still needs its first hosted run after publication.

The test app and its dependency/build directories are not bundled into either installable skill. The public packages remain dependency-free authoring/runtime tools; applying them to a Next.js project uses that project's own existing framework dependencies.

## Monochrome gallery revision

The current demo has two sections only: a centered bold Manrope hero and a three-column component gallery, with the middle column raised. Mobile uses one column. The font is self-hosted with its SIL Open Font License. No external imagery is needed.

Playback now waits until a component enters the middle 20% of screen height, with a zero area threshold so tall targets can activate. The band is configured through `playback.activation` and `playback.viewportBand`; it is independent of mask direction. Runtime observers rebuild after viewport resize and preserve paused inspection. Prior filter-specific checks describe the earlier test layout; the minimal revision removes the page filters.

Revision checks: production build passed; the two-section layout was inspected at 1280×900 and 390×844, with no mobile document overflow. Six frames retained six canvases. All six intermediate clip polygons stayed identical after mobile resizing while inspection was paused. Center-band waiting and subsequent activation were inspected in Chromium. The release audit found no configured credential/private-path patterns in the public skill repository.
