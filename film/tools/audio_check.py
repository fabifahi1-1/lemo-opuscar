"""ffmpeg ebur128 readings of the sample's final audio (the AAC track in the .mp4): whole file, the opening, every narration slot, the pauses."""
import json, re, subprocess, sys
F = sys.argv[1] if len(sys.argv) > 1 else '/home/user/lemo-opuscar/film/sample.mp4'
TL = json.load(open('/home/user/lemo-opuscar/film/data/timing.json'))
def eb(a=None, b=None):
    af = (f'atrim=start={a}:end={b},asetpts=PTS-STARTPTS,' if a is not None else '') + 'ebur128=peak=true:framelog=verbose'
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-loglevel', 'verbose', '-i', F, '-vn', '-af', af, '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); tp = re.findall(r'Peak:\s+(-?[\d.]+|-inf) dBFS', r); LRA = re.findall(r'LRA:\s+([\d.]+) LU', r)
    M = [float(m) for m in re.findall(r'M:\s*(-?[\d.]+)\s+S:', r)]
    return dict(I=I, TP=float(tp[-1]) if tp else None, LRA=float(LRA[-1]) if LRA else None, Mmax=max(M) if M else None)
out = {'whole': eb()}
out['opening 0-8.25'] = eb(0, 8.25)
prev = 8.25
for l in TL['lines']:
    if l['start'] < 25 and l['start'] - prev > .3: out[f'pause {prev:.2f}-{l["start"]:.2f}'] = eb(round(prev, 3), round(l['start'], 3))
    prev = l['end']
for l in TL['lines']:
    if l['start'] < 25: out[f"{l['id']} {l['start']:.2f}-{min(25, l['end']):.2f}"] = eb(round(l['start'], 3), round(min(25, l['end']), 3))
print(json.dumps(out, indent=1))
