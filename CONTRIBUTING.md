# Contributing

Use Node.js 20 or newer. There are no npm dependencies to install.

```sh
npm test
npm run check
npm run demo
```

Keep the shared runtime, scaffold script and references identical between `codex/blueprint-reveal/` and `claude-code/blueprint-reveal/`. Their invocation sentence and Codex UI metadata are intentionally different. The tests check this parity.

For runtime changes, verify both blueprint construction and the complementary surface mask. Test multiple directions, timeline reversal, responsive geometry, reduced-motion behavior and cleanup. Preserve live HTML semantics and event handlers; do not turn the effect into a video overlay.

For skill changes, test that an agent is instructed to inspect actual project components, generate matching factories, integrate shared controls, and account for exclusions. Scaffolding alone must not be described as complete integration.

Keep examples generic. Do not add credentials, personal paths, private screenshots, chat exports, hosting manifests or a reference video. Run the release audit before opening a pull request. Do not add network dependencies or installation hooks without documenting why they are needed.
