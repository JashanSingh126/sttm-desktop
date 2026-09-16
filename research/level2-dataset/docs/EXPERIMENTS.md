# Experiment record

## E001 — recover and audit baseline (2026-09-14)

- Hypothesis: existing source and measurements are sufficient to identify the main live failure.
- Source: `8a5a89c` / feature/voice-follow; untouched at audit start.
- Commands: `node --test www/main/addons/voice-follow/components/`; `node www/main/addons/voice-follow/components/switchPolicy.eval.js` using `/opt/homebrew/opt/node@18/bin/node`. Inspect legacy harness and parquet metadata.
- Result: 30/30 policy tests pass; deterministic policy checks pass with a known sustained-spurious-evidence failure. Native ONNX and Realm load. Model, database and audio available.
- Finding: legacy initial search is restricted to known answer candidates; app cold acquisition and full retrieval are absent. Legacy lock-in denominator excludes never-proposed cases. Parquet is one video with automatically assigned labels; some labels require review. Previous percentages are not accepted as end-to-end or hall results.
- Trend: **unmeasured product performance; positive measurement readiness**.
- Decision: build a replay of the actual component logic and audit truth IDs/timing before tuning or training. Preserve the working product baseline.

## E002 — replay the user's live Darbar failure (2026-09-14)

**Qualification added in E036:** the user-recording intervals are unreviewed. Canonical verification of the recalled Shabad does not establish what was sung throughout the clip; see the later clarification of this entry.

- Method: `test/voice-follow/replay.js` executes the actual VoiceFollow component, native ONNX recognizer, follower, complete Realm query implementation, and switch policy. React drawing and physical microphone are mocked; a test-only bridge is inserted in memory. No truth is passed to retrieval. Asynchronous work settles between chunks, so this is not an Electron timing/UX test.
- Input: `new-kirtan.mov` -> 16 kHz mono PCM; all 310.67 seconds, cold start. Source/component/model/input hashes and commands' parameters are recorded in `reports/E002-darbar-baseline.json`.
- Result: one acquisition at audio t=4.096s to Shabad 4898; no later switches. Shabad 300, confirmed by the user's recollection and canonical BaniDB text, is never acquired during the passage containing it. Complete-session percent accuracy is unavailable without checked boundaries.
- Runtime: 132.32s wall / 310.65s audio, RTF 0.426 on this Mac. Simulated peak serial backlog 3.39s; this is not measured microphone-to-projector latency.
- Finding: ASR recovers a canonical phrase from Shabad 300 from t=195.584s, but the four-first-letter early return suppresses its three-word evidence. The correct candidate enters first-letter query results only at t=219.136s, then is not judged on subsequent short decodes. The fallback screens by subsequence over whole-Shabad concatenated letters and repeatedly favors long low-ID entries.
- Trend: **failure reproduced; Level 2 not achieved**.
- Decision: test general full-text retrieval and evidence handling before changing model weights. Do not infer truth from the failing app's projected page.

## E003 — full-corpus retrieval comparison (2026-09-14)

- Hypothesis: useful ASR text is lost by first-letter retrieval and early-return gates.
- Method: `test/voice-follow/retrieval-diagnostic.js`; compare existing fallback's top 60 against a full-corpus character-trigram index, with raw and vowel-mark-stripped representations. Indexed BaniDB without expected IDs; used E002's 439 saved transcripts. Experimental only, not wired into product.
- Result: on the recovered phrase near 195.6–198.1s, Shabad 300 is absent from the old top 60 and tied for first in the prototype. The duplicate/ambiguous match is explicit, not a unique lock. At 219.136s, longer evidence uniquely ranks 300 first. Similar recovery occurs on the later phrase around 274s and 289s.
- Query time: mean 4.06ms, median 2.57ms, p95 11.63ms. Report: `reports/E003-retrieval-comparison.json`.
- Trend: **positive candidate recall on this development recording; acquisition/false-positive effect unmeasured**.
- Decision: continue with ambiguity-aware evidence accumulation and full audio replay. Reject any change that turns faster retrieval into extra incorrect projections. Add independent annotated recordings and negative controls before promoting a product change.

## E004 — narrow short-phrase gating fix, development replay (2026-09-14)

- Hypothesis: a first-letter query-length requirement incorrectly blocks judging an already-nominated switch when sung evidence contains fewer words.
- Change under test: in-memory component variant permits the following-phase decision path to continue when the first-letter query is too short; initial acquisition gates and acoustic thresholds remain as shipped. Product source is still untouched.
- Input and model: identical to E002; variant source at `research/variants/E004-short-evidence.jsx`. Trace: `reports/E004-short-evidence.json`.
- Result: initial acquisition remains Shabad 4898 at 4.096s. Shabad 300 is now acquired at 220.160s and retained through the end, instead of never acquired. This is about 24.6s after the first clearly recovered canonical phrase in E002; identifying-evidence timing still requires manual annotation.
- Runtime: RTF 0.415, peak simulated backlog 3.32s. Small timing differences are not treated as a speed win.
- Trend: **positive on one development example; broad reliability unproven**.
- Decision: hold as experimental pending paired independent-recording regression tests. Do not mistake this for the <20s acquisition goal or statistical evidence across halls.

## E005 — paired public-reference regression (started 2026-09-14)

- Plan fixed before results: unchanged component versus E004, four reference recordings each with initial/33%/66% cold start = 24 replay runs, sequential to avoid competing inference loads. Twelve cases represent four source groups, not twelve independent events.
- Labels: public hand-reviewed reference annotations; all 61 base-case segments' canonical text, verse IDs and Shabad IDs match local BaniDB exactly (`reports/reference-canonical-audit.json`). This set has no transitions and unknown model-training overlap.
- Runner: `test/voice-follow/run-reference.py --workspace /Users/jashansc/Documents/ChatGPT/VF --candidate-source /Users/jashansc/Documents/ChatGPT/VF/research/variants/E004-short-evidence.jsx --user-data '/Users/jashansc/Library/Application Support/SikhiToTheMax' --all-offsets`.
- Metrics: new exact interval scorer counts every acquisition attempt, stale pages as incorrect, seeking slides separately, and compute-delay estimates. Five scorer regression tests pass, including never-acquired denominators and boundary/gap handling. It does not substitute for the reference's separate collar-based score.
- Outputs: `reports/E005-reference/`, per-run traces, logs, score files and `progress.json`.
- Status: running; inspect the process handle and completed score files before drawing conclusions.

### E005 interim findings and runner repair

- The frozen baseline is now explicitly supplied as `research/variants/E002-baseline.jsx`, so product edits cannot change a run halfway through the experiment. E004 also remains frozen. Resume validates source/model/audio hashes and completion markers; it never silently overwrites traces.
- A baseline cold33 replay completed and wrote its trace, then aborted during native shutdown (`recursive_mutex lock failed`). The completed result was retained with `nativeShutdownWarning: true`. The headless driver now closes its Realm handles after all decisions settle. Subsequent completed runs have exited cleanly. This repair affects test cleanup, not recognition decisions.
- The first recording's base case is effectively unchanged: ~97.18% correct Shabad, 0% incorrect. At cold33, correct coverage improves 25.62% → 60.44%, but incorrect coverage worsens 11.51% → 29.94%; seeking falls 61.14% → 7.89%. First correct acquisition improves 233.22s → 132.90s, still far beyond the target. At cold66, neither variant acquires the correct Shabad (~95.52% incorrect coverage).
- **Trend: mixed; E004 is not a releasable fix by itself.** Faster recovery cannot justify the extra incorrect-page time. Continue the fixed paired regression plan; record all results, including failures.
- Some reference UEM ends exceed the linked audio duration by a few seconds. All supplied singing segments in the 12 cases fall inside available audio (E009). Requested and replayed durations are now explicit; no unavailable interval earns credit.
- The earlier commentary saying the cold33 case displayed incorrect Shabads for nearly four minutes was imprecise: most of that time was a seeking slide. Both are failures of correct-page coverage; they are separate categories in the report.

## E006 — canonical-only Voice Follow display (2026-09-14)

- Requirement: even the user's recollections and model output are unverified search hints. Only BaniDB/STTM canonical text may be displayed as Gurbani.
- Product change: remove raw recognizer text and first-letter chips from the panel, together with their per-decode UI state updates. Keep canonical display strings separately from the alignment tokens; backstop suggestions now preserve punctuation and verse markers instead of rebuilding a line from stripped words. Matching and decision thresholds are unchanged.
- Verified the user's example directly against local BaniDB; Shabad 300, verse 4132 includes the word form `ਤੂੰਹੈ`. Full exact source text and database/schema SHA-256 fingerprints are in `reports/user-recollection-canonical-verification.json`.
- Validation: component Babel compilation passes; all 30 policy tests and 5 interval-scoring tests pass; `git diff --check` passes. ESLint has 29 existing errors on both frozen baseline and current component, with zero new error signatures (`reports/E006-lint-comparison.json`). Full Electron/live microphone UI testing remains outstanding.
- **Trend: positive for canonical-text integrity.** Removal of constantly changing unverified text also removes one source of panel churn; no claim yet that all flickering is solved. Keep the change.

## E007 — canonical-transcript retrieval oracle (2026-09-14)

- Feed the 33 distinct verified canonical verses from four reference recordings to retrieval only. Expected IDs are used after retrieval for scoring, not in the candidate field.
- Existing first-letter fallback includes the correct Shabad in its top 60 for 11/33 verses; the text-index prototype includes it for 33/33. See `reports/E007-canonical-retrieval-oracle.json`.
- **Trend: positive mechanism evidence for retrieval work.** This tests whether clean text can find its source, not acoustic recognition or statistical hall reliability. The 33 verses do not represent 33 independent events.

## E008 — capture-channel audit (2026-09-14)

- Analyze the extracted stereo track in 30-second blocks. Both channels are identical (correlation 1, equal RMS); averaging them does not cause stereo cancellation. RMS varies approximately -20.7 to -32.0 dBFS.
- Report: `reports/E008-capture-audit.json`. This does not identify the microphone, measure vocal SNR, or establish that the voice was adequately captured.
- **Trend: one suspected capture defect ruled out on the development recording.** Device provenance and paired room/desk evidence remain open.

## E009 — canonical label validation (2026-09-14)

- Added `test/voice-follow/canonical-labels.js`: cross-check exact Unicode text, verse-to-Shabad membership, optional larivaar text, timestamps and audio bounds against the read-only local BaniDB. Reject mismatches; never silently repair labels or echo suspect text as canonical Bani. Retain database and label fingerprints in CLI reports.
- Canonical identity and explicit human audio-review declarations are separate fields. `--require-audio-review` rejects labels without a named, dated declaration of listening against the canonical source. It cannot independently prove that a declaration is honest and does not certify dataset splits or release readiness.
- All 134 segment entries across 12 reference cases match BaniDB and fit available audio (`reports/E009-canonical-label-audit.json`). These include repeated offsets, not 134 independent samples. The original source describes the annotations as hand-reviewed; none has been independently audio-reviewed here, and the report preserves that distinction.
- Six validation tests pass, including wrong text/IDs, unknown records, overlapping intervals, unavailable audio, and model agreement being insufficient as an audio-review declaration.
- **Trend: positive labeling safeguards; no new acoustic ground truth claimed.** Use this gate before any checked-label pool or training pilot.

## E010 — fallback candidate selection defect (2026-09-14)

- Code inspection found the cached-candidate selector compares `m.s > top.s` even though `top` stores `{ id, prof, m }`. Once a cached candidate exists, later scores are compared with `undefined`, preventing the better candidate from replacing it.
- A probe executes the exact selection block with candidate scores 0.2 then 0.9: baseline selects 0.2; changing only the field access to `top.m.s` selects 0.9. Report: `reports/E010-selection-probe.json`.
- Frozen experimental variant: `research/variants/E010-best-cached-candidate.jsx`, based on E002 with just that comparison repaired. Product source has not received this recognition change.
- **Trend: confirmed wiring defect; end-to-end impact unmeasured.** Test separately from E004 and the text index, then compare combined fixes only if the individual results support it. This is a specific reason to continue retrieval/decision diagnosis before committing to model retraining.

## E011 — retrieval from actual reference ASR output (2026-09-14)

- `test/voice-follow/diagnose-reference-retrieval.js` evaluates completed baseline traces against the full canonical index. The expected Shabad is used only after each search. It validates the source label text/IDs and compares transcript windows whose end falls in a labeled singing interval.
- On the first two completed base recordings, the old fallback's top 60 contains the expected Shabad in 0/767 and 0/442 scored transcript windows. The text-index prototype includes it in 553/767 and 274/442. It ranks the expected Shabad uniquely first in 288/767 and 71/442; many other first-place matches are tied. The main app's separate first-letter query proposer is not included in these fallback-only numbers.
- Report: `reports/E011-acoustic-retrieval-diagnostic.json`. The windows overlap and represent only two source recordings, not 1,209 independent trials. Ranking does not establish reliable confidence, accurate word transcription or a correct display decision.
- **Trend: positive candidate-recovery evidence on additional audio; end-to-end benefit still unproven.** Together with the cached-selection defect, this supports a bounded retrieval/decision experiment before a training investment. Ambiguous matches must stay explicit.

### E005 completed comparison

- All 24 planned runs completed: 12 paired cases grouped within four recordings. `reports/E005-reference/summary.json` uses the audio clock for an algorithm comparison; earlier interim compute-delay figures remain above and must not be mixed with these percentages.
- Mean correct-page coverage across cases improves 34.72% → 44.54%; mean incorrect-page coverage falls 45.69% → 43.83%. Those means hide regressions: incorrect coverage increases in three of four source groups (IZO 35.68% → 41.81%; kZh 50.97% → 52.54%; zOt 64.28% → 76.80%). kch improves 31.83% → 4.16% incorrect.
- Acquisitions within 20 seconds of the first labeled sung words remain 3/12 in both variants; never-acquired cases fall 6/12 → 5/12. Identifying-evidence boundaries are not supplied, so these are not measurements of that release KPI.
- **Decision: do not promote E004 alone. Trend: mixed and far below Level 2.** Cold offsets are correlated; no confidence interval or independent-event claim is made from these twelve cases.

### E010 completed base-case comparison

- Four paired base cases completed, reusing fingerprint-checked baseline traces. The isolated comparator repair produces exactly the same audio-clock scores in all four: mean correct 51.18%, incorrect 35.88%, 2/4 acquisitions within 20 seconds, 1/4 never acquired. These are base cases only, not the twelve-case E005 aggregate.
- `reports/E010-reference/summary.json` and `progress.json` preserve every case. The candidate used emissions-cache record mode, so every inference was native; disk work prevents a live timing claim. Cold offsets and real transitions were not evaluated in this ablation.
- **Trend: neutral measured effect; the selection defect is still real.** Leave experimental and test retrieval separately.

## E012 — full-text fallback screen ablation (2026-09-14)

- Frozen variant `research/variants/E012-text-screen.jsx` uses the full-corpus trigram candidate screen plus E010's corrected comparator. Other nomination gates, confirmation thresholds and cache adoption policy are unchanged. E004 and the later product lifecycle guard are intentionally not bundled into this ablation.
- Four paired base cases started with `run-reference.py --candidate-name text-screen --output-dir .../reports/E012-reference --baseline-results-dir .../reports/E005-reference --emissions-cache .../cache/model-emissions --cache-mode replay`. Baseline traces are reused only after fingerprint checks. This is exploratory: cache hits can change asynchronous callback order (E016).
- Inspect completion state and scores before judging the result. A stronger retrieval ranking alone is not an acquisition or false-positive win; the frozen variant does not add ambiguity-aware decisions.
- **Trend: end-to-end effect under evaluation.** Repeat promising results fully uncached before any promotion, then examine cold offsets and negative controls.

## E013 — explicit cold-start negative controls (2026-09-14)

- Generated reproducible local development controls: 60 seconds of silence, 60 seconds of seeded pink noise, and 34.51 seconds of synthetic English announcements. Inputs, generation settings and hashes are in `data/synthetic-negative-controls/manifest.json`.
- Added `score-negative.js` with three passing tests: every Shabad commitment on these intrinsically negative cold-start inputs is a false commitment, including decisions becoming available after the clip ends. Seeking is separate from projected false-Shabad time.
- No Bani is generated for these controls. They are not substitutes for real hall instrumentals, Simran, Katha, speech or audience noise. Unlabeled live intervals must never be silently treated as negatives.
- **Trend: negative-test coverage prepared; replay results pending.**

## E014 — broader live-source audit (2026-09-14)

- Acquired eight excerpts from public live-stream sources: six Level 2 candidates from San Jose, Southall Park Avenue and Ontario Khalsa Darbar, plus two AKJ smagam candidates for Level 3. Source URL/channel/date metadata and hashes are preserved in `data/live-source-audit/manifest.json`, `acquired.json` and per-source records. Dates/venue/content are metadata hints until checked.
- Sampling was fixed before listening or model inspection: request 240 seconds beginning at 15% of each declared stream duration. Keep nonsinging excerpts instead of replacing them with easier material. Seek/keyframe padding means the actual excerpts are approximately 241–248 seconds each; full-stream offsets are nominal until verified.
- Preserve source excerpt and derived mono 16 kHz WAV. Capture chain and performers are unknown; all eight remain `unlabeled`, `development-source-audit`, and `training_eligible: false`. The source videos do not establish eight independent events or room-microphone capture.
- **Trend: broader source coverage available, no new checked acoustic ground truth yet.** Label against canonical Bani and audit event/performer/capture grouping before using any performance result as hall evidence.

## E015 — canonical annotation utility (2026-09-14)

- Added local `test/voice-follow/annotation-server.js` and `annotation.html`, served only on 127.0.0.1. It offers audio playback, timing selection, exact canonical search and read-only Bani, verse-ID selection, editing/review of intervals, and versioned local saves. It currently exposes the user's clip, four reference recordings and eight new live excerpts.
- The server independently validates submitted exact text, IDs, membership, overlap and measured audio bounds; a tampered text request returns 422 and writes no label. Explicit named/dated listening declarations are distinct from canonical validity. Training eligibility stays false.
- Browser verification: imported and saved 15 source segments with exact IDs/text/times and gaps preserved, without adding any audio-review declaration. The new edit/update flow keeps draft status unless the reviewer explicitly declares audio review. Resetting a source reference clears an in-progress edit. `reports/E015-annotation-tool-verification.json` records the round-trip and rejection checks.
- **Trend: positive labeling integrity and review usability.** No new recording has been audio-approved by exercising the interface.

## E016 — exact audio-emissions cache, with scheduling caveat (2026-09-14)

- Added a test-only cache keyed by exact float PCM bytes, model hash, inference source hash and ONNX Runtime version; stored tensors have integrity checks. No expected IDs, labels or text are part of a cache key. Three tests pass for exact tensors, key separation and corrupt-entry fallback.
- A 30-second native-record/cache-replay audit reused 126/126 tensors and made zero native calls on the second run. It reduced experiment wall time 12.12s → 4.08s, **not application latency**.
- The initial strict event-order assertion failed. Investigation found all 267 event values/timestamps and ordering within each event type equal, but retrieval and follower callbacks interleaved differently. The report retains `strictCrossTypeOrderEqual: false`; it does not establish general decision equivalence because the component does not await the transcript handler before advancing its follower.
- `score-replay.js` omits compute-clock scores for cache-enabled traces. Use cached runs only to screen experiments; every promising result requires a fully uncached replay. `reports/E016-cache-audit/verification.json` preserves the limitation.
- Provenance repair: replay now fingerprints the component actually passed and the driver loaded at process start. Historical runs captured the driver file hash at the end, so a hash could reflect a harness edit made while a replay was running. Component/model/audio inputs remained frozen; do not treat historical driver hashes as proof of the exact loaded harness.
- **Trend: faster exploratory iteration with an explicit limitation; no product speed claim.**

## E017 — discard obsolete follower completions (2026-09-14)

- Controlled tests executing the actual component reproduced an in-flight old follower projecting its verse after a different Shabad was selected, after autopilot stopped, and after manual following stopped. The delayed engine is a test fixture; canonical profile rows come from the real read-only database.
- Product change: after awaiting a follower result, require the same follower instance to still be current. Autopilot also requires the session still active and no lock in progress. This prevents a stale result from moving the new/current page. Healthy current-follower movement is preserved.
- Five lifecycle tests pass, including a frozen-baseline reproduction. The full selected suite passes 52/52 tests (`reports/E017-tests.tap`). Babel compilation passes; differential ESLint validation is recorded in `reports/E017-lint-comparison.json`. No recognition thresholds or retrieval experiment have been promoted.
- **Trend: positive for a reproduced stale-display failure.** This addresses one mechanism that could cause flickering; actual Electron rendering, microphone capture, model-initialization lifecycle and broader live UX remain separate verification work.

### E012 first attempt: harness ownership failure

- The first run stopped before a trace completed: the diagnostic corpus reader closed a Realm instance shared with active app queries. This was an integration error in the experimental harness, not evidence of recognition failure. The failed log is retained as `IZOsmkdmmcg-text-screen-attempt1-realm-closed.log`.
- The reader now optionally transfers handle ownership to the driver, which closes it only after all decisions settle. Standalone canonical/retrieval audits still close their own handles. This does not change the index or component variant. New traces also fingerprint retrieval/cache support files before replay.

### E012 completed exploratory comparison

- All four base pairs completed after the harness repair. Correct/incorrect/seeking coverage: IZO baseline 97.22/0/0% → 30.51/0/66.72%; kZh 9.09/77.89/0.22% → 82.81/4.17/0.22%; kch 98.42/0/0% → 70.66/0/27.76%; zOt 0/65.63/32.63% → 33.07/30.93/34.27%.
- kZh first-correct latency falls 266.40s → 40.10s; zOt improves never → 170.50s. Both remain beyond 20 seconds from first sung words. IZO and kch retain the same initial correct commits, but a seeking slide hides them for long intervals.
- In IZO the seeking slide opens at 147.968s and remains until 448.000s despite no Shabad switch. Existing code dismisses it when both contender slots disappear; the new high-recall index often keeps a cached, zero-win contender present. This is a concrete display-state interaction, not evidence that the correctly identified page became wrong.
- **Trend: mixed; no promotion.** The cached comparison requires uncached confirmation, and the four base cases are development diagnostics rather than independent hall evidence.

## E018 — restore a revalidated current page (2026-09-14)

- Frozen variant `research/variants/E018-restore-current.jsx` adds one display rule to E012: clear our seeking slide only when the current Shabad clearly wins the text comparison, using existing minimum/margin thresholds, sufficient hypothesis length, and zero remaining contender wins. It leaves acquisition/switch rules unchanged. A cached contender's continued existence is insufficient to hide the revalidated current page forever.
- Generator: `test/voice-follow/make-seeking-variant.js`; initial JSX syntax check required explicit Babel presets for the out-of-repo variant path, then succeeded before writing the frozen variant.
- Four paired base cases will test the effect against E002 and the completed E012 scores. Keep the alternative prospectively defined; do not tune thresholds from individual passages. Cached exploration must be followed by an uncached replay if promising.
- **Trend: mechanism identified; effect pending.**

### E013 baseline negative results

- Full uncached actual-component replays complete on all three controls. Silence and pink noise produce zero acquisitions. The synthetic English announcement falsely acquires Shabad 925 at audio 6.656s and retains it for the rest of the clip (34.51s total; 27.68s incorrect using estimated compute availability).
- **Trend: negative for cold-start precision.** This establishes a concrete failure on an intrinsically negative input; it does not estimate a real-hall false-positive rate. Current first-letter cold acquisition treats a fast wrong lock as recoverable, an assumption contradicted by the reference failures. Candidate-text verification and ambiguity handling deserve an isolated diagnosis before tuning or training.

### E018 completed exploratory comparison

- The restoration rule reduces correct-page masking in IZO (E012 30.51% correct → 96.59%) and kch (70.66% → 96.79%). Both retain 0% incorrect-page time. kZh and zOt scores are unchanged from E012. Baseline still has slightly better correct coverage in IZO/kch because it did not trigger the new index's false seeking episodes.
- Shabad commitments and acquisition times are unchanged from E012. The E018 mean correct coverage is 77.31%, incorrect 8.77%; 2/4 first-sung-word acquisitions within 20s, zero never acquired in the four base cases. This remains below Level 2, and the cached/native scheduling distinction is unresolved until uncached confirmation.
- **Trend: positive display recovery within this experiment, insufficient for release.**

## E019 — audit initial nominees against full canonical text (2026-09-14)

- `diagnose-initial-locks.js` inspects the first commit in all twelve baseline reference cases and the synthetic English negative. Retrieval receives the saved acoustic text and the full BaniDB corpus; expected IDs are used afterward. The report stores hashes/timestamps of acoustic text rather than presenting it as Bani.
- Four first nominees match the single-Shabad reference; all four rank uniquely first in full-text retrieval. Eight first nominees are wrong; none ranks first, with ranks 199–3825 or absent. The expected Shabad ranks first in five of those eight wrong-nomination cases. The English false nominee is absent from text-index results despite the first-letter acquisition accepting it.
- `reports/E019-initial-commit-audit.json` includes every case and ties. These are four correlated recording groups, inspected post hoc. This is diagnostic mechanism evidence, not a calibrated confidence rule or statistical hall claim.
- **Trend: strong reason to test initial nominee verification before training.**

## E020 — initial nominee agreement gate (2026-09-14)

- Frozen `research/variants/E020-initial-text-veto.jsx` adds a veto to E018's existing first-letter cold-acquisition rule: the nominee must also be the unique full-text leader. No numeric threshold is tuned. Ties do not become evidence through ID ordering. Session/recognizer checks discard a nominee if startup changes during the index await.
- Predeclared evaluation: all twelve reference offsets, preserving four source groups; compare against frozen E002 and inspect E018's completed base-case scores. The candidate uses the exact emissions cache where available; missing windows run native. Results remain exploratory until uncached confirmation. Negative controls must also be repeated before any promotion.
- Generator `make-initial-veto-variant.js`; runner output `reports/E020-reference/`. No product recognition change is made while this runs.

## E021 — prevent old lock construction crossing a restart (2026-09-14)

- Two controlled actual-component tests failed before repair: an old follower construction can finish after stop/restart and overwrite a newly acquired Shabad; its late failure can instead reset the new session to searching. A frozen-baseline test preserves the first reproduction.
- Added a session generation invalidated by cleanup. A lock checks that generation after profile/follower/recognizer awaits, suppresses obsolete failure handling, and releases only its own session's lock flag. Product change affects lifecycle, not retrieval or numeric decision policy.
- All eight lifecycle tests now pass (the five E017 cases plus three E021 checks); red and green TAP reports are retained. Broader tests and differential lint are still to be run for this edit. This does not yet establish complete cancellation of all microphone/model-startup operations.
- **Trend: positive for reproduced restart races.**

### E021 verification complete

- All 55 selected tests pass with zero skips (`reports/E021-tests.tap`). Babel compilation passes. Differential ESLint reports 29 baseline/current errors and zero added signatures (`reports/E021-lint-comparison.json`); the pre-existing failures are not described as a clean lint run. `git diff --check` passes. No commit or publication was performed.

### E020 completed cached comparison and negative controls

- All twelve pairs are scored. Mean correct-Shabad coverage improves 34.72% → 69.71%; incorrect coverage falls 45.69% → 2.49%. All four source-group means improve, but these are correlated offsets with unverified independent-event structure, so no statistical significance claim is made.
- Within 20 seconds of first labeled sung words: 3/12 → 5/12. Never acquired: 6/12 → 2/12. The last zOt cold66 case falsely acquires Shabad 7973 and never reaches the reference Shabad; that failure remains in every denominator. Both remaining never-acquired cases belong to zOt. This is not Level 2.
- The final candidate trace completed, atomically saved, and printed its completion marker before native teardown aborted with `recursive_mutex lock failed`. Resume validated all source/model/audio fingerprints and the completed trace, retained `nativeShutdownWarning: true`, and scored it. The cleanup issue is not fixed and this is not described as a clean native batch.
- Repeated all three synthetic negatives fully uncached for E020. Silence/noise remain zero false acquisitions; the English announcement falls from one false acquisition in E002/E012 to zero in E020. Outputs: `reports/E013-negative/initial-text-veto/`. These three artificial controls cannot establish a real-hall false-positive rate.
- **Trend: positive descriptive progress, incomplete reliability.** A fully uncached twelve-case confirmation is running under `reports/E020-uncached/`, using the same frozen component. No recognition experiment is promoted before that confirmation and broader live evaluation.

### E020 uncached confirmation, first three cases

- IZO base, cold33 and cold66 complete with native inference, no cache and clean process exit. Their ordered Shabad/verse/seeking actions and audio timestamps exactly match the cached runs (`reports/E020-uncached/verification-progress.json`). The other nine cases remain pending at this checkpoint; no general scheduling-equivalence or live-latency claim follows yet.

## E022 — initial-search opportunities and a rejected shortcut (2026-09-14)

- `diagnose-search-opportunities.js` inspects only initial-search transcripts through the first actual E020 commit, across all twelve offsets and three synthetic controls. The full canonical corpus is searched before expected labels are consulted. Unverified hypothesis text is represented by hashes in this report.
- The predeclared diagnostic slice requires score ≥0.8, margin ≥0.2, at least eight normalized characters, and two consecutive windows no more than 0.75s apart. These are exploratory similarity thresholds, not calibrated probabilities or accepted product settings.
- Six of twelve cases have a stable correct match in that slice. Five precede the actual first commitment; kZh cold33 coincides with it. However, zOt cold33 has a sustained wrong leader (Shabad 4208) at relative 78.848s, against reference Shabad 3712. Therefore accepting strong full-text leaders directly is not justified by these results. None of the synthetic controls passes this slice.
- Report: `reports/E022-search-opportunities.json`. Overlapping windows and offsets are correlated. No counterfactual acquisition performance, identifying-evidence latency, or independent auditory approval is inferred from this diagnostic.
- **Trend: negative for a simple direct-text acquisition shortcut; positive for avoiding an unsupported policy change.**

## E023 — preserve vowel marks in the same diagnostic (2026-09-14)

- Repeated E022 without changing its thresholds, using only the index representation that preserves vowel marks. This is a diagnostic index selection, not an edit to canonical Bani or to the experimental/product retrieval module.
- The sustained wrong 4208 opportunity disappears, but stable correct opportunities fall from six cases to three. IZO base remains at 5.120s, IZO cold66 moves from 27.648s to 29.184s, and kch cold66 remains at 2.560s. No qualifying wrong window is observed in this slice. These small, post hoc results do not establish a safe acceptance threshold.
- Report: `reports/E023-raw-search-opportunities.json`. Both representations are internal search data; exact STTM/BaniDB text remains the only display and canonical-label source.
- A separate read-only membership audit examined 142,576 verse rows and found zero rows with multiple Shabad memberships in this database (`reports/canonical-membership-audit.json`). It rules out that particular index omission here, not all possible candidate ambiguity.
- **Trend: mixed precision/recall tradeoff; no promotion.** Residual acoustic ambiguity and independently checked sung-word labels remain higher-value evidence than tuning these thresholds to four recordings.

## E024 — cancel obsolete model preparation (2026-09-14)

- Controlled actual-component tests reproduce late download progress, successful readiness and failed readiness updating state or creating an extra engine after stop/restart. All nine current-behavior checks fail before repair; a separate frozen-baseline reproduction passes. The pre-edit component is preserved at `research/variants/E024-before-model-cancellation.jsx`.
- Manual follow, blind detection and autopilot now capture the session generation before preparing the model. Progress, success and failure are ignored after that generation changes. Manual content-loading results are similarly checked before changing line state or beginning model preparation.
- All ten focused startup tests pass after repair (`reports/E024-startup-red.tap`, `reports/E024-startup-green.tap`). Full selected verification is being completed. No recognition threshold, retrieval rule or canonical text changes in this repair.
- This does not yet cancel every microphone-permission, worklet, recognizer-construction or transcript-query operation. Those remain explicit runtime audit items; this is not an assertion of complete startup cancellation or verified live Electron UX.
- **Trend: positive for a reproduced lifecycle failure.**

### E024 verification complete

- All 65 selected tests pass with zero skips (`reports/E024-tests.tap`). Babel compilation passes. ESLint remains at 29 baseline/current errors with no added signatures (`reports/E024-lint-comparison.json`), and `git diff --check` passes. No installed app rebuild, commit or publication has been made.

### E020 full uncached confirmation complete

- All twelve candidate cases finish with native inference and clean process exits. Ordered Shabad/verse/seeking actions and audio timestamps exactly match the cached screening in every case. Frozen component, model, audio, database/schema and retrieval support fingerprints match. Report: `reports/E020-uncached/verification-complete.json`.
- Metrics remain 34.72% → 69.71% mean correct coverage, 45.69% → 2.49% incorrect coverage, 3/12 → 5/12 acquisitions within 20s of first labeled sung words, and 6/12 → 2/12 never acquired. These are four source recordings, not twelve independent hall events. Identifying-evidence timing and actual transitions remain unmeasured.
- Baselines reuse previously validated uncached traces; one retains its prior native shutdown warning. The candidate batch has zero new shutdown warnings, which does not establish that intermittent teardown is fixed.
- Startup-test bridge/state-observer additions were made to the headless driver during the batch. The traces record two loaded driver versions; the default observer is a no-op, frozen recognition inputs are unchanged, and all twelve projection action sequences still match exactly. Physical microphone-to-projector timing is not inferred from these runs.
- **Trend: positive, reproducible descriptive improvement; Level 2 remains unmet.** No recognition experiment is promoted. Independent checked hall labels and real transitions are the main evidence priority.

## E025 — verify the Electron renderer model path and preserve its cache (2026-09-14)

- A real Electron 26.6.10 hidden-window probe, with the app's Node/remote settings and an isolated user-data profile, confirms that `require('electron').app` is unavailable in the renderer. The old manager selects the temporary `sttm/voice-follow` directory even though `remote.app.getPath('userData')` correctly identifies the isolated persistent profile. The existing temporary model happens to be present; that does not make its location persistent (`reports/E025-runtime-before.json`).
- Product repair: resolve `app` through `@electron/remote` in the renderer and directly in main, keeping the plain-Node temporary fallback. A complete legacy cache is copied to a temporary destination and atomically renamed into the profile, retaining the original. An existing complete persistent model wins; truncated legacy data is not promoted, and a failed copy leaves no partial destination.
- Seven focused filesystem/context tests pass, including main/renderer/Node resolution, no-download reuse/migration, truncated legacy rejection and failed-copy cleanup. Sparse fixture files test the existing size-based cache contract, not ONNX validity. The red run retained four failures before repair (`reports/E025-cache-red.tap`); green runs are retained separately.
- After repair, the real Electron renderer resolves the intended profile and loads the native model successfully in about 404ms in this one probe (`reports/E025-runtime-after.json`). This is model-load timing on this machine, not acquisition latency or a statistically established startup improvement.
- The first command used an incorrect synthetic fixture filename; it was stopped and its error log is retained. The initial data-origin probe cannot access `mediaDevices`, so its audio error is a harness-origin limitation. A file-origin probe and later post-repair audio probe both time out; progress logging locates the latter after model preparation and before `getUserMedia` resolves. No fake/physical audio-transport success is claimed.
- Full selected suite: 72/72 pass, zero skips (`reports/E025-tests.tap`). Babel compilation passes for both changed product files. Differential lint: VoiceFollow 29→29 errors, model-manager 11→3, zero added signatures (`reports/E025-lint-comparison.json`); formatting existing download code does not change its behavior. `git diff --check` passes.
- **Trend: positive for a demonstrated startup/cache defect; audio transport remains unresolved.** No recognition rule, Bani text, installed application, commit or published release is changed by this verification.

## Independent review queue prepared (2026-09-14)

- `REVIEW-QUEUE.md` and `data/review-queue.json` select the first 120 seconds of each pre-acquired source excerpt without consulting model output. R01–R03 span three venue hints and require six minutes initially; all six Level 2 tasks total twelve minutes, with four further minutes from two Level 3 tasks.
- Audio hashes were checked against acquisition manifests. Every label, reviewer declaration, content category and identifying-evidence timestamp remains absent. Training/release eligibility is false, and the existing development/source-audit split is preserved. These are not independent-event or release-quality claims.
- A question asking who can perform knowledgeable audio review is pending. The annotation server was verified live, and its tab remains available. Opening the review-queue file was queued by Codex, not visually confirmed.
- Native UI inventory reports that the Mac is locked and automatic unlock failed. Native app rendering was therefore not inspected. This limitation is separate from the fake-audio probe timeout; the timeout's cause is not established.

## E026 — isolate fake-audio permission handling (2026-09-14)

- Repeated the isolated runtime probe with test-process-only Electron permission handlers. Fake-device switches are required; only this probe window and audio-only media requests can be granted. No product permissions or physical microphone settings are changed.
- The first handler required `details.mediaType === audio` during the preliminary check. Electron 26 omitted that field, the check was denied, and the request timed out (`reports/E026-fake-audio-permission.json`). This harness mistake cannot diagnose a production audio failure.
- The corrected handler allows an unspecified preliminary media type for the same fake-device window while retaining the audio-only final request check. The second probe still times out after model preparation, even though the preliminary media check is now allowed. No final permission request or acquired stream is observed (`reports/E026-fake-audio-permission2.json`). Correcting the harness check did not resolve the transport test; this remains an unresolved runtime test, not proof of an app acoustic failure.

- A separate read-only platform preflight reports macOS microphone permission as `granted` for this Electron executable (`reports/E026-platform-status.json`). It does not request or change permission. The final-source model-only check still resolves the intended profile and loads successfully; this does not resolve the pending audio request.

## E027 — explicit reviewed episodes and identifying-evidence scoring (2026-09-14)

- The previous scorer always returned null identifying-evidence latency and inferred episodes from adjacent Shabad IDs. It could not evaluate the user's exact evidence-based acquisition target or qualify natural transitions. Added optional explicit episode labels with canonical Shabad IDs, boundaries, natural/constructed/unknown entry type, nullable evidence timestamp and a separate scoped listening declaration.
- Validation rejects unknown IDs, overlapping/unsorted episodes, intervals beyond measured audio, verse intervals not contained in their matching episode, evidence markers outside labeled singing, and natural transitions without a preceding different Shabad. The validator never creates Bani or infers an evidence marker from model output.
- New `evidenceMetrics` retains all explicit attempts in its denominator. Missing timing or episode review is unassessable, with a null incomplete rate; zero transition examples do not pass. Natural and constructed transitions remain separate, and unknown entry kinds prevent a complete transition-rate claim. Cold starts cannot reuse evidence from before replay or count as followed source transitions.
- A page already correct at the evidence marker gets zero latency. An earlier correct guess that becomes wrong before the marker earns no evidence-based credit until the correct page returns. Seeking earns none. The existing descriptive first-labeled-sung-word metrics are retained and clearly named separately.
- Re-scored all 24 completed E020 native/baseline traces. Every prior numerical metric and acquisition result is unchanged, and all have `evidenceMetrics: null` because no reviewed episode markers were supplied (`reports/E027-historical-score-equivalence.json`). The new capability does not retroactively manufacture missing timing evidence.
- The local annotation UI now supports episode drafts/editing and explicit review. Browser verification imported the 15 existing IZO source segments unchanged, saved one draft episode with unknown entry type and null evidence, and added no listening declaration. The saved version remains `draft-needs-audio-review`. Three invalid server submissions were rejected with 422; the report is `reports/E027-annotation-verification.json`.
- The draft episode's broad boundaries were copied from the source reference extent solely to exercise the editor. It is not a newly checked audio label or transition. Current review tab is left on R01 (`live-BygbNxDF8-w`) with no labels or markers; the earlier tab is retained to preserve prior drafts.
- Eleven new focused cases cover timing, never-acquired/missing evidence, review scope, wrong/held/seeking pages, natural versus constructed transitions, unknown kinds, cold starts, invalid annotations and canonical identity. All 83 selected tests pass with zero skips (`reports/E027-tests.tap`). Script parsing and `git diff --check` pass. Product files did not change in E027, so the previous differential lint evidence remains applicable.
- **Trend: positive measurement and review integrity; recognition performance unchanged.** Real reviewed hall episodes, event independence, capture conditions and full-app testing remain outstanding. Neither declarations nor these tests prove independent audio-label quality or Level 2 achievement.

## E028 — isolate model/origin and test the actual worklet offline (2026-09-14)

- With native model initialization omitted, the file-origin fake microphone request still times out after 30 seconds. Switching to a loopback HTTP origin also times out. Reports: `reports/E028-file-no-model.json` and `reports/E028-http-no-model.json`. Neither experiment establishes the cause of the unresolved capture test.
- A separate OfflineAudioContext probe feeds two seconds of synthetic pink noise through the component's actual worklet. Both its existing unconnected output and an output connected through zero gain deliver all 15 complete chunks (30,720 samples), with zero input-prefix mismatches. Report: `reports/E028-offline-worklet.json`.
- This tests offline worklet processing, not getUserMedia, physical input, real-time scheduling or the full app. No production graph change is justified by these results. Native UI inventory still reports the Mac locked; microphone permission was independently reported granted. A causal connection between the lock and timeout is unproven.
- **Trend: positive isolation evidence; live capture remains unresolved.**

## E029 — constructed transition regression (2026-09-14)

- `make-transition-regression.py` concatenates four already-used reference excerpts, stopping at the first labeled boundary at or after 120 seconds, with three five-second synthetic silence separators. Total duration is 550.6 seconds. All source PCM spans match exactly; all 16 canonical label segments retain their source identity/text and receive only timestamp offsets. Reports: `reports/E029-construction-verification.json` and `reports/E029-canonical-audit.json`.
- Four episodes and three explicitly constructed transitions are supplied; identifying-evidence markers and new listening declarations remain absent. This creates no new independent events, natural transitions, audio approvals or training/release examples.
- Completed native baseline/E020 runs: correct coverage 22.04% → 49.86%; incorrect coverage 75.61% → 29.02%; seeking 0% → 18.76%. E020 reaches two next Shabads, at 45.104s and 41.804s after first labeled sung words, and never reaches the third. The baseline reaches none. Both have 0/3 transitions within 20 seconds of first labeled sung words; all evidence-based transition metrics remain unassessable. Report: `reports/E029-constructed-transitions/comparison.json`.
- Post-hoc switch diagnosis records canonical IDs, scores and times only. The second target leads full-text retrieval at 299.008s, but its first switch comparison is 313.856s. The backstop is empty for several intervening decodes, so an incumbent continuously blocking it is not established. Cache membership/pending IDs are absent from this trace; a cache-loading explanation needs direct instrumentation. Report: `reports/E029-constructed-transitions/switch-diagnostic.json`.
- **Trend: mixed.** E020 improves this regression relative to baseline but switching remains too slow and wrong coverage remains far above the release target. Parallel native runs are decision comparisons, not live compute-latency measurements.

## E030 — cancel obsolete audio setup and engine construction (2026-09-14)

- Twelve initial controlled cases fail before repair: late microphone/worklet completion or engine construction can install obsolete work after stop/restart. The pre-change component is preserved as `research/variants/E030-before-audio-cancellation.jsx`; red output is `reports/E030-audio-startup-red.tap`.
- Product audio setup now captures the session generation. A late microphone stream releases its tracks; obsolete worklet completion cannot publish a node; old callbacks and queued PCM cannot feed a restarted recognizer. Worklet URLs are revoked in finally, and microphone failures preserve their actual error message.
- All three startup modes publish newly constructed engines only in their current generation and ignore obsolete failures. Recognizer results also check generation and recognizer identity before entering detection. Existing follower/lock/model-readiness guards remain.
- The expanded 22 focused tests cover late microphone/worklet success and failure, constructor success/failure and queued PCM. All 105 selected tests pass without skips (`reports/E030-tests.tap`). Babel passes and differential component lint remains 29→29 with no added signatures (`reports/E030-lint-final.json`).
- **Trend: positive for reproduced lifecycle defects.** Controlled hooks do not verify live Electron rendering or physical capture. In-flight transcript queries remained an explicit gap at this point and are addressed separately in E032.

## E031 — prospectively re-test short following evidence in the E020 combination (2026-09-14)

- E029 reveals slow switches and one missed constructed transition. Initial diagnostic timestamps: expected 1821 first leads full-text retrieval at 190.464s and commits at 200.704s; expected 1341 leads at 299.008s but first enters the switch comparison at 313.856s, committing at 315.904s. Expected 3712 leads as early as 406.016s and earns a first comparison win at 414.720s but never commits. This points to both available-evidence and decision-path delays; it does not prove acoustic training is needed.
- Freeze E031 as E020 plus exactly E004's two following-only gate relaxations. Short first-letter strings and empty first-letter queries may reach the existing full-text fallback while already following. Initial acquisition and every numeric threshold remain unchanged. Generator: `make-short-follow-variant.js`.
- E004 alone previously increased wrong coverage in three of four source-group means; that negative result remains relevant. The combination is an unproven hypothesis, not a promotion or a new statistical claim.
- Predeclared first screen: the constructed transition regression and all four reference base cases, compared with completed E020 and original-baseline runs. If it survives, require all twelve offsets, negatives and uncached confirmation before considering promotion. Independent hall data and real transitions remain required regardless of these outcomes.

### E031 rejection after completed screen and native confirmation

- Four reference base cases compare against completed E020 native results. Correct/wrong coverage: IZO 96.59/0 → 95.71/0; kZh 81.49/0 → 58.69/19.95; kch 96.79/0 → 97.84/0; zOt 33.28/0 → 26.52/5.39. Initial acquisitions are unchanged. The E031 run directory also contains original-baseline scores; the explicit E020 comparison is `reports/E031-reference/comparison-with-E020.json`.
- Fully uncached kZh confirmation finishes cleanly and exactly reproduces all 33 ordered projection actions and audio timestamps from cached screening. Wrong coverage remains 19.95%, versus E020's 0%. Report: `reports/E031-native-rejection/verification.json`. This confirms that this regression is not merely cache scheduling in this case.
- On the constructed stream, E031 reaches all three next Shabads after 34.352s, 25.932s and 117.980s from first labeled sung words. Correct coverage rises from E020's 49.86% to 61.73%, but wrong coverage also rises from 29.02% to 32.87%. Still 0/3 switches within 20 seconds. The record-mode trace computes all 3,160 native calls; its disk/cache work prevents a live timing claim. Report: `reports/E031-constructed-transitions/short-follow-score.json`.
- **Decision: reject the simple short-follow gate relaxation; no promotion or expansion to twelve offsets/negative controls.** The paired regressions are sufficient to reject this candidate without claiming statistical generalization. Keep the narrower gate in product and E020. Independent reviewed hall data and genuine transitions remain essential for the release decision.

## E032 — prevent obsolete transcript-query completion after restart (2026-09-14)

- The transcript handler checked only whether recognition was currently enabled after database queries. A restarted session enables recognition again, allowing an old result to update its shortlist/status and associated state. Controlled delayed real BaniDB queries reproduce this in both autopilot and blind detection: two restart cases fail while two stopped cases pass before repair (`reports/E032-query-red.tap`).
- Product repair captures the session generation at transcript entry and checks it after the query await. The later backstop verse fetch also checks generation, recognition and contender identity before committing. The latter defensive guard has not yet been isolated with a controlled delayed-commit test.
- Four focused tests now pass, including the requirement that fresh queries still contribute evidence after restart. Test input is copied verbatim from a provenance-recorded canonical STTM fixture; no sung-audio assertion is made. Driver database hooks are optional and do not add an await to ordinary runs.
- All 109 selected tests pass, zero failures/skips (`reports/E032-tests.tap`). No recognition threshold, canonical text or experimental policy is changed. Final syntax/lint/diff verification is recorded separately.
- **Trend: positive for a reproduced session defect.** Remaining async profile/cache paths, manual content-load timing and actual Electron UX still need targeted assessment; this is not complete lifecycle certification or Level 2 achievement.

### E032 final verification

- Babel compilation passes. Differential component lint remains 29 baseline/current errors with zero added signatures; `git diff --check` passes (`reports/E032-lint-final.json`). An initial lint invocation used an unavailable legacy API; the corrected API found one new formatting error, which was repaired and rechecked. Product logic was unchanged after the 109-test pass.
- All E029/E031 replay and E028 runtime probe processes are complete. The local annotation server remains available. No model training, recognition-policy promotion, installed app rebuild, commit or publication was performed.

## E033 — observe candidate availability before changing selection (2026-09-14)

- Previous goal turn was progress: native rejection of E031, E032 query-cancellation repair and completed validation. No blocked/no-progress audit applies.
- The E029 trace cannot distinguish a cold profile cache from a skipped selection pass. Freeze E033 as E020 plus synchronous diagnostic events: phrase-gate decisions, every screened candidate's canonical ID, cache state, line-match score, banked wins and result under the unchanged switch test; include adoption key and incumbent state.
- No labels, expected IDs, thresholds, projection rules or Bani text are changed by instrumentation. No transcript text is copied into the new diagnostic event. The generated variant remains outside product.
- Predeclared run: the same complete constructed stream, using the exploratory emissions cache. Verify ordered projection actions and audio timestamps against the original E029 E020 native trace before accepting diagnostics as representative. Cache/instrumentation timings cannot support a live latency claim.
- Decide on a focused selection experiment only if the trace demonstrates a correct already-available candidate being skipped. Otherwise investigate the actual limiting stage; do not assume training or broaden the rejected short-phrase rule.

### E033 observation complete

- All 33 ordered projection actions and their audio timestamps exactly match E029's E020 native trace. The new trace finishes cleanly; 3,084 cached hits and 84 native calls. Timing is diagnostic only.
- The correct second transition candidate is absent at 299.008s and ready at 300.032s. From 300.032–306.176s, seven eligible decodes leave the slot empty because the search key is unchanged. The ready candidate is the best line match each time and passes the unchanged switch test on six of those decodes. Selection resumes only at 313.856s. This directly demonstrates a stale-key decision delay. Report: `reports/E033-backstop/analysis.json`.
- Other delays differ: at 194.048s and 195.584s an incumbent with zero accumulated wins prevents a better ready candidate from being considered; later evidence and confirmation also fluctuate. The third target often lacks sustained wins. Those observations are separate from the stale-key experiment.
- Of 963 following decodes, 722 are rejected by the phrase gate; this alone does not justify relaxing it, given E031's confirmed regressions. No Bani labels or audio-review declarations are created.
- **Trend: positive diagnosis; performance unchanged.**

## E034 — rescore a free backstop slot on each eligible decode (2026-09-14)

- E033 supports one focused change: E020's empty slot may rescore ready candidates even when its first-candidate/count key repeats. Hypothesis and completed profile loads can change without changing that key. Numeric thresholds, incumbent handling, initial locks, phrase gates and confirmation rules remain unchanged.
- Freeze `research/variants/E034-rescore-free-slot.jsx`. First screen: constructed transitions and four reference base cases, paired against E020. Completed native E020 traces are linked into `reports/E034-e020-baselines` under the runner's baseline filenames; source/model/audio fingerprints must match before reuse. These baseline filenames mean E020 in this experiment, not the original application.
- Predeclared continuation: reject or constrain on following/wrong-page regressions; if promising, expand to all twelve offsets and negatives, then require fully uncached confirmation. This development evidence cannot substitute for independent reviewed hall events, actual transitions or a locked release set.

### E034 base screen passed; expand validation

- All four reference base cases have unchanged correct/incorrect/seeking coverage versus E020. In the constructed stream, the second switch improves from 41.804s to 26.956s after first labeled sung words. Correct coverage rises 49.86% → 52.96%, wrong coverage falls 29.02% → 25.92%; the first switch stays slow and the third stays never acquired.
- Continue to the eight remaining correlated cold offsets and a fully uncached constructed-stream confirmation. No promotion is made on this screen. Concurrent runs compare audio-clock decisions only.

## E035 — negative controls while already following (2026-09-14)

- E034 changes only the following phase, so the existing cold-start negative controls do not exercise its changed branch. Construct three controls by appending the existing synthetic silence, pink noise or English announcement to the exact 135.4-second first reference prefix. Prefix and negative source hashes are checked and PCM copied unchanged. No labels or expected IDs are supplied to normal replay; acquisition must occur through the component.
- Post-replay scoring requires the expected prior Shabad to be acquired and visible at negative entry. Failed, wrong or seeking entry is unassessable, not a zero-false-switch pass. Every different Shabad commitment at/after entry counts; repeat commitments of the prior identity and seeking entries are reported separately.
- Four scorer tests cover false switches at the boundary, restoration, failed prerequisites, seeking and incomplete inputs. The three controls share one source prefix and are synthetic development controls, not independent hall events or a real-hall false-positive-rate estimate.
- Predeclared paired replay: E020 versus frozen E034 on all three controls, exploratory cache allowed, complete traces retained. If wrong-switch behavior worsens, do not promote E034. A promising result still needs native confirmation and independent real hall controls.

### Clarification of the early user-recording findings

- E002's wording about the passage containing Shabad 300 was stronger than the available audio labels justify. BaniDB verifies the canonical text and identity corresponding to the user's recollection; it does not verify when that Shabad is sung in the recording. The observed baseline fact is one commitment to 4898 and none to 300. Without reviewed audio boundaries, 4898 must not be labeled wrong for the whole clip, nor may recognizer match times become identifying-evidence truth.
- E003/E004 phrase-recovery times remain model/retrieval diagnostics. E004's commitment to 300 at 220.160s is a trace fact, not a reviewed correct-acquisition latency. This qualification preserves the original traces and supersedes stronger interpretations of that unreviewed example.

## E036 — replay newer candidates on the user's actual Darbar recording (2026-09-14)

- Return to the confirmed live recording with the latest frozen E020/E034 candidates. Replay the exact E002 WAV without labels or expected identities, using the exploratory emissions cache. Record every commitment and seeking change, plus full input/source/model fingerprints.
- Compare observational actions only. The user's remembered Shabad 300 is a canonical-identity search hint, not a checked label spanning this whole recording. No correct/wrong percentage, identifying-evidence latency, transition success or negative-control claim is permitted without reviewed audio intervals. This is a development case, not a new independent validation event.
- The aim is to check whether the changes remain relevant to the original live failure report and locate passages for later review, while retaining failures and unexpected results.

### E034 full offset screen: one additional recovery

- The final detailed comparison corrects the earlier progress message saying all twelve cases were unchanged. Eleven cases have exactly the same ordered projection actions and scores as E020. The last zOt cold66 case improves from 0% to 25.87% correct coverage, 29.83% to 18.37% wrong coverage and 14.44% to 0.02% seeking; it reaches the expected Shabad at replay time 76.800s. This cached improvement needs separate native confirmation, now being run.
- The constructed-stream native confirmation completes cleanly and exactly reproduces the candidate's cached projection actions and audio timestamps. Source/model/audio hashes match; no cache was enabled. Report: `reports/E034-native-constructed/verification.json`. This confirms the isolated switch improvement, not physical capture timing or a release KPI.

### E035 screening complete

- All six paired runs complete with a correct visible prior Shabad at negative entry. E020 and E034 each have zero false switches, zero repeat prior-ID commitments and zero seeking entries across the three synthetic negative tails. Prefix and tail PCM hashes independently match their source spans. Report: `reports/E035-following-negatives/summary.json`.
- These are cached screening results, not fully uncached confirmation or a real-hall rate. The unchanged early acquisition is exercised normally; no answer is injected. All 113 selected tests pass with zero skips (`reports/E035-tests.tap`), including the four new control-scorer cases. Product source did not change this turn; the E032 differential lint result remains applicable. Diff checks pass.
- **Trend: positive coverage of the changed following branch; no observed regression on these synthetic controls.** Independent real hall speech/instrumental/Simran/Katha controls remain missing.

### E034 native recovery confirmation and current decision

- The changed zOt cold66 replay finishes without the emissions cache and exactly reproduces the candidate's ordered projection actions and audio timestamps, including recovery to expected Shabad 3712 at replay t=76.800s. Input/model/component hashes match. Report: `reports/E034-native-cold66/verification.json`.
- Across all twelve cached reference cases, mean correct coverage is 71.87% and wrong coverage 1.53%, versus E020's 69.71% and 2.49%; first-labeled-sung-word acquisitions within 20s remain 5/12, and never-acquired falls 2/12 → 1/12. The eleven unchanged cases have exact action equality to E020 native traces. This is not a fully uncached twelve-case E034 confirmation: only the changed cold66 case and constructed stream have candidate native confirmation so far.
- **Decision: retain E034 as a promising frozen development candidate; no product-policy promotion yet.** Independent checked hall labels, real transitions, Level 1 preservation, remaining candidate native regression checks and physical capture/rendering remain outstanding. One structural selection repair cannot establish the full release target.

### E036 observational comparison complete

- Both E020 and E034 commit once, to Shabad 300 / verse 4134 at recording t=201.728s, with no seeking events. The original trace commits once to 4898 at 4.096s and never to 300; E004 had committed to 300 at 220.160s. All use the same WAV hash and duration. Report: `reports/E036-user-recording/comparison.json`.
- The newer two runs finish cleanly. Their result is relevant to the user's recalled canonical identity but is not a checked accuracy or latency score: no reviewed sung boundaries or identifying-evidence onset exist. The initial part of the recording cannot be declared correct, wrong, silent or instrumental from these traces alone.
- **Trend: positive observational relevance, unmeasured live accuracy.** No new canonical text, auditory approval, training data, independent event or release claim is created. All E033–E036 replay jobs are complete.

### E034 complete native reference confirmation started

- Previous goal turn made progress: E033 diagnosed selection skips; E034's two changed cases were native-confirmed, and E035/E036 added branch-specific controls and a qualified user-recording comparison.
- Run all twelve E034 reference cases without the emissions cache. Reuse the already completed native cold66 candidate and all completed native E020 baselines only after checking their runtime cache fields are null; the runner additionally validates source/model/audio fingerprints and completion markers. No live process is restarted or overwritten.
- The eleven remaining candidate traces will complete the native reproducibility check; this does not add independent recordings, reviewed episode timing or release evidence. Keep the frozen candidate unchanged during the batch.

## E037 — audit the live-rate input path omitted by 16 kHz replays

- Source inspection shows both native recognizer and follower call `resampleTo16k` on each worklet chunk. The app uses the AudioContext's actual rate, while all existing recognition replays supplied preconverted 16 kHz audio and bypassed that resampling branch. This is a benchmark coverage gap, not proof of the user's actual device rate.
- Controlled ten-second tones through the exact production resampler, in 2,048-sample chunks: at 48 kHz, 10/12 kHz input remains at only about −1.23/−1.76 dB relative RMS after downsampling, contaminating the output band. The output has 78 extra samples (4.875ms) per ten seconds from independent chunk rounding. At 44.1 kHz, corresponding attenuation is about −1.46/−2.07 dB and output has eight fewer samples. At 16 kHz, samples pass through unchanged. Report: `reports/E037-input-resampling.json`.
- These are deterministic signal-processing measurements, not Bani or recognition labels. The timing drift is small on this clip; no claim is made that it explains a delay of tens of seconds. The unfiltered high-frequency energy is a separate concern requiring recognition measurement.
- The original user recording is AAC at 48 kHz stereo. Decode it to mono PCM16 at the same 48 kHz rate and replay frozen E034 with the actual 2,048-sample input chunk size. This exercises the engine's live-rate resampling without changing weights/policy or the ongoing 16 kHz confirmation batch. Preserve input/source hashes and compare commitments to E036 only as unreviewed observations.
- Before choosing a repair, compare browser-native resampling and controlled input behavior. No production resampler change or acoustic-performance claim is made at this stage.

### E037 completed observations and browser comparison

- The native 48 kHz user-recording replay completes cleanly and commits to the recalled canonical identity at 202.240s, versus E036's preconverted 16 kHz commitment at 201.728s. No seeking entry occurs in either. That 0.512-second difference does not explain the reported long delay; no audio-accuracy claim follows without review.
- Electron's OfflineAudioContext/AudioBufferSource path does not provide the hoped-for filtering replacement: 48→16 kHz 10/12 kHz tones pass at approximately 0 dB. At 44.1 kHz the result resembles linear interpolation. Every complete worklet chunk arrives. This tests buffer playback, not the distinct live MediaStream resampling path, so no claim about that path is inferred. Report: `reports/E037-browser-resampling.json`.
- The [Web Audio specification](https://webaudio.github.io/web-audio-api/) allows implementation choices in buffer resampling; the observed result is from this Electron version. Do not assume requesting a 16 kHz context alone fixes the microphone path without testing it.

## E038 — isolated filtered streaming input converter

- Prototype a causal, stateful FIR converter in test tooling only. It uses a Blackman-windowed sinc, cutoff at 90% of the lower Nyquist limit, approximately 2.65ms declared delay at 44.1/48 kHz, bounded fractional-phase coefficients and a cumulative sample clock. It leaves 16 kHz inputs exactly unchanged. These are signal-design choices, not parameters tuned against Bani labels.
- Filtering before downsampling is the established approach illustrated in the [SciPy polyphase-resampling documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.resample_poly.html). This custom causal implementation is not SciPy's zero-phase algorithm and must be tested independently.
- Seven tests pass: exact chunk-partition invariance/sample counts at 44.1/48 kHz, passband tones within 0.1 dB through 6 kHz, suppression at 8/10/12 kHz exceeding 55 dB, declared impulse delay under 3ms, exact 16 kHz pass-through and invalid-rate rejection. Full tone/timing reports compare both converters with identical RMS edge exclusion.
- Keep production engines and the running reference harness unchanged. A separate native wrapper compares original versus filtered conversion on the same 48 kHz user WAV. Its original mode must reproduce the standard E037 replay's projection actions before the changed mode can be interpreted. No labels are supplied; this unreviewed example cannot prove recognition accuracy or justify a release claim.

### E038 signal and native comparison complete

- With matched steady-state RMS measurement, the experimental converter suppresses 10/12 kHz tones by over 100 dB at 44.1/48 kHz and has exact cumulative output counts for the ten-second fixtures. Filtering consumes approximately 50–56ms for those ten seconds in this single CPU probe; this is not an application latency result. Reports: `reports/E038-streaming-resampling.json` and `reports/E038-original-resampling.json`.
- The wrapper's original mode exactly reproduces all nine standard E037 projection actions; model, source and audio hashes match. The filtered 48 kHz path commits to Shabad 300 at 201.728s versus 202.240s unfiltered. It has seven rather than nine projection actions overall; line-following accuracy cannot be decided without checked verse timing. No accuracy or identifying-evidence latency is reported. Report: `reports/E038-darbar/comparison.json`.
- **Decision: keep the converter experimental.** Signal integrity improves, but one unreviewed recording and a half-second commitment difference do not establish hall recognition benefit. Broader capture-rate and checked-audio comparisons are required before changing production engines.
- The exact converter used for the traces is retained at `research/variants/E038-streaming-resampler-before-compatibility.js`. Subsequent changes only accept Float32 PCM from another JavaScript realm and correctly report zero delay for the 16 kHz bypass; filtering calculations are unchanged. Analytic waveform-phase and cross-realm tests bring focused converter coverage to ten cases. All 123 selected tests pass without skips (`reports/E038-full-tests.tap`).

## E039 — preparation work must not block the renderer

- A separate Node main-thread probe of the experimental full-corpus index measures 10.93s corpus extraction and 2.39s index construction, with maximum event-loop delay about 13.97s. This was one probe during concurrent inference, not a statistically established STTM UI delay. Report: `reports/E039-index-startup.json`.
- A worker-thread prototype opens the canonical database read-only, builds the same index and returns only candidate IDs/scores. It finishes preparation in 6.35s in its separate run while the main-thread delay remains about 13.1ms. Different background load prevents interpreting total preparation times as a controlled speedup.
- All 439 saved E003 query results exactly match in candidate order, Shabad/verse IDs and scores. Mean query round trip is 5.30ms, p95 12.56ms in this probe. No label or unverified transcript text is promoted to canonical Bani. Report: `reports/E039-index-worker.json`.
- **Decision: use this as integration evidence for off-thread preparation, not a shipped feature or full-app validation.** Adapting the component to asynchronous search still requires session cancellation, failure handling, startup and packaging tests. Product files and the active frozen native reference batch remain unchanged.

### E035 native following-control confirmation started

- Repeat all six E020/E034 following-control runs without the emissions cache into a new report directory. Preserve the completed cached traces and compare later; normal acquisition remains a prerequisite. These jobs run alongside remaining reference confirmation, so compare audio-clock actions and false switches only, not live compute latency.

### E034 complete native reference confirmation finished

- All twelve candidate cases complete, including the reused earlier native cold66 case. Every ordered Shabad/verse/seeking action and audio timestamp exactly reproduces the cached screen. Source/model/audio/database/support and loaded driver fingerprints match. The runner exits cleanly; no new native shutdown warning occurs. Report: `reports/E034-uncached/verification-complete.json`.
- Metrics remain 71.87% mean correct coverage, 1.53% wrong coverage, 5/12 first-labeled-sung-word acquisitions within 20s and 1/12 never acquired. Four recordings and correlated offsets remain the entire reference population; reviewed identifying-evidence timing and genuine transitions are still missing. No statistical or Level 2 release claim follows.
- Compute-clock scores in this concurrent verification batch are set to null. Historical original traces remain intact. The separate six-run native following-control confirmation is still active and must be checked through its existing process handle; do not restart it on an observation timeout.

### E035 native following-control confirmation finished

- All six native E020/E034 runs finish cleanly and exactly reproduce their cached Shabad/verse/seeking actions. Input, component and model hashes match; no inference cache is enabled. Each enters the tail with the expected acquired page, and each has zero false switches and zero seeking entries. Report: `reports/E035-following-negatives-native/verification-complete.json`.
- This completes the currently planned E034 native reference and E035 native following-control confirmations. E037–E039 signal, wrapper and worker probes are also terminal. The annotation server remains available; no replay job needs restarting or further waiting.
- **Trend: positive reproducibility and engineering evidence, not Level 2 achievement.** Independent checked hall labels, actual transitions, live input/projection validation and runtime integration remain outstanding. No model training, production-policy promotion, application rebuild, commit or publication was performed.

## E040 — actual Electron integration rejects the Node-worker route

- The preceding goal turn only reiterated the canonical-source rule; it added no new Level 2 evidence. This turn resumes the available software integration work while independent audio review remains pending.
- Extract the unchanged E034 full-corpus search algorithm into self-contained modules. Index responses expose only canonical Shabad/verse IDs and scores. Add bounded requests, preparation/query deadlines, per-request aborts, owner replacement, renderer navigation/crash cleanup and explicit process disposal. No generated text becomes a display or label.
- The first real Electron 26.6.10 renderer probe fails immediately with `ERR_MISSING_PLATFORM_FOR_WORKER`: this renderer's V8 platform cannot create Node worker threads. The earlier Node-only success was insufficient. Reports: `reports/E040-electron-worker.json` and `reports/E040-electron-worker-diagnosis.json`.
- Starting the worker from Electron's main process and relaying via IPC initially succeeds: all 439 saved E003 queries exactly preserve IDs/order/scores, a separate renderer Realm handle stays usable, and native ONNX inference runs afterward. Babel output and an ASAR containing service JavaScript both work. Native dependencies still resolve from the checkout; this is not full signed-app packaging certification.
- **Critical rejection:** a subsequent native startup-cancellation probe aborts the entire Electron process with exit 134 and an uncaught `Napi::Error`. The final JSON was not written. Do not infer the exact failing delay or native call site from the absent report. Preserve the observed failure in `reports/E040-native-cancellation-failure.json` and the tested compiled source in `.runtime-build-E040-service.asar`. The earlier 145 passing tests and steady-state runtime success did not cover this native teardown failure.
- **Decision: reject Node workers as the production transport for this corpus service.** An isolated helper is required so native failure cannot abort the presenter. App registration and VoiceFollow decision integration remain untouched.

## E041 — isolated utility-process retrieval service

- Use Electron's utility process from the main process, with the same read-only corpus extraction and E034 retrieval math. Renderer messages cannot choose an executable or database path. Only the configured presenter's main frame is accepted; session tokens prevent a late close/search from affecting a replacement owner. A helper cancellation preceding spawn is retried on spawn, and disposal waits for an actual exit with a bounded timeout.
- The API and message/termination behavior are checked against [Electron 26.6.10's utility-process documentation](https://raw.githubusercontent.com/electron/electron/v26.6.10/docs/api/utility-process.md). Native loading restrictions/entitlements for a fully signed application remain unverified; no entitlement relaxation is introduced.
- Native ASAR-path probes cancel pending readiness and searches at requested delays of 0, 25 and 250ms, then create a fresh service and run all 439 saved queries. The final source completes all three cancellations with zero pending requests, matches every query result exactly, retains a usable renderer database handle and executes native inference afterward. The Electron process exits 0, and the final log contains no warning/error lines. These chosen delays are lifecycle regressions, not independent acoustic events or comprehensive crash certification.
- Normal stop/replacement now returns a terminal IPC marker, avoiding Electron error logs for expected cancellation. Actual preparation failures still reject. All 148 selected tests pass with zero skips, including 25 transport/lifecycle tests. All seven added retrieval modules have zero ESLint errors/warnings and compile with the repository Babel configuration. Reports: `reports/E041-electron-utility-final.json`, `reports/E041-full-tests.tap`, `reports/E041-retrieval-lint.json`, and source/archive fingerprints in `reports/E041-verification.json`.
- **Trend: positive runtime integration evidence after rejecting a crashing approach; no new hall-accuracy evidence.** The service modules are preparatory: app.js has not registered them and VoiceFollow still uses its baseline retrieval. Next connect this service to the candidate's asynchronous decisions while preserving canonical display and existing session guards, then test paced replay and actual capture/rendering. Level 2 is not achieved. No training, commit, publication or full-app rebuild occurs.

## E042 — connect isolated retrieval to Voice Follow decisions

- The previous turn made progress: E040 exposed a native cancellation crash and E041 established an isolated utility-process replacement. Connect that service to the actual component and register it in app.js for the presenter main frame. Preserve canonical display strings and every earlier audio/follower/model session guard.
- Port the frozen E034 mechanisms without changing numerical evidence thresholds: full-text candidate retrieval, unique-leader agreement for initial acquisition, reconsidering loaded profiles when the backstop slot is empty, the corrected best-score comparison, and restoration from seeking when the current Shabad clearly regains the comparison.
- Prepare the corpus concurrently with capture startup. Each decode carries session, sequence, phase and current-Shabad guards; superseded searches are aborted locally. Stop/unmount disposes the owned helper, resets the cache and prevents late preparation from becoming the new session's index. Profile-load completion checks both cache and placeholder identity so eviction/restart cannot be undone by an old callback. Failures back off and hold automatic acquisition rather than using an unchecked result.
- Nine new component tests exercise initial-result stop/restart, out-of-order decodes, following-result Shabad replacement, tied leaders, late preparation, preparation failure, obsolete failure versus new readiness, and old profile-load completion. The complete selected suite passes **157 tests with zero skips**. Lint remains 0 app.js errors and 29 existing component errors, with no added signatures. Babel compilation and diff checks pass. Targeted compiled component/model-manager/helper files are updated; previous compiled component/manager files are backed up. This is not a full signed-app build or visual check.
- Two fully uncached native inference replays exactly preserve E034's ordered projection actions and audio timestamps: difficult zOt cold66 (6 actions) and the 550.6s constructed-transition stream (33 actions). Their input/model hashes match. The constructed stream retains the same three commitments, including the same delayed switches and missed final transition; this integration has not fixed those recognition limitations. A twelve-case cached regression screen has started against the previously native-confirmed E034 traces; its completion and all-case comparison remain to be checked through the existing runner handle.
- The combined real Electron probe now runs the actual component, real database queries, native engine construction and actual helper IPC together. React rendering and microphone input are still mocked. One probe initially failed because its own cleanup released the same native inference session twice; the driver call was corrected without changing production behavior. A second correctly held an ambiguous canonical input, exposing an incorrect uniqueness assumption in the test. Both failed artifacts are retained.
- **Canonical ambiguity verified directly:** Shabad 300 / verse 4132 and Shabad 4093 / verse 48817 are distinct canonical source texts which tie under the internal base-letter search. No spelling is changed or merged. The user's Romanized recollection alone does not uniquely select one Shabad. The original canonical verification note is qualified accordingly; see `reports/E042-canonical-ambiguity.json`. This is further reason to review actual audio and identifying-evidence timing rather than infer labels from recollection.
- The corrected combined probe verifies that the tied input does not project automatically; subsequent distinguishing canonical context permits Shabad 300 acquisition. Stop/restart releases both helpers with zero pending requests and exit codes 0. Report: `reports/E042-electron-component-verified.json`. Its injected canonical inputs are controlled policy evidence, not audio recognition or a new checked recording.
- **Trend: positive integration with no observed regression in the two native cases; representative live-hall reliability remains unproven.** Source and verification details: `reports/E042-integration-verification.json`. Actual paced input, microphone/rendered UI, a locked independently reviewed release set, Level 1 and natural-transition validation remain outstanding. No training, commit or publication.

### E042 reference integration screen finished

- All twelve integrated candidate cases finish cleanly. Every ordered Shabad/verse/seeking action and audio timestamp exactly equals its frozen E034 comparison, and audio/model/database hashes match. The screen uses the exploratory inference cache; two targeted E042 cases also have separate fully uncached confirmation. No twelve-case uncached E042 claim follows.
- Mean correct coverage remains 71.87%, wrong coverage 1.53%, first-labeled-sung-word acquisitions within 20s 5/12, and never-acquired 1/12. These are the same four recordings/correlated offsets, still without reviewed identifying-evidence timing or real transitions. Report: `reports/E042-reference/verification-complete.json`.
- All E042 replay, Electron and test process handles are terminal. The reference runner exits 0, and no new native shutdown warning occurs. The integration preserves the candidate behavior while adding real helper IPC and cancellation guards; it does not establish new hall accuracy or fix the remaining delayed/missed cases.

## E043 — real-time PCM delivery with the actual Electron helper

- Previous goal turn made progress: E042 integrated retrieval and preserved all twelve settled reference cases. The next fidelity gap is that settled replay pauses for database/profile work between chunks, hiding contention. Add an independent main-process PCM producer paced by a monotonic clock, delivering through IPC without waiting for renderer inference or decisions.
- The renderer runs the actual component, native recognizer/follower, real Realm queries and utility-process retrieval. Record projection wall times, PCM sequence/sample/hash integrity, delivery and completion delay, unfinished audio (including the chunk currently processing), helper query duration and wall-versus-monotonic clock continuity. Track asynchronous transcript decisions only for final draining; delivery never awaits them. Model initialization precedes playback; retrieval preparation overlaps playback. React rendering and physical microphone/worklet transport remain mocked.
- A five-second smoke test receives/completes all 40 chunks and 80,000 samples with exact float-PCM hash equality and clean helper/process exits. The existing selected suite still passes all 157 tests without skips after the driver extension.
- The 135.4-second reference prefix receives/completes all 1,058 chunks and 2,166,400 samples unchanged. Maximum unfinished audio is 0.256s; maximum delivery delay is 0.099s and completion delay 0.235s in this one run. Helper preparation completes at 2.790s of the playback clock. Maximum clock-continuity deviation is 1.2ms. The same ordered projection identities appear as in settled E042, with initial Shabad selection at wall t=11.473s versus settled audio t=11.264s. Reports: `reports/E043-paced-prefix.json` and `reports/E043-prefix-comparison.json`.
- On this clipped source-labeled singing interval, correct coverage is 90.17% paced versus 90.35% settled, with zero wrong coverage. These are the same previously used source words/labels, not independent validation. The clip remains below the correct-coverage goal, and identifying-evidence timing is still unreviewed. Small processing delay is not proof that recognition is adequate.
- Start the difficult cold66 case with the same producer to exercise competing candidates and recovery under real cadence. Its result remains to be checked through exec session 54474. Native UI access was freshly attempted through CUA and reports the Mac locked; this is separate from the earlier fake-microphone timeout. Both canonical review tabs are retained without declaring any audio reviewed. An optional unlock request is pending while independent tests continue.

### E043 cold-start and adverse control finished

- The 95.6956s cold66 run receives and completes all 748 chunks / 1,531,129 samples unchanged. Maximum unfinished received audio is 0.256s; maximum delivery/completion delay is 0.227s/0.355s. All helpers and the Electron process exit cleanly. The same six projection identities occur in order, including the known incorrect first choice and later recovery.
- Timing is not a constant offset from settled replay: first commitment occurs at wall 33.544s versus audio 33.280s; seeking starts at 75.698s versus 76.288s; recovery occurs at 76.714s versus 76.800s. Do not claim an 86ms recognition gain: the execution/clock conventions differ, and asynchronous scheduling can change when comparisons run. Source-labeled correct coverage remains 25.87%, while seeking versus wrong/unacquired time shifts slightly. The core recognition failure remains. Reports: `reports/E043-paced-cold66.json` and `reports/E043-cold66-comparison.json`.
- Verify the benchmark itself with a one-second injected renderer stall at playback t≈2s in the five-second smoke input. The independent producer still finishes in about 5s with maximum dispatch delay about 10ms; the renderer reports maximum receive delay 0.956s and completion delay 0.997s. All 40 chunks / 80,000 samples are preserved. This confirms the observer detects a real renderer stall instead of slowing the input clock to hide it. The unfinished-audio counter includes received PCM in flight; IPC messages still awaiting renderer dispatch are captured by delivery/completion delay, not that counter.
- Freeze the exact pre-control harness used for the two full cases at `research/variants/E043-paced-replay-before-stall-control.js`; current tooling adds only the optional deliberate-stall control and explanatory metadata. All input/source/helper hashes are retained and checked. Verification: `reports/E043-verification.json`.
- **Trend: positive for measured scheduling fidelity and absence of a large backlog in these two runs; unchanged evidence of inadequate recognition on the difficult case.** No production recognition/audio/UI change or training experiment is justified by these timing observations alone. All E043 replay/test process handles are terminal. Physical capture, rendered UI, longer real-time transitions and independent reviewed hall data remain outstanding.

## E044 — remove an unsupported recollection label and audit dataset relationships

- The dataset registry still contained `expected_shabad_ids: [300]` despite E042's canonical ambiguity finding. Preserve the prior registry and remove that field. Retain both verified candidates as hints only, and correct the Level 2 plan's singular wording. No canonical text is edited or reconstructed.
- Freshly query the read-only STTM corpus: both candidate texts and Shabad memberships exactly match E042's saved canonical rows. Save database/schema fingerprints and the prior-field detection in `reports/E044-verification.json`. This verifies source text, not audio content or timing.
- Add `test/voice-follow/dataset-audit.js`: fingerprint registry/acquired inputs; reject unscoped expected IDs, unknown splits, malformed lineage, duplicate IDs and missing recording groups. Conservatively join recording/video/event/hash/derivative relationships and flag protected split overlap; check release venue/performer exposure. Missing metadata remains explicit. The tool does not approve labels or infer independent events, and cannot detect omitted lineage/exposure history.
- Actual inventory: 13 recordings, 13 known relationship clusters, zero errors after correction and 64 metadata warnings. All sources remain development/regression. These counts do not establish 13 independent events, checked live audio or a release set. No recognition/model/policy changes.
- Initial nine inventory plus six canonical tests passed. Add an unknown-split edge case and explicit limitations; final ten inventory plus six canonical tests pass with no skips, retained in `reports/E044-tests.tap`. Final inventory report: `reports/E044-dataset-audit-final.json`. Earlier output retained.
- **Trend: positive for evidence integrity, unchanged for recognition.** Next evidence work remains checked source categories, capture provenance, canonical sung intervals and identifying-evidence timing on broader hall recordings. No training, commit or publication.

## E045 — enable content audits without forced canonical labels

- Previous turn made progress by correcting the ambiguous user recollection and adding inventory checks. Inspection now confirms the review server rejected empty verse arrays, preventing content-only review of the preselected live excerpts.
- Add a separately validated content-category layer and version 3 saves. Content-only review files can have no verse segments, but the canonical scorer remains strict. Review methods and status distinguish content review from canonical/episode review. Text/identity injection, invalid timing, category overlaps and contradictions with sung-verse labels are rejected. No gap is filled automatically.
- Add/edit/listen/remove controls for category intervals, defaulting to uncertain drafts with review unchecked. The shared reviewer field is available above the content track. Changing recording clears content through the existing draft confirmation; importing verse references preserves the separate content layer. Bani remains exact, read-only canonical data.
- All 29 focused tests pass: 12 new content/review tests plus the existing canonical/episode checks. Six HTTP cases on an isolated five-second synthetic silence fixture verify content-only reviewed-format serialization, legacy verse drafts and four rejected requests creating no files. Synthetic reviewer declarations are test data, never actual hall labels.
- Through the browser, add 0–2s uncertain content with no verse or review declaration, save, inspect the version 3 file and edit layout. No actual audio-listening claim is made. Synthetic test files remain in `reports/E045-review-probe/`, outside the real inventory.
- Verify old annotation server handle 77260 live, then stop it cleanly and start the updated server on the same port. New handle 54696 confirms 13 recordings and canonical DB/schema hashes. Both older draft tabs are preserved without reloading. New tab 4 is ready on R01 with all labels/review declarations empty. The isolated port 8766 probe (handle 32996) is stopped cleanly after testing.
- **Trend: positive evidence-collection capability; no recognition gain measured.** Categories alone do not establish correct projection behavior (particularly spoken Bani/Simran), independent events, checked Bani or release readiness. No training, production recognizer change, real audio label, commit or publication.

## E046 — sustained paced transitions expose decision differences

- Previous goal turn improved the content-review workflow. Revalidate the current worktree, then run the full 550.6s constructed-transition input through the unchanged E043 wall-paced Electron harness. Native UI inspection through CUA still reports the Mac locked; the earlier unlock question remains pending. Existing review tabs are retained.
- First replay handle 44627 exits 0. Every one of 4,302 chunks / 8,809,600 samples matches the expected PCM hash. Producer duration is 550.6016s and maximum dispatch lateness 20.6ms. Maximum receive delay is 0.131s; maximum completion delay 0.259s (p95 0.157s). Maximum unfinished received audio is 0.256s. All helper clients close with zero pending requests and exit 0. No model warm-up or actual microphone/React rendering claim follows.
- `reports/E046-compare.cjs` verifies source/model/audio/database equivalence, the previously canonical-audited label hash, full PCM integrity and clean helper teardown. It scores paced wall and settled audio clocks separately. Comparison: `reports/E046-comparison.json`.
- The full action sequences differ: paced 31 projection actions and four commitments versus settled 33 actions and three commitments. Initial acquisition is wall 11.480s. Constructed-transition latencies from first labeled sung words are 39.292s, 26.871s and 74.366s; settled values are 45.104s, 26.956s and never acquired. Thus the final transition eventually recovers under this paced execution, but all three remain over 20s.
- Correct coverage rises from settled 52.96% to paced 68.73%, wrong coverage also rises from 25.92% to 28.65%, and seeking falls from 18.76% to 0.22%. This is a mixed execution-path difference, not a trained-model gain, independent trial or evidence-based Level 2 score. Four known recordings/three synthetic transitions remain the entire source set.
- Start a second unchanged 550.6s paced run to assess scheduling repeatability after the newly observed action divergence. Output target: `reports/E046-paced-constructed-repeat.json`; result pending. Do not restart just because a polling interval expires.
- During the run, inspect the old 86-minute parquet provenance: the existing plan already correctly identifies automatic labels/review flags and a timing mismatch. Its historical claims of 116 real transitions remain unverified; no labels are promoted.
- Candidate-display audit on the existing settled trace counts 139 `setSwitchView` comparison updates, 113 with no accumulated wins and 88 changes between candidate identities. Code renders this card whenever the view is non-null. This is evidence of speculative state churn, not measured browser flicker or false projection; actual UI inspection remains necessary. Artifact: `reports/E046-candidate-display-audit.json`.
- **Trend: positive sustained runtime, mixed decision behavior; Level 2 not achieved.** No production source, recognition threshold, model weight or label changes. No training, commit or publication.

## E047 — repeat paced transitions and locate the first window divergence

- Previous turn made progress: sustained real-time delivery completed, but projection decisions differed from settled replay. Poll the exact repeat handle 1542 until terminal; never restart it during observation timeouts. It exits 0 with all 4,302 chunks / 8,809,600 samples unchanged, zero helper pending requests and exit 0.
- The repeat preserves all 31 projection identities and every transcript hash/confidence value from E046. Maximum corresponding action-time difference is 20ms. Completion delay peaks at 0.241s (p95 0.156s), unfinished received audio at 0.256s. Correct/wrong coverage remains 68.73%/28.65%; constructed first-sung transition latencies are 39.289s, 26.881s and 74.373s. Evidence-based/natural-transition metrics remain unavailable. Report: `reports/E047-paced-repeat-comparison.json`. Update the earlier verification's pending repeat to completed.
- Compare earlier paced E043 prefix to E046: all first 242 transcript hashes and confidence values match, with at most 34ms timing variation. This supports investigating the systematic execution-mode difference before assuming acoustic-model randomness. Artifact: `reports/E047-existing-paced-prefix-comparison.json`.
- Inspect the component: acquisition replaces the recognizer with a fresh four-second buffer after asynchronous profile/follower preparation. Add an opt-in `--trace-recognizer-inputs` diagnostic to settled and paced harnesses. It observes generation/options and hashes the exact PCM input to native recognition without changing buffers, decoding or rules. Synchronous hashing is explicitly not zero overhead. Freeze prior driver/replay/paced sources before editing and verify the frozen hashes against E046. Product source remains unchanged.
- All 17 targeted component lifecycle/retrieval tests pass with zero skips (handle 11553, exit 0). Run native uncached 30s settled (54643) and paced (13617) input-window probes only after the full repeat finishes. Both exit 0; paced delivers all 235 chunks / 480,000 samples exactly and closes its helper cleanly.
- Window matching finds all 112 windows uniquely in the exact source PCM. The first 21 are identical. Generation 2 begins with source 11.264–12.288s in settled mode versus 11.392–12.416s in paced mode; every compared second-generation window has a 128ms offset. The first transcript-hash divergence follows this input divergence. This proves an early window-alignment difference, not sole causation of all later behavior. Reproduction script/report: `reports/E047-window-alignment.cjs` and `.json`.
- Observer controls: the settled diagnostic reproduces all 53 prior-prefix transcript hashes/confidence and projection identities/audio times; paced reproduces its prior 53 transcript hashes/confidence and projection identities. No new Bani labels, source text, model weights or thresholds. Verification: `reports/E047-verification.json`.
- **Trend: positive diagnostic confidence; no new recognition gain.** All E046/E047 processes are terminal. Two paced executions of the same four-source constructed stream cannot establish independent-event performance, identifying-evidence latency or natural-transition reliability. The next evidence work must retain paced validation and broaden checked hall data; rendered UI/capture remains unresolved. No training, commit or publication.

## E048 — stabilize the speculative following panel

- Previous turn made progress by confirming paced repeatability and identifying a 128ms recognition-window shift. Return to the user's UI complaint, using the E046 candidate-state audit as a concrete lead.
- Add a local visual fixture that mounts the actual component in installed React with application CSS. Controlled states select exact canonical rows freshly read from local STTM; there is no audio, inference, real Redux/navigation or projection. This fixture cannot substitute for a full desktop/microphone test.
- Browser inspection before editing shows a zero-win candidate adds a speculative card and grows the panel from 264.02px to 357.64px. Across seven states (following, candidate A/B at zero wins, one win, two wins, zero wins, following), height reaches 374.44px and visible text changes five times. Canonical candidate identities change without accumulated confirmation.
- Change only the JSX following block: remove the speculative candidate line/progress card, reserve two lines for the status cue, and keep ordinary zero/one-win candidate updates visually quiet. Two wins change the cue to checking a Shabad change. Recognition, retrieval, evidence counters, projection, canonical text and initial detection choices are unchanged.
- Repeat the exact visual sequence: panel height remains 282.02px throughout, candidate text never appears in the following block, and visible text changes only twice. The first four states have identical visible text. Browser checks also verify Collapse, pill expansion and Stop. These are controlled UI measurements, not statistically representative live flicker or recognition results. `reports/E048-visual-measurements.json`.
- Source audit confirms all bytes before the JSX return and exports after the component are identical to the frozen before-source. All 179 selected tests pass (49358 exit 0), no skips. Lint remains 29 existing errors with zero added signatures (73939 exit 0). Targeted Babel compilation and diff checks pass. Before-source and before-compiled files are frozen under `research/variants/E048-before-quiet-panel*`. Verification: `reports/E048-verification.json`.
- Visual server 48158 remains live on port 8767 for comparison; before/after tabs are retained, alongside the untouched review drafts. The preview explicitly labels its limited scope. No recognition replays are rerun merely to test a render-only change.
- **Trend: positive panel stability in the reproduced scenario, recognition unchanged.** Full native UI/capture is still unverified, and the actual Level 2 accuracy/transition requirements remain unmet. No model training, commit or publication.

## E049 — test manual-following preservation on the existing references

- Previous turn made progress by stabilizing the following panel. Audit the outstanding Level 1/following requirement. Historical clean-set notes point to the same four public references, not a new verified capture stratum. The available extra audio is title-labeled, so it is not promoted into checked Level 1 evidence.
- Add explicit manual mode to the existing replay CLI. `--mode manual --shabad-id ID` selects the operator's Shabad before playback and calls the actual manual-follow entry point. Default autopilot rejects a supplied Shabad to prevent hidden answer injection. No expected verse/timing labels enter replay. Product source/engine are unchanged.
- Freshly validate all 61 reference verse intervals against the read-only local STTM corpus. Save IDs, audio/label/database hashes, durations and limitations in `reports/E049-manual-following/manifest.json`. Preserve the current product source at `research/variants/E049-manual-current.jsx` and prior replay script separately.
- Add exact manual-follow scoring using the existing interval scorer but returning only verse-selection time. No automatic acquisition/Shabad-switch KPI is reported. The initial displayed verse remains unknown; unobserved follower selection earns no correctness credit. Five tests cover this distinction, gaps, boundaries, offsets and invalid task/identity input. All 184 selected checks pass, zero skips (test handle 19972 exit 0; `reports/E049-tests.tap`).
- Start eight sequential native runs (baseline/current on each of four whole recordings), with no prediction cache, through batch handle 85779. Each child writes a unique trace/log and terminal exit status; no restart is justified by a quiet observation interval.
- First pair finishes: 1,277 follower outputs and all 18 verse actions/audio times are identical. Source-labeled correct-verse selection is 94.0463%, incorrect 5.0705%, and no follower selection yet 0.8832% in both. Initial Shabad setup is supplied, so this is preservation of known-content following, not initial discovery success. `reports/E049-manual-following/first-pair-screen.json`.
- Remaining three pairs are still running. Final comparison script checks all eight exit codes, source/model/audio/database/driver fingerprints, uncached mode and exact events before producing the aggregate. Keep the current component unchanged until the runner completes. No all-case or new-word-accuracy claim yet.
- **Trend: positive initial regression preservation; Level 1/2 certification remains unproven.** No new source recordings, training labels, model changes, commit or publication.

### E049 completion

- The same native batch 85779 finishes all eight cases with exit 0. The final comparison passes frozen source, actual model/driver, audio/label, schema/support, explicit preset identity and complete unique case checks. No product source changed while the batch ran.
- All 80 verse actions/audio times and 3,712 follower outputs/audio times per version match exactly across four pairs. Duration-weighted verse selection over 1,407.5 labeled seconds is 90.11% correct, 9.10% incorrect and 0.79% with no follower selection yet, in both versions. Per-recording correctness spans 82.99–94.05%. Preservation does not imply sufficient absolute following accuracy.
- Final artifacts: `reports/E049-manual-following/comparison.json`, updated `reports/E049-verification.json`. The 184 selected tests remain passing; no replay/production changes justify rerunning the unchanged suite.
- Packaging inspection remains read-only: earlier ASAR probes depend on checkout-native modules; configured extra resource `data.db` is absent from this checkout. No full packaged build was attempted and no packaging success/failure is inferred.
- Updated the status summary and next-work list to reflect completed paced runs and avoid presenting settled and paced results as equivalent. Reviewed representative hall audio and evidence timing remain the highest-return missing evidence.
- **Trend: positive preservation; Level 2 still unproven.** Same four reused references, not additional independent events or certification. No training, commit or publication.

## E050 — inspect recorded paced comparison leaders

- The previous turn completed four native manual-following pairs and confirmed preservation. Inspect the saved complete paced trace before selecting another experiment.
- The expected Shabads first appear as recorded shared comparison leaders 35.167s, 26.378s and 73.364s after first labeled sung words. Commit follows 4.125s, 0.493s and 1.002s later. Only the shared leader is observed, commits return before logging, and short holds can retain prior scores; this does not establish earliest retrieval availability or every gate.
- Report `reports/E050-paced-leader-diagnostic.json` preserves source hash and limitations. This makes confirmation-count relaxation a lower-priority lead than recognition context for a bounded next test. It does not prove an acoustic-model defect. No product/model/label changes.
- **Trend: positive diagnostic focus, recognition unchanged.**

## E051 — bounded longer-context experiment (in progress)

- The following recognizer uses a four-second window while initial search uses ten seconds. Test one isolated variant using ten seconds during following, retaining all model weights and evidence gates. Only the constant differs from frozen E042 source; Babel parsing passes. Product component is unchanged.
- Predeclare one complete paced constructed-stream screen, comparing against two existing repeatable baseline runs. Longer context might help sparse sung fragments but could also retain stale content or increase false decisions and computation. Plan/fingerprints: `reports/E051-plan.json`.
- If promising, require matched repeat and reference/negative/following checks before integration. If worse or unable to keep pace, reject this variant rather than tune further on three constructed transitions. No independent-event, reviewed-evidence or representative reliability claim.
- Native paced E051 process starts and is confirmed live through handle **65661**. At 60.032s audio, it has received 469 chunks and completed 468, with one chunk in flight; this is progress, not a full-stream result. Output: `reports/E051-paced-context10.json`.
- Prepare a syntax-checked comparison script that verifies the sole source change, frozen inputs, prior canonical-label hash, full PCM integrity and helper cleanup, then reports all scores and deltas. It explicitly exposes harness hash differences since E046 and requires matched confirmation if promising. `reports/E051-compare.cjs`; do not run before the native process exits successfully.
- Fresh CUA native access still reports Mac locked. Review drafts and UI comparison tabs are retained unchanged. Product code, model and labels remain unchanged. `reports/E051-verification.json` records the active handle and next step.

### E051 failure

- Native handle 65661 ends with exit 1 after producing all 4,302 chunks / 8,809,600 samples. Error is `Cannot read properties of undefined (reading 1)` at transformed component line 1192, the backstop profile verse lookup. Producer completion is not full pipeline integrity. The previous top-level error path omitted all accumulated events and runtime details. Preserve the original failed report and do not run the clean comparison script.
- Progress observations showed an extra Shabad and a late final transition, but no valid complete accuracy/wrong-page result survives. The context hypothesis remains unresolved.

## E052 — retain canonical profile through cache eviction and preserve failures

- Reconstruct the Babel source location: `prof.verses[m.index]` reads from the mutable shared cache. The active slot retains lines after eviction; when its cache entry becomes an empty pending reload, verse lookup throws.
- Freeze pre-fix component/compiled component and harness sources. Add a real-component regression with one-entry cache capacity and mocked retrieval/engine; use exact verified canonical fixture text and actual read-only database. It fails on the original source with the same error location.
- Keep `profile: top.prof` in the active backstop alongside `linesNorm`, and rescore verse/display correspondence from that same profile. No canonical source text, model weight, score threshold or recognition window changes.
- The first post-fix test incorrectly expected the backstop to be the shared comparison leader, although the vote slot can lead. Correct the test to inspect the actual backstop snapshot. The corrected test still fails on frozen original source and passes on the fix. Both initial test artifacts remain preserved.
- Record component promise errors at occurrence; catch paced drain/shutdown errors into the report instead of losing the trace. Ensure driver native resources release in `finally` when completed decisions fail. A separate 15-second injected-failure component verifies exit 1, 55 retained events/27 errors, full 240,000 samples, helper pending 0 and exit 0. This does not inject an error into production. Native control handle 4017 is terminal.
- All 185 selected tests pass with zero skips (98810 exit 0). Lint remains 29 existing component errors with no added signatures (34413 terminal). Targeted Babel compilation and diff checks pass. Verification: `reports/E052-verification.json`.
- **Trend: positive runtime repair and failure evidence; no recognition-accuracy claim.**

## E053 — matched context comparison after the cache repair (in progress)

- Freeze the fixed four-second component and create a ten-second variant differing in exactly one constant. Both use the same harness and helper. Plan/fingerprints in `reports/E053-plan.json`; sequential runner `reports/E053-run.py`.
- Start native batch handle **1962** on context4, then context10. No simultaneous inference processes. Each writes unique output/log and terminal status; failure stops the batch without pretending the remaining case ran.
- Syntax-checked `reports/E053-compare.cjs` requires both terminal success statuses, identical model/audio/database/helper/harness, sole constant variant, preserved canonical-label hash, full PCM integrity and helper teardown before reporting all scores and deltas. A promising screen still requires repeatability and broader regressions; the reused constructed stream cannot certify natural-transition or identifying-evidence KPIs.

### E053 control validation

- Previous goal turn repaired the cache defect and started the pair. Revalidate all frozen plan fingerprints, and poll batch 1962 through context4 completion. Its child exits 0; the batch then starts context10. No process restarted.
- `reports/E053-check-control.cjs` verifies prior canonical-label hash, matched model/audio/database/helper, full PCM integrity and clean helper teardown. All 31 projection identities and all 980 hypotheses/confidence values match E046. Maximum corresponding action-time delta is 18ms.
- Correct/wrong coverage is 68.7214% / 28.6591%, compared with 68.7272% / 28.6541% before; the identical event sequence shifts by milliseconds. Runtime maximum completion delay is 0.244s and maximum unfinished received audio 0.256s. Report: `reports/E053-control-preservation.json`.
- This completes the full-stream cache-fix regression on these development inputs. Context10 is still running; `reports/E053-verification.json` records the exact handle and next step. Do not score the failed E051 trace or claim the broader context experiment is complete.
- **Trend: positive preservation; Level 2 unmet.** No additional code/label/model changes, training, commit or publication this turn.

## E054 — audit canonical ambiguity (diagnostic in progress)

- While E053 context10 is active, a read-only corpus audit finds 161 groups in a deterministic ID/length subset whose normalized wording maps to distinct Shabad IDs. This count is not a completeness or source-genre claim. The report retains canonical text hashes and row memberships, never rewritten Bani.
- In particular, canonical verse IDs 284, 404 and 15802 have identical complete text but distinct Shabad IDs. A controlled test can therefore inspect ambiguity handling without assigning an invented unique expected identity. `reports/E054-canonical-duplicate-audit.json`. No audio is labeled.
- Prepare `reports/E054-ambiguity-probe.cjs` using exact canonical text, real component/first-letter DB and a mocked engine/equally matching three-candidate full-text adapter. Run only after the current native replay ends; this is a decision diagnostic, not an acoustic/reliability test.
- The corpus audit overlapped context10 and is a disclosed CPU/DB timing confound absent from context4. Record its completion time relative to playback in `reports/E053-verification.json`; no exact start timestamp was captured. No other probe should run during the remaining replay. A promising context result still requires a quiet repeat.

### E053 final outcome

- Batch 1962 finishes both native conditions with exit 0, exact sample integrity and clean helper exits. Run the comparison only after both terminal statuses.
- Ten-second context improves two constructed first-sung transition delays to 12.975s and 6.338s (four-second: 39.291s and 26.882s), but final Shabad 3712 is never acquired. Correct coverage drops 68.72% -> 58.34%; wrong coverage drops 28.66% -> 10.55%, while seeking rises 0.22% -> 28.71%. Three extra selected identities (41162, 2057, 3981) are absent from the four source-reference labels.
- Candidate max completion delay 0.460s, unfinished received audio 0.384s. Preserve the disclosed E054 corpus-work overlap, completed around candidate playback 219.768s; timing is not a CPU-isolated context comparison. No acoustic inference ran concurrently.
- **Decision: do not promote fixed ten-second context.** Lower correct coverage and a missed transition fail the predeclared screen. Faster early acquisitions do not erase later errors/seeking. This does not establish that every longer-context approach fails or justify model training. `reports/E053-comparison.json`, `reports/E053-verification.json`.

### E054 controlled probe complete

- After the paced batch is terminal, run the prepared canonical-input diagnostic (24886 exit 0). Read rows 284/404/15802 freshly from STTM and assert identical exact text plus three distinct Shabad IDs. No canonical wording is generated.
- In both original and reversed tied-shortlist order, initial search remains unacquired. Following from an explicitly preset unrelated Shabad selects Shabad 27 at 1.5s of synthetic transcript time. This is a real component-policy observation under mocked acoustic/full-text inputs, not a recorded-audio score.
- This demonstrates inconsistent ambiguity handling between phases. It does not establish actual ASR prevalence, actual full-text candidate ordering/scores, or that a broad tie guard would improve hall accuracy. Next, observe real query results at replay decisions before selecting a new gate. `reports/E054-ambiguity-probe.json`, `reports/E054-verification.json`.
- No product, model, label, commit or publication changes this turn. **Trend: useful diagnostic evidence; Level 2 remains unmet.**

## E055 — observe actual canonical query results

- Previous turn completed E053 and a controlled canonical ambiguity diagnostic. Add opt-in `--trace-canonical-queries` to the paced harness; actual search arguments/results/errors/signals are preserved. Store hashes, IDs, scores, timing and last projected identity, never raw hypothesis text. Observer failures invalidate measurement without changing the search outcome.
- Four focused observer tests pass; all 189 selected tests pass (15718 exit 0). Freeze prior harness before editing. Plan/fingerprints: `reports/E055-plan.json`. No production source changes.
- Run a purpose-selected 100s prefix from the rejected ten-second variant containing its first known wrong selection, with no concurrent inference/corpus probes. Native 60369 exits 0 with full 1,600,000 samples and clean helper disposal.
- All 180 recognition hashes/confidence values and ten projection identities match the prior prefix; action times differ by at most 41ms. Of 128 query results, five have tied top scores. The wrong 41162 selection at 70.556 follows equal-score leaders 41135/41162 (0.8497777364704066); initial and recovery selections have unique leaders. A preceding comparison shows two wins for 41162 while those leaders tie. This is real returned-query evidence, not yet a counterfactual policy result. `reports/E055-trace-verification.json`.

## E056 — test tied-leader confirmation guard

- Create isolated four-/ten-second sources from frozen E052: when full-text top scores tie at 1e-9 tolerance, clear banked wins and set active slot wins to zero rather than confirm. Model, similarity thresholds and canonical text remain unchanged. Product source is untouched. `reports/E056-plan.json`.
- Controlled canonical cases (25027 exit 0): four tied-input/search/following/order cases hold; unique-candidate controls still acquire in search and following. The single-candidate control is a supplied shortlist, not a full-corpus uniqueness assertion. Clarify this per-case input distinction in report metadata after execution; no outcome changes.
- Native guarded 100s prefix (20061 exit 0) has exact input/model/driver/helper/query-trace agreement with E055, full sample integrity and clean helper exit. All 132 pre-failure recognition outputs and the query candidate list at the old failure match.
- Correct coverage improves 72.47% -> 85.87%, wrong 12.16% -> 0%, seeking 1.25% -> 0%. Initial acquisition stays near 11.48s. The old wrong selection is absent throughout the prefix. Report: `reports/E056-prefix-comparison.json`; this is targeted mechanism evidence, not representative success or natural-transition recall.
- **Decision: continue controlled validation; do not integrate yet.**

## E057 — full four-second guarded transition check (in progress)

- Start the isolated guard at the production four-second window over the complete constructed stream, with query tracing. Native session **75626** is the active handle. Source/model/policy other than the tested guard remain fixed; no concurrent inference or corpus probes.
- Plan/fingerprints: `reports/E057-plan.json`. After terminal exit 0, record the exit code in verification and run `reports/E057-compare.cjs`; it checks canonical-label hash, inputs, helper cleanup and all projection/coverage/transition results against E053 context4. Baseline predates query observation, so retain that scope limitation rather than assuming zero observer effect.
- Full result pending. Broader reference/negative/following and actual hall validation remain necessary before promotion or a Level 2 claim.

## E057 complete: reject the broad tie guard

The full 550.6-second native run exits 0 with all 4,302 chunks / 8,809,600 samples intact and clean helper disposal. Compared with E053 four-second control, correct-Shabad coverage falls 68.72% -> 51.08%, wrong coverage rises 28.66% -> 46.21%, and seeking rises 0.22% -> 0.32%. Initial acquisition stays near 11.48s. Constructed transition delays change from 39.291s / 26.882s / 74.384s to 40.292s / 40.568s / never, measured from first labeled sung words.

**Decision: reject the broad guard and retain E052 production behavior. Trend: negative candidate result, with a regression caught before integration. Level 2 remains unmet.** The favorable E056 prefix does not justify this broader regression. Comparison and integrity checks are in `reports/E057-comparison.json`; native session 75626 is terminal, exit 0.

The broad rule blocks every active slot when any top full-text candidates tie. Trace inspection finds the expected candidate below unrelated tied leaders on one query before the first transition and two before the final transition. This motivates a controlled scope test; it does not establish the cause of the missed transition, because changed commitments also shift recognition windows. Any narrower rule must preserve ambiguity controls and pass full regression checks before integration. These reused constructed transitions add no independent hall evidence. Baseline tracing is off and candidate tracing is on; retain this observation-scope limitation.

## E058: candidate-scoped suppression passes controlled and prefix checks

Broad versus scoped guard: all 14 predeclared controlled cases pass. Both hold tied canonical shortlists and acquire unique-shortlist controls. When tied leaders are unrelated to a distinct canonical nominee, the broad source blocks and the scoped source permits confirmation. This is an intentionally supplied ranking; it is not an asserted real full-text result for that exact canonical input. Exact inputs come directly from STTM and are identified by verse IDs/text hashes. Probe 80796 exits 0.

The scoped ten-second variant also removes the E055 known wrong selection over the same 100s prefix: correct 72.47% -> 85.88%, wrong 12.16% -> 0%, seeking 1.25% -> 0%. All 132 pre-failure recognition outputs and the actual query candidate list at the old failure match. Native 57340 exits 0 with full PCM integrity and clean helper disposal. Reports: `E058-scope-probe.json`, `E058-prefix-comparison.json`, `E058-verification.json`.

**Trend: positive targeted mechanism checks only.** Product remains E052. E059 now tests the full four-second constructed stream; a prefix success is insufficient, as E057 demonstrated. No new independent hall recordings or checked labels, no training or release claim.

## E059 complete: scoped guard preserves the constructed-stream baseline

Native session **19555** exits 0. Source/model/audio/database/helper and emitted driver/probe/query-tracer fingerprints verify, all 4,302 chunks / 8,809,600 samples complete intact, there are no recorded errors, and the retrieval helper closes with zero pending work and exit 0. Before scoring, the checker was strengthened to explicitly match the emitted probe/driver/query-tracer hashes; no replay source or outcome changed.

All **31 projection identities and 980 recognition hashes/confidence values match E053 four-second baseline exactly**. Maximum corresponding action-time difference is 29ms. Correct/wrong coverage is 68.7232% / 28.6576% versus 68.7214% / 28.6591%; these tiny differences reflect timing variation, not improved recognition. Constructed transition delays are 39.280s / 26.887s / 74.383s from first labeled sung words. Initial acquisition is 11.478s. Maximum completion delay is 0.250s and unfinished received audio is 0.256s. `reports/E059-comparison.json`, `reports/E059-verification.json`.

**Decision: retain the candidate for broader validation, without production integration. Trend: positive preservation after rejecting a harmful broad rule; no demonstrated gain on this stream's Level 2 metrics.** E058's controlled ambiguity and purpose-selected ten-second prefix improvements remain narrow findings. Reference, negative and following regressions remain before integration. Do not keep tuning window/threshold parameters against this same constructed stream to imply general reliability. Reviewed representative hall audio, capture provenance, natural transitions and identifying-evidence timing remain the highest-value evidence gap.

The application source still matches E052, confirmed by SHA-256; no model changes, training, new canonical audio labels, commit or publication. Project principles explicitly require STTM/BaniDB verification even for the user's own recollections; the dataset summary now retains that recollection's canonical ambiguity.

## E060–E061: broader paired screen, duration-boundary repair

Previous turn completed E059 preservation and kept the scoped candidate experimental. E060 pairs frozen E052/E058 four-second sources on twelve reference scenarios (four sources, correlated offsets), three following-negative composites and three cold synthetic controls. Exact-PCM/model emissions caching makes this a decision screen, not a live timing test. Stop at the first changed projection decision for inspection; no automatic promotion.

All four full reference pairs match on all 80 projection actions. Batch 51674 then exits 1 at a runner assertion, after the first cold33 baseline child completed cleanly: the label UEM requests 308.8 seconds from start 152.1, while the WAV supplies 305.92525 seconds. E060 erroneously asserted requested duration rather than the available interval. Preserve its source, plan, log and traces. This is a runner defect, not a candidate recognition failure.

E061 derives available duration directly from WAV frame count, retains requested duration and reports any unavailable requested tail. It revalidates and reuses clean completed E060 children; audio and labels are unchanged. Native batch **44789** is running. Plan, progress and traces: `reports/E061-screen/`; verification `reports/E061-verification.json`. CUA freshly confirms the Mac remains locked, so actual microphone/UI validation is still unavailable. The existing unlock/reviewer requests remain outstanding.

**Trend: positive preservation on four sources so far; broader screen pending and Level 2 unmet.** No production/model changes, new reviewed labels, training, commit or publication.

## E061b complete: all 18 cached pairs preserve behavior

E061 completed twelve reference and three following-negative pairs with identical projection actions, then batch 44789 exited 1 on a second runner assumption: the cold-silence child finished the full 60s and exited 0, but its last recognition event was at 5.632s. Lack of later recognition events does not indicate missing audio. Preserve the original runner and output.

E061b verifies successful child exits, exact source/input/support fingerprints, the frozen replay's post-loop completion report/marker, and periodic audio progress. It reuses revalidated completed children without changing source audio, labels or component code. Batch **17974 exits 0** and all **18 paired scenarios** preserve complete projection identities/audio timestamps: twelve reference cases from four reused sources, three following-negative composites and three cold synthetic controls. Reference label hashes and canonical DB/schema match E009's canonical audit. All six synthetic controls have zero false acquisitions/switches; each following control is assessable from the correctly acquired prior page.

Mean correct/wrong coverage remains **71.8696% / 1.5309%** across the twelve correlated reference scenarios, first-labeled-sung-word acquisition within 20s remains **5/12**, and never-acquired remains **1/12**. These unchanged development scores do not satisfy Level 2. The eight cold-offset UEMs extend 2.273–4.557s past available audio; the plan/comparison explicitly retain requested and available durations. Do not treat unavailable tails as observed audio or new success evidence. Reports: `reports/E061b-screen/comparison.json`, `reports/E061b-verification.json`.

**Trend: positive broader preservation, no recognition-accuracy gain.** E062 is prepared to repeat all eighteen candidate cases with native inference and no emissions cache, stopping at any divergence from its exact cached trace. No integration before confirmation and remaining regression checks. Representative reviewed hall data, natural transitions, capture provenance and actual microphone/UI validation remain missing. CUA rechecked the locked Mac; prior review drafts and visual comparison tabs are preserved.

E062 native confirmation is now running through exact batch handle **93199**. See `reports/E062-native/plan.json` and `reports/E062-verification.json`; preserve the frozen source/support files throughout the run.

## E062 native confirmation: first two recordings verified

Previous goal turn completed all eighteen cached pairs and started native batch 93199. This turn polls that exact handle and confirms it remains live. The first two native children, IZOsmkdmmcg and kZhIA8P6xWI, exit 0 after 181.23s and 112.02s wall time. These are compute-run durations, not microphone-to-display latency. Their 21 and 19 projection identities/audio timestamps match the respective cached candidate traces exactly.

`reports/E062-verify.cjs` independently rereads completed traces, hashes frozen plan/source/audio/canonical-label/support files, verifies native inference without a cache, checks completion markers/audio-progress records, and compares the actual projection sequences. Interim verification confirms **2/18** completed cases and zero differences. It explicitly does not infer parent liveness from a status file. Only `--final`, after recorded terminal success and all eighteen cases, can create `verification-complete.json`. Batch **93199 remains active**; do not restart it on an observation timeout.

Prepared `reports/E063-switch-ambiguity.test.js` contains eight canonical-input regression tests, including a new stateful case requiring a tied nominee to lose prior wins and gather fresh evidence after the tie clears. Inputs are loaded read-only from STTM at execution; the controlled rankings are not claimed as real acoustic/index results. The file parses but has **not been executed** and is not installed in the product test suite. After native confirmation is terminal, run it against scoped, baseline and broad variants before considering integration.

**Trend: positive native preservation so far; full confirmation pending, accuracy unchanged and Level 2 unmet.** Product remains E052; no new reviewed hall labels, training, commit or publication.

## E064 — current status consolidated

Replace the cumulative STATUS chronology with a current evidence dashboard, separating existing metrics, release gaps, current product, active native confirmation and next actions. Save the prior page byte-for-byte in `reports/E064-status-before.md`; verify every linked local file exists. The experiment log retains the history and both recent runner failures. This is communication/traceability work, not new performance evidence. `reports/E064-verification.json`.

## E063 — stateful ambiguity regressions verified

Execute the eight prepared tests on the scoped, current-baseline and rejected broad sources with mocked acoustic engines and exact read-only canonical inputs. Scoped session 27727 exits 0, 8/8 pass. Baseline session 95788 exits 1 as expected: the two following/order ambiguity cases and the prior-wins case fail (tests 3/4/8). Broad session 98213 exits 1 as expected: unrelated tied leaders prevent the distinct nominee from confirming (test 7). All other controls pass; zero skips/cancellations. These expected red controls validate the targeted regressions, not a live error rate. No canonical text is invented or audio labeled.

The stateful case starts with accumulated wins, supplies a controlled tie, checks that the tied nominee's wins reset, then requires fresh unique-shortlist decodes before confirmation. This is deliberately controlled ranking evidence, not an assertion about full-corpus uniqueness of its exact input.

Revise the earlier scheduling plan: run these mocked-engine tests during E062's settled headless native batch, rather than after it, to detect a stateful defect sooner. Record the full CPU/DB-read overlap window in `reports/E062-verification.json`; no other model inference runs, no frozen replay source changes, and no CPU-isolated or microphone latency claim is made. Candidate remains unintegrated pending all eighteen native cases and integration checks. `reports/E063-verification.json`.

## E062 complete; E065 local integration verified

Native batch 93199 exits 0 after all eighteen cases. The final independent verifier checks the full inventory and trace/source/input/support fingerprints, uncached mode, completion markers and actual projection sequences; all eighteen match their exact cached candidate traces. Preserve the E063 mocked-engine CPU/DB-read overlap disclosure; this settled headless batch is not a live latency measurement. `reports/E062-native/verification-complete.json`.

Prepare E065 with formatting confined to the new guard block. Babel output without comments is identical to E058, establishing no logic change, and ESLint has the same 29 existing component errors with zero added signatures. Back up the current component/compiled output, verify the product still matches frozen E052, then integrate the formatted guard and the E063 test file. Selected suite 88289 exits 0: 197 passed, zero failed/skipped. Targeted Babel, compiled/test syntax and diff checks pass. Inspect the generated diff: it adds tied-identity tracking and the per-slot confirmation gate. No canonical text, model or numerical similarity threshold changes. No commit/publication. `reports/E065-verification.json`.

## E066 — current readiness rechecked

Inventory audit: 13 records, zero errors, 64 unresolved metadata warnings, no locked-release split. The only two saved annotation files are reference drafts with no document/segment/episode audio-review declarations. No new reviewed hall labels have arrived. CUA freshly reports the Mac locked; the existing unlock/reviewer/capture-source requests remain outstanding. Annotation server 54696 is independently polled and remains live; draft/review tabs are preserved.

The same data/access dependency has persisted across multiple goal turns. The focused engineering work could proceed during those turns; its native confirmation, controlled tests and local integration are now complete. Further model/policy experimentation without reviewed representative data would not establish the requested Level 2 end state. Do not invent labels, reinterpret the small reused set as representative, or claim training is justified. `reports/E066-readiness.json`.

## E067 — durable development source backup

Save tracked changes plus 110 task-created untracked files outside the temporary checkout. Exclude the pre-existing unrelated engine test and leave it untouched. Apply the tracked patch to the recorded HEAD versions in an isolated temporary directory and verify resulting file bytes match the worktree; verify archived untracked hashes. Archive size 164,028 bytes, SHA-256 in the report. No model, canonical database, recordings, node_modules, commit, installer or external publication is included. `reports/E067-verification.json`.

After completing local integration and rechecking the persistent data/access dependency, the full goal is marked **blocked**, not complete. The objective and KPI thresholds remain unchanged. Resume when reviewed hall evidence and native input/UI access are available.

## E068 — actionable user handoff and new Level 3 source

The user confirms acoustic MacBook microphone input near the kirtan for the failed live application test, without a direct feed. Record this as app-input provenance; do not independently assert the separate MOV's recorder device. User supplies Q5QFYd6sL_w and coarse sections 99–1375s and 1376–1846s, with intervening Simran/resumption. Exact local STTM/BaniDB lookups verify Shabad/verse 1875/22584 and 1664/20427. Canonical snapshot and hashes: E068-canonical-verification.json. Coarse ranges remain user evidence, not continuous verse/content labels or reviewed identifying-evidence markers. No training or release eligibility is assigned.

Acquire public source metadata and first 1846s audio. The initial remote-section download is stopped for low throughput; its failed result and partial/log remain preserved. Ordinary native download succeeds; trim decoded audio locally to avoid remote-seek offset ambiguity. Audio is mono PCM16 at16kHz, exactly1846s, SHA256 3f22c91b835158f85473c9d3be75552ac9efa0fb810da2f0d8d00ff02eaf16db. Full original audio retained; later material not analyzed. Dataset audit passes:14records,0errors,69warnings; no new independent release samples. PHONE-HANDOFF.md separates diagnostics we can execute immediately from stronger evidence needed for claims. Trend:positive for new usable evidence, performance not yet evaluated.

## E069 — first continuous replay of the new recording (running)

Replay 0–1846s using the frozen current production component, native acoustic inference and the full canonical corpus. No expected IDs, manual seed, label restrictions or emissions cache enter inference. Freeze source/audio/model/DB/support fingerprints before execution; retain all actions and errors. Read coarse user ranges only after replay to report matching acquisition observations, never reviewed accuracy. Includes introduction, natural audio around the user-identified Shabad change and all interruptions; Simran boundaries remain unreviewed. Source: reports/E069-new-smagam/component-frozen.jsx; plan and runner preserved. A process-scoped caffeinate hold prevents idle sleep for this run, without unlocking the Mac or overriding lid closure. No production/model changes or training.

## E069 complete; E070 targeted retrieval and content triage

Replay session16411 exits0 after1846s audio (806.575s replay wall time, outside-startup timing). All frozen fingerprints match; no emissions cache, exceptions or expected-ID input. Initial matching selections:109.568s for1875 and1379.328s for1664, offsets10.568s and3.328s from coarse user boundaries. These are not reviewed evidence-onset or physical microphone latency. Five other acquisitions occur inside the first main-Shabad section, with returns to1875; an opening2803 selection is outside user labels. They are unadjudicated, not automatically errors: actual audio may contain pramaans/quotations, Simran or recognition failures. No later Shabad change after1664 through30:46.

Retrieval triage session88093 exits0. All10 selected verse/Shabad memberships are canonical. Save24 fixed boundary-grid snapshots plus25 separately marked outcome-selected diagnostic snapshots. Diagnostic expected-ID recovery is7/12 and1/12 in the two start grids, despite successful runtime acquisition. The oracle is not the precise live shortlist and no reliable acoustic-failure fraction can be inferred. Three focused review windows total104s; user review questions remain pending. No reviewed annotations, threshold/model/product change or training. Trend:mixed; prioritize actual-content review and independent room examples before choosing a new route. reports/E069-results.md and reports/E070-verification.json.

## E071 — initial pre-Simran interpretation (superseded by E073)

**Correction: the error classification and downstream recommendations below are withdrawn. See E073. Retained here as historical reasoning, not current truth.**

User confirms19:30–20:00 is still the same Shabad and approximately20:00–20:30 is Simran, then quick resumption. Save the exact user statement and coarse content/identity intervals in data/user-smagam-Q5QFYd6sL_w/user-review-2026-09-14-E071.json, with approximate timing and no fabricated word/verse or reviewer declarations. Under this user label, the19:34.528 and19:38.112 selections are incorrect Shabad-level switches. They precede Simran. The purpose-selected30s slice has4.016s correct visible selection,24.960s other selection,1.024s seeking. No acquisition occurs in the approximate Simran interval; previously wrong7778 persists. First return to1875 is21:25.120, about55s after approximate resumption. These are one-source diagnostics, not population statistics.

Correlate saved exact runtime shortlist/decision comparisons: the first false nominee gains two wins at candidate0.875/current0.5625, commits a half-second later; the second accumulates three wins even as full-text ranking favors the current wrong Shabad. Simran-only classification cannot prevent the initial error. E072 read-only all-canonical-line scoring distinguishes cursor restriction from absent useful short-window matching. No new inference, production code or model changes. Trend:negative for this measured behavior, positive for narrowing the next investigation. reports/E071-reviewed-window.json and E071-results.md.

E072 completes with exit0: at the first false nomination, the all-canonical-line oracle score for1875 is0.5625, equal to the actual cursor-band score. A cursor-band-only expansion would not prevent this nomination. At commitment,1875 is absent from the actual text-retrieval shortlist despite being the user-confirmed Shabad. High recognizer confidence and short-fragment matching are therefore insufficient evidence of correct identity here. Prioritize a bounded context/confirmation experiment, with true-transition latency controls, before any retraining or global window change. Saved E072-current-shabad-score-audit.json.

## E073 — refined passage identity; withdraw premature error classification

User clarifies that19:24–19:54 includes chanting referring to Guru Gobind Singh Ji and a brief sung passage around19:40. Cross-check their Romanized hint against read-only STTM/BaniDB:7755/80618 contains the supplied phrase. This is the reference selected at19:34.528. The19:38.112 selection7778/81639 is a distinct canonical passage with similar wording, requiring separate review. Approximate times cannot establish exact transition latency or whether the first selection was early.

Withdraw E071’s two-confirmed-errors classification, derived correct/incorrect time, asserted55-second error-recovery delay, and E072’s route recommendation based on treating departure from1875 as false. Preserve numerical observations and all original artifacts byte-for-byte in reports/E073-superseded with hashes. Mark active prior reports superseded, point the dataset registry to the new review, and update STATUS. Do not train or tune policy against the withdrawn label. No product changes, model training or new inference had been performed from it. Earlier20:00–20:30 Simran context remains approximate and was not explicitly retracted.

Trend: prior negative assessment for these two switches is withdrawn; the first selection matches the newly identified passage. Overall accuracy remains unscored for this interval. Next priority is content sequence and brief-passage transitions, not suppressing these selections by assumption.

## E074 — preserve later content clarification; prioritize Level 2 step by step

User identifies a brief different passage around20:40 and return to the main Shabad around21:56. Save as approximate point observations; the other passage has no user-confirmed canonical ID, and no continuity or exact latency is inferred. Preserve with E073 in the review registry.

The user explicitly requests greater focus on Level 2 and a step-by-step plan based on tests. Defer further Level 3 experiments. NEXT-LEVEL-2-STEP.md defines a small initial ordinary Darbar batch, unchanged-system baseline, one measured improvement with controls, and later independent expansion. Existing recordings remain available. Request two useful10–20-minute ranges with Shabad hints and capture provenance; one can start triage. No new inference, training, product code changes or additional Level 3 analysis in this scope update. No new Level 2 accuracy/trend claim.

## E075 — reconstruct Renton v3 locally; acquire Level 2 batch

User supplies five timestamp-verified Renton/Seattle cuts and asks to create the dataset on this computer. The original /Users/asingh02/personal path is absent; no local named copy was found. Reconstruct an explicitly marked local import from the complete pasted list, preserve user attribution and timing verification scope. Five cuts total4267s (71:07), three continuous spans with70s of intervening audio total4337s (72:17). Aarti remains a separate singing entry, with no guessed single canonical ID. Native downloads and local decoding complete for all three sources; source/PCM hashes and source-to-local offsets saved. Source titles suggest three dates on one channel; this does not establish independent capture conditions or unseen venues.

Canonical search matches:657/8983,2776/31040,2352/26883; candidate650/8898 for fifth cut remains provisional. Exact database rows retained separately from user Romanized hints. Aarti passage sequence pending. No words/boundaries/identity approved by model agreement. Optional request sent for Aarti and fifth-entry STTM links; replay can continue without them. Dataset audit:17records,0errors,84metadata warnings. No new training/release eligibility.

## E076 — bounded unchanged-system screen; resume after output-pipe interruption

Predeclare seven native unassisted cases: first120s of all five user cuts and two adjacent-cut boundary windows, totaling1150s (19:10). Retain original gaps; no synthetic splicing, manual seeds, labels or candidate restrictions enter inference. Freeze source/model/audio/DB/support. The two initial children exit0 and traces are saved. The runner then fails with stdout BrokenPipeError after its output connection closes; this is a runner/logging failure, not a component inference error. Original failed progress and traces remain intact.

E076b verifies both completed trace hashes and all plan fingerprints, reuses those results and resumes only five unfinished cases. Redirect runner output to a persistent file and retain a process-scoped idle-sleep hold. Active progress:reports/E076b-renton-screen/progress.json. No product changes, training or full-dataset accuracy claim.

## E076b completed; E077 screen assessed

Resumed runner session65376 exits0 with all seven cases completed, reusing two verified traces and executing five remaining cases. Assessment exits0; unchanged frozen source/model/DB/audio/support fingerprints verified. Total1150s replay across overlapping windows; not full4267s-cut accuracy. Cold entries2,3,4 select matching canonical hints after34.304s,28.672s,9.216s. Aarti selects2640 then4894, whose singing sequence remains unreviewed; entry5 selects749 while hint650 is provisional. No false-switch count is asserted for those uncertain identities. Boundary windows select next hints27.152s and7.936s after coarse user cut starts; exact evidence timing remains unresolved.

Entry3 exposes unique full-text2776 at8.192s while first-letter votes favor another candidate, with repeated later agreement before selection at28.672s. This is the highest-value bounded decision experiment. Entry2's early657 leaders are exact ties, so its delay must not be solved by removing ambiguity protection. No policy/model change, training or representative success claim. Reports:E077-renton-observations.json,E077-results.md,E077-verification.json. Dataset file verified and opened in Codex (queued UI action); current local path is data/live-darbar-renton-v3/live-darbar-renton-dataset.json.


## E078 — full supplied Renton baseline (running)

- Frozen current source/model/DB/support/audio in reports/E078-renton-full/plan.json. Three continuous spans total4337s, including all4267s of user cuts and70s of original gaps. No expected labels/IDs enter inference.
- Sequential native inference with exact PCM emissions recorded for future paired studies. Recording disk work and settled asynchronous execution prevent a live latency claim. Current machine load is high; first30.1s audio took453.6s replay wall time. Process remains active; no completed full benchmark yet. Optional user request to free laptop resources is pending.
- Full run must finish and verify every fingerprint and child exit before any completion claim. Runner and persistent logs: reports/E078-full-baseline.py/.log.

## E079 — corroborate fifth main identity from source-video projection

- Native public-video metadata/frame extraction succeeded. Inspected frames at1150,1180 and1245 source seconds show lines matching exact canonical verses8898,8898 and8899 respectively, all Shabad650. Read-only targeted canonical extraction saved both650 and the selected749 for comparison.
- User title/timestamps remain unchanged. Added separate source_projection_evidence to entry5. This corroborates the main identity independently of recognition output; projection can lag or be wrong and is not audio-verified continuous truth.
- Browser navigation timed out; public native retrieval succeeded normally. An unnecessary full-corpus canonical read was stopped with SIGTERM to reduce local resource use; targeted canonical lookup completed. No restriction bypass.
- Files, hashes, exact canonical rows and limitations: reports/E079-video-verification/verification.json.

## E080 — short-phrase gate diagnosis and controlled component probe

- Exact frozen first-letter function was checked against the diagnostic helper for every transcript across all seven completed screen cases. For entry5,138/150 following updates have fewer than four first letters; only12 reach full-text retrieval. Other cases also have frequent short updates. Correlated decode counts are descriptive, not independent statistical evidence.
- Three actual-component controlled probes pass: alternating exact canonical refrain verses8898/8899 cannot acquire and makes zero full-text queries; verse8898 alone cannot prompt re-evaluation while following749; longer canonical verse8900 reaches retrieval and acquires650. Retrieval rankings and recognizer are deliberately controlled; this is not an audio accuracy test.
- This supports investigating short-phrase routing before retraining: even exact input encounters the gate. Prior E004 wrong-page regressions and E022 sustained false full-text leaders constrain the intervention. Do not relax thresholds blindly or promote a direct-text shortcut.
- An early diagnostic draft categorized the acquisition decode by its post-decision phase. The final report uses pre-decision phase and preserves the draft separately; aggregate counts in E080-results.md come from the final report.
- No product or model change. Dataset hints/timestamps verified unchanged;5cuts4267s preserved. See reports/E080-results.md, E080-gate-probe.cjs/.json/.log and E080-verification.json. Full E078 benchmark still running.

## E081 — bounded runtime probe; retain defaults

Sampled the running replay process to distinguish busy native inference from a hang. Paused the full replay for approximately18s during a four-process same4s-input default/one-thread comparison and resumed it in finally. All eight output tensors were identical. Median default1081.61ms versus one-thread1251.87ms gave no reason to change configuration. This is one input on a variable-load host, not a throughput benchmark. The host later recovered without any confirmed response to the optional resource request. No runtime/product change. See E081-runtime-probe/comparison.json.

## E082 — isolated short-following routing candidate

Generated research/variants/E082-short-following.jsx. Only following-mode routing changes; initial acquisition and numeric thresholds remain unchanged. First generation attempt failed closed because a marker appeared twice; scoped the marker before generating the artifact. All eight ambiguity controls pass. Three controlled canonical probes preserve initial behavior and demonstrate that short following input now reaches retrieval, but the short exact line still cannot switch under the unchanged margin rule. Candidate exact-match length penalty yields0.8667 versus current fuzzy0.7692, below required0.15 margin. Canonical strings remain exact; probe inputs are not audio labels. No integration.

## E083 — Aarti reference lookup and unsuccessful projection labeling

Read-only canonical lookup finds Bani22/token aarti and256 collection rows, including arrangements/flags and custom references. Collection membership does not establish a performed passage or its timestamp. First sampled video extraction failed on unsupported vsync; corrected top crops timed out with partial frames and revealed the assumed top overlay was absent. Two full frames at10s and180s were extracted successfully and inspected, with no usable projected Bani. No listening-based labels or timed Aarti sequence produced. Preserve partial artifacts and errors; stop further frame extraction. See E083-aarti-projection/assessment.json.

## E084 — seven native paired Renton screens complete

All seven predeclared E076 cases ran uncached using frozen E082,1150s total, every child exit0, source/input fingerprints unchanged. First acquisition identity/time preserved in every case. Entry5 reaches main hint650 at69.632s versus no baseline650 within120s. Three other identified cold starts unchanged. Both transition screens have less main-hint display and more seeking; additional IDs remain unadjudicated. Aarti timing changes are not automatically gains. E078 was concurrently running, so no controlled timing claim. Preserve every changed state in E085-paired-observations.json.

## E078 completed; E085 full assessment and independent verification

The full baseline completed at2026-09-15T03:06:07.945454Z: all three children exit0,4337s replay including all4267s cuts and70s original gaps.24,978 native inferences, zero cache hits/corrupt entries in record mode. E085 rechecks all traces, file/audio fingerprints, durations, no expected seed and no component errors; product remains E065. Tool process handles were unavailable after user interruption, so completion was recovered from verified disk artifacts without restarting work.

First main-hint display offsets from user cuts2–5:19.712,28.672,8.096,156.160s. Main-hint display88.57%,94.80%,99.23%,62.62%; these are not verified accuracy. Aarti unscored, later differing IDs unadjudicated. Second recording has only2776 then2352 selections; fifth cut has initial749, delayed650 and later departures/returns. Full observations, all paired differences and ROI diagnosis: E085-results.md, E085-verification.json, E085-full-observations.json, E085-paired-observations.json.

## E086 — all18 existing reference/control cases; no broader gain

Predeclared all12 existing reference scenarios and all six synthetic controls, retained every result. All18 children exit0,20,931 cache requests/hits, zero native calls or corrupt entries. No truth enters inference. E062 native baseline hashes verified; E065 integration's compiled semantic equivalence permits comparison. Seven action arrays change and11 remain identical. Reference-case mean labeled correct display71.8696% to71.6334%, wrong1.5309% unchanged, seeking0.3241% to0.5603%. All six synthetic negatives preserve behavior; following controls acquire their prior page unseeded before scoring. No population or runtime claim. E086-score.cjs produces comparison.json.

## E087 — native confirmation, same-time event-order discrepancy, candidate rejected

Preselected IZOsmkdmmcg_cold66, the largest E086 reference decline, for uncached replay. Child exits0; strict action-array assertion fails because verse/seeking=false updates arrive in reversed order at89.600s. Preserve original verification.json and error log. Independent E087-assess.cjs verifies all fingerprints, identical recognition content/retrieval/switch comparisons, identical post-timestamp states and exact interval-score equality. No claim of raw event-order or rendered UI equality.

Native candidate correct-display71.6687% versus baseline73.0591%, seeking1.3904% versus zero, wrong zero in both. This confirms the particular regression, not a population rate. Decision: do not integrate E082; retain E065. No additional full candidate replay or training launched. Highest ROI is focused content adjudication and better short-evidence verification. Optional phone review requested for_Q8mZ5rqA2w8:50–9:45; the benchmark decision does not depend on that answer. No new recordings needed now. Final decision report:E086-results.md.
