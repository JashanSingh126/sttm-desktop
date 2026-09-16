# First audio-review queue

Start with R01–R03: six minutes across three venue hints. These are source-audit passages selected without model predictions, not a release test. Every passage is currently unreviewed.

Use the [local canonical review tool](http://127.0.0.1:8765/). Select the matching video ID in Recording and review local time 0:00–2:00. Exact Bani comes from the read-only STTM/BaniDB selection; leave unclear regions unlabeled.

| Task | Venue hint | Event hint | Stratum | Audio |
|---|---|---|---|---|
| R01 | san-jose | san-jose-2026-09-06 | level2-candidate | [BygbNxDF8-w](/Users/jashansc/Documents/ChatGPT/VF/data/live-source-audit/BygbNxDF8-w/audio-16k.wav) |
| R02 | southall-park-ave | None | level2-candidate | [NL9rLlhcZZM](/Users/jashansc/Documents/ChatGPT/VF/data/live-source-audit/NL9rLlhcZZM/audio-16k.wav) |
| R03 | ontario-khalsa-darbar | None | level2-candidate | [54KtC_zwDpc](/Users/jashansc/Documents/ChatGPT/VF/data/live-source-audit/54KtC_zwDpc/audio-16k.wav) |
| R04 | san-jose | san-jose-2026-08-30 | level2-candidate | [l7wnFG6DoU0](/Users/jashansc/Documents/ChatGPT/VF/data/live-source-audit/l7wnFG6DoU0/audio-16k.wav) |
| R05 | southall-park-ave | None | level2-candidate | [R7ViCgoyY4w](/Users/jashansc/Documents/ChatGPT/VF/data/live-source-audit/R7ViCgoyY4w/audio-16k.wav) |
| R06 | ontario-khalsa-darbar | None | level2-candidate | [xDGiC2QVwjU](/Users/jashansc/Documents/ChatGPT/VF/data/live-source-audit/xDGiC2QVwjU/audio-16k.wav) |
| R07 | chandigarh | akj-chandigarh-2026-09-12 | level3-candidate | [A1JLy3lfZxg](/Users/jashansc/Documents/ChatGPT/VF/data/live-source-audit/A1JLy3lfZxg/audio-16k.wav) |
| R08 | hoshiarpur | akj-hoshiarpur-2026-06-18 | level3-candidate | [DjO5WXWELtk](/Users/jashansc/Documents/ChatGPT/VF/data/live-source-audit/DjO5WXWELtk/audio-16k.wav) |

For each passage:

1. Establish whether it contains Shabad singing, Simran, Katha/conversation, instrumental audio, an announcement, or uncertain content. Use “Describe the audio content” to save category intervals even when there are no verse labels. Leave unclear regions uncertain; declare content review only after listening. Capture provenance still belongs in the review handoff.
2. Listen and select exact canonical Shabad/verse IDs with actual sung boundaries, including repeats and partial lines. A projected page, caption, title, user recollection, or ASR result is only a search hint.
3. Save a draft first. Declare audio review only for intervals you actually checked against the recording; record your name and review date. Uncertain material stays unapproved.
4. Use the episode section to mark actual Shabad changes and when the heard words identify the Shabad. Declare episode review separately from verse review. Leave uncertain identifying-evidence times blank; do not infer them from when the model happened to succeed or substitute an ordinary verse boundary.
5. Leave microphone/capture chain, performer identity and event independence unknown unless you have source evidence. Sound alone does not prove a desk feed or room microphone.

The six Level 2 excerpts total twelve minutes in this first pass; the two Level 3 excerpts add four minutes. Longer review and independent second review are needed before any broad reliability claim. These passages already belong to development/source audit and cannot become the untouched release pool.

Machine-readable queue: [data/review-queue.json](data/review-queue.json). No labels, reviewer declarations, training eligibility or release eligibility have been fabricated.
