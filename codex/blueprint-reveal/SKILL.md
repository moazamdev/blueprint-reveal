---
name: blueprint-reveal
license: MIT
description: "Add blueprint-to-UI reveal animations to an existing web project: inspect components, generate matching SVG skeletons, and integrate moving dots and lines with shared settings and development controls. Use for dot-matrix or wireframe component reveals, not ordinary loading skeletons or a visual redesign."
---

# Blueprint Reveal

Add the reference-style construction reveal to the user's existing website. Use the bundled dependency-free runtime. Understand the actual code, generate matching component blueprints, and integrate one shared configuration and working controls. Preserve the site's design and behavior.

Invoke in Codex with `$blueprint-reveal`, optionally followed by a route, component, or settings request. With no narrowed scope, inspect the web app in the current project and cover each distinct eligible component family and its instances. Do not stop after proposing a plan or copying files.

## Inspect before editing

Read applicable repository instructions, package metadata, app entrypoints, routes, UI components, design styles, existing animation tools, and current reveal settings if present. Use the project's installed tooling. In a monorepo select the actual requested web app; ask only if multiple unrelated app targets make that ambiguous.

Identify where initialization and cleanup belong. Reuse the current framework and design system. Do not introduce a CSS library, replace styles/content, run Git, install packages, publish, or modify unrelated configuration merely to apply this skill.

Treat “each component” as coverage, not stacked animations on every DOM node. Inventory reusable cards, panels, widgets, headings/sections and their instances. One visible region has one reveal owner: its children are blueprint anchors. Account for omitted, nested, inaccessible or high-frequency interaction regions explicitly. Do not silently reduce an app-wide request to three sample cards.

## Scaffold the shared runtime

Resolve paths relative to this skill folder, not the user's current directory. Read [integration.md](references/integration.md) before choosing the destination and framework lifecycle. Read [blueprints.md](references/blueprints.md) before authoring geometry. For React/Next.js, also read [react-next.md](references/react-next.md) for the tested lifecycle pattern and regression checks.

Copy and adapt the assets into the app's normal source structure. The deterministic helper can do the copying:

```sh
node <skill-folder>/scripts/scaffold.mjs --project <app-root> --out src/blueprint-reveal --dry-run
node <skill-folder>/scripts/scaffold.mjs --project <app-root> --out src/blueprint-reveal
```

It creates runtime files and project-root `blueprint-reveal.config.js` / `blueprint-reveal.blueprints.js`. Existing config and registry are preserved; differing runtime files cause a conflict rather than an overwrite. Merge an existing installation deliberately, retaining user settings and authored geometry. Never blindly rerun an initializer or duplicate providers/listeners. The helper only copies assets; source integration and blueprint generation remain required.

## Author component-matched blueprints

Create a factory in the registry for every distinct eligible component family, using the component's actual layout, responsive rules, chart/icon geometry, and text wrapping. Prefer the bundled DOM measurement and SVG sampling helpers for stable anchors; add authored paths for details they cannot represent. Do not reuse the original demo's geometry in unrelated components or call bounding-box placeholders a precise match.

Mark stable targets with `data-reveal="component-key"` and appropriate content/anchor attributes, or use framework refs when they are safer. Avoid layout-breaking wrappers. Factory coordinates must be local to the frame and recomputed after resizing or meaningful content changes. Keep generated geometry decorative and pointer-transparent. Do not serialize user text, live API responses or private content into static blueprint files.

Where a source/runtime cannot expose internal geometry (e.g. opaque canvas or cross-origin iframe), retain a documented bounds-only fallback or skip with a concrete reason. Cover all other requested components; do not imply unsupported automatic tracing.

## Integrate one settings source and controls

Use `blueprint-reveal.config.js` as the project's central settings file, or an equivalent central typed module when tooling requires it. Wire all instances to the shared controller. Include global direction, line treatment, density, duration, speed, guides, moving points/lines, and enable/disable controls; retain playback triggers, stagger, once/loop settings and per-component overrides as described in the integration reference.

Mount a collapsible controls panel in development, using the bundled panel or the app's existing UI library. It must change actual registered components and offer replay, pause, inspection scrubbing and reset. Keep it hidden in production by default using the app's real development-mode flag. Label temporary panel overrides clearly and tell the user how to persist copied defaults in the config file. Do not claim a browser panel writes source files.

Default viewport activation waits until the component intersects the middle 20% of the screen (`playback.activation: "center"`, `viewportBand: 0.2`, `threshold: 0`). Keep the activation band configurable and distinct from the reveal direction `center`. Use pixel root margins calculated from viewport height; percentage IntersectionObserver margins are width-relative. Rebuild observation on resize without restarting completed or manually paused reveals. Use `activation: "viewport"` only when the user requests early viewport-edge entrances.

For framework apps, connect registration/unregistration to their real mount/unmount lifecycle and keep one app-level coordinator. Static DOM scanning alone is not a complete React/Next/Vue/Svelte integration. Avoid SSR/hydration changes, stale route instances, duplicate animation layers, and hiding focused inputs. Wait for stable initial layout/fonts when needed without keeping normal content invisible before initialization. Reserve an empty absolute overlay sibling and pass `overlayMount`; do not append generated layers into framework-managed content. Cancel asynchronous font readiness work and scheduled refreshes on unmount.

Refresh geometry for text/chart updates even when the outer size stays fixed. Observe only content child/text mutations or explicit framework dependencies; never observe animated styles or the generated overlay. Match ancestor overflow clipping in authored geometry: measured full circles must not draw outside a clipped cover.

## Keep the motion contract

Points drift into the component's geometry. Dots/dashes and tracing heads move along its blueprint. The fully opaque live component then sweeps in quickly, using the same boundary to **inverse-mask SVG and erase canvas**. Finished areas have no construction ink over them. Preserve this masked replacement; do not substitute a slow opacity crossfade.

All directions must coordinate arrival, tracing, surface clipping and the complementary cutout. Timeline seeking must be reversible. Respect reduced motion, keep no-JavaScript content visible, and stop nonessential work when hidden/offscreen. Use a short entrance for normal app usage; reserve long durations for inspection.

## Complete and verify

Run focused existing checks appropriate to edited source. Inspect a representative route at desktop and mobile widths plus long/dynamic content. Verify center-band activation before/after scroll and resize (including a tall component), exactly one SVG/canvas layer per mounted frame and one development panel, and no panel in a production build. Paused timeline inspection must remain paused while scrolling/resizing until explicit Replay. Verify alignment in paused intermediate states, clean masked areas, global options affecting multiple targets, live controls after the reveal, reduced motion, repeated mounts and navigation cleanup. If browser QA is unavailable, disclose that limit.

Write `blueprint-reveal.coverage.md` with source paths, reveal keys, factory method, responsive/dynamic behavior, validation status, and concrete exclusions. Every inventoried family must be implemented or explicitly accounted for. Document the central config path, how to open the development panel, and how to rerun this skill when components change. Report implementation limits honestly.

For later invocations, inspect and update the existing integration. Regenerate only changed component blueprints, preserve other options and overrides, and verify their corresponding regions. Keep everything local unless the user separately requests publication.
