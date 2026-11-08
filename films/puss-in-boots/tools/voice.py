"""Narration with Kokoro (offline): script/lines.json → voices/<id>.wav (24 kHz mono, trimmed) + voices/dur.json.
Run from anywhere with the library's Python:  $LIB/.venv/bin/python tools/voice.py [ids…]
- Narrator: af_heart (warm American female), slow.
- Asides (bracketed lines): a softer blend (af_heart + breathy af_nicole), a touch quieter: playful side comments.
- Shouted words: sentence case in the input (read as words), a little faster and brighter.
- Phoneme fixes from tools/lines.py PHON_SUBS (Carabas → KA-ra-bas).
"""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
LIB = os.environ.get('LIB') or os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, HERE)
from lines import PHON_SUBS
from kokoro_onnx import Kokoro

k = Kokoro(os.path.join(LIB, 'core/tts/kokoro-v1.0.onnx'), os.path.join(LIB, 'core/tts/voices-v1.0.bin'))
NARR = k.get_voice_style('af_heart')
ASIDE = .62 * k.get_voice_style('af_heart') + .38 * k.get_voice_style('af_nicole')
SPEED = {'narr': .8, 'title': .74, 'aside': .84, 'shout': .88}
# per-line fixes found by the speech-to-text check: (speed, [(phoneme from, to)])
OVR = {
  'L083': (.74, [('bᵻlˈɔŋd tʊ', 'bᵻlˈɔŋd, tʊ')]),
  'L091': (.74, [('ˈæskt ðə', 'ˈæskt, ðə')]),
  'L096': (.8, [('bˈɑː!', 'bˈæː!')]),
  'L117': (.74, []),
  'L129': (.72, [('slˈɪpt.', 'slˈɪːpt.')]),
  'L143': (.8, []),
}

lines = json.load(open(os.path.join(ROOT, 'script/lines.json'), encoding='utf-8'))
only = set(sys.argv[1:])
out = os.path.join(ROOT, 'voices'); os.makedirs(out, exist_ok=True)
durf = os.path.join(out, 'dur.json')
dur = json.load(open(durf)) if os.path.exists(durf) else {}
phon = {}
for L in lines:
    if only and L['id'] not in only: continue
    ph = k.tokenizer.phonemize(L['tts'], 'en-us')
    for a, b in PHON_SUBS: ph = ph.replace(a, b)
    sp_ = OVR.get(L['id'], (None, []))
    for a, b in sp_[1]: ph = ph.replace(a, b)
    phon[L['id']] = ph
    style = ASIDE if L['tone'] == 'aside' else NARR
    a, sr = k.create(ph, voice=style, speed=sp_[0] or SPEED.get(L['tone'], .86), lang='en-us', is_phonemes=True)
    nz = np.where(np.abs(a) > np.abs(a).max() * .02)[0]
    a = a[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.1 * sr)]
    sf.write(os.path.join(out, f"{L['id']}.wav"), a.astype(np.float32), sr)
    dur[L['id']] = round(len(a) / sr, 3)
    print(L['id'], dur[L['id']], L['tone'], '|', L['tts'], '|', ph, flush=True)
json.dump(dur, open(durf, 'w'), indent=1)
json.dump(phon, open(os.path.join(out, 'phonemes.json'), 'w'), indent=1, ensure_ascii=False)
