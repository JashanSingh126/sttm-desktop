# Level 2 dataset handoff (2026-09-15)

## What this is
Development/benchmark data for Voice-Follow "Level 2" (dependable live
Gurudwara Darbar use). Built by a prior agent ("Astra") on 2026-09-15,
pushed here so a new agent can continue. Product code is untouched on
`feature/voice-follow` (commit 42380ec); this handoff lives on branch
`level2-dataset-handoff` under `research/level2-dataset/`.

## What Astra did
- Defined `protocol.json`: target 80+ Shabad episodes, 5+ venues, 30+
  independent recordings. Renton = development/regression, unseen venues =
  evaluation. Truth must be canonical STTM/BaniDB IDs; publisher titles,
  slides, and ASR are separate provenance fields, never ground truth.
- Downloaded 20 official SGPC Harmandir Sahib broadcasts and cut 80
  "which-Shabad-is-this" tests (61 unique Shabads) + 13 projection
  transitions (`overlay-cases/summary.json`).
- Labeled 3 Renton recordings with broad timestamp cuts (`renton-labels/`,
  user-supplied cuts, main-Shabad agreement only).
- Discovered but did NOT download: Southall UK (20 videos), Fremont (8),
  Surrey (8), Ontario + San Jose channels. Links in `discovery/`.

## What is in this push (small files only, ~2.4MB)
- `discovery/` — venue search results with video URLs (re-downloadable).
- `overlay-labels/` — per-video projection-slide labels (11 files).
- `overlay-cases/` — aggregates: cold-starts, transitions, excluded, summary.
- `renton-labels/` — 3 verified-broad Renton label files.
- `protocol.json`, `pilot-plan.json`, `overlay-plan.json`, `sample-plan.json`.
- `vf-kirtan-switch-eval.js`, `run_kpis.sh` — the switch eval harness + KPI runner.

## What is NOT pushed (local only, ~21GB)
Audio, video, frames, metadata dumps, and the 170MB canonical corpus stayed
local because GitHub cannot take them. Locations on the source machine:
- `/Users/jashansc/Documents/ChatGPT/VF/data/level2-scale-v1/overlay-audio/`
  (20 video dirs, 77 cut clips + originals)
- `/Users/jashansc/Documents/ChatGPT/VF/data/level2-scale-v1/overlay-frames/`,
  `overlay-hd-frames/`, `metadata/`, `canonical-corpus.json`
- `/Users/jashansc/Documents/ChatGPT/VF/data/darbar-2026-09-13/`
  (5.2-min live room recording, mono + stereo + screen frames)
- `/tmp/vf-bench/` (86-min Amritsar caption-clip set: eval-canonical.parquet,
  kirtan86.wav — machine labels, mostly unreviewed, REJECTED as verdict data)
Re-fetch video audio with yt-dlp using the URLs in `discovery/` and the
`url` fields in `overlay-labels/*.json`.

## Known limitations (do not overclaim)
- Overlay labels are publisher projection slides, `unreviewed` — slides can
  lag, lead, or be wrong. Not verified sung Shabads.
- Single broadcast venue (Harmandir Sahib), broadcast mix — nothing about
  diaspora Gurudwara room mics.
- Cut starts are not verified singing onsets; no line-level labels.
- The 573-clip caption set is machine-labeled (311/573 flagged review) and
  rejected for verdict use by the user.

## Agreed tuning contract (user-approved 2026-09-15, plain names)
Goal: the screen shows the Shabad being sung — quickly, steadily, cleanly.
- Catch rate (CR): share of Shabads correctly shown within N seconds of
  identifying singing. Curve 10/20/30/60s. Headline CR@20s (83% today on
  machine labels); stretch CR@30s to 90%+. Switcher metric.
- Flicker rate (FR): wrong slide shown briefly then self-corrects, per Shabad
  sung. Committed only after the new Shabad holds 5s. Follower metric.
- Right-line rate (RLR): share of sung time the highlighted line matches the
  sung line. Needs line-level labels. Follower metric.
- Wrong-catch rate (WCR): share of real changes committed to the wrong Shabad.
  Guardrail: recall must not drop — never improve by refusing to switch.
- Switch delay (SD): seconds from real change to correct Shabad held. Median
  + p95. Never at FR/WCR expense.
Rules: tune on machine-labeled data, judge on human-held-out; every number
carries its denominator; common vs rare Shabads reported separately.
Old acronyms LWR/FFR/ISR/LBS appear in earlier records and map to CR/FR/WCR/SD.

## Next steps for the receiving agent
1. Download Southall/Fremont/Surrey/Ontario videos from `discovery/` links.
2. Prep an 80-clip confirm-or-correct review kit (slide label pre-filled) for
   the user to verify by ear + mark identifying-singing onsets.
3. Add 15–20 sustained segments with line labels (unlocks FR + RLR).
4. Get room-mic full-darbar recordings (Renton/Fresno/Southall) with permission.
5. Freeze a held-out verdict split; never tune on it.
