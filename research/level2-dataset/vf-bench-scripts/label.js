// Scratch: title-label downloaded clips via Realm FirstLetterEng + translit verify.
// Usage: PULL_DIR=/tmp/vf-bench/audio node /tmp/vf-bench/label.js
// Writes labels.json [{file, videoId, title, sid, titleScore, nLines}].
// Lines are pulled per shabad on demand by the harness (see loadLines).
const fs = require('fs');
const path = require('path');
const Realm = require('/tmp/sttm-desktop/node_modules/realm');
const anvaad = require('/tmp/sttm-desktop/node_modules/anvaad-js');
const { partialRatio } = require('/tmp/sttm-desktop/www/main/addons/voice-follow/engine/fuzz');

const APP = '/Users/jashansc/Library/Application Support/SikhiToTheMax';
const PULL = process.env.PULL_DIR || '/tmp/vf-bench/audio';
const ENTRIES = '/tmp/sttm-desktop/handoff/benchmark/playlist_entries.tsv';
const STOP = new Set(['the', 'a', 'of']);
const clean = (s) => s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
function titleParts(t) {
  const first = clean(t.split(/[|/]/)[0]);
  const words = first.split(' ').filter((w) => w && !STOP.has(w));
  return { first, fl: words.map((w) => w[0]).join('') };
}
function resolveByTitle(realm, title) {
  const { first, fl } = titleParts(title);
  if (fl.length < 2) return null;
  const tryFl = (f, op) => {
    try {
      return realm.objects('Verse')
        .filtered(`FirstLetterEng ${op}[c] $0 AND Source.SourceID = $1`, f, 'G')
        .slice(0, 80);
    } catch (_) { return []; }
  };
  let rows = tryFl(fl, 'BEGINSWITH');
  if (!rows.length) rows = tryFl(fl, 'CONTAINS');
  if (!rows.length && fl.length > 3) rows = tryFl(fl.slice(0, -1), 'BEGINSWITH');
  let best = null; let bs = -1;
  for (const r of rows) {
    const s = partialRatio(first, clean(anvaad.translit(r.Gurmukhi)));
    if (s > bs) { bs = s; best = r; }
  }
  if (!best) return null;
  return { sid: best.Shabads[0].ShabadID, titleScore: +bs.toFixed(1) };
}
(async () => {
  const realm = await Realm.open({
    path: path.join(APP, 'sttmdesktop-evergreen-v2.realm'),
    schema: require(path.join(APP, 'realm-schema-evergreen.json')).schemas,
    schemaVersion: require(path.join(APP, 'realm-schema-evergreen.json')).schemaVersion,
    readOnly: true,
  });
  const ent = {};
  for (const l of fs.readFileSync(ENTRIES, 'utf8').split('\n').filter(Boolean)) {
    const i = l.indexOf('\\t');
    if (i > 0) ent[l.slice(0, i)] = l.slice(i + 2);
  }
  const wavs = fs.readdirSync(PULL).filter((f) => f.endsWith('.wav')).sort();
  const out = [];
  for (const f of wavs) {
    const vid = f.replace(/\.wav$/, '');
    const title = ent[vid] || vid;
    const res = resolveByTitle(realm, title);
    let nLines = 0;
    if (res) {
      nLines = realm.objects('Verse').filtered('ANY Shabads.ShabadID == $0', res.sid).length;
    }
    console.log(`sid=${String(res ? res.sid : null).padStart(5)} title=${String(res ? res.titleScore : 0).padStart(5)} lines=${String(nLines).padStart(3)}  ${title.split(/[|/]/)[0].trim().slice(0, 44)}`);
    out.push({ file: f, videoId: vid, title: title.split(/[|/]/)[0].trim(), sid: res ? res.sid : null, titleScore: res ? res.titleScore : 0, nLines });
  }
  fs.writeFileSync(path.join(PULL, 'labels.json'), JSON.stringify(out, null, 1));
  realm.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
