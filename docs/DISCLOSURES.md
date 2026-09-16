# AI and material disclosure

## Development

> I built the foundation with Claude, then iterated with Codex. AI coding tools did most of the typing; the product decisions, the thesis, and the review were mine.

The Claude-assisted foundation supplied the original arithmetic application. The Codex iteration added the alpine experience, Fraction Peaks, session reporting, stronger arithmetic assessment, AI boundaries, verification, and documentation. Assisting agents contributed bounded research, implementation, and review. The [development record](DEVELOPMENT-RECORD.md) distinguishes the foundation and later changes.

## Visual materials

- **AI-generated scenery:** `web/public/art/summit-island.png` was generated for Summit with the built-in image-generation tool. No third-party reference image was supplied to that generation. The exact prompt and provenance are retained in [ARTWORK.md](ARTWORK.md).
- **Code-native visuals:** tower geometry, Pip, interface icons, planets, number lines, and fraction models use SVG/CSS/React created during the Codex iteration.
- **Product screenshot:** the README's Fraction Peaks image is an unmodified capture of the running app with its synthetic demo profile, not a generated mockup.
- **Fonts:** [DM Sans](https://github.com/google/fonts/tree/main/ofl/dmsans) and [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk) are requested from Google Fonts with system-font fallback. Their upstream repositories distribute the fonts under the SIL Open Font License. Font binaries are not bundled in this source package.

## Runtime AI

Optional Anthropic Messages API calls produce arithmetic stories, hints, and parent guidance. `AI_MODEL` controls the model; the live demonstration used the configured alias `claude-sonnet-4-5`. That alias is not presented as a verified dated model snapshot. Fraction feedback is authored and deterministic, and code owns mathematical assessment, scoring, progression, and report totals.

The app labels the content source and uses authored fallback for missing access, provider failure, timeout, or rejected output. Numeric and format checks do not establish arbitrary semantic accuracy or child suitability. Credentials are excluded from the repository. [QA](QA.md) records verification and its limits.

## Dependencies and verification tools

The [dependency inventory](DEPENDENCIES.md), [lockfile](../package-lock.json), [source inventory](materials/dependency-inventory-with-sources.md), [collected notices](materials/THIRD_PARTY_NOTICES.txt), and [supplemental notices](materials/supplemental-license-notices.txt) identify incorporated packages and available license records. Node.js is installed separately and has its own notices.

The GitHub Actions workflow uses [actions/checkout v7](https://github.com/actions/checkout) and [actions/setup-node v7](https://github.com/actions/setup-node) on a GitHub-hosted runner. GitHub's current examples support those versions and Node 24. The actions are fetched by the workflow and are not bundled in the app. A local passing result does not establish the outcome of a separate hosted run.

The source package uses one synthetic demo learner and excludes runtime databases, private configuration, interview documents, and credentials. No real child records, private training dataset, or biometric inputs were used in this iteration.

Project and third-party terms are explained in [LICENSING.md](LICENSING.md). The [challenge guide](HACKATHON.md) links the contest's separate submission terms; this material inventory does not itself submit an entry.
