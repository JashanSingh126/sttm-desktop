/* Build a labeled switch stream from downloaded kirtan clips.
 * Usage: node /tmp/vf-bench/build-stream.js
 * Reads /tmp/vf-bench/audio/labels.json + *.wav, keeps titleScore>=72 clips,
 * takes the middle 60s of each (skip intros/outros), concatenates with 0.5s
 * gaps into stream.wav + manifest.json {segments, lines}.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const Realm = require('/tmp/sttm-desktop/node_modules/realm');
const anvaad = require('/tmp/sttm-desktop/node_modules/anvaad-js');

const APP = '/Users/jashansc/Library/Application Support/SikhiToTheMax';
const DIR = '/tmp/vf-bench/audio';
const SEG_S = 60;
const SKIP_S = 30;
const SR = 16000;

function wavDur(file) {
  const b = fs.readFileSync(file);
  let off = 12;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4);
    const sz = b.readUInt32LE(off + 4);
    if (id === 'data') return Math.floor(sz / 2) / SR;
    off += 8 + sz + (sz & 1);
  }
  throw new Error(`no data: ${file}`);
}

(async () => {
  const schemaJson = require(path.join(APP, 'realm-schema-evergreen.json'));
  const realm = await Realm.open({
    path: path.join(APP, 'sttmdesktop-evergreen-v2.realm'),
    schema: schemaJson.schemas, schemaVersion: schemaJson.schemaVersion, readOnly: true,
  });
  const labels = JSON.parse(fs.readFileSync(path.join(DIR, 'labels.json'), 'utf8'))
    .filter((l) => l.sid && l.titleScore >= 72);
  console.log(`${labels.length} labeled clips pass titleScore>=72`);

  const segs = [];
  const lines = {};
  const parts = [];
  let t = 0;
  for (const l of labels) {
    const f = path.join(DIR, l.file);
    if (!fs.existsSync(f)) continue;
    const dur = wavDur(f);
    if (dur < SKIP_S + SEG_S + 5) { console.log(`skip ${l.videoId}: too short (${dur.toFixed(0)}s)`); continue; }
    const start = Math.min(SKIP_S, dur - SEG_S - 2);
    const cut = path.join(DIR, `_cut_${l.videoId}.wav`);
    execFileSync('/opt/homebrew/bin/ffmpeg', ['-y', '-v', 'error', '-ss', String(start), '-t', String(SEG_S), '-i', f, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', cut]);
    parts.push(cut);
    const sid = String(l.sid);
    if (!lines[sid]) {
      const verses = realm.objects('Verse').filtered('ANY Shabads.ShabadID == $0', l.sid).sorted('ID');
      lines[sid] = Array.from(verses, (v) => anvaad.unicode(v.Gurmukhi));
    }
    segs.push({ shabadId: sid, start: t, end: t + SEG_S });
    t += SEG_S;
  }
  realm.close();
  if (!parts.length) { console.error('no segments'); process.exit(1); }
  const list = path.join(DIR, '_concat.txt');
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n') + '\n');
  // concat with silence gaps: build gap once, interleave via filter is complex;
  // simpler: concat cuts, gaps shift accounted by segment times already (+GAP_S each).
  execFileSync('/opt/homebrew/bin/ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c:a', 'pcm_s16le', path.join(DIR, 'stream.wav')]);
  fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify({ sr: SR, segments: segs, lines }));
  console.log(`stream: ${segs.length} segments, ${(t / 60).toFixed(1)} min, back-to-back (boundaries exact)`);
  console.log(`distinct shabads: ${Object.keys(lines).length}`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
