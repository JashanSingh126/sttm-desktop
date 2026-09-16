# Voice Follow — Git and project handoff

Prepared 2026-09-14 Pacific / 2026-09-15 UTC. Recheck remote and process state before acting; paths and PIDs below describe this machine at handoff time.

## Start here

- **Open PR:** https://github.com/Arash2348/sttm-desktop/pull/3
- **Source:** `JashanSingh126/sttm-desktop`, branch `codex/live-darbar-voice-follow`.
- **Target:** `Arash2348/sttm-desktop`, branch `feature/voice-follow` — not `dev`.
- **PR commit:** `55184362117c56a78e39bf98d9b1469506ee1f6b`.
- Last verified: PR OPEN, merge state CLEAN. It has not been merged.
- **Clean PR worktree:** `/tmp/sttm-voice-follow-pr`. Continue PR review/fixes here.
- **Running development checkout:** `/tmp/sttm-desktop` (same location as `/private/tmp/sttm-desktop`). This remains on `feature/voice-follow` with uncommitted product changes and extensive untracked research/test files.
- **Research workspace:** `/Users/jashansc/Documents/ChatGPT/VF`.
- **Base comparison worktree:** `/tmp/sttm-vf-base-review`, detached at `9f75d61`.

The clean PR worktree contains reviewed cleanup that the running checkout does not: consolidated CSS, lint cleanup, curated test helpers, and the new test command. Do not overwrite the PR worktree wholesale from the running checkout. Both reflect the agreed UI and matching behavior, but are not byte-identical.

The earlier documentation/scaffolding cleanup is a separate PR, https://github.com/Arash2348/sttm-desktop/pull/2. It was intentionally not incorporated into PR #3. This handoff is outside both Git checkouts and is **not included in the code-only PR**.

## User intent and non-negotiables

The product should identify and follow live Darbar kirtan through a MacBook microphone listening in the room. Prioritize Level 2; Level 3 smagam material can involve rapid pramaans and Simran transitions and comes later.

The practical target is roughly **85% correct matches fast or acceptably late**, ideally within about 20 seconds. The user explicitly relaxed the earlier arbitrary 95% target. Quality and avoiding incorrect projection matter more than a favorable development score.

- Display only canonical Bani from STTM/BaniDB. Never display ASR-generated or manually reconstructed Bani as authoritative text.
- Cross-check even the user's romanized hints against the canonical database.
- Do not change canonical spelling or punctuation to improve matching. Internal normalized search keys must remain separate from displayed text.
- Retaining an already displayed slide during uncertainty is acceptable. When very unsure, the existing Vaheguru fallback is preferred. Do not add a blanket fallback on every searching frame; that was proposed and rejected.
- The user declined computer-control permissions. Do not request them again or try to access their desktop through another automation route. Files, commands, logs, and headless checks were used.
- Keep updates concise, practical, and candid about whether evidence is improving.
- Keep PRs focused on product code and useful tests. No research reports, datasets, Markdown handoffs, shell scripts, generated bundles, model binaries, or unrelated cleanup.

## What was implemented

### Matching and runtime

1. Accumulated distinct phrase hypotheses during initial acquisition, rather than relying on a single short decode.
2. Added weighted character-gram retrieval over canonical BaniDB text. Results carry canonical IDs and scores, not generated display text.
3. Combined text evidence with audio verification of leading candidates. The integrated behavior is the E103 approach, plus subsequent lifecycle fixes.
4. Moved canonical retrieval into an Electron utility process, owned by a main-process service. The presenter renderer is the permitted caller. Retrieval has bounded pending work, timeouts, cancellation, and disposal.
5. Added session/request ownership checks around asynchronous model, microphone, retrieval, profile loading, and follower results. A stopped/restarted session must reject old results.
6. Fixed persistent model-cache location in the Electron renderer and migration from the earlier temporary cache.
7. Kept the existing following/switch confirmation policy. UI snapshots do not drive projection decisions.

Important limitation: the integrated audio verification performs an additional inference. Reusing the recognizer's already-computed emissions is prepared and partially tested separately, **not shipped in this PR**. No model finetuning was performed.

### Agreed UI

The user selected **MVP refined**, based on the original MVP 3.0 design in commit `1f5c51f`.

Final preference, after several iterations:

- Narrow dark/glass panel with `Voice Follow` and `Listening` in the header.
- **Green microphone bars**, driven by actual input level; no fake looping animation.
- Current Shabad with a subtle green accent and canonical text.
- An amber candidate section only while checking a new Shabad, with confirmation progress.
- `Matches` collapsed by default; compact blue-toned rows inside.
- No visible Auto switch control, internal build labels, source disclaimers, or explanatory paragraphs.
- Automatic behavior remains the default.
- **Start listening centered** before a session; Stop on the right during a session.

The user briefly requested Khalsa colors, then explicitly rejected that result and asked to return to MVP refined. Do not restore the rejected navy/kesari redesign merely because it appears earlier in the conversation.

Visual desktop inspection was not performed because permissions were declined. Builds and code checks passed; the user has been evaluating the actual window. Current line text identifies the selected Shabad and should not be assumed to be a verbatim transcript of the latest audio.

## Code map

Paths below are relative to the clean PR worktree:

- `www/main/addons/voice-follow/components/VoiceFollow.jsx`: capture/session orchestration, acquisition evidence, switch handling, presenter panel.
- `www/main/addons/voice-follow/engine/retrieval/text-index.js`: canonical search ranking.
- `.../retrieval/read-corpus.js`: read-only Realm snapshot.
- `.../retrieval/client.js`: bounded request lifecycle.
- `.../retrieval/renderer-client.js`: renderer IPC adapter.
- `.../retrieval/main-service.js`: authorized service and ownership.
- `.../retrieval/utility-worker.js`, `worker.js`: isolated worker transport and search.
- `app.js`: main-process retrieval registration/disposal.
- `.../engine/model-manager.js`: persistent cache and migration.
- `www/src/scss/styles.scss`: UI styles; the final additions were consolidated in the PR.
- `test/voice-follow/`: curated lifecycle, microphone, retrieval, model-cache, and switch-ambiguity regressions; canonical fixture and supporting driver.

The PR contains 26 changed files: JS/JSX, SCSS, and JSON only. Existing packaging excludes the test directory. Do not stage the running checkout's whole untracked `test/` directory: it also contains experiment generators, scripts, and research utilities that were deliberately excluded.

## Verified results — do not overstate them

The reference acquisition set is **4 recordings/Shabads × 3 starts = 12 correlated cases**, not 12 independent Shabads. Timing is measured from labeled sung-word onset on the replay audio clock, not physical microphone-to-screen latency.

| Development result | Earlier baseline | Integrated matching approach |
| --- | ---: | ---: |
| Correct acquisition within 20 s | 5/12 | 10/12 (83.3%) |
| Within 30 s | 5/12 | 10/12 |
| Within 60 s | 9/12 | 11/12 |
| Within 90 s | 10/12 | 12/12 |
| Mean correct-page time | 71.9% | 90.3% |
| Mean wrong-page time | 1.53% | 0% observed |

The remaining two acquisitions were late, approximately 43 and 65 seconds. Six synthetic negative controls had zero false selections. Neither result establishes a real-hall false-positive rate or population accuracy. Do not add correct-page time percentages to acquisition percentages; they measure different things.

Authoritative development evidence, relative to the research workspace:

- `reports/E103-screen/result-summary.json`: full cached development screen.
- `reports/E103-screen/progress.json`: per-case completion and trace hashes.
- `reports/E102-native/comparison.json` and `reports/E105-native/comparison.json`: selected uncached confirmations of gains, not a full native confirmation of all 18 cases.
- `reports/E112-launch/matching-parity.json`: earlier T1 acquisition logic parity evidence.

The final UI did not change matching rules, but the final PR has not been subjected to a fresh representative room-microphone evaluation. **The 85% Level 2 goal remains unproven.**

## PR validation

Results are stored outside Git under `reports/compact-ui/` in the research workspace:

- `pr-tests.tap`: **91 passed**, 3 optional historical-baseline reproductions skipped.
- `pr-policy.tap`: **30 passed**.
- `pr-policy-eval.log`: all policy KPIs passed.
- `pr-build.log`: Babel compiled 253 files; SCSS compiled successfully.
- `pr-lint-clean.json`: changed Voice Follow code passes lint; `app.js` has pre-existing console warnings.
- `base-full-lint.json` versus `pr-full-lint.json`: base has 127 lint findings, PR has 116; no newly introduced message signatures.
- `pr-full-test.log`: full `npm test` is not green because repository-wide lint has existing failures. Do not report the entire suite as green.

Reproduction (Node 18, dependencies installed):

```sh
cd /tmp/sttm-voice-follow-pr
VF_BANIDB_USER_DATA='/Users/jashansc/Library/Application Support/SikhiToTheMax' npm run test:voice-follow
npm run test:unit
```

Database-dependent tests skip without `VF_BANIDB_USER_DATA`. The three historical-baseline reproductions additionally require an external frozen source and are optional. Commands on another machine must use that machine's actual profile path.

## Data and runtime assets

- Node used here: `/opt/homebrew/opt/node@18/bin/node`.
- Canonical database: `/Users/jashansc/Library/Application Support/SikhiToTheMax/sttmdesktop-evergreen-v2.realm`; schema alongside it.
- Model: `/private/tmp/vf-bench/model/model.int8.onnx`.
- Persistent app model: `/Users/jashansc/Library/Application Support/SikhiToTheMax/voice-follow/model.int8.onnx`.
- Previously verified model SHA-256: `5f9e41d867dee2883796e290eef85abc11cbd32fe0f10c1f763a638d824634f9` (184311219 bytes).
- Original room-microphone recording: `/Users/jashansc/Documents/new-kirtan.mov`.
- Renton dataset manifest: `data/live-darbar-renton-v3/live-darbar-renton-dataset.json` in the research workspace.

Renton cuts supplied by the user:

| Video ID | Source interval, seconds |
| --- | --- |
| `_Q8mZ5rqA2w` | 0–450; 480–1414 |
| `-E-PjJz00j8` | 910–1570; 1610–2666 |
| `h37nNWBwZxk` | 1141–2308 |

Five cuts total 71m07s. Continuous timelines including gaps total 72m17s. These are three recordings from one venue/channel, not a broadly independent evaluation sample.

Main-Shabad labels may contain brief pramaans, Aarti sequences, or Simran. A differing Shabad ID is **unadjudicated**, not automatically incorrect. In particular, the cut around `h37nNWBwZxk` source 19:25–20:00 needs audio review: candidate Shabad 749 / verse 10642 may be a genuine pramaan rather than a wrong switch. Use canonical IDs and audio review, not a model-generated transcription, to settle this.

## Paused work — inspect before resuming

Heavy benchmarks were SIGSTOP-paused to avoid competing with the user's live microphone test. No confirmation to resume has been received. At handoff, these exact processes still exist in stopped state:

| Process | PID | Work |
| --- | ---: | --- |
| Python parent | 49762 | E097 continuous Renton context candidate |
| Node child | 51838 | E097 second recording |
| Python parent | 52264 | E110 native emissions-reuse validation |
| Node child | 52273 | E110 first selected case |

The running app was PID 65792 at handoff. Never kill/restart arbitrary Electron or Node processes by name. Revalidate PID, command, working directory, and ownership first.

- E097: `reports/E097-full-candidate.py`, output `reports/E097-renton-full/`. First recording completed; second paused; third not started. First span's Shabad events were unchanged from baseline after a 0.512-second earlier initial lock. No broad accuracy improvement established there.
- E110: `reports/E110-native-run.py`, output `reports/E110-native/`. First of two selected cases paused, zero completed results in progress file.
- Pause record: `reports/live-test-benchmark-pause.json`.
- `progress.json` says `running` for both, but the OS process state is stopped. Do not trust that file alone.

When the user is finished testing, inspect the existing jobs before resuming. Wall-clock subprocess timeouts may expire immediately after a long pause; preserve failure records and outputs. Do not start duplicate jobs because a poll timed out. Paused runs cannot support uninterrupted real-time-factor or latency claims.

Native replay failures previously traced to ONNX telemetry teardown. Recent launches used `ORT_DISABLE_TELEMETRY=1` before initialization. That is a launch-environment mitigation, not a committed product fix or proof the issue can never recur.

## Next steps, in order of value

1. **Review PR #3 / respond to feedback.** Do not merge without the user's instruction. Preserve the selected MVP refined UI and the centered initial Start button.
2. **Get actual live-test observations:** correct Shabad, approximate delay, wrong switches, and flicker with recording/time references. Separate microphone signal, acquisition delay, and projection behavior.
3. **Finish the paused validations when the user is no longer testing.** Compare continuous Renton traces to baseline and adjudicate departures rather than treating broad labels as exact ground truth.
4. **Reduce duplicate inference if validated.** Isolated candidate `research/variants/E114-T1-reuse.jsx` combines T1 matching with emissions reuse. `research/E109-engine/recognizer.js` proposes `getLastEvidence()` guarded by exact PCM identity. E108 cached screen preserved all 18 case actions with 179 reuse accesses and zero extra verification inferences. E109/E113 safety checks passed; E110 actual native validation remains unfinished. Restore relative module imports before any promotion; do not copy prototype absolute paths into product code.
5. **Investigate fallback flicker separately.** `reports/E115-seeking-duration-audit.json` and `E115-seeking-outcomes.json`: four seeking intervals in the development screen returned without selecting a new Shabad; three lasted 2.56 seconds. This is not proof of the user's observed rendering flicker and does not justify weakening wrong-switch protection without tests.
6. **Collect fresh held-out Level 2 recordings across different diwans/microphones/rooms.** Keep whole recordings separated from tuning. Score correct acquisition by 20/30/60 seconds, wrong projected Shabad exposure, abstention/holding, transitions, and actual wall-clock delay. Report recording-level uncertainty; overlapping starts are correlated.
7. Only choose longer context, alternate retrieval, acoustic changes, or finetuning after failure analysis identifies the bottleneck. Optimize for robust product quality, not another small gain on the same reused cases. Level 3 expansion follows reliable Level 2 behavior.

The persistent research goal was last marked blocked while waiting for live testing to finish; PR/UI work is complete for the latest requests, but the long-term accuracy goal is not. Keep future status reports explicit about that distinction.
