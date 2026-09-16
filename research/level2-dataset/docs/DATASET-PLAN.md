# Live Darbar and smagam dataset

## What counts as evidence

The release target is a laptop used in a live hall. A sound-desk recording of a live event is valuable, but it is not equivalent to the laptop microphone in the room. Record capture provenance; retain paired room/desk recordings where possible. The two versions and all excerpts belong to the same group.

Keep three explicit pools:

1. **Development:** the user's September 13 recording, diagnosed failures, and any recordings inspected while choosing algorithms or thresholds.
2. **Regression:** existing checked reference recordings and Level 1 cases. Repeated offsets are useful scenarios but are not independent events. The four public reference recordings have unknown model-training overlap and no Shabad transitions; they cannot certify Level 2.
3. **Locked release evaluation:** recordings from independent live events, with checked labels and previously unseen performers/venues. Decide sampling and metrics before evaluating candidate releases. Do not tune on this pool; add a fresh locked pool after using it to diagnose a failure.

## Acquire data in stages

- Start with 12–20 independent live recordings, deliberately including slow/failing acquisition, several venues/performers, mid-Shabad joins, distant room capture, tabla/harmonium bleed, audience sound, and normal pauses. Include separate negative controls: instrumental-only stretches, Simran, Katha/Punjabi conversation, English announcements and silence. Label content categories rather than assuming every region is an ordinary Shabad.
- Expand based on coverage gaps and failure uncertainty, not the number of downloaded hours. Report effective event/performer/venue counts and concentration. Long recordings containing many excerpts still contribute one correlated group.
- For a 95% acquisition claim, sample size must support the claim. A one-sided exact 95% lower bound exceeds 95% after 59/59 independent successes; failures require a larger sample. This is a calculation for one binary KPI, not a guarantee that a 59-clip dataset establishes the entire release target. Time-coverage metrics need uncertainty across independent events and explicit capture strata.
- Keep Level 3 / AKJ smagam data visible as a harder stratum. Do not pool it with easier Level 2 examples to conceal either failure rate.

## Smart labeling without altering Gurbani

1. Preserve original audio, source URL, timestamps, source/event identity, performer/venue metadata when known, and file hash.
2. Use source titles, chapter names, captions and visible projection only to propose candidate Shabad IDs. Projection can be late or wrong, as the user's recording demonstrates.
3. Retrieve exact canonical text and IDs from STTM/BaniDB. Do not manufacture or autocorrect Gurbani text.
4. Check the audio and select the actual canonical verse/word spans sung, retaining repeats, partial lines, returns and uncertain boundaries. Keep unverified regions unscored and visibly outstanding. A training transcript must reflect actual sung words, not the full Shabad pasted over a clip.
5. Record first sung-word time, first identifying-evidence time, Shabad boundaries, verse/word intervals when possible, and nonsinging/negative categories. Mark ambiguity explicitly where words are shared across Shabads.
6. Review uncertain cases and a random sample of apparently easy labels independently. Model agreement can prioritize review but cannot approve its own labels. Track disagreement and timing tolerance; resolve using the audio and canonical source.
7. For a training pilot, use checked labels first. Automatically aligned or model-derived labels remain provisional and are excluded from release evaluation. Keep source recordings and derivatives together across splits.

## Source leads verified on 2026-09-14

- [Live Gurbani captioning benchmark](https://github.com/karanbirsingh/live-gurbani-captioning-benchmark-v1): four hand-reviewed source recordings and cold-start variants; canonical IDs/text and timestamps. Annotations are CC BY 4.0. All 61 current base-case annotated segments match the local BaniDB verse text and Shabad IDs exactly. Audio and annotations are now available locally. This is a regression resource, not a broad hall dataset.
- [AKJ official keertan archive](https://akj.org/keertan.php) and [Shabad search](https://akj.org/searchshabad.php): leads organized by events/locations and recordings. Use official links to collect event metadata and candidate labels. Metadata alone is not checked sung-word truth. Direct programmatic fetching returned HTTP 403 on this machine; the public pages were readable through web search. No attempt to bypass access controls.
- [AKJ official live broadcasts](https://akj.org/livestreaming.php): additional event leads. Verify actual audio/capture conditions and permissions before including in a training release.
- Existing Hugging Face kirtan dataset search results are leads only. Direct API reads returned 401 for the inspected candidate datasets; no dataset contents or licensing have been verified from those responses, and no data were acquired from them.

## Training decision

Do not begin expensive training merely because recognition sounds imperfect. First measure how often the correct candidate is recoverable from existing acoustic output, and whether the application can use that evidence. The September 13 example already demonstrates loss of useful words in retrieval/decision handling. If significant residual hall errors are acoustic after system fixes, prepare 5–10 hours of checked live audio as a small pilot, preserve independent evaluation groups, record the base model/license/training provenance, and compare complete-system outcomes and negative controls before expanding.

## Current readiness

- One user-confirmed live development recording with a Romanized recollection matching more than one canonical Shabad; identity and sung boundaries still require audio review.
- Four source-checked regression recordings; 12 correlated cold-start cases; 61 base-case verse segments verified against local BaniDB.
- No locked, statistically sufficient multi-venue release set yet.
- No completed training pilot and no claim that Level 2 has been achieved.

## Enforced canonical check

Run `/opt/homebrew/opt/node@18/bin/node test/voice-follow/canonical-labels.js --user-data '/Users/jashansc/Library/Application Support/SikhiToTheMax' --labels PATH --out REPORT --audio-duration SECONDS` from the repository. The validator compares canonical text exactly; it never autocorrects a mismatch. Add `--require-audio-review` for a pool that requires an explicit reviewer, date and `listened-against-canonical` declaration. Model agreement and a correct database match are insufficient to satisfy that declaration. Dataset independence and release statistics remain separate checks.

The public reference includes an annotation editor at `research/live-gurbani-captioning-benchmark-v1/docs/annotate.html`, which searches BaniDB. It has not been approved for this workflow: inspection found that imported labels can lose verse IDs and that gaps can disappear on round-trip export. Validate and repair those behaviors before using it to generate checked data; never assume an editor's output is authoritative just because it displays a canonical-looking line.

32 metadata leads from live-event YouTube searches are saved under `data/source-candidates/`. They are not acquired/checked audio or training labels. Four San Jose Raag Darbar parts belong to the same September 11–13 event and must remain one group; similarly, whole-event AKJ streams and their performer excerpts must not cross splits.

## Acquired source-audit pool and review tool

Eight predeclared live-stream excerpts are now local (32.63 minutes total); see E014 and `data/live-source-audit/acquired.json`. Six are Level 2 candidates across three venue hints, and two are AKJ smagam candidates. All remain unreviewed, with unknown capture chains and performer independence. They add **zero** checked release or training samples at present.

The repaired local annotation workflow is at http://127.0.0.1:8765 while its server is running. Start it from `/tmp/sttm-desktop` using:

```sh
/opt/homebrew/opt/node@18/bin/node test/voice-follow/annotation-server.js /Users/jashansc/Documents/ChatGPT/VF '/Users/jashansc/Library/Application Support/SikhiToTheMax' 8765
```

Select canonical verse IDs and intervals after listening; Bani text is read-only. Source-reference imports preserve gaps and exact IDs. Use “Edit / review” to review each imported interval; leave the declaration unchecked for drafts. Saves are local versioned JSON under `data/annotations/`, validated independently by the server and never automatically made training eligible. The declaration records who reviewed a passage; the interface cannot certify honest review or dataset independence.

## Follow-up public-source audit, 2026-09-14

A focused search did not establish a larger human-audited live release set. The public [V2 dataset card](https://huggingface.co/datasets/surindersinghssj/gurbani-kirtan-dataset-v2/blame/main/README.md) describes OCR/slide-derived labels and a fuzzy STTM match/cleaning pipeline; its stated style coverage is studio. These are leads, not checked live sung-word labels.

The [V4 SGPC card](https://huggingface.co/datasets/surindersinghssj/gurbani-kirtan-v4-sgpc) explicitly describes YouTube automatic-caption sources. Its large row count does not establish canonical correctness, audio review or independent-event coverage. The viewed [cleaned SGPC shard](https://huggingface.co/datasets/surindersinghssj/gurbani-kirtan-v4-sgpc-clean) exposes quality labels but only two video-ID classes in that displayed shard; a cleaning label is not independent auditory approval. No audio from these follow-up leads was acquired and no labels were admitted to a checked pool. Earlier direct API access failures remain unresolved; searchable cards do not establish current downloadable access.

## First reviewer handoff

[REVIEW-QUEUE.md](REVIEW-QUEUE.md) starts with three two-minute passages across venue hints, without model-suggested labels. This is a source audit, not a locked release evaluation. Audio-review participation is pending. E027 provides dedicated storage/scoring for identifying-evidence episode markers and natural versus constructed transitions. These require their own review declaration; ordinary verse intervals must not be silently substituted for that timing.

### Inventory checks (E044)

Run `node test/voice-follow/dataset-audit.js WORKSPACE NEW_REPORT.json` from the repo before using an inventory for experiments. It rejects unscoped expected Shabad IDs and known source/event/derivative overlap across protected splits. `derived_from` holds source recording IDs. Preserve earlier inventories before any split change: this checker cannot discover omitted exposure history or hidden source relationships. Event hints can conservatively join related recordings but cannot establish independence. Successful inventory validation grants neither label approval nor training/release eligibility. The current registry retains the user's recollection as ambiguous canonical search candidates only.

### Content review (E045)

The updated local editor saves content categories independently of canonical verses, including content-only drafts. Categories cover Shabad singing, Simran, Katha/Punjabi speech, spoken Bani recitation, instrumental audio, English speech, silence and uncertain/mixed content. Empty verse arrays are allowed in these review files, but remain invalid as canonical scoring labels. Content review requires its own listening declaration; it cannot approve verse identity or identifying-evidence timing. Gaps remain unknown, and categories do not automatically establish expected projection behavior or negative-control eligibility.

The editor is running on port 8765 with the new format. Existing draft tabs were preserved without reload. No actual hall categories were inferred or marked reviewed during the update. Synthetic browser/API fixtures are isolated under `reports/E045-review-probe/` and excluded from the dataset inventory.
