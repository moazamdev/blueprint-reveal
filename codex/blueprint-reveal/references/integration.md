# Integration and shared settings

## Project files

Use the repository's conventions for the runtime destination; `src/blueprint-reveal/` is a default, not a required layout. Keep one project-root `blueprint-reveal.config.js` and `blueprint-reveal.blueprints.js` unless the repo's tooling requires an equivalent central module. Add `blueprint-reveal.coverage.md` and concise usage notes in the project's existing docs.

The scaffolder copies assets and preserves existing config/registry. It deliberately does not edit component source, register routes, or invent a global mount. Completing those tasks belongs to the coding agent. Its report says `integrationRequired: true`; scaffolding alone is not completion.

## Shared controller

```js
import config from './blueprint-reveal.config.js';
import { blueprints } from './blueprint-reveal.blueprints.js';
import { mountBlueprintProject } from './src/blueprint-reveal/project-controller.js';
import { mountRevealControls } from './src/blueprint-reveal/reveal-controls.js';

const project = mountBlueprintProject({
  config, blueprints,
  development: /* the existing project's real development-mode boolean */ false
});
project.scan(); // For static DOM. Frameworks should register in mount lifecycles.
mountRevealControls(project);
// project.setOptions({direction: 'top', movement: true});
// project.replayAll(); project.pauseAll(); project.seekAll(0.6);
// project.destroy();
```

Correct these imports for the project. Use `import.meta.env.DEV` in Vite, a real existing environment switch in other stacks. Do not guess development mode by hostname or accidentally ship a visible debug panel to production.

The settings panel is dependency-free, isolated with a shadow root, collapsible and keyboard accessible. Reuse the app's own component library for a custom panel if that fits better, but wire it to the same controller. Do not add daisyUI/Tailwind to a host project just to install this effect.

Panel adjustments are temporary overrides. “Copy current defaults” copies the selected values; lasting changes go in the shared config's `defaults`. Clearly label this distinction. Do not claim the panel saves a source file.

## Targets and lifecycle

Give each eligible frame a stable `data-reveal="component-key"`; its content is the child marked `data-reveal-content` or the first element child. Mark intentionally excluded areas with `data-reveal-ignore`. A frame must obtain real dimensions from normal layout or explicit sizing. Never insert a generic block wrapper that breaks grid/flex layout, tables, display:contents, inline flow or accessibility. Prefer an existing suitable container.

Static HTML: call `scan()` after DOM, styles and relevant fonts are ready. `observe:true` optionally scans dynamically added `data-reveal` nodes; omit it if the app's lifecycle can register explicitly.

React/Next: import the runtime in a client boundary, create one project controller per app/provider, register each target in an effect, and call the returned unregister function on cleanup. Do not construct instances during render or SSR. Keep generated layers outside the subtree React itself reconciles where needed (a dedicated empty overlay/frame sibling is safer than appending into a virtual-DOM-managed list). In Strict Mode, register/cleanup/register must leave exactly one layer. Keep the controller stable across rerenders; do not create it per card.

Vue/Svelte: use one app-level controller and mounted/unmounted hooks or actions/directives to register/unregister. Use framework refs, not global selectors, to identify each mounted target. For Astro/static islands or an SPA router, connect initialization and teardown to the existing page lifecycle; avoid duplicate document-wide listeners on each navigation.

If the framework owns every child of a frame, pass the optional `overlayMount` element to `project.register(frame, {key, content, overlayMount})`. The engine appends its layers into this dedicated empty element, keeping them outside React-managed content. Position that mount absolutely with inset:0 and pointer-events:none. Verify hydration and cleanup; never assume a generic DOM scan is a complete framework integration.

## Configuration contract

`defaults` contains `enabled`, `direction`, `material`, `density` (spacing in pixels), `duration` (milliseconds), `speed`, `guides`, `movement`, `color`, `seed`.

Directions: `diagonal`, `top`, `left`, `bottom`, `right`, `diagonal-reverse`, `center`. Materials: `hybrid`, `dots`, `lines`. Lower spacing means more points. `duration / speed` is the effective playback duration; do not apply speed twice.

`playback` contains `trigger` (`visible`, `load`, `manual`), `once`, bounded `stagger`, `maxStagger`, IntersectionObserver `threshold`, `activation` (`center` by default, or `viewport`), `viewportBand` (0 < fraction <= 1, default 0.2), optional `loop`, `loopDelay`.

For `center`, playback begins when any part of a component enters the middle `viewportBand` of the viewport. This works for components taller than the viewport; it does not require a large percentage of their area to fit on screen. Keep `threshold: 0` with center activation. A band of 0.2 spans 40–60% of screen height. `activation: "viewport"` restores edge-of-screen entry and can use an area threshold. The runtime calculates pixel root margins from height and rebuilds its observer after resize. The mask direction named `center` is independent of this playback setting. Explicit Replay bypasses the band for currently visible targets.

```js
playback: { trigger: "visible", activation: "center", viewportBand: 0.2, threshold: 0, once: true, stagger: 70, maxStagger: 280 }
```

Manual inspection pauses automatic observation and timers. Resizing, scrolling and new registrations must retain the inspected timeline position until Replay. Disabled targets stay fully visible. Nonessential loops stop offscreen/hidden. For normal projects use short entrances, not the demo's seven-second inspection sequence. A shared config value must actually affect every registered target; keep it out of duplicated hardcoded props.

Precedence: defaults → named group → component-key override → instance override → temporary global panel override. Give frames `data-reveal-group` only when the project needs groups. Use `config.components` for persistent exceptions, not multiple conflicting config files.

Keep content visible before initialization and on reduced-motion autoplay. Incomplete UI is inert only while it is revealing; avoid triggering during existing user interaction. Preserve semantics, handlers, route behavior, focus order and existing animations. The core owns opacity/filter/clip-path during playback: use a dedicated content wrapper when those properties already implement another interaction, and restore them on destroy.

## Validation

Run the existing build/typecheck or focused tests appropriate to edited files. In a browser, test visible/load/manual trigger actually starts the effect, global control changes reach all components, opaque masks exclude construction ink, desktop/mobile geometry aligns, routes and repeated mounts clean up, and controls still work after revealing. If browser verification is unavailable, report that limit and do not call the result visually verified.


When a mounted component changes text or chart data without changing its overall size, refresh its blueprint after the DOM update. A throttled MutationObserver restricted to `childList`/`characterData` inside the content region works; disconnect it and cancel its scheduled frame on unmount. Do not observe the engine overlay or its animated style attributes, which would cause a refresh loop. For components with explicit data dependencies, a normal framework effect can call refresh instead.

On initial registration, pending automatic targets are held at the initial blueprint state until entry. Reduced-motion users keep completed content. If an anchor jump or restored scroll skips the central band entirely, already-passed targets show completed content immediately; do not leave them invisible or animate them above the activation region.
