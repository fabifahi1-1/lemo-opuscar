"""ffmpeg ebur128 readings of a delivered part's final audio (the AAC track in the .mp4).
usage: audio_check.py FILE.mp4 [FILM_START]   FILM_START = where the file starts in film time (s), default 0.
Reads: the whole file, every narration slot inside it and every pause between slots; prints a summary with the limits
(lines about -30 LUFS, pauses/opening fuller but momentary <= -20 LUFS, true peak <= -6 dBTP)."""
import json, re, subprocess, sys
F = sys.argv[1] if len(sys.argv) > 1 else '/home/user/lemo-opuscar/film/sample.mp4'
A = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
TL = json.load(open('/home/user/lemo-opuscar/film/data/timing.json'))
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', F], capture_output=True, text=True).stdout)
B = A + dur
def eb(a=None, b=None):
    af = (f'atrim=start={a}:end={b},asetpts=PTS-STARTPTS,' if a is not None else '') + 'ebur128=peak=true:framelog=verbose'
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-loglevel', 'verbose', '-i', F, '-vn', '-af', af, '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); tp = re.findall(r'Peak:\s+(-?[\d.]+|-inf) dBFS', r)
    M = [float(m) for m in re.findall(r'M:\s*(-?[\d.]+)\s+S:', r)]
    return dict(I=I, TP=float(tp[-1]) if tp and tp[-1] != '-inf' else None, Mmax=max(M) if M else None)
out = {'whole': eb()}
lines = [l for l in TL['lines'] if A - .01 <= l['start'] < B]
prev = max(A, TL['first_line_at'] if A == 0 else A)
if A == 0: out['opening 0-%.2f' % TL['first_line_at']] = eb(0, TL['first_line_at'])
for l in lines:
    if l['start'] - prev > .45: out[f'pause {prev:.2f}-{l["start"]:.2f}'] = eb(round(prev - A, 3), round(l['start'] - A, 3))
    out[f"{l['id']} {l['start']:.2f}-{min(B, l['end']):.2f}"] = eb(round(l['start'] - A, 3), round(min(B, l['end']) - A, 3))
    prev = l['end']
if B - prev > .45: out[f'tail {prev:.2f}-{B:.2f}'] = eb(round(prev - A, 3), round(dur, 3))
L = [v for k, v in out.items() if k.startswith('L')]; P = [v for k, v in out.items() if not k.startswith('L') and k != 'whole']
summ = dict(file=F, film_span=[round(A, 2), round(B, 2)], whole_TP=out['whole']['TP'], lines=len(L),
            line_I_range=[min(v['I'] for v in L), max(v['I'] for v in L)] if L else None, line_Mmax=max(v['Mmax'] for v in L) if L else None,
            pause_Mmax=max(v['Mmax'] for v in P) if P else None, max_TP=max(v['TP'] for v in out.values() if v['TP'] is not None))
summ['ok'] = bool(summ['max_TP'] <= -6 and (not L or (summ['line_Mmax'] <= -20)) and (not P or summ['pause_Mmax'] <= -20))
out['SUMMARY'] = summ
print(json.dumps(out, indent=1))
