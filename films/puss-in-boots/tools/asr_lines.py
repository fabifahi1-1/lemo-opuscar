"""script/lines.json → out/asr_lines.json (what Whisper should hear: the script words without brackets)"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = json.load(open(os.path.join(ROOT, 'script/lines.json')))
for l in L: l['asr'] = l['text'].replace('(', '').replace(')', '')
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True); json.dump(L, open(os.path.join(ROOT, 'out/asr_lines.json'), 'w'), indent=1)
