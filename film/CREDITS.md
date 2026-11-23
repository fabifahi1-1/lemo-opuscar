# CREDITS: every sound in *Puss in Boots* (Lantern and Page)

The film's soundtrack is music and effects only (no voice). Every sound is either a **CC0 (public-domain) instrument sample** or **synthesised in code for this film** (no recordings, no third-party material). Nothing in the soundtrack needs attribution; the CC0 libraries are thanked below.

## Music: instrument samples (all CC0 1.0)

| Instrument (as used in the score) | Notes played | Library | Licence | Sample set |
|---|---|---|---|---|
| bassoon | 8 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Woodwinds/Bassoon/sus` |
| bassoon_stac | 64 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Woodwinds/Bassoon/stac` |
| cellos | 24 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Strings/Cello Section/susvib` |
| cellos_pizz | 173 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Strings/Cello Section/pizzT` |
| clarinet | 12 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Woodwinds/Clarinet/susLong` |
| clarinet_stac | 61 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Woodwinds/Clarinet/stac` |
| contrabass_pizz | 8 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Strings/Solo Contrabass/Pizz` |
| flute | 77 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Woodwinds/Flute/susvib` |
| flute_stac | 10 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Woodwinds/Flute/stac` |
| glockenspiel | 128 | Versilian Community Sample Library (Versilian Studios) | CC0 1.0 | `vcsl/Idiophones/Struck Idiophones/Glockenspiel` |
| harp | 282 | Versilian Community Sample Library (Versilian Studios) | CC0 1.0 | `vcsl/Chordophones/Composite Chordophones/Concert Harp` |
| harpsichord | 382 | Versilian Community Sample Library (Versilian Studios) | CC0 1.0 | `vcsl/Chordophones/Zithers/Harpsichord, Italian/Sustains` |
| horn | 25 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Brass/F Horn/sus` |
| marimba | 88 | Versilian Community Sample Library (Versilian Studios) | CC0 1.0 | `vcsl/Idiophones/Struck Idiophones/Marimba` |
| timpani | 3 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Percussion/Timpani` |
| tubular_bells | 3 | Versilian Community Sample Library (Versilian Studios) | CC0 1.0 | `vcsl/Idiophones/Struck Idiophones/Tubular Bells 1` |
| upright | 120 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Keys/Upright Nr1` |
| violas | 95 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Strings/Viola Section/susvib` |
| violas_pizz | 1 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Strings/Viola Section/pizz` |
| violins | 70 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Strings/Violin Section/susVib` |
| violins_pizz | 145 | VS Chamber Orchestra: Community Edition (Versilian Studios) | CC0 1.0 | `vsco2ce/Strings/Violin Section/Pizz` |
| woodblock | 7 | Versilian Community Sample Library (Versilian Studios) | CC0 1.0 | `vcsl/Idiophones/Struck Idiophones/Woodblock` |
| xylophone | 114 | Versilian Community Sample Library (Versilian Studios) | CC0 1.0 | `vcsl/Idiophones/Struck Idiophones/Xylophone/Medium Mallets` |

Both libraries are released under CC0 1.0 Universal (public domain dedication): https://creativecommons.org/publicdomain/zero/1.0/ . Thanks to Versilian Studios.

The score was written note by note for this film (`film/audio/score.py`); no existing music is quoted.

## Sound effects: synthesised in code (no recordings)

Every effect is generated from noise and oscillators in `film/audio/foley.py` (built on the procedural tools in `core/audio/sfx.py`) and placed on the action in `film/audio/cues.py`. Made for this film; no third-party rights.

| Effect | Used for |
|---|---|
| `air` | soft air swell (opening) |
| `baa` | the sheep's "Baaa!" |
| `bird` | birdsong |
| `bloop` | pop-ins (bag, peaches, cookies) |
| `boots` | boot steps |
| `candle` | candle crackle bed |
| `chatter` | chatter |
| `clap` | clapping paws, cheering |
| `clop` | boot steps (clip-clop), hooves |
| `crack` | the bread breaking (twice) |
| `creak_door` | doors creaking open |
| `creak_wood` | creaking wood (mill wheel, the crier's stand, the carriage) |
| `crickets` | night crickets bed |
| `crowd` | village square bustle bed |
| `crunch` | crunching cookies and peaches |
| `drip` | drips, sweat drops |
| `eeek` | Puss's EEEK |
| `flags` | flags flapping bed |
| `flutter` | startled birds |
| `gulp` | Puss's gulp |
| `hooves` | horse hooves bed |
| `jingle` | the crier's bell, harness bells |
| `knock` | the knock gag (five sizes) |
| `nibble` | nibbling bread and cookies |
| `page_flip` | the storybook page turn (opening) |
| `paper` | the paper slide under every word card |
| `poof` | POOF smoke |
| `river` | river bed |
| `roar` | the lion's funny roar |
| `room` | room tone bed |
| `rustle` | rustling cloth, leaves, paper |
| `scurry` | tiny mouse feet |
| `sigh` | sighs |
| `sniff` | sniffs |
| `snore` | Puss's tiny snore |
| `splash` | SPLASH into the river |
| `splashes` | splashing water (mill wheel, Tom climbing out) |
| `squeak` | the mouse's SQUEAK |
| `stones` | water over stones at the mill |
| `swish` | swishes, leaps, whooshes |
| `tap` | tap, tap of the boot; tiptoe |
| `thud` | soft thuds, landings, the basket, the stamp of a boot |
| `thunder` | thunder rumble, the ogre's shadow |
| `tick` | small clicks (the doorbell button, the title) |
| `tile_slide` | boots slipping on the roof tiles |
| `tummy` | the hungry tummy |
| `wheels` | carriage wheels bed |
| `whisper` | whispers (Puss, the forest animals) |
| `wind` | wind bed |

Ambience beds used: birds, candle, crickets, crowd, flags, hooves, river, riverUp, room, wheels, wind (all synthesised as above).

## Picture

All pictures, characters, sets and lettering are drawn in code for this film (`film/src/`). Lettering uses the font Lilita One (SIL Open Font License 1.1).
