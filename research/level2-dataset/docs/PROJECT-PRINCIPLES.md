# Canonical Gurbani is authoritative

The user reiterated this requirement on 2026-09-14: this work serves Satguru Ji's Bani. All work, communication, UI, datasets, and experiments must be respectful.

- Never invent, rewrite, paraphrase into purported Gurbani, or silently correct Guru Ji's Bani.
- Treat the user's Romanized recollections as search hints too. Cross-check them against STTM/BaniDB before quoting Gurbani; do not reconstruct a line from memory or assume a word was present/absent in the recollection.
- A Romanized recollection or normalized search can match distinct canonical verses. Preserve each source exactly, retain ambiguity, and use distinguishing canonical context before assigning a unique Shabad identity. Never resolve a tie by ID order.
- Obtain authoritative Gurbani text from STTM or BaniDB. Other sources can guide lookup but cannot replace that canonical check. Retain source identifiers and provenance.
- Display canonical source text exactly. Predictions select existing Shabad/verse IDs; free-form ASR output is not canonical text and must not be presented as Gurbani.
- Keep internal matching representations separate from authoritative text. Normalization for search is not an edit to the source and must never overwrite display text or labels.
- Treat model transcripts, YouTube titles/captions, automatic alignments, and the currently projected page as unverified evidence. They cannot establish what was actually sung on their own.
- Ground-truth annotation requires an audio-verified selection of canonical Shabad/verse IDs and correct timing. For training, repeated/partial sung words must be checked against the canonical source; omit uncertain samples instead of inventing text.
- Label uncertain observations explicitly. Never turn an acoustic prediction into a checked label merely because it matches a plausible verse.

## Statistical discipline

- Today's live recording is development evidence, not a release test.
- Use diverse, independent events/recordings and unseen performers/venues to validate broad claims. Multiple clips, noise variants, or cold starts from one source do not increase the independent sample count.
- Report denominators, confidence intervals, label quality, and known missing conditions. For independent all-success Bernoulli trials, the one-sided 95% exact lower bound is `0.05^(1/n)`; 20/20 gives about 86.1%, and 59/59 is the first all-success sample size whose lower bound exceeds 95%. This does not imply that 59 correlated clips certify reliability, nor certify every other KPI.
- Initial small experiments can reject defects or test mechanisms; they cannot justify a broad performance claim or a costly training route without further evidence.
- Do not call Level 2 complete until the specified acquisition, correct-page, incorrect-page, transition and regression requirements are supported by relevant checked live-hall data.

## Main Shabad versus brief passages

A main-Shabad time range does not establish uninterrupted singing of only that Shabad. Keep brief pramaans, other sung passages, chanting and Simran distinct when reported. Conversational timestamps remain approximate; do not turn them into exact word/evidence boundaries or automatically score every intervening selection as wrong. When the user refines a description, version the review, withdraw dependent error metrics and route decisions, retain original artifacts for the paper trail, and point active evaluation to the corrected review. Model agreement cannot settle the disputed label.
