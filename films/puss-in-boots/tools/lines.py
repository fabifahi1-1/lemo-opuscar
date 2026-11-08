"""Split script/script.txt into narration segments → script/lines.json.

Each segment keeps the script's words exactly (checked below against script.txt). Fields:
  id, text (exact script words), tts (what Kokoro reads; only spelling/punctuation help, never new words),
  who (speaker of the quoted words, for lip-sync), tone ('narr' | 'aside' | 'shout'), gap (silence before, s),
  asr (what Whisper is expected to hear, when it differs).
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

P, S, B = .95, .42, 1.6   # paragraph gap, sentence gap, scene-break gap (s)

# (text, who, tone, gap)  — gap = silence before this segment
SEG = [
  ("PUSS IN BOOTS", None, 'title', 0),
  ("This is a story about a young man named Tom, and his clever cat.", None, 'narr', B),
  ("Tom's father was a miller.", None, 'narr', B),
  ("He ground wheat into flour at the old mill by the river.", None, 'narr', S),
  ("But one day, he died.", None, 'narr', .7),
  ("Tom's oldest brother got the mill.", None, 'narr', .8),
  ("His middle brother got the donkey.", None, 'narr', S),
  ("And Tom got the cat.", None, 'narr', .55),
  ('"A cat?" said Tom.', 'tom', 'narr', P),
  ('"I can\'t buy dinner with a cat!"', 'tom', 'narr', .3),
  ("His tummy rumbled.", None, 'narr', P),
  ("He had one small piece of bread left, so he broke it in half and gave one half to the cat.", None, 'narr', S),
  ("The cat was sleek and orange, with white paws and bright green eyes.", None, 'narr', P),
  ("He ate slowly.", None, 'narr', S),
  ('Then he said, "Thank you, Master."', 'puss', 'narr', .6),
  ('Tom jumped.', None, 'narr', P),
  ('"You can talk?"', 'tom', 'narr', .25),
  ('"Of course.', 'puss', 'narr', P),
  ('Give me a bag and a pair of boots, and I will make you rich."', 'puss', 'narr', .3),
  ('"Why boots?" said Tom.', 'tom', 'narr', P),
  ('"A cat in boots looks important," said the cat.', 'puss', 'narr', P),
  ('"And important cats get invited places."', 'puss', 'narr', .3),
  ("Tom did not know what to think.", None, 'narr', P),
  ("But he had nothing else, so he found an old bag and a tiny pair of boots.", None, 'narr', S),
  ("The cat put them on.", None, 'narr', S),
  ("Clip-clop! Clip-clop!", None, 'narr', .45),
  ("He walked down the road like he owned it.", None, 'narr', .45),
  ("(Tom tried hard not to laugh.)", None, 'aside', .5),
  ('"From now on, call me Puss," said the cat.', 'puss', 'narr', P),
  ("The next morning, Puss had a plan.", None, 'narr', B),
  ("He took his bag to the edge of the forest and filled it with fresh red berries.", None, 'narr', S),
  ("Pick, pick, pick!", None, 'narr', .4),
  ("Then he marched up the hill to the castle.", None, 'narr', .6),
  ("A guard let him in.", None, 'narr', B),
  ("The king sat on his throne.", None, 'narr', S),
  ("He had a long white beard and a tiny gold crown.", None, 'narr', S),
  ('"Your Majesty," said Puss, bowing low.', 'puss', 'narr', P),
  ('"The Marquis of Carabas sends you a gift."', 'puss', 'narr', .3),
  ('"The Marquis of Carabas?" said the king.', 'king', 'narr', P),
  ('"Never heard of him.', 'king', 'narr', .3),
  ('But these berries are delicious!"', 'king', 'narr', .3),
  ("There was no Marquis.", None, 'narr', P),
  ("Puss made up the name.", None, 'narr', S),
  ("(A Marquis is an important lord, and Puss thought it sounded fancy.)", None, 'aside', .5),
  ("He wanted the king to remember it.", None, 'narr', .5),
  ("Every week, Puss brought a new gift: sweet peaches, warm bread, golden honey.", None, 'narr', P),
  ('Every time, the king said, "Never heard of him. But this is delicious!"', 'king', 'narr', S),
  ("Then, one morning, Puss was walking through the village when the town crier rang his bell.", None, 'narr', B),
  ("Ding-ding-ding!", None, 'narr', .4),
  ('"The king and the princess will ride past the river today!"', 'crier', 'narr', .3),
  ("Puss's green eyes lit up.", None, 'narr', P),
  ("This was the chance he was waiting for.", None, 'narr', S),
  ("He ran home as fast as his boots could go.", None, 'narr', S),
  ('"Master, jump in the river!"', 'puss', 'shout', B),
  ('Tom looked up.', None, 'narr', P),
  ('"Why?"', 'tom', 'narr', .25),
  ('"Trust me," Puss cried.', 'puss', 'narr', .5),
  ('"Is the water cold?" said Tom.', 'tom', 'narr', .5),
  ('"TRUST ME!"', 'puss', 'shout', .45),
  ("SPLASH!", None, 'shout', .7),
  ("Tom sat in the cold river, shivering.", None, 'narr', .6),
  ("Puss hid Tom's old clothes under a rock.", None, 'narr', S),
  ("Then he ran to the road and waved his paws.", None, 'narr', S),
  ("The royal carriage was coming.", None, 'narr', B),
  ('"HELP!" cried Puss.', 'puss', 'shout', .45),
  ('"Robbers took the Marquis\'s clothes!"', 'puss', 'narr', .3),
  ('"The Marquis of Carabas?" said the king.', 'king', 'narr', P),
  ('"The one who sends me gifts?', 'king', 'narr', .3),
  ('Stop the carriage!', 'king', 'narr', .3),
  ('Bring him my best clothes!"', 'king', 'narr', .3),
  ("A servant ran to the river with the clothes.", None, 'narr', P),
  ("Tom hid behind a bush and put on a blue jacket, new pants, and shiny shoes.", None, 'narr', S),
  ("When he came out, the princess smiled.", None, 'narr', S),
  ("Tom's cheeks turned pink.", None, 'narr', S),
  ('"Please, ride with us," said the king.', 'king', 'narr', P),
  ("Tom climbed into the carriage.", None, 'narr', P),
  ("Puss waited until nobody was looking, then slipped away through the trees.", None, 'narr', S),
  ("Now Tom looked like a Marquis.", None, 'narr', B),
  ("But a Marquis needs land and a castle.", None, 'narr', S),
  ("And Puss knew just the place.", None, 'narr', S),
  ("Swish, swish, swish!", None, 'narr', B),
  ("Puss ran ahead of the carriage.", None, 'narr', .4),
  ("The fields, sheep, and apple trees along this road belonged to a mean ogre, and everybody was tired of him.", None, 'narr', S),
  ("Puss still had a basket of peaches.", None, 'narr', P),
  ("He traded it for warm cookies at the village bakery.", None, 'narr', S),
  ("Then he gave one cookie each to the farmers, the shepherd, and the apple picker.", None, 'narr', S),
  ('"Say these belong to the Marquis of Carabas," he whispered.', 'puss', 'narr', P),
  ('"Help me, and I will do my best to chase the ogre away."', 'puss', 'narr', .3),
  ('"Deal!" they said.', 'farmers', 'narr', .6),
  ("Soon, the carriage rolled by.", None, 'narr', B),
  ('"Whose fields are these?" asked the king.', 'king', 'narr', .4),
  ('"These fields belong to the Marquis of Carabas!" said the farmers.', 'farmers', 'narr', P),
  ("Cookie crumbs flew everywhere.", None, 'narr', S),
  ('"Whose sheep are these?"', 'king', 'narr', P),
  ('"These sheep belong to the Marquis of Carabas!" said the shepherd.', 'shepherd', 'narr', P),
  ('"Baaa!" said a sheep.', 'sheep', 'narr', .6),
  ('"Even the sheep agree," said the king.', 'king', 'narr', .6),
  ('"Whose apples are these?"', 'king', 'narr', P),
  ('"These apples belong to the... um..." said the apple picker.', 'picker', 'narr', P),
  ("A boot poked out from behind a tree.", None, 'narr', .5),
  ("Tap, tap.", None, 'narr', .35),
  ('"Marquis," whispered a voice.', 'puss', 'narr', .6),
  ('"...to the Marquis of Carabas!"', 'picker', 'narr', .5),
  ('"Marquis, you are so rich!" said the king.', 'king', 'narr', P),
  ('"Um... thank you?" said Tom.', 'tom', 'narr', .6),
  ("The carriage rolled on slowly.", None, 'narr', P),
  ("Puss ran ahead again, all the way to the end of the road.", None, 'narr', S),
  ("There stood a huge castle with tall stone towers and colorful flags.", None, 'narr', B),
  ("A big doormat said BEWARE OF OGRE.", None, 'narr', S),
  ("The ogre who lived there was twice as tall as the door, with a voice like thunder and fluffy pink slippers.", None, 'narr', S),
  ("(Nobody had the courage to tell him they were pink.)", None, 'aside', .55),
  ("Puss walked up to the door.", None, 'narr', P),
  ("Knock.", None, 'narr', .5),
  ("...", None, 'pause', 0),
  ("Knock, knock.", None, 'narr', 1.0),
  ("...", None, 'pause', 0),
  ("KNOCK! KNOCK! KNOCK!", None, 'shout', 1.0),
  ("Nobody answered.", None, 'narr', .9),
  ("So Puss pressed the doorbell.", None, 'narr', S),
  ("It played a happy little tune: Ding-a-ling-a-ling!", None, 'narr', S),
  ("(A silly tune for an ogre.)", None, 'aside', 1.3),
  ("The door creaked open.", None, 'narr', .9),
  ('"Sir Ogre," said Puss.', 'puss', 'narr', 1.5),
  ('"I hear you can turn into any animal.', 'puss', 'narr', .3),
  ('Is it true?"', 'puss', 'narr', .3),
  ('"Of course!"', 'ogre', 'narr', P),
  ("ROAR!", None, 'shout', .3),
  ("The ogre turned into a lion.", None, 'narr', .8),
  ('"EEEK!"', 'puss', 'shout', .5),
  ("Puss jumped onto the roof.", None, 'narr', .3),
  ("His boots slipped.", None, 'narr', S),
  ("Slide, slide, slide!", None, 'narr', .3),
  ("(Puss pretended he meant to do that.)", None, 'aside', .7),
  ("The ogre turned back into himself, and Puss climbed down.", None, 'narr', P),
  ('"Very impressive!" said Puss.', 'puss', 'narr', P),
  ('"But anyone can be big.', 'puss', 'narr', .3),
  ('Can you be tiny?', 'puss', 'narr', .3),
  ('Like a mouse?', 'puss', 'narr', .3),
  ('That is probably too hard."', 'puss', 'narr', .35),
  ('"Too hard?', 'ogre', 'narr', P),
  ('Watch this!"', 'ogre', 'narr', .3),
  ("POOF!", None, 'shout', .45),
  ("The ogre was a tiny mouse.", None, 'narr', .45),
  ('"BOO!" said Puss.', 'puss', 'shout', 1.0),
  ('"SQUEAK!"', 'mouse', 'shout', .45),
  ("The mouse zoomed out the door and down the hill, leaving one fluffy slipper behind.", None, 'narr', .3),
  ("He never came back.", None, 'narr', .5),
  ("Puss peeked inside.", None, 'narr', B),
  ("The castle was empty.", None, 'narr', S),
  ("Now it needed a new owner.", None, 'narr', S),
  ("He hurried to the gate just as the royal carriage rolled up.", None, 'narr', S),
  ('"Welcome to the castle of the Marquis of Carabas!" said Puss.', 'puss', 'narr', P),
  ("Tom stepped out of the carriage and looked at the huge castle.", None, 'narr', P),
  ("Then he felt bad.", None, 'narr', .6),
  ("The king trusted him, and it was all lies.", None, 'narr', S),
  ("He took a deep breath.", None, 'narr', .6),
  ('"Your Majesty," said Tom, "I must tell you the truth.', 'tom', 'narr', 1.1),
  ('I am not a Marquis.', 'tom', 'narr', .4),
  ('I am just Tom.', 'tom', 'narr', .45),
  ('My cat made up everything."', 'tom', 'narr', .45),
  ("Puss covered his eyes with his paws.", None, 'narr', .9),
  ('The king laughed.', None, 'narr', 1.3),
  ('"A real Marquis does not say \'um,\'" he said.', 'king', 'narr', .35),
  ('"And I still have never heard of the Marquis of Carabas.', 'king', 'narr', .4),
  ('But I like you, Tom.', 'king', 'narr', .4),
  ('Would you like to marry my daughter?"', 'king', 'narr', .45),
  ("Tom looked at the princess.", None, 'narr', P),
  ("She nodded.", None, 'narr', .5),
  ('"Yes, please!" said Tom.', 'tom', 'narr', .6),
  ("That night, after all the happy news, Tom and Puss ate supper in the castle kitchen.", None, 'narr', 2.0),
  ("There was one warm loaf of bread.", None, 'narr', S),
  ("Tom broke it in half and gave one half to Puss.", None, 'narr', .5),
  ('"Thank you, Master," said Puss.', 'puss', 'narr', .9),
  ("So Tom lived in the castle with the princess.", None, 'narr', B),
  ("And Puss?", None, 'narr', S),
  ("He had the softest bed in the castle and wore his favorite boots everywhere.", None, 'narr', .45),
  ("Even to bed.", None, 'aside', .5),
  ("And Tom never forgot that one small piece of bread, shared with a hungry cat, had changed his whole life.", None, 'narr', B),
  ("Moral:  a little kindness can come back to you in a big way.", None, 'narr', 1.2),
]

# What Kokoro reads. Only punctuation, case and spelling help; the words are the script's.
def tts_text(text, tone):
    t = text
    t = re.sub(r'[()]', '', t)
    t = t.replace('"', '')
    # shouted words in capitals: sentence case so they are read as words, with the "!" kept
    if tone in ('shout', 'title') or re.search(r'\b[A-Z]{2,}\b', t):
        t = re.sub(r'\b([A-Z])([A-Z]+)\b', lambda m: m.group(1) + m.group(2).lower(), t)
    t = t.replace('Eeek!', 'Eek!')
    t = t.replace('Moral:  a', 'Moral: a')
    t = t.replace("'um,'", 'um,')
    t = t.replace('Baaa!', 'Baa!')
    return t.strip()

# Phoneme fixes (applied to the phonemized TTS input only)
PHON_SUBS = [
    ('kæɹˈɑːbəz', 'kˈæɹəbæs'),      # Carabas → KA-ra-bas
    ('mɑːɹrkˈiː', 'mɑːɹkˈiː'),      # Marquis → mar-KEE (tidy the doubled r)
    ('ˈiːk!', 'ˈiːːk!'),             # Eek! → a long eee
]

# Whisper's spelling for words it can't know
def asr_text(text):
    a = re.sub(r'[()"]', '', text)
    return a


def main():
    lines, gid = [], 0
    for i, (text, who, tone, gap) in enumerate(SEG):
        if tone == 'pause':
            lines[-1]['after'] = lines[-1].get('after', 0)  # marker only: the gap of the next line holds the pause
            lines[-1]['ellipsis'] = True
            continue
        gid += 1
        L = dict(id=f'L{gid:03d}', text=text, tts=tts_text(text, tone), who=who, tone=tone, gap=gap)
        if tone == 'aside': L['voice'] = 'aside'
        lines.append(L)
    # exactness check: the segments rebuild the script word for word ("..." pause markers excluded)
    script = open(os.path.join(ROOT, 'script', 'script.txt'), encoding='utf-8').read()
    norm = lambda s: re.sub(r'\s+', ' ', s).strip()
    body = norm(script)
    joined = norm(' '.join(t for t, *_ in SEG).replace(' ... ', ' ... '))
    # the script writes "Knock. ... Knock, knock. ... KNOCK!" — the "..." segments are those dots
    if joined != body:
        a, b = joined, body
        k = next(i for i in range(min(len(a), len(b))) if a[i] != b[i]) if a != b else 0
        sys.exit(f'segments differ from script at char {k}:\n  seg: …{a[max(0,k-60):k+60]}\n  scr: …{b[max(0,k-60):k+60]}')
    json.dump(lines, open(os.path.join(ROOT, 'script', 'lines.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print(len(lines), 'lines; script matches word for word')


if __name__ == '__main__':
    main()
