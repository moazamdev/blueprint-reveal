# Initial release review

Release: 0.1.0. Review date: 2026-10-27.

## Scope and result

Reviewed the source tree intended for publication: both skills, their runtime and helper assets, installer, example, tests, documentation and GitHub workflow. The publication copy was created from selected source files, not a copy of a working checkout, home directory or chat export. No previous Git history is included.

No credentials, private keys, personal absolute paths, local hosting account identifiers or private datasets were detected by the configured audit or manual inventory review. No critical/high-severity issue was identified in this bounded review. This is an initial-release source review, not a certification or a guarantee about future changes.

## Evidence

- `npm run audit:release` scans text/source content for common API, GitHub, cloud, bearer and artifact credential formats; private-key headers; local hosting identifiers; embedded URL passwords; and personal absolute paths. Values are not printed.
- The audit rejects unexpected binaries, symlinks, private tool-state directories, dependency directories and unrecognized file types. Top-level `.git/` is skipped after a user initializes a normal repository; it is absent from this publication copy.
- The release excludes the original video, screenshots, conversation exports, hosting manifests, generated archives, environment files, package-manager credentials and local Python validation dependencies.
- Runtime assets contain no fetch/XHR/WebSocket client, analytics endpoint, telemetry or browser storage. DOM geometry and settings stay in the page. The example's public CDN requests are documented in NOTICE and SECURITY.
- Scaffold destination boundaries, conflict handling, config preservation and repeat invocations are covered by tests. The installer preflights every selected tool before copying and checks installed file hashes.
- Tests use isolated temporary destinations and explicitly bypass any real CODEX_HOME when simulating a personal installation.
- CI is limited to repository read permission, disables persisted checkout credentials, pins official action commits, and has no deployment, registry-publication or secret-dependent steps.

## Known boundaries

The example uses external public styling resources; the runtime does not need them. Agent-generated integration code and blueprint factories must still be reviewed in each host project. Factories are trusted code, not a parser for arbitrary untrusted SVG or scripts. Framework hydration, CSP and unusual rendering technologies require project-specific validation.

The portable installer and release suite were run locally on Windows with Node.js 22. The configured Linux/Windows GitHub workflow has not run on a hosted repository yet; its first run will occur after publication. The demo's original runtime/controller behavior was browser-checked with a measured SVG chart, wrapped paragraph text, shared settings and a working original button.

## Maintenance

Repeat `npm run check` and `npm test` before publishing changes. Review the complete file list as well as scan results. Never include real secrets in tests, issues or screenshots. A secret added after publication may require rotation and history cleanup even if its file is later ignored.

Revision 0.2.0 retains this publication boundary and passes the same release audit. See CHANGELOG.md for center activation and Next.js integration updates.

## Preview-media revision — 2026-10-28

The publication tree now intentionally includes six preview binaries (two PNG screenshots, two looping GIFs and two silent MP4s), all captured from our own illustrative local demos. The six exact names are allowlisted with signature/size validation and reviewed SHA-256/byte-length records. Intermediate and completed frames were visually reviewed for complete component bounds and absence of desktop/browser/account content. MP4 streams were inspected for dimensions, duration and absence of audio; metadata was stripped during encoding. Temporary raw captures remain outside the publication tree. These preview files are not part of the installed skills. This revision supersedes the original blanket statement that generated images/media are excluded; third-party reference media remains excluded.

## Higher-quality preview revision — 2026-10-28

Replaced both MP4/GIF pairs with exports from newly rendered high-density sources and 181 distinct timeline samples at 25 fps. Added two sharp component PNG posters. The current binary allowlist contains eight exact media names, each still capped at 12 MiB and verified against its reviewed signature/size/hash manifest. Normal demo source was restored byte-for-byte after capture. The older full-page layout images remain separate from the new high-resolution component posters.
