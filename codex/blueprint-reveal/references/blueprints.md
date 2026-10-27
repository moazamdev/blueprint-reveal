# Generate a matching component blueprint

Use this after identifying the actual source component and its rendered layout. Factories receive `{frame, content, width, height}` and return SVG `[tag, attributes]` tuples. They run on the client after layout; do not bake one screenshot's page coordinates into a reusable component.

## Choose anchors from the actual component

Read its markup/JSX, styles, responsive rules, icons and chart renderers. Add stable, neutral data attributes where existing selectors are brittle. An attribute such as `data-blueprint-part="chart"` is preferable to matching user-facing text or generated CSS classes. Scope every selector to `content`.

Use `assets/runtime/blueprint-geometry.js` when it helps:

```js
import { blueprintFor } from './src/blueprint-reveal/blueprint-geometry.js';

export const blueprints = {
  'activity-card': ({frame, content}) => blueprintFor(frame, content, {
    text: true,
    anchors: [
      { selector: '[data-blueprint-part="chart"]', kind: 'svg' },
      { selector: '[data-blueprint-part="metric"]', kind: 'rect' },
      { selector: '[data-blueprint-part="action"]', kind: 'rect' }
    ]
  })
};
```

The import path is illustrative. Derive the real relative path from the registry's location. Do not copy the demo's heart/chart/music geometry into unrelated components.

## Map each visual material deliberately

- Card/panel outlines: `rectFor(frame, content)` samples the actual border radius and bounds. Do not invent a rounded box around a borderless text section.
- Text: `textFor` measures wrapped text-line lengths with Range rectangles. This creates line skeletons, not exact glyph outlines. Keep paragraphs as measured lines rather than one giant rectangle. Do not persist actual user text or live values in generated geometry.
- Inline SVG charts and icons: `svgFor` samples geometry, applies each path's screen matrix, and maps it into frame coordinates. Existing viewBox transforms and nested groups are respected. Select only the specific chart/icon once, not both its SVG root and every child. Text inside SVG needs a separate semantic placeholder.
- CSS/DOM charts: explicitly anchor bars, plot baseline, axes, series tracks and key legend markers. Map line graphs to real path data when it exists. Avoid a generic rectangle as the sole blueprint for a complex chart.
- Images: preserve their measured silhouette or image bounds and optional neutral crop guides. Do not infer photographic edges, fetch traced copies, or replace the image asset.
- Controls: reproduce their real outline or underline; keep the underlying HTML button/input interactive after the reveal. No separate fake controls.
- Canvas/WebGL, cross-origin iframe content and inaccessible shadow roots: use source-known geometry or an explicitly documented bounds-only fallback. Never claim pixel-accurate extraction without access.

Use manual `path`, `polyline`, `rect`, `circle`, `ellipse`, `line` or `polygon` tuples for details the helpers cannot represent. Custom coordinates use the frame's local CSS pixels. Derive them from `width/height`, named DOM anchors, or known chart coordinates, so mobile and dynamic content do not leave a stale skeleton behind.

## Coverage

Create a factory for every distinct eligible component family in the requested scope; repeated instances reuse that factory. Account for all screens in a route-wide request. For each target, record its source path, reveal key, blueprint factory, breakpoint behavior, and completed checks in `blueprint-reveal.coverage.md`.

One visual region has one owner. If a card owns its chart, headline and buttons, those children are blueprint anchors, not additional reveal instances. Other siblings still receive their own reveal. When a top-level region is skipped to animate its children independently, record that decision instead of silently dropping the parent.

## Reference motion contract

Moving dots form the local structure, stroke patterns and tracing heads travel along real geometry, then the fully opaque live UI sweeps over it. The same polygon reveals HTML and inversely masks SVG / erases canvas pixels. Never reintroduce an opacity crossfade with construction lines visible on top of finished content.

Pause around 45%, 60% and 80% to compare the blueprint and final component. Inspect at least desktop and mobile and one long-content case. Lines must align with their corresponding elements; revealed regions must be free of construction ink; reversing the scrubber must restore the blueprint without leftover pixels.
