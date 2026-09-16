# Scratch: rebuild the 86-min continuous kirtan stream from parquet clip audio.
# Places each clip at its start_s offset (16k mono); gaps stay silent.
# Output: /tmp/vf-bench/kirtan86.wav (matches handoff kirtan_manifest.json times).
import pandas as pd, numpy as np, soundfile as sf, io, wave

SR = 16000
df = pd.read_parquet('/tmp/vf-bench/eval-canonical.parquet').sort_values('start_s').reset_index(drop=True)
total_s = float(df.end_s.max()) + 2.0
out = np.zeros(int(total_s * SR), dtype=np.float32)
for _, r in df.iterrows():
    w = wave.open(io.BytesIO(r.audio['bytes']))
    raw = w.readframes(w.getnframes())
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    s0 = int(float(r.start_s) * SR)
    s1 = min(len(out), s0 + len(a))
    out[s0:s1] = a[:s1 - s0]
sf.write('/tmp/vf-bench/kirtan86.wav', out, SR, subtype='PCM_16')
print(f'wrote kirtan86.wav {(len(out)/SR)/60:.1f} min')
