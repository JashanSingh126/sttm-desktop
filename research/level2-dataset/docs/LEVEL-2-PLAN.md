# Voice Follow: live Darbar hall reliability

Updated: 2026-09-14. Active release milestone: Level 2 (dependable live Gurudwara Darbar use). Further Level 3/AKJ experiments are deferred at the user's explicit request. The immediate next step is a small Level 2 baseline followed by one measured improvement; see NEXT-LEVEL-2-STEP.md. Owner priority: actual live Darbar use, highest return on effort first, evidence over inherited conclusions. Treat Satguru Ji's Bani respectfully; display canonical BaniDB text, never unverified model text as Gurbani.

## Latest user revision — combined timely and delayed matches

The user clarified that95% was an arbitrary initial target. The desired product outcome is now more than85% successful matches combining fast and acceptably delayed acquisition, with a Vaheguru fallback screen when confidence is low. The maximum acceptable delay is not yet defined. Treat the95% targets below as historical, not as binding current release requirements. Quality, canonical text integrity and careful fallback remain priorities.

Keep event acquisition and correct-page duration separate: a late successful acquisition counts in an eventual-match rate, while its waiting period reduces correct-display time. On the12 existing correlated development scenarios, the retained E065 system finds5 within20s, another4 between32.768 and43.168s, another1 at78.3s, another1 at169.984s, and never finds1. Thus9/12 within60s,10/12 within90s,11/12 eventually. These are first-labeled-singing timing anchors, not independently reviewed identifying-evidence timing or real microphone latency. They do not establish a representative hall rate.

Fallback quality must be measured separately: a system can be confidently wrong. The remaining unsuccessful cases cannot be presumed to be detected as low confidence. Measure incorrect/stale-page exposure, fallback coverage, recovery and unnecessary fallback on correct matches. Do not count fallback as a successful match. The user prefers Vaheguru presentation on low confidence; implementation and rendered behavior still need validation.

## Agreed tuning contract (2026-09-15) — Draft, pending user final check

Goal in plain words: the screen shows the Shabad being sung — quickly, steadily, and it switches cleanly.

- **Catch rate (CR).** Share of Shabads correctly shown within N seconds of identifying singing. Report the curve (10/20/30/60s). Primary: CR@20s (today 83% on the 573 development clips). Stretch: CR@30s toward 90%+. Rule: improving CR@20s beats improving CR@30s alone. Switcher metric. (Formerly LWR.)
- **Flicker rate (FR).** Flickers (wrong slide shown briefly, then self-corrects) per Shabad sung. A switch counts as committed only after the new Shabad holds 5s; anything reverting inside 5s is flicker — reported separately, never folded into wrong-catch rate. Target: as close to zero as possible. Primarily follower metric. (Formerly FFR.)
- **Right-line rate (RLR).** Share of sung time the highlighted line matches the line actually being sung. Catches what flicker rate misses: a screen can sit on the wrong line all Shabad without ever flickering. Target: as high as possible; line-lag distribution as diagnostic. Follower metric, needs line-level labels. New in this draft.
- **Wrong-catch rate (WCR).** Share of real Shabad changes where we commit to the wrong Shabad (held 5s+). Target: as close to 0% as possible. Guardrail: recall on real changes must not fall below today's baseline — WCR is never improved by refusing to switch. Switcher metric. (Formerly ISR.)
- **Switch delay (SD).** Seconds from a real Shabad change to the correct Shabad displayed and held. Report median and p95 on switch-capable events. Lower is better, never at flicker/wrong-catch expense. Order-of-magnitude rule: 10s to 5s matters, 5s to 4s does not. Switcher metric. (Formerly LBS.)

Measurement rules for all five: development clips for tuning, held-out recordings for verdicts; every number carries its denominator; stratified by Shabad rarity (common vs rare reported separately, never averaged away). Old acronyms (LWR/FFR/ISR/LBS) appear in experiment records before this date and map as noted. This contract, once approved, is the binding tuning target; the table below is history.

## Historical release targets (superseded by the clarification above)

| Measure | Target |
|---|---:|
| Correct acquisition within 20 seconds of identifying words | ≥95% of **all** attempts |
| Correct Shabad visible during labeled singing | ≥95% of time |
| Incorrect Shabad visible (including stale previous Shabad) | <5% of time |
| Never acquired | Zero observed, report denominator |
| Actual Shabad changes caught within 20 seconds | ≥95% |
| Level 1 and line/word following | Preserve validated baseline |

Also report acquisition within 10/20/30 seconds from first sung words, no acquired page / seeking-slide time, false acquisitions on negative audio, line-following accuracy where labeled, runtime lag, and manual corrections per complete Darbar. Do not count a seeking slide as correct. Report identifying-evidence latency as unavailable until a person labels the evidence onset. Missing annotations and short/truncated examples must stay visible.

## Order of work

1. **Trustworthy measurement and data audit.** Recover assets; execute the actual app decision path against the full BaniDB; separate measurements from answer-assisted diagnostics. Check labels, timing, dataset coverage, and replay fidelity.
2. **Live input diagnosis.** Inspect available room recordings; log transcripts, candidate entry/rank, decisions, and timing. Compare matched room-mic and desk feeds when available. Keep recording capture explicit and user initiated.
3. **Locate lost information.** Replay checked transcripts through retrieval; use true-candidate injection only in clearly labeled diagnostics; inspect inference and scheduling lag. Compare against the unchanged application on identical data.
4. **Focused system improvements.** Prioritize demonstrated retrieval, evidence handling, or runtime defects. Retain product changes only when acquisition improves without increased incorrect-page time, with Level 1/following checks.
5. **Acoustic adaptation if warranted.** Reproduce recognition failures on room audio. Evaluate available compatible models or a small training pilot; do not assume training is necessary or sufficient. Training labels must match words actually sung, including repetitions. Split entire recordings and derivatives together; preserve unseen performers/venues for final evaluation. Pilot size of 5–10 checked hours is an experiment budget, not a promise.
6. **Release verification.** 12–20 representative recordings initially, multiple performers/venues, success/slow/failure cases, negative controls, mid-Shabad starts, transitions, and complete live sessions. Simulated reverberation/noise tests are useful diagnostics, not evidence of success in a real hall.

## Verified assets

- Source: `/private/tmp/sttm-desktop`, branch `feature/voice-follow`, HEAD `8a5a89c`, baseline `1f5c51f` immediately below. No product changes at start. Preserve existing untracked `engine/engine.test.js`.
- Models, audio, legacy harness: `/private/tmp/vf-bench`. Existing ONNX model is 184,311,219 bytes. Node 18 and native dependencies load.
- Full BaniDB: local SikhiToTheMax application data, read-only for experiments.
- Historical notes/scripts: `research/reference`, recovered from `1f5c51f`. These are hypotheses and historical evidence, not current instructions or verified performance.
- Confirmed live test screen recording: `/Users/jashansc/Documents/new-kirtan.mov`, 310.67 seconds, stereo 48 kHz. User confirms live Darbar test with delayed/missed acquisitions and flickering. The user's Romanized recollection matches distinct canonical candidates: Shabad 300 / verse 4132 and Shabad 4093 / verse 48817. It does not uniquely establish the sung Shabad. Exact source rows are retained in `reports/E042-canonical-ambiguity.json`; exact sung boundaries and capture device remain unverified. Extracted mono audio and sampled UI frames are in `data/darbar-2026-09-13/`. Exact canonical text and database fingerprints are saved in `reports/user-recollection-canonical-verification.json`.

## Baseline caveats

- Current policy unit tests: 30/30 pass; synthetic policy KPIs pass except the documented sustained-spurious-evidence limitation. These do not establish recognition or hall reliability.
- Legacy 69.8% correct-page report is **not an accepted baseline**. The harness restricts the search field to manifest labels, uses a different initial acquisition policy, omits the actual follower/cursor, and treats some answer-assisted comparisons as product evidence.
- Legacy acquisition denominator excludes cases never proposed. It cannot measure the user's “never finds it” failure rate.
- The reconstructed 86-minute parquet contains 573 caption clips from **one** source video, automatic canonical labels, and records marked for review. Its manifest extends beyond the reconstructed audio. Validate rather than treating all 117 labeled segments as true Shabad changes.
- The old numeric-ID map is inferred by fuzzy matching and has unresolved entries. Validate against database cross-platform identifiers.

## Working discipline

Each experiment records hypothesis, source/model/data fingerprints, command, inputs, metrics, limitations, trend (positive/negative/mixed/unmeasured), and keep/reject decision in `EXPERIMENTS.md` plus machine-readable reports. Benchmark labels never enter normal retrieval. No tuning against final held-out recordings. No commits or publication without the user's explicit request.
