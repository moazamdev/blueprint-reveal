# Preview media

The README includes captures of the original three-component reveal lab and the newer monochrome six-component Next.js gallery. These are our working implementations, not clips from the third-party video reference. Values, names and content are illustrative; the music-player demo has no audio.

## Playback and capture

Both sequences show a top-left diagonal reveal with moving points/lines, hybrid line treatment, reference point spacing and guides. The timeline is played over approximately 7.2 seconds, plus short holds at the beginning and end (9.56 seconds per MP4).

The first export used compressed single-density frames and 14 timeline samples per second; the low detail was visible in small text and dot patterns. It has been replaced with newly rendered captures at approximately twice the previous pixel density, rather than an enlargement or sharpening filter applied to the old video. The temporary capture layout, canvas resolution and inspection range changes were restored after exporting; the normal demo source is unchanged.

The new source has **181 distinct timeline samples**, encoded at **25 fps**. This is a deterministic frame-by-frame export of the real renderer, not a real-time screen recording or a recreated animation. H.264 MP4 encoding uses CRF 14, the slow preset, `yuv420p`, fast-start playback and no audio. Gallery resolution is **2560 × 1876**; original-demo resolution is **2464 × 1232**. Those are the native encoded dimensions; they are not labeled as 4K or 60 fps.

The MP4s are the full-quality previews. The README shows the looping GIFs inline, because GitHub does not play repository-relative MP4s, and each GIF links to its full-resolution MP4, served through the jsDelivr CDN so it plays in the browser. The GIFs' smaller dimensions, 15 fps playback and restricted color palette make them less suitable for judging fine construction lines, so use the MP4s for close inspection. GitHub requires its own uploaded video attachment URLs for native README playback; the steps below explain that. Sharp component stills and full-page layout screenshots are linked in the table below. The gallery's six targets are synchronized for inspection; normal scrolling still uses the configured center-of-viewport entrance.

Captures contain only local page content. Crops exclude browser chrome, desktop information and the gallery's development panel. Full-page screenshots show the completed interfaces. Video and image metadata was removed during encoding; the MP4s have no audio tracks. No personal paths, cookies, environment variables or account details are part of the captures.

## Files

| Demo | Full-quality MP4 | Sharp component screenshot | Compact GIF | Full-page layout |
| --- | --- | --- | --- | --- |
| Monochrome gallery | [2560 × 1876 video](https://cdn.jsdelivr.net/gh/moazamdev/blueprint-reveal@main/docs/media/monochrome-gallery.mp4) | [PNG](media/monochrome-gallery-poster.png) | [GIF](media/monochrome-gallery.gif) | [PNG](media/monochrome-gallery.png) |
| Original reveal lab | [2464 × 1232 video](https://cdn.jsdelivr.net/gh/moazamdev/blueprint-reveal@main/docs/media/original-demo.mp4) | [PNG](media/original-demo-poster.png) | [GIF](media/original-demo.gif) | [PNG](media/original-demo.png) |

The MP4 links use jsDelivr, which serves files from this repository as `video/mp4` so browsers play them; GitHub serves large raw MP4s only as downloads. The other links are repository-relative. GitHub supports relative image paths and file links in READMEs, but that does not make repository-relative MP4s into native inline video players. See [GitHub's README documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes#relative-links-and-image-paths-in-markdown-files).

## Native video players on GitHub

A local `<video>` element is not a reliable GitHub README embed. GitHub-hosted video attachments are different from video files committed to a repository. See the [GitHub discussion of relative MP4 embedding](https://github.com/orgs/community/discussions/133813) and [attachment rendering guidance](https://github.com/orgs/community/discussions/209976).

To make the **actual high-quality videos** play inside the GitHub README:

1. Open this repository's README in GitHub's web editor.
2. Drag `docs/media/monochrome-gallery.mp4` from your computer into the editor. Wait for the upload to finish. GitHub inserts a generated video-attachment URL.
3. Replace the gallery's GIF line with that generated attachment URL, alone on its own line with a blank line above and below it. Keep the existing full-quality MP4 link directly underneath.
4. Repeat for `docs/media/original-demo.mp4` and its GIF line.
5. Use GitHub's Preview tab to confirm that both native players load and play before saving.

The attachment URLs must come from a real upload. They cannot be calculated from a repository-relative path or invented before uploading. The current README uses inline GIFs; it does **not** claim native GitHub playback is already configured. Publishing the repository files alone will not perform these two uploads. Keep the local MP4s as download links even after adding the attachment URLs.

## Updating the captures

1. Use illustrative local demo content. Check that the page contains no private data.
2. Set the reveal duration to 7.2 seconds and capture 181 distinct renderer samples from 0% to 100%, for 25 fps playback. Render at high pixel density and check source sharpness before capturing the entire sequence. Avoid changing normal project defaults just to record previews.
3. Capture the full page area first; crop the saved frames offline after checking the component bounds. Review the beginning, mask transition and completed frames for clipping or missing content.
4. Encode silent H.264 MP4s with `yuv420p`, fast-start playback and metadata removed. Generate looping GIFs for the README and PNG screenshots; keep each asset below 12 MiB.
5. Update byte lengths and SHA-256 digests in `media/manifest.json` only after reviewing the media. Its digest inventory detects unreviewed changes; hashes do not inspect pixel content for secrets.
6. Run `npm test`, `npm run check` and `npm run audit:release`.

Only the eight named preview assets are allowed as binaries by the release audit. They are not copied into either installed skill. The original reference video, temporary capture frames and local tooling files stay outside the publication folder.
