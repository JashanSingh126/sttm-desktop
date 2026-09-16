/* Audio switch benchmark for Voice-Follow autopilot on real sung kirtan.
 *
 * Streams a concatenated multi-shabad kirtan WAV through the REAL engine
 * (Infer + Recognizer) and the REAL shipped switch policy
 * (switchPolicy.js nextSwitchWins/maxLineScore) with shipped constants.
 * Scores my KPIs: switch recall/latency, false switches, lock-in (#3),
 * on-correct/stale/erroneous time, and Waheguru slide precision/latency.
 *
 * Run (node 18):
 *   MODEL=/tmp/vf-bench/model/model.int8.onnx WAV=... MANIFEST=... \
 *   node /tmp/vf-bench/switch-eval.js [--cap-min N]
 *
 * Env overrides (defaults = shipped app config):
 *   SEARCH_WIN/FOLLOW_WIN/REC_HOP, SMIN/MARG/CONF, STRONG_MIN/STRONG_MARG,
 *   LEN_MIN, FL_MIN (first-letter propose gate, 0 = off), WAHE_WIN
 *   (wins that raise the Waheguru slide in the app; metrics only here).
 */
const fs = require('fs');
const path = require('path');

const DESK = '/tmp/sttm-desktop/www/main/addons/voice-follow';
const { Infer, norm } = require(path.join(DESK, 'engine/infer'));
const { Recognizer } = require(path.join(DESK, 'engine/recognizer'));
const { partialRatio } = require(path.join(DESK, 'engine/fuzz'));
const { nextSwitchWins, maxLineScore } = require(path.join(DESK, 'components/switchPolicy'));
const { toAsciiFL } = require('/tmp/vf-bench/flutil');
// App's vote gate (env): VOTEGATE=1 proposes only contenders with decayed
// first-letter votes >= MIN_VOTES, exactly like the component.
const VOTEGATE = parseInt(process.env.VOTEGATE || '0', 10);
const MIN_VOTES = parseFloat(process.env.MIN_VOTES || '6');
const VOTE_DECAY = parseFloat(process.env.VOTE_DECAY || '0.8');
const VOTE_MINFL = parseInt(process.env.VOTE_MINFL || '9', 10); // mirrors DETECT_MIN_LETTERS
const HYP_MIN = parseInt(process.env.HYP_MIN || '0', 10); // min heard-chars to count a win (hold otherwise)
// Numeric Realm shabadId -> manifest code (for the vote gate only).
let VOTETABLE = null;
if (process.env.VOTETABLE) {
  try { VOTETABLE = JSON.parse(require('fs').readFileSync(process.env.VOTETABLE, 'utf8')); } catch (_) {}
}
let NUM2CODE = null;
if (process.env.MAPFILE) {
  const m = JSON.parse(fs.readFileSync(process.env.MAPFILE, 'utf8'));
  NUM2CODE = {};
  for (const [code, sid] of Object.entries(m)) if (sid != null) NUM2CODE[String(sid)] = code;
}
// SUBSET=1: score recall/lock-in only on boundaries whose true code is mapped
// (fair denominator when comparing vote-gate runs against baselines).
const SUBSET = process.env.SUBSET === '1';

const WAV = process.env.WAV;
const MANIFEST = process.env.MANIFEST;
const MODEL = process.env.MODEL || '/tmp/vf-bench/model/model.int8.onnx';
const SR = 16000;
if (!WAV || !MANIFEST) {
  console.error('need WAV= and MANIFEST= env');
  process.exit(2);
}

const SEARCH_WIN = parseFloat(process.env.SEARCH_WIN || '10');
const FOLLOW_WIN = parseFloat(process.env.FOLLOW_WIN || '4');
const HOP = parseFloat(process.env.REC_HOP || '0.5');
const HYP_SLICE = parseInt(process.env.HYP_SLICE || '35', 10);
const SMIN = parseFloat(process.env.SMIN || '0.65');
const MARG = parseFloat(process.env.MARG || '0.15');
const CONF = parseInt(process.env.CONF || '3', 10);
const STRONG_MIN = parseFloat(process.env.STRONG_MIN || '0.8');
const STRONG_MARG = parseFloat(process.env.STRONG_MARG || '0.3');
const LEN_MIN = parseFloat(process.env.LEN_MIN || '15');
const FL_MIN = parseInt(process.env.FL_MIN || '4', 10); // propose gate; 0 = off
// Two-signal tier: when the first-letter proposer STRONGLY names the contender
// (heard run vs contender opening LCS >= FL_STRONG), relax the acoustic bar to
// SMIN_STRONG/MARG_STRONG — trust the detector where the acoustic judge is weak
// (KPI #3: proposer finds it, judge won't commit). FL_STRONG=0 disables.
const FL_STRONG = parseInt(process.env.FL_STRONG || '0', 10);
const SMIN_STRONG = parseFloat(process.env.SMIN_STRONG || '0.5');
const MARG_STRONG = parseFloat(process.env.MARG_STRONG || '0.1');
const WAHE_WIN = parseInt(process.env.WAHE_WIN || '2', 10); // app raises Waheguru at wins>=2
// MULTI: parallel contenders tracked (top-MULTI by score). 1 = legacy single.
const MULTI = parseInt(process.env.MULTI || '1', 10);
// Knockout: a single overwhelming decode commits immediately. The confusion
// zone tops out far below, so a lone 0.95/0.4 decode is near-certain.
// KNOCK_MIN=0 disables.
// Windowed voting: commit when ≥2 of the last 3 decodes win (any order),
// instead of requiring consecutive wins. Targets spiky real evidence
// (W,W,L,W,W,… never commits under consecutive-3). VOTE_W=0 disables.
const VOTE_W = parseInt(process.env.VOTE_W || '0', 10);
const KNOCK_MIN = parseFloat(process.env.KNOCK_MIN || '0');
const KNOCK_MARG = parseFloat(process.env.KNOCK_MARG || '0.4');
const LOCK_MIN = 0.6;
const LOCK_STABLE = 2;

function readWavFloat32(file) {
  const b = fs.readFileSync(file);
  let off = 12;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4);
    const sz = b.readUInt32LE(off + 4);
    if (id === 'data') {
      const n = Math.floor(sz / 2);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = b.readInt16LE(off + 8 + i * 2) / 32768;
      return out;
    }
    off += 8 + sz + (sz & 1);
  }
  throw new Error(`no data chunk in ${file}`);
}

async function main() {
  const args = process.argv.slice(2);
  const capIdx = args.indexOf('--cap-min');
  const capMin = capIdx >= 0 ? parseFloat(args[capIdx + 1]) : null;

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const linesNormBySid = {};
  const flBySid = {};
  const firstLetters = (s) => s.split(/\s+/).filter(Boolean).map((w) => w[0]).join('');
  for (const [sid, lines] of Object.entries(manifest.lines)) {
    linesNormBySid[sid] = lines.map((l) => norm(l)).filter(Boolean);
    flBySid[sid] = firstLetters(lines.join(' '));
  }
  const allSids = Object.keys(linesNormBySid);
  const lcs = (a, b) => {
    if (!a || !b) return 0;
    let best = 0;
    const dp = new Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i++) {
      let prev = 0;
      for (let j = 1; j <= b.length; j++) {
        const t = dp[j];
        dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : 0;
        if (dp[j] > best) best = dp[j];
        prev = t;
      }
    }
    return best;
  };
  // Mirror the app: the length penalty applies to the CANDIDATE only; the
  // current shabad is scored raw (its cursorLineScore is untouched).
  const scoreSid = (hypNorm, sid, isCurrent) => maxLineScore(hypNorm, linesNormBySid[sid], isCurrent ? 0 : LEN_MIN);

  let total = readWavFloat32(WAV);
  if (capMin) total = total.slice(0, Math.floor(capMin * 60 * SR));
  const durS = total.length / SR;
  const truth = manifest.segments
    .filter((s) => s.start < durS)
    .map((s) => ({ id: String(s.shabadId), start: s.start, end: Math.min(s.end, durS) }));
  console.log(`stream: dur=${(durS / 60).toFixed(1)}min shabads=${allSids.length} segments=${truth.length} boundaries=${truth.length - 1}`);

  const infer = await Infer.create(MODEL);
  let rec = new Recognizer(infer, { inputSr: SR, hopS: HOP, windowS: SEARCH_WIN });

  let phase = 'searching';
  let curId = null;
  let lockCand = null;
  let lockCount = 0;
  let switchCand = null; // { id, wins } (legacy mirror)
  let switchCands = new Map(); // id -> { id, wins, hist } (parallel tracking)
  const voteMap = new Map(); // shabadId -> decayed first-letter votes (app replica)
  const recentVoted = new Map(); // numeric shabadId -> last vote t (backstop field)
  let lastCommitT = -1e9;
  const events = []; // { t, from, to, sCur, sCand }
  const hypLog = []; // { t, hyp } every decode (for DIAG rescoring)
  if (process.env.HYPLOG) {
    process.on('exit', () => {
      try { fs.writeFileSync(process.env.HYPLOG, JSON.stringify(hypLog)); } catch (_) {}
    });
  }
  const waheIntervals = []; // { up, down } slide-up/down times
  let waheUp = -1;
  const contLog = [];

  const setWahe = (t, on) => {
    if (on && waheUp < 0) waheUp = t;
    if (!on && waheUp >= 0) { waheIntervals.push({ up: waheUp, down: t }); waheUp = -1; }
  };

  const CHUNK = Math.floor(0.1 * SR);
  const t0 = Date.now();
  for (let p = 0; p < total.length; p += CHUNK) {
    const chunk = total.slice(p, p + CHUNK);
    const tNow = (p + chunk.length) / SR;
    const rout = await rec.push(chunk);
    if (rout && rout.text) {
      if (process.env.FLSTAT) {
        global.__fl = global.__fl || [];
        if (global.__fl.length < 3000) global.__fl.push(toAsciiFL(rout.text).length);
      }
      const hypNorm = norm(rout.text).slice(-HYP_SLICE);
      if (process.env.HYPLOG && hypLog.length < 400000) hypLog.push({ t: tNow, hyp: hypNorm, raw: rout.text });
      const hfl = firstLetters(rout.text).slice(-8);
      if (phase === 'searching') {
        let bestId = null;
        let bestS = -1;
        for (const sid of allSids) {
          const s = scoreSid(hypNorm, sid, false);
          if (s > bestS) { bestS = s; bestId = sid; }
        }
        if (bestS >= LOCK_MIN) {
          if (bestId === lockCand) lockCount += 1;
          else { lockCand = bestId; lockCount = 1; }
          if (lockCount >= LOCK_STABLE) {
            curId = bestId;
            phase = 'following';
            events.push({ t: tNow, from: null, to: curId });
            lockCand = null; lockCount = 0; switchCand = null; switchCands = new Map(); voteMap.clear();
            lastCommitT = tNow;
            rec = new Recognizer(infer, { inputSr: SR, hopS: HOP, windowS: FOLLOW_WIN });
          }
        }
      } else {
        // Contender set: with VOTEGATE=1, the app's decayed first-letter vote
        // tally proposes (top-MULTI non-current at >= MIN_VOTES); otherwise the
        // legacy acoustic argmax (VOTEGATE=0) or LCS proxy gate (FL_MIN>0).
        let topK = [];
        if (VOTEGATE > 0) {
          const fl = toAsciiFL(rout.text);
          if (fl.length >= VOTE_MINFL) {
            for (const [k, v] of voteMap) {
              const nv = v * VOTE_DECAY;
              if (nv < 0.4) voteMap.delete(k);
              else voteMap.set(k, nv);
            }
            const seenQ = new Set();
            const qs = [];
            const addQ = (q, w, type) => {
              if (!q || q.length < 4 || qs.length >= 16) return;
              const key = `${type}:${q}`;
              if (seenQ.has(key)) return;
              seenQ.add(key);
              qs.push({ q, w, type });
            };
            addQ(fl.slice(0, Math.min(fl.length, 8)), 12, 0);
            for (const k of [8, 6, 5, 4]) {
              if (fl.length < k) continue;
              for (let s = fl.length - k; s >= 0; s -= 1) addQ(fl.slice(s, s + k), k, 1);
            }
            const tail = fl.slice(-8);
            for (let d = 1; d < tail.length - 1; d += 1) {
              addQ(tail.slice(0, d) + tail.slice(d + 1), tail.length - 1, 1);
            }
            const results = VOTETABLE
  ? qs.map((g) => (VOTETABLE[`${g.type}:${g.q}`] || []).map(([shabadId]) => ({ shabadId })))
  : await Promise.all(qs.map((g) => banidb.query(g.q, g.type, 'all', 8).catch(() => [])));
            results.forEach((rows, qi) => {
              const w = qs[qi].w;
              rows.forEach((row, i) => {
                if (row.shabadId == null) return;
                voteMap.set(row.shabadId, (voteMap.get(row.shabadId) || 0) + w * ((rows.length - i) / rows.length));
                recentVoted.set(row.shabadId, tNow);
              });
            });
          }
          if (process.env.VDBG && Math.random() < 0.02) {
            process.stderr.write(`VDBG fl len=${fl ? fl.length : -1} head=${JSON.stringify((fl || '').slice(0, 12))} text=${JSON.stringify((rout.text || '').slice(0, 30))}\n`);
          }
          if (process.env.VDBG && Math.random() < 0.002) {
            const top = [...voteMap.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3);
            process.stderr.write(`VDBG t=${tNow.toFixed(0)} mapsize=${voteMap.size} top=${JSON.stringify(top)} cache=${require('/tmp/vf-bench/banidb-local').cacheStats()}\n`);
          }
          topK = [...voteMap.entries()]
            .map(([sid, v]) => ({ code: NUM2CODE ? NUM2CODE[String(sid)] : null, v }))
            .filter((e) => e.code && e.code !== curId && e.v >= MIN_VOTES)
            .sort((a, b) => b.v - a.v)
            .slice(0, MULTI)
            .map((e) => ({ sid: e.code, s: scoreSid(hypNorm, e.code, false) }))
            .sort((a, b) => b.s - a.s);
          if (process.env.UNION === '1' || process.env.BACKSTOP_FIELD) {
            // Rescoring backstop: best text match joins the shortlist.
            // UNION=1: exhaustive field (all test shabads).
            // BACKSTOP_FIELD=recent: shabads with any vote in the last TTL_S
            // (bounded, app-feasible: no DB enumeration, lazy line loads).
            let best = null;
            let field = allSids;
            if (process.env.BACKSTOP_FIELD === 'recent') {
              const ttl = parseFloat(process.env.FIELD_TTL_S || '60');
              field = [...recentVoted.entries()]
                .filter(([sid, t]) => tNow - t < ttl)
                .map(([sid]) => NUM2CODE[String(sid)])
                .filter(Boolean);
            }
            for (const sid of field) {
              if (sid === curId || topK.some((e) => e.sid === sid)) continue;
              const sc = scoreSid(hypNorm, sid, false);
              if (!best || sc > best.s) best = { sid, s: sc };
            }
            if (best) topK = [...topK, best].sort((x, y) => y.s - x.s);
          }
        } else {
          const ranked = [];
          for (const sid of allSids) {
            if (sid === curId) continue;
            if (FL_MIN > 0 && lcs(hfl, flBySid[sid]) < FL_MIN) continue;
            ranked.push({ sid, s: scoreSid(hypNorm, sid, false) });
          }
          ranked.sort((a, b) => b.s - a.s);
          topK = ranked.slice(0, MULTI);
        }
        const contId = topK.length ? topK[0].sid : null;
        const contS = topK.length ? topK[0].s : -1;
        if (!switchCands) switchCands = new Map();
        const live = new Set(topK.map((c) => c.sid));
        for (const [id, sc] of [...switchCands]) {
          if (!live.has(id)) {
            sc.wins = Math.max(0, sc.wins - 1);
            if (sc.wins === 0) switchCands.delete(id);
          }
        }
        const sCur = scoreSid(hypNorm, curId, true);
        let committed = null;
        for (const { sid, s } of topK) {
          let sc = switchCands.get(sid);
          if (!sc) { sc = { id: sid, wins: 0, hist: [] }; switchCands.set(sid, sc); }
          const tierStrong = FL_STRONG > 0 && lcs(hfl, flBySid[sid]) >= FL_STRONG;
          if (hypNorm.length >= HYP_MIN) {
          const step = nextSwitchWins(sc.wins, s, sCur, {
            min: tierStrong ? SMIN_STRONG : SMIN,
            margin: tierStrong ? MARG_STRONG : MARG,
            strongMin: STRONG_MIN,
            strongMargin: STRONG_MARG,
          });
          sc.wins = step.wins;
          if (KNOCK_MIN > 0 && s >= KNOCK_MIN && s - sCur >= KNOCK_MARG) {
            sc.wins = CONF;
          }
          }
          let voteCommit = false;
          if (VOTE_W > 0) {
            sc.hist.push(step.wins > (sc._pw === undefined ? -1 : sc._pw));
            sc._pw = step.wins;
            if (sc.hist.length > 3) sc.hist.shift();
            voteCommit = sc.hist.length === 3
              && sc.hist[2]
              && sc.hist.filter(Boolean).length >= 2;
          }
          if (!committed && (sc.wins >= CONF || voteCommit)) {
            committed = { id: sid, sCand: s };
          }
        }
        // Legacy single-contender mirror for the display metric.
        switchCand = switchCands.get(contId) || null;
        if (contId !== null) contLog.push({ t: tNow, hfl });
        setWahe(tNow, [...switchCands.values()].some((sc) => sc.wins >= WAHE_WIN));
        if (committed) {
          events.push({ t: tNow, from: curId, to: committed.id, sCur, sCand: committed.sCand });
          curId = committed.id;
          switchCands = new Map();
          switchCand = null;
          voteMap.clear();
          setWahe(tNow, false);
          lastCommitT = tNow;
          rec = new Recognizer(infer, { inputSr: SR, hopS: HOP, windowS: FOLLOW_WIN });
        }
      }
    }
    if (p % (CHUNK * 3000) === 0 && p > 0) {
      process.stderr.write(`  ...${((100 * p) / total.length).toFixed(0)}% (${(tNow / 60).toFixed(1)}min audio, ${((Date.now() - t0) / 1000).toFixed(0)}s wall)\n`);
    }
  }
  if (waheUp >= 0) waheIntervals.push({ up: waheUp, down: durS });

  if (process.env.FLSTAT) {
    const a = global.__fl || [];
    a.sort((x, y) => x - y);
    const pct = (p) => (a.length ? a[Math.floor(a.length * p)] : -1);
    console.log(`FLSTAT n=${a.length} min=${a[0]} p50=${pct(0.5)} p75=${pct(0.75)} p90=${pct(0.9)} max=${a[a.length - 1]} frac>=9=${(a.filter((x) => x >= 9).length / (a.length || 1)).toFixed(2)}`);
  }
  // --- score ---
  const realBoundaries = [];
  for (let i = 1; i < truth.length; i++) {
    if (truth[i].id !== truth[i - 1].id) {
      if (SUBSET && NUM2CODE && !Object.values(NUM2CODE).includes(truth[i].id)) continue;
      realBoundaries.push(truth[i]);
    }
  }
  const lock = events[0];
  const lockOk = lock && lock.to === truth[0].id;

  let recall = 0;
  const latencies = [];
  for (const b of realBoundaries) {
    const ev = events.find((e) => e.from && e.to === b.id && e.t >= b.start - 0.5 && e.t <= b.end + 1.0);
    if (ev) { recall += 1; latencies.push(ev.t - b.start); }
  }
  // LOCK-IN #3: proposed (first-letter run matched target opening) but never committed.
  let lockProposed = 0;
  let lockCommitted = 0;
  const lockLat = [];
  for (const b of realBoundaries) {
    const prop = contLog.find((h) => h.t >= b.start - 0.5 && h.t <= b.end + 1.0 && lcs(h.hfl, flBySid[b.id]) >= FL_MIN);
    if (!prop) continue;
    lockProposed += 1;
    const ev = events.find((e) => e.from && e.to === b.id && e.t >= b.start - 0.5 && e.t <= b.end + 1.0);
    if (ev) { lockCommitted += 1; lockLat.push(Math.max(0, ev.t - prop.t)); }
  }
  const nowPlaying = (t) => {
    const s = truth.find((x) => t >= x.start && t <= x.end + 0.5);
    return s ? s.id : null;
  };
  const falseSwitches = events.filter((e) => e.from && e.to !== nowPlaying(e.t)).length;
  const nSwitchEvents = events.filter((e) => e.from).length;

  // --- DIAG: rescore each boundary's TRUE shabad across archived hyps.
  if (process.env.DIAG) {
    console.log('\nboundary evidence (trueId segLen maxTrue maxMargin outcome):');
    for (const b of realBoundaries) {
      let maxTrue = -1; let maxMarg = -99;
      for (const h of hypLog) {
        if (h.t < b.start - 0.5 || h.t > b.end + 1.0) continue;
        const sT = maxLineScore(h.hyp, linesNormBySid[b.id], LEN_MIN);
        // current = best of the PREVIOUS shabad's lines (what the judge compares against)
        const prevId = truth[truth.findIndex((x) => x.id === b.id && x.start === b.start) - 1];
        const sC = prevId ? maxLineScore(h.hyp, linesNormBySid[prevId.id] || [], 0) : 0;
        if (sT > maxTrue) maxTrue = sT;
        if (sT - sC > maxMarg) maxMarg = sT - sC;
      }
      const ev = events.find((e) => e.from && e.to === b.id && e.t >= b.start - 0.5 && e.t <= b.end + 1.0);
      console.log(`  ${b.id} len=${(b.end - b.start).toFixed(0)}s maxTrue=${maxTrue.toFixed(2)} maxMarg=${maxMarg.toFixed(2)} ${ev ? `COMMIT@${ev.t.toFixed(0)}s` : 'STUCK'}`);
    }
  }
  // UX time integration.
  const believedAt = (t) => {
    let b = null;
    for (const e of events) {
      if (e.t <= t) b = e.to;
      else break;
    }
    return b;
  };
  const segAt = (t) => {
    for (let i = 0; i < truth.length; i++) {
      if (t >= truth[i].start && t <= truth[i].end + 0.5) return i;
    }
    return -1;
  };
  const STEP = 0.2;
  let tCorrect = 0; let tStale = 0; let tErr = 0; let tSearch = 0;
  for (let t = 0; t < durS; t += STEP) {
    const si = segAt(t);
    if (si < 0) continue;
    const bel = believedAt(t);
    if (bel == null) tSearch += STEP;
    else if (bel === truth[si].id) tCorrect += STEP;
    else if (si > 0 && bel === truth[si - 1].id) tStale += STEP;
    else tErr += STEP;
  }
  const tTotal = tCorrect + tStale + tErr + tSearch || 1;

  // Waheguru metrics: an interval is "genuine" if a real boundary falls in [up-2, down].
  let waheGenuineT = 0;
  let waheT = 0;
  const waheLat = [];
  for (const w of waheIntervals) {
    waheT += w.down - w.up;
    const b = realBoundaries.find((x) => x.start >= w.up - 2 && x.start <= w.down);
    if (b) { waheGenuineT += w.down - w.up; waheLat.push(Math.max(0, w.up - b.start)); }
  }

  const med = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  console.log('\n=== MY KPIs (audio switch benchmark) ===');
  console.log(`ON-CORRECT:   ${((100 * tCorrect) / tTotal).toFixed(1)}%  (stale ${((100 * tStale) / tTotal).toFixed(1)}% / ERRONEOUS ${((100 * tErr) / tTotal).toFixed(1)}% / searching ${((100 * tSearch) / tTotal).toFixed(1)}%)`);
  console.log(`initial lock: ${lockOk ? 'OK' : 'WRONG/none'} (${lock ? lock.to : '-'} @ ${lock ? lock.t.toFixed(1) : '-'}s, truth ${truth[0].id})`);
  console.log(`SWITCH RECALL: ${recall}/${realBoundaries.length}` + (realBoundaries.length ? ` (${Math.round((100 * recall) / realBoundaries.length)}%)` : ''));
  console.log(`switch events: ${nSwitchEvents} (false: ${falseSwitches})`);
  console.log(`switch latency: avg ${avg(latencies).toFixed(1)}s med ${med(latencies).toFixed(1)}s`);
  console.log(`LOCK-IN #3:    ${lockCommitted}/${lockProposed}` + (lockProposed ? ` (${Math.round((100 * lockCommitted) / lockProposed)}%)` : '') + ` never-locked: ${lockProposed - lockCommitted}`);
  if (lockLat.length) console.log(`lock-in latency: avg ${avg(lockLat).toFixed(1)}s med ${med(lockLat).toFixed(1)}s`);
  console.log(`WAHEGURU:      ${waheIntervals.length} shows, ${waheT.toFixed(1)}s total, precision ${waheT ? Math.round((100 * waheGenuineT) / waheT) : 0}% genuine` + (waheLat.length ? `, slide latency med ${med(waheLat).toFixed(1)}s` : ''));
  if (process.env.EVENTS_OUT) {
    try { fs.writeFileSync(process.env.EVENTS_OUT, JSON.stringify(events)); } catch (_) {}
  }
  console.log('\nfirst 15 switch events (* = false):');
  events.filter((e) => e.from).slice(0, 15).forEach((e) => {
    const bad = e.to !== nowPlaying(e.t) ? ' *' : '';
    console.log(`  ${e.t.toFixed(1)}s ${e.from} -> ${e.to} [${e.sCand.toFixed(2)} vs ${e.sCur.toFixed(2)}]${bad}`);
  });
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });

