"""Final assembly: clips/scene*.mp4 (concatenated, no re-encode) + out/mix.wav (two-pass loudnorm −14 LUFS, TP −1.5) → puss-in-boots.mp4.
If the film is over 95 MB, it is split into numbered pieces under 90 MB, cut only at keyframes inside quiet moments
(no narration, no music, no sound effect), so the pieces join back seamlessly in a video editor.
"""
import json, os, re, subprocess, sys, glob
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, 'out')
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
T = json.load(open(os.path.join(OUT, 'timeline.json'))); DUR = T['dur']; FPS = 24

clips = sorted(glob.glob(os.path.join(ROOT, 'clips/scene*.mp4')))
assert len(clips) == len(T['scenes']), f'{len(clips)} clips for {len(T["scenes"])} scenes'
lst = os.path.join(OUT, 'concat.txt'); open(lst, 'w').write(''.join(f"file '{c}'\n" for c in clips))
video = os.path.join(OUT, 'video.mp4')
run('ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', video)
nf = int(run('ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', video).stdout.strip())
want = sum(z['f1'] - z['f0'] for z in T['scenes'])
print('video frames', nf, 'expected', want); assert nf == want

# two-pass loudness normalisation of the mix
mix = os.path.join(OUT, 'mix.wav')
m = run('ffmpeg', '-hide_banner', '-i', mix, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-').stderr
j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,"
      "aresample=192000,alimiter=limit=0.84:attack=1:release=60:level=false,aresample=48000")
final = os.path.join(ROOT, 'puss-in-boots.mp4')
run('ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', mix, '-filter_complex', f'[1:a]{af}[a]', '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', final)
meas = run('ffmpeg', '-hide_banner', '-nostats', '-i', final, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', meas)[-1]); TPk = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', meas)[-1])
size = os.path.getsize(final) / 1e6
print(f'{final}: {size:.1f} MB, loudness {I} LUFS, true peak {TPk} dBTP')

# split if needed
for f in glob.glob(os.path.join(ROOT, 'puss-in-boots-*.mp4')): os.remove(f)
if size > 95:
    n = int(np.ceil(size / 86))
    kf = [float(x) for x in run('ffprobe', '-v', 'error', '-select_streams', 'v', '-skip_frame', 'nokey', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', video).stdout.split()]
    # quiet = no voice line, music bus silent, no sound effect within ±0.45 s
    VT = json.load(open(os.path.join(ROOT, 'script/vtime.json')))
    mus, sr = sf.read(os.path.join(OUT, 'music.wav')); mus = np.abs(mus).max(1) if mus.ndim > 1 else np.abs(mus)
    busy = [(L['t0'] - .45, L['t1'] + .45) for L in VT['lines']] + [(e['t'] - .45, e['t'] + 1.6) for e in T['ev']]
    def quiet(t):
        if any(a <= t <= b for a, b in busy): return False
        s0, s1 = int((t - .45) * sr), int((t + .45) * sr)
        return mus[max(0, s0):s1].max(initial=0) < 10 ** (-60 / 20)
    cuts = []
    for k in range(1, n):
        target = DUR * k / n; cands = [t for t in kf if quiet(t) and abs(t - target) < DUR / n * .45]
        cuts.append(min(cands, key=lambda t: abs(t - target)) if cands else None)
    assert all(c is not None for c in cuts), f'no quiet keyframe for every cut: {cuts}'
    edges = [0] + cuts + [None]
    for i in range(n):
        piece = os.path.join(ROOT, f'puss-in-boots-{i + 1}.mp4')
        a = ['-ss', f'{edges[i]:.3f}'] if edges[i] else []
        b = ['-to', f'{edges[i + 1]:.3f}'] if edges[i + 1] else []
        run('ffmpeg', '-y', '-loglevel', 'error', *a, *b, '-i', final, '-c', 'copy', '-avoid_negative_ts', 'make_zero', '-movflags', '+faststart', piece)
        print(piece, f'{os.path.getsize(piece) / 1e6:.1f} MB', f'from {edges[i] or 0:.2f} s')
    json.dump({'cuts': cuts}, open(os.path.join(OUT, 'cuts.json'), 'w'))
