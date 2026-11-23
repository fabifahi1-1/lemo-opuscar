"""Word times from the timing sheet (for sounds that land on a spoken word)."""
import json
TL = json.load(open('/home/user/lemo-opuscar/film/data/timing.json'))
LN = {l['id']: l for l in TL['lines']}
def W(lid, words):
    out, used = [], set()
    for w in words:
        for i, x in enumerate(LN[lid]['wordtimes']):
            if i not in used and x['w'] == w: out.append(x['t0']); used.add(i); break
        else: raise KeyError(f'{w} not in {lid}')
    return out
