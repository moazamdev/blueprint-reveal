# Security and privacy

The runtime has no telemetry, API client, analytics, network requests or persistent browser storage. Geometry is measured locally in the browser; blueprint factories should not persist user text or API responses. “Copy current defaults” writes only reveal settings to the clipboard after a user action.

The optional demo loads public CSS/JavaScript from jsDelivr, which receives ordinary browser asset requests. The installer, scaffold helper, tests and release audit require no network access, accounts, tokens or package installation.

The installer copies only a selected skill folder to its chosen destination. It supports a dry run and refuses to overwrite different existing contents. The scaffold helper confines output to the selected project, checks existing symlinks, and preserves user configuration and blueprint registries. These tools do not clone, commit, push, deploy or modify account settings.

Skill installation grants no permissions beyond the host coding tool. Review generated changes before publishing them. Blueprint factories are trusted project code: never evaluate code or accept raw SVG attributes from untrusted runtime input. CSP restrictions and framework lifecycle behavior remain the host project's responsibility.

## Reporting a vulnerability

After the repository is published, use its GitHub **Security → Advisories → Report a vulnerability** feature when available. If private reporting is unavailable, open an issue requesting a private reporting channel without including exploit details, secrets or personal data. Never post a real credential in a public issue.

## Publication checks

Run `npm run check` and `npm test` before publication. The release audit checks for common credential formats, private keys, personal absolute paths, local hosting identifiers, prohibited metadata and unexpected binaries. Eight explicitly named preview files in `docs/media/` are allowed only with recognized PNG/GIF/MP4 signatures, a size limit, and matching SHA-256/byte-length entries in their reviewed manifest. Other binary files remain blocked. Media hashes do not inspect pixel content; preview content also needs visual review. It prints rule names and file locations without printing matched values.

Automated scanning cannot prove the absence of every possible secret. The initial release also received a manual content and file-inventory review; see `docs/release-review.md`. If you add private material later, remove it before committing; ignore rules alone do not remove committed data from history.
