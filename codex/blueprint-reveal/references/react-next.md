# React / Next.js: lessons from the working gallery

Use this with the host project's installed framework documentation. The integration was exercised in a Next.js App Router / React Strict Mode gallery; it is a pattern to adapt, not a universal drop-in adapter.

## Ownership and lifecycle

Keep one coordinator in a client provider, initialized in an effect with `development: process.env.NODE_ENV === 'development'` for Next.js. Destroy it on cleanup. Let server-rendered content remain visible until registration; do not hide the whole page with an SSR class.

A reveal frame contains two sibling nodes: a normal content wrapper and a reserved empty absolute overlay mount. React owns the wrappers and content; the engine owns only children inserted inside the overlay mount. Register using refs:

```js
const unregister = project.register(frameRef.current, {
  key: componentKey,
  content: contentRef.current,
  overlayMount: overlayRef.current
});
// Effect cleanup:
unregister();
```

```css
.reveal-frame { position: relative; min-width: 0; }
.reveal-overlay-mount { position: absolute; inset: 0; pointer-events: none; }
```

Do not put content in the overlay mount. Preserve dimensions and semantics; adapt wrappers for tables, inline elements and existing grids. Do not create a coordinator per component or append arbitrary SVG/canvas siblings to a React-rendered list.

Wait for `document.fonts.ready` before measuring text when necessary, with an effect-local cancellation flag checked after the promise resolves. Cleanup must set that flag, unregister, disconnect observers, and cancel any pending requestAnimationFrame. This prevents the first Strict Mode mount from registering after it has already been cleaned up.

## Changes that ResizeObserver cannot see

A chart period or text label can change while its outer card stays exactly the same size. Refresh after the DOM has committed, using explicit data dependencies or a MutationObserver limited to `{childList:true, characterData:true, subtree:true}` on the content wrapper. Coalesce refreshes into one animation frame. Do not observe style attributes or generated overlays: the animation itself changes those and would cause a refresh loop. Changes expressed only through classes/attributes need explicit dependency-based refresh after those updates.

## Respect the actual visible shape

Text blueprints measure wrapped line lengths, not glyph outlines. SVG helpers sample real path geometry. CSS circles inside an overflow-hidden art panel need paths cropped to that panel's visible rectangle; measuring their complete bounds draws incorrect arcs outside it. Inspect masks at intermediate timeline values on desktop and mobile after fonts load.

## Behavioral checks before completion

- Count mounted reveal frames, generated layers and canvases: one of each per eligible instance, plus one shared development panel.
- Unmount/remount a component or navigate away/back. Counts must shrink and recover without orphan layers or duplicated listeners.
- Start above the gallery: components below the center activation band must remain at their initial blueprint state. Scroll one into the band and verify it starts; completed once-only components must stay complete after scrolling back. Jump directly to an anchor and reload at a restored scroll position: already-passed targets must show completed content.
- Test a tall target and resize the viewport. The activation band follows screen height, not width; paused inspection stays at the selected progress until Replay.
- Change chart data, wrapped text, or selected dates; confirm geometry updates and original event handlers still work after reveal.
- Build and serve production: there must be zero development panels. Check console/hydration errors rather than treating build success as visual evidence.
- Verify reduced-motion autoplay with actual media emulation or an OS setting when possible. Reading the code alone does not count as browser verification.

Report what was actually run and any remaining limits. A shared runtime parity test does not prove that a separate Claude Code agent or every framework/browser was exercised.
