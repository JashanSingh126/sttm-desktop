# Voice Follow — current status

Latest target clarification: the user now prioritizes more than85% combined fast/acceptably delayed matches plus careful Vaheguru fallback at low confidence;95% was arbitrary. The delay cutoff is pending. The retained system's older12 correlated tests yield9/12 matches within60s,10/12 within90s,11/12 eventually. This does not add to the71.9% correct-display-time metric. Fallback must be tested; the system cannot assume every incorrect result is low confidence. Historical95% requirements below are superseded by LEVEL-2-PLAN.md's latest revision.

Snapshot: 2026-09-15T03:19:27.285755+00:00

**Level 2 is not achieved. Focus: ordinary live Darbar, step by step. Further Level 3 experiments are deferred. Existing fixes are retained. Full Renton baseline and seven paired experimental cases are complete; the experimental candidate is not integrated.** The scoped ambiguity fix is now integrated locally as E065, retaining the four-second following window.

## Current benchmark goal

**E078 completed all 72:17 of continuous supplied audio**, including the five cuts and original gaps. All three children exited0. E085 independently verified all traces and source/model/DB/support/audio fingerprints. Every one of24,978 inferences was native; zero cache hits or corrupt entries. Record-mode disk work, variable host load and the headless driver prevent physical microphone-latency claims.

All four identified main hints were eventually selected. Audio-clock offsets from user cut starts for entries2–5 are19.712s,28.672s,8.096s and156.160s. Main-hint display agreement is88.57%,94.80%,99.23% and62.62%, respectively. These are **not verified accuracy**: brief other passages and boundaries remain unreviewed, seeking receives no matching-display credit, and Aarti's timed sequence is unresolved. The three videos are from one venue/channel, not five independent hall trials.

E079 corroborates entry5's main650 through independently inspected source projection. E080 reproduces a short-phrase routing limitation even with exact canonical input. E082 changes only following-mode routing; E084's seven native paired cases preserve every first acquisition but reach650 at69.632s in entry5, versus no matching selection in the paired baseline's120s window. The separate full baseline reaches650 at156.160s. Both transition screens have more seeking and less main-hint display with the candidate. **Mixed evidence; no integration.**

E086 completed all18 existing reference/control cases, including six passing synthetic negatives. Its12 reference cases show mean correct display71.87% baseline versus71.63% candidate, with unchanged1.53% wrong display; increased seeking explains the decline. These are reused development labels and correlated offsets, not population estimates. E087 confirmed the largest reference decline with uncached inference. A strict array check failed on reversed same-time verse/seeking updates; independent assessment verifies identical post-timestamp states and scores while preserving the failure. Final decision: do not integrate E082; keep E065. See reports/E086-results.md and reports/E087-native-check/assessment.json.

E081's bounded default/one-thread runtime probe found no gain from one thread, so runtime configuration remains unchanged. E083 obtained a canonical Aarti collection reference but no usable projection labels from inspected full frames; it does not establish the sung sequence.

Trend: **positive diagnostic progress; mixed candidate results; Level2 unmet**. No additional recordings are needed for the current candidate decision. Full report: [E085 results](</Users/jashansc/Documents/ChatGPT/VF/reports/E085-results.md>); reproducible observations and verification are adjacent. The next useful content work is focused review of influential passages, followed by stronger short-evidence verification. Training is conditional on demonstrated residual acoustic errors.

## Current readiness

The scoped ambiguity fix is locally integrated. All 18 uncached native cases match their exact cached projection decisions, eight controlled ambiguity regressions pass, and the complete selected suite passes **197/197, zero skipped**. Targeted Babel compilation and syntax/diff checks pass, with no new lint signatures. Existing lint errors remain. [Integration verification](</Users/jashansc/Documents/ChatGPT/VF/reports/E065-verification.json>) and [native verification](</Users/jashansc/Documents/ChatGPT/VF/reports/E062-native/verification-complete.json>).

**The new Level 2 dataset is local and the first screen is complete.** Renton v3 was reconstructed from the user's five-cut list because its original /Users/asingh02 path is absent on this Mac. Five cuts total71:07 across three videos;72:17 of continuous audio preserves the two intervening gaps. User timestamp-verification scope and exact source hashes/offsets are retained. Aarti remains a separate singing entry; its canonical sequence is unresolved. Three other title hints have canonical search matches; E079 corroborates the fifth using source-video projection. Capture chain and independent event/venue coverage remain unverified.

E076/E076b completed five two-minute cold starts plus two short continuous transition windows (19:10 total), with all seven native children exiting0. The runner’s output-pipe interruption was recovered using the two already verified traces; no cases were duplicated. Matching canonical hints for entries2–4 were selected after34.3s,28.7s and9.2s from cut starts. Entry3 had a unique matching full-text leader at8.2s while first-letter votes favored another candidate; this is the next bounded decision experiment. Entry2’s early match was tied and does not justify removing tie protection. Aarti remains unresolved. E079 later corroborates entry5’s main identity using source projection; exact sung interval labels remain unreviewed. No whole71-minute accuracy or live-microphone latency claim. See reports/E077-results.md.

Level 3 experiments remain deferred. E073/E074 corrections supersede the premature E071 error classification; do not use those withdrawn labels for tuning. No new product changes or training.

## What the evidence shows

| Check | Result | What it establishes |
|---|---|---|
| Twelve reference scenarios from four recordings | Mean correct display 71.87%; wrong 1.53%; 5/12 acquired within 20s of first labeled sung words; 1/12 never acquired | Existing development performance; offsets are correlated and identifying-evidence onsets are unreviewed |
| Full 550.6s paced constructed stream | Current baseline: 68.72% correct, 28.66% wrong; transition delays 39.291s / 26.882s / 74.384s from first labeled sung words | Sustained native inference/helper execution, with simulated input and no natural transitions |
| Scoped ambiguity candidate, full paced stream | All 31 projection identities and 980 recognition outputs match baseline; maximum action-time difference 29ms | Preservation on this stream; no accuracy gain |
| Broader cached paired screen | All 18 scenarios preserve projection identities/audio timestamps; six synthetic controls have zero false acquisitions/switches | Decision preservation is also confirmed uncached; these are not representative hall controls |
| Manual following comparison, four reused references | 90.11% correct verse selection, 9.10% incorrect, 0.79% no selection yet; baseline/current outputs match | Preserved manual following on those recordings, not verified Level 1 strata |

Sources: [reference/control screen](</Users/jashansc/Documents/ChatGPT/VF/reports/E061b-screen/comparison.json>), [paced comparison](</Users/jashansc/Documents/ChatGPT/VF/reports/E059-comparison.json>), [manual following comparison](</Users/jashansc/Documents/ChatGPT/VF/reports/E049-manual-following/comparison.json>).

The eight reference cold-offset UEMs request 2.273–4.557 seconds beyond their WAV ends. The screen explicitly records requested and available durations; unavailable tails are not observed audio. Earlier runner failures and their corrections are preserved. Seeking/no acquired display earns no correct-page credit. These source references have unverified event/performer independence and model-training overlap.

## Release requirements still unproven

- ≥95% acquisition within 20 seconds of **reviewed identifying evidence**, including every attempted Shabad. Identifying-evidence markers and a representative checked release pool are missing.
- ≥95% correct-Shabad time, <5% wrong-Shabad time including stale pages, and zero observed never acquired. Current development results fall short; they cannot certify hall reliability.
- ≥95% natural transitions within 20 seconds. Existing constructed transitions do not count as natural events.
- Preserve Level 1 and following, with actual microphone/rendered-app validation. Verified Level 1 capture strata and physical live-app testing remain incomplete.

## Changes currently kept

- Exact canonical STTM/BaniDB display text is separate from normalized search. Raw model text and first-letter chips are removed from the UI. User recollections remain hints requiring canonical verification.
- Obsolete session, follower, audio-setup and retrieval work is rejected; late microphone streams are released.
- Model caching uses persistent application storage, with legacy-cache migration.
- Full-text retrieval runs through the isolated helper; initial agreement/tie checks, empty-slot rescore and seeking restoration are integrated.
- Active matching slots retain their canonical profiles across cache eviction/reload, fixing a reproduced runtime exception.
- Following-mode confirmation now clears prior wins and blocks confirmation for tied full-text leader identities. Unrelated nominees continue to be judged, avoiding the broad guard’s demonstrated regression.
- The following panel has steadier layout in controlled React checks. Actual Darbar UX/flicker improvement remains unverified.

Selected suite: **197 passed, zero skipped** (E065), including the eight new ambiguity tests. The component retains 29 existing lint errors and introduces no new signatures. Source branch is `feature/voice-follow` at `8a5a89c`; no new commit or publication.

## Highest-value next steps

1. Candidate decision completed: do not integrate E082; retain E065. Existing controls and bounded native confirmation did not support promotion.
2. Review the fifth cut's initial mismatch and the added transition1 departures, with exact canonical identities and explicit identifying-evidence markers. Do not classify every departure from a coarse main hint as wrong.
3. Separate admitting useful short evidence from committing a page. A bounded canonical candidate verifier using retained model token probabilities is a research option, not an established fix. Preserve the existing ambiguity and E022 counterexamples.
4. If checked residual errors are acoustic, run a small source-grouped live-hall training pilot before scaling. Broader independently reviewed room-microphone coverage and physical microphone/UI testing are still needed for release confidence.
5. Keep Level3 deferred. No new links are required to diagnose the recordings already supplied.

Canonical requirements: [project principles](</Users/jashansc/Documents/ChatGPT/VF/PROJECT-PRINCIPLES.md>). Dataset and statistical requirements: [dataset plan](</Users/jashansc/Documents/ChatGPT/VF/DATASET-PLAN.md>). Full experiment history: [experiment log](</Users/jashansc/Documents/ChatGPT/VF/EXPERIMENTS.md>). The previous status page is preserved [here](</Users/jashansc/Documents/ChatGPT/VF/reports/E064-status-before.md>).

A [development source backup](</Users/jashansc/Documents/ChatGPT/VF/artifacts/E067-development-source-backup.tar.gz>) is saved outside `/tmp`. Its patch was restored against the recorded base file versions and verified byte-for-byte; it is not a release installer. Model, canonical DB and recordings are not bundled. [Backup verification](</Users/jashansc/Documents/ChatGPT/VF/reports/E067-verification.json>).
