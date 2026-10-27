# Changelog

## 0.2.0

- Visible-trigger reveals now default to the central 20% of viewport height. Configure `activation: "viewport"` to retain early edge entry; keep `threshold: 0` with the center band.
- Pending components are armed at their initial blueprint state, avoiding a flash of completed UI when automatic playback begins. No-JavaScript and reduced-motion content remains visible.
- Anchor jumps and restored scroll positions show already-passed components as complete rather than leaving them clipped indefinitely.
- Activation margins use viewport height in pixels and update on resize. Manual inspection remains paused until explicit Replay.
- React/Next guidance covers a dedicated overlay mount, Strict Mode cleanup, cancellable font measurement, fixed-size dynamic content refresh and clipped artwork.
- Added height-based activation-margin regression coverage; shared package parity and release audit remain enforced.

The separate Next.js validation gallery was redesigned as a monochrome two-section page with self-hosted Manrope and a raised middle column. It is not a dependency of either skill.
