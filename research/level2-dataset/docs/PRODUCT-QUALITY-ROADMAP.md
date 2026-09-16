# Voice Follow: quality-first route to dependable Level 2

Latest user clarification:95% was an arbitrary initial aspiration. The current desired outcome is more than85% combined fast and acceptably delayed matches, with careful Vaheguru fallback at low confidence. The acceptable-delay cutoff remains to be agreed. References to95% below describe the earlier checkpoint, not a binding current requirement. Preserve the quality-first diagnostic strategy and separately measure confidently incorrect displays and fallback reliability. See LEVEL-2-PLAN.md for the updated metric definition and current acquisition-time breakdown.

Decision checkpoint: 2026-09-14, after E085–E087. The user prioritizes durable product quality over quick benchmark gains. The existing 95% release targets remain aspirations to establish through evidence, not a prediction that the current model or architecture can meet them.

## Correct the scope of the reported baseline

The older 12 scenarios are four distinct Shabads in four recordings, each entered at three different positions. They are not 12 independent Shabads or hall events. The exact inventory, canonical reference lines and offsets are in reports/reference-test-inventory.json. The 71.9% labeled correct-display case mean is a development result, not an estimate of real-Darbar population performance. Its original labels are reported as author-reviewed; our canonical audit does not establish their sung timing or capture conditions.

The new Renton batch adds three same-venue/channel recordings and five broad cuts. Full replay is complete, but main-hint agreement is not whole-cut accuracy. Both pools have now influenced development and must not become an untouched final release test. Keep derivatives and offsets grouped by source/event. Record performer, venue, recording path and training overlap as unknown where unknown.

## What is known and what is still a hypothesis

- Known: exact canonical short inputs can be blocked by the current decision path. Model adaptation alone will not remove that rule.
- Known: admitting more short evidence through E082 helps one initial recovery but increases seeking elsewhere; E086/E087 do not support integration. Keep E065.
- Known: first-letter and full-text nomination can disagree; exact ties and an earlier sustained false full-text leader make broad acceptance unsafe.
- Unknown: how much of the remaining live-hall deficit comes from the acoustic model, information lost during decoding, candidate retrieval, temporal decision rules, capture conditions, or real-time scheduling/rendering. We have not measured an acoustic ceiling or established that rule changes alone can achieve95%.
- Unknown: whether a particular larger model, adapted model, vocal separator, or token-probability verifier improves this product on unseen Darbar events. Treat each as a testable candidate, not a promised solution.

## Highest long-term value: evaluation and failure attribution

Build an evaluation asset that survives model replacement. Start with influential intervals in existing recordings: initial identification, slow/missed entry, repeated short refrains, brief other passages, actual changes, pauses/Simran, recovery, and negative audio. Add stable successful intervals as controls so review selection is not failures only. A knowledgeable listener verifies what is sung; exact reference words come from canonical STTM/BaniDB. Projection and recognition may suggest review locations but cannot certify their own correctness.

Represent actual repetitions and passage boundaries, identifying evidence onset, uncertain content, and review provenance. Do not manufacture words, force alignment into a guessed Shabad, or silently omit hard attempts. Canonical ambiguity must remain explicit. Independent review is especially valuable for episodes that decide whether to adopt a change.

For each checked failure, record elapsed acquisition delay and lost correct-display time alongside the pipeline evidence. Report recoverable cases, unresolved cases and counterexamples. Do not claim mutually exclusive causal percentages where multiple stages interact. Match evaluation emphasis to the real product input: MacBook room microphone in a Darbar; a clean desk feed is a separate stratum.

## Compare the fundamental routes

| Route | Question it answers | Main tradeoff | Evidence needed to advance |
|---|---|---|---|
| Richer decoding and canonical audio verification | Is useful evidence present in the current model output but lost by taking one transcription? | More computation and complexity; canonical bias can favor a plausible but unsung passage | Recovery on checked failures without added false pages/seeking on controls and separate events |
| Temporal decision redesign | Can repeated evidence distinguish a real change from a weak moment without flicker? | Longer evidence accumulation can delay real changes; stale-page holding is also an error | Improved complete-episode display, transitions and recovery, with all waiting/stale time counted |
| Fine-tune an existing acoustic model on live Darbar | Does adapting to singing, instruments and room acoustics recover evidence that the current model misses? | Canonical audio labels, training compute, overfitting and loss of earlier capabilities | Held-out-event improvement and learning curves, plus preserved prior strata and native runtime |
| Compare a stronger/different model | Is the current representation the practical ceiling? | Memory, startup, sustained latency, deployment and possibly network dependence | Same checked episodes, independently calibrated on development data, measured CPU/memory and end-to-end quality |
| Input enhancement or different microphone/feed | Does capture dominate the gap? | Artifacts, extra delay, setup burden; may change the intended use case | Paired room/feed or raw/enhanced tests; retain ordinary room-microphone release reporting |

Our immediate technical hypothesis is richer use of the current model evidence with better temporal verification. This is favored by reproduced information-handling defects, not by a belief that training is unnecessary. Set a clear bounded test and stop the route if it cannot separate true and false candidates. Avoid an open-ended sequence of threshold tweaks.

CTC decoding with model logits and beam/language-model support is an established implementation option; its benefit for Gurbani kirtan remains unproven here. See [Hugging Face Wav2Vec2 documentation](https://huggingface.co/docs/transformers/model_doc/wav2vec2). Fine-tuning pretrained speech representations and evaluating domain mismatch are established research directions, but their speech-benchmark gains are not predictions for this product: [wav2vec2 paper](https://arxiv.org/abs/2006.11477), [domain-shift study](https://arxiv.org/abs/2104.01027).

## A sequence with decision gates

1. **Checked diagnosis set and candidate-recoverability report.** Reuse the full recorded evidence; no repeated full replay without a new hypothesis. Identify where the correct canonical candidate appears in richer recognition alternatives, where retrieval loses it, and where policy delays it. Any answer-assisted injection is explicitly an offline diagnostic, never normal inference or a headline score.
2. **Controlled decoder/verifier comparison.** Freeze current weights; compare existing decisions with richer evidence and calibrated verification. Check short phrases, canonical ties, the earlier E022 false leader, synthetic negatives and independent source groups. Replay cannot substitute for native real-time confirmation.
3. **Model comparison/adaptation if supported.** If useful canonical evidence is absent or the decoder cannot distinguish it, compare a suitable pretrained alternative and a small live-Darbar fine-tuning pilot. Begin with an explicitly budgeted, checked dataset; the previously suggested5–10hours is a pilot budget, not a sufficient-data claim. Track acquisition and page correctness as well as transcription errors. Keep training, validation and final-test event groups disjoint; record dataset reuse/permission eligibility before training.
4. **Integrate only a demonstrated improvement.** Separate recognition/candidate evaluation from presentation. A candidate being evaluated should not itself force visible instability. Count wrong pages, stale pages, seeking and manual intervention; a calm but wrong display is not quality. Canonical text is always retrieved by verified ID, never generated for display.
5. **Progressively broader complete-session validation.** Expand performers, venues, room acoustics, device positions and actual mid-performance starts. Report per-condition results and uncertainty, not only a pooled mean. Use untouched events and full sessions before claiming the95% targets, including missed attempts, real changes and actual microphone/UI behavior.

The next deliverable is a root-cause and recoverability comparison that tells us which fundamental route deserves investment. Do not promise a percentage gain or timeline without those results. Quality progress means fewer important failures on new events, reliable recovery and sustainable runtime—not a larger experiment count or a better score on four reused recordings.

## Product constraints that remain

Respect Satguru Ji's Bani in every stage. Canonical display text is immutable, normalized search representations are separate, and labels require content verification. User recollections and video captions are useful leads rather than authoritative text. An uncertain phrase may not uniquely identify a Shabad yet; reviewed identifying-evidence timing accounts for that without removing difficult attempts from the evaluation.

The95% target is a release gate to earn. A number of recordings alone does not establish statistical sufficiency, and correlated windows do not create independent evidence. There is no current claim that95% is achieved or guaranteed achievable under every microphone condition.
