# Development, AI, and material disclosure

## Development contribution

I built the foundation with Claude, then iterated with Codex. AI coding tools did most of the typing; the product direction and review were mine.

The original Summit supplied the alpine mountain, Pip, fraction tower, arithmetic practice, existing reporting, and local server. This iteration changes the main experience to teaching Pip through an expedition with visible consequences and correctable evidence. AI coding assistance produced implementation, documentation, and bounded review under the user's direction. Final verification belongs in [VERIFICATION.md](VERIFICATION.md).

The [legacy documents](legacy/) are an archive of the earlier release. Their descriptions, dates, and test totals are historical; they are not automatically current claims about Teach the Climb.

## Artwork and dependencies

- The unchanged `web/public/art/summit-island.png` is the original Summit mountain generated for this project. The archived [artwork record](legacy/ARTWORK.md) contains its creation details and prompt.
- New expedition scenery, companions, models, and controls are code-native SVG/CSS/React. The original mountain PNG is retained; no new AI-generated bitmap asset was created for this iteration.
- The root README intentionally shows the original hero PNG. Browser screenshots, when present, are captures of the actual product and should be identified separately from concept art.
- The dependency lockfile, [inventory](materials/dependency-inventory-with-sources.md), [notices](materials/THIRD_PARTY_NOTICES.txt), and [supplemental notices](materials/supplemental-license-notices.txt) remain included. A copied inventory should be refreshed if dependencies change.
- Existing font loading may request Google Fonts with system fallback. Font binaries are not bundled solely by that CSS request; see the archived materials record for source details.

The project source uses the root MIT license; other materials retain their own terms.

## AI at runtime

Teaching Pip means changing the supported instructions it executes. It does not train or fine-tune the underlying language model. In the new expedition, the optional provider selects a question and Pip line from finite authored banks. It does not write the journal's observations or tentative next steps. Deterministic code owns quantities and results. Authored selection keeps the experience usable.

Source labels should reflect the returned content. A configured key is not proof that a response came from the model. A passing response validator is not proof that every interpretation is correct. The child or adult can dispute an interpretation, and downstream guidance must respond to that correction.

This release was browser-tested with authored questions. No live provider call is claimed; provider behavior is covered through automated adapter tests.

## Data and scope

No real child records, interview files, private training corpus, biometric input, or provider credentials are needed in the source package or demo. Use synthetic demonstration data and avoid identifiable information in notes. Optional AI receives the structured context, plan, recomputed result, and booleans for recorded prediction/support. It does not receive learner notes, correction text, the evidence ID, or prior-session history. The [architecture](ARCHITECTURE.md) specifies the request and storage boundaries.

This is a local prototype, not a deployed classroom record system or a validated assessment. Broader use requires an appropriate consent and data process, access controls, retention policy, and educational evaluation.
