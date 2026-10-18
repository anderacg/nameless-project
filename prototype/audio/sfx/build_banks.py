# build_banks.py SRC OUTDIR : cuts the battle sound banks (audio/sfx/battle-*.js) from the CC0 sources (LICENSE-sfx.md), which
# are not kept here: SRC/raw holds the freesound previews as fs_<id>.mp3 (-hq) and lq_<id>.mp3 (-lq), SRC/ext the OpenGameArt
# WAVs (adv_<name>.wav from the Male Adventurer pack, orc_<name>.wav from the orc commander pack, names lower case, _ for spaces).
# Needs numpy and scipy. The table B below is the cut: each sound's source, its start and end (s) and how it is kept.
# MP3 sources (freesound previews) are cut at frame boundaries, never re-encoded; WAV sources become 4-bit IMA ADPCM, mono,
# 22.05 kHz (no encoder here: battlesound.js decodes it). Each entry: f (mp3|ima), b (base64), r (the rate to decode at),
# c (channels kept), o (offset s into the decoded cut), d (length s), x (a loop's crossfade s; 0: a one-shot), fo (fade out s).
import sys, os, json, base64, wave, math
import numpy as np
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mp3tool
SRC, OUT = sys.argv[1], sys.argv[2]
RAW, EXT = SRC + '/raw/', SRC + '/ext/'
DEC_DELAY = int(os.environ.get('DEC_DELAY', '0'))   # decoder samples ahead of a cut (measured: see verify)

# name: (source, t0, t1, opts)   source: hq:ID | lq:ID | whole:hq:ID | wav:NAME ; opts: x (loop crossfade), fo, r, c
B = {}
B['battle-beds'] = {
  'bed.crowd':  ('lq:764156', 1.6, 14.6, dict(x=1.0, c=2, r=24000)),
  'bed.steel':  ('lq:376646', 60.0, 78.0, dict(x=1.0, c=2, r=24000)),
  'bed.far':    ('lq:675094', 0.6, 16.0, dict(x=1.0, c=1, r=24000)),
  'bed.feet':   ('lq:480675', 5.0, 19.0, dict(x=.6, c=1, r=24000)),
  'bed.kit':    ('lq:481931', 0.4, 9.8, dict(x=.6, c=1, r=24000)),
  'bed.hooves': ('lq:583261', 0.4, 10.6, dict(x=.6, c=2, r=24000)),
  'bed.herd':   ('lq:564626', 0.6, 8.4, dict(x=.6, c=2, r=24000)),
  'bed.panic':  ('lq:459101', 0.6, 13.0, dict(x=1.0, c=2, r=24000)),
  'bed.drums':  ('whole:hq:491277', 0, 8.0, dict(x=0, loop=1, c=2, r=32000)),
}
B['battle-voices'] = {
  # war cries: a crowd's, and single men's (human; dwarves and elves are pitched from them, elves have their own too)
  'warcry.crowd1': ('lq:764155', 0.4, 5.6, dict(fo=1.4, r=24000)),
  'warcry.crowd2': ('lq:764158', 0.3, 5.0, dict(fo=1.2, r=24000)),
  'warcry.crowd3': ('lq:621373', 1.8, 6.4, dict(fo=1.2, r=24000)),
  'warcry.man1': ('hq:521830', 0.0, 1.5, dict(fo=.4)),
  'warcry.man2': ('hq:521831', 0.0, 2.4, dict(fo=.5)),
  'warcry.man3': ('hq:521832', 0.0, 0.95, dict(fo=.25)),
  'warcry.man4': ('hq:249807', 0.4, 2.1, dict(fo=.4)),
  'warcry.man5': ('hq:621341', 0.5, 2.6, dict(fo=.5)),
  'warcry.man6': ('hq:621343', 0.95, 3.0, dict(fo=.5)),
  'warcry.elf': ('hq:396230', 0.5, 3.2, dict(fo=.6)),
  'warcry.roar': ('hq:398908', 1.3, 4.6, dict(fo=1.0)),
  # the charge landing: shields, bodies, blades
  'impact.shield1': ('hq:182112', 0.12, 0.55, dict(fo=.12)),
  'impact.shield2': ('hq:182112', 0.58, 1.2, dict(fo=.2)),
  'impact.shield3': ('hq:182112', 1.78, 2.3, dict(fo=.15)),
  'impact.shield4': ('hq:370203', 0.0, 0.7, dict(fo=.2)),
  'impact.heavy1': ('hq:588278', 0.6, 1.0, dict(fo=.15)),
  'impact.heavy2': ('hq:588278', 3.4, 3.85, dict(fo=.15)),
  'impact.body1': ('hq:504626', 0.25, 1.3, dict(fo=.3)),
  'impact.body2': ('hq:264062', 0.0, 1.5, dict(fo=.3)),
  # replies to orders: yes, hey, huh, ha, hold, to war
  'order.yes1': ('hq:345422', 0.0, 0.62, dict(fo=.1)),
  'order.yes2': ('hq:340367', 0.0, 0.85, dict(fo=.15)),
  'order.yes3': ('wav:adv_yes1', 0, 0.5, dict(fo=.08)),
  'order.yes4': ('wav:adv_yes0', 0, 0.68, dict(fo=.1)),
  'order.hey1': ('hq:57204', 0.0, 0.8, dict(fo=.2)),
  'order.hey2': ('hq:527740', 0.0, 0.5, dict(fo=.12)),
  'order.huh': ('hq:650917', 0.08, 0.6, dict(fo=.15)),
  'order.ha': ('hq:623441', 0.08, 0.6, dict(fo=.12)),
  'order.hold': ('hq:623447', 0.86, 1.5, dict(fo=.15)),
  'order.war': ('hq:161967', 0.0, 1.6, dict(fo=.35)),
  'order.go1': ('wav:adv_attackbig1', 0, 1.0, dict(fo=.2)),
  'order.go2': ('wav:adv_attackbig4', 0, 0.6, dict(fo=.12)),
  'officer.hold': ('hq:623447', 0.86, 4.3, dict(fo=.3)),
  'officer.king': ('hq:623449', 0.3, 3.4, dict(fo=.5)),
  # cheers (a rally, a victory), panic and screams (a rout)
  'cheer.short': ('lq:764165', 0.0, 2.9, dict(fo=.6, r=24000)),
  'cheer.big1': ('lq:764164', 0.4, 7.6, dict(fo=1.8, r=24000)),
  'cheer.big2': ('lq:764163', 0.5, 6.0, dict(fo=1.5, r=24000)),
  'panic.crowd': ('lq:491405', 0.0, 5.5, dict(fo=1.5, r=24000)),
  'panic.small': ('lq:173945', 0.0, 4.0, dict(fo=1.0, r=24000)),
  'scream.1': ('hq:556976', 0.55, 2.5, dict(fo=.5)),
  'scream.2': ('hq:166944', 2.7, 3.6, dict(fo=.25)),
  # the melee's own voices near the camera: grunts and shouts
  'grunt.1': ('hq:621353', 0.22, 0.62, dict(fo=.1)),
  'grunt.2': ('hq:621355', 0.32, 0.62, dict(fo=.1)),
  'grunt.3': ('hq:621358', 0.27, 0.62, dict(fo=.1)),
  'grunt.4': ('hq:621360', 0.22, 0.5, dict(fo=.1)),
  'grunt.5': ('hq:166944', 0.0, 0.8, dict(fo=.2)),
  'grunt.6': ('hq:166944', 0.95, 1.6, dict(fo=.15)),
  'grunt.7': ('wav:adv_attack3', 0, 0.7, dict(fo=.15)),
  'grunt.8': ('wav:adv_attack6', 0, 0.8, dict(fo=.15)),
  'grunt.9': ('wav:adv_attackbig2', 0, 0.7, dict(fo=.15)),
  'grunt.10': ('wav:adv_attack5', 0, 0.6, dict(fo=.12)),
  # orcs: their own voice (a commander's lines, grunts, a laugh) and goblin snarls
  'orc.charge': ('wav:orc_keep_charging', 0.0, 2.4, dict(fo=.3)),
  'orc.kill': ('wav:orc_leave_no_survivors', 0.0, 2.8, dict(fo=.3)),
  'orc.scum': ('wav:orc_die_human_scum', 0.0, 2.1, dict(fo=.3)),
  'orc.march': ('wav:orc_orcs_we_march', 0.05, 1.0, dict(fo=.15)),
  'orc.wait': ('wav:orc_orcs_wait', 0.1, 1.55, dict(fo=.2)),
  'orc.retreat': ('wav:orc_orcs_retreat', 0.0, 0.85, dict(fo=.15)),
  'orc.victory': ('wav:orc_the_victory_is_ours', 0.0, 1.9, dict(fo=.3)),
  'orc.laugh': ('wav:orc_orc_laugh', 0.0, 2.6, dict(fo=.5)),
  'orc.grunt1': ('wav:orc_orc_grunt_1', 0.0, 0.32, dict(fo=.08)),
  'orc.grunt2': ('wav:orc_orc_grunt_2', 0.0, 0.6, dict(fo=.12)),
  'orc.grunt3': ('wav:orc_orc_grunt_4', 0.0, 1.2, dict(fo=.2)),
  'orc.fight1': ('wav:orc_orc_fight', 0.0, 0.5, dict(fo=.1)),
  'orc.fight2': ('wav:orc_orc_fight_2', 0.0, 0.6, dict(fo=.12)),
  'orc.fight3': ('wav:orc_orc_fight_3', 0.0, 0.6, dict(fo=.12)),
  'orc.snarl': ('hq:442815', 0.0, 1.9, dict(fo=.4)),
  'orc.scream': ('hq:442816', 0.0, 1.6, dict(fo=.3)),
  # arrows: a volley in flight (the whoosh of many), and the hail coming down
  # (no 474121 'volley of arrows01': a woman's voice runs through it; volleys and hails carry no voice at all)
  'volley.1': ('hq:438618', 13.0, 15.1, dict(fo=.4)),
  'volley.2': ('hq:394004', 0.0, 3.3, dict(fo=.4)),
  'whoosh.1': ('hq:675821', 0.05, 0.8, dict(fo=.15)),
  'whoosh.2': ('hq:675821', 1.2, 1.9, dict(fo=.15)),
  'whoosh.3': ('hq:675821', 3.15, 3.85, dict(fo=.15)),
  'whoosh.4': ('hq:789389', 0.0, 1.0, dict(fo=.3)),
  # the hail's hits: crisp, short and dry (each its transient and about 130 ms, a fast fade); no 205938 (a noisy, splashy burst)
  'thunk.1': ('hq:534956', 0.10, 0.24, dict(fo=.05)),
  'thunk.2': ('hq:531877', 0.10, 0.24, dict(fo=.05)),
  'thunk.3': ('hq:531877', 0.68, 0.82, dict(fo=.05)),
  'thunk.4': ('hq:531877', 1.86, 2.00, dict(fo=.05)),
  'thunk.5': ('hq:531877', 2.44, 2.58, dict(fo=.05)),
  'thunk.6': ('hq:531877', 3.02, 3.16, dict(fo=.05)),
  'thunk.7': ('hq:521242', 0.29, 0.43, dict(fo=.05)),
  'thunk.8': ('hq:521242', 2.93, 3.07, dict(fo=.05)),
  'thunk.9': ('hq:536066', 0.0, 0.13, dict(fo=.05)),
  'thunk.10': ('hq:708223', 0.41, 0.55, dict(fo=.05)),
  'thunk.11': ('hq:521552', 0.0, 0.13, dict(fo=.05)),
  'clack.1': ('hq:182112', 0.12, 0.26, dict(fo=.05)),
  'clack.2': ('hq:370203', 0.0, 0.14, dict(fo=.05)),
  # battle-start horns, one a race (audio.js horn)
  'horn.human': ('hq:402753', 0.0, 5.2, dict(fo=1.6)),
  'horn.orc': ('hq:328541', 0.0, 6.5, dict(fo=2.5)),
  'horn.dwarf': ('hq:345830', 0.1, 7.0, dict(fo=2.2)),
  'horn.elf': ('hq:512490', 0.3, 5.4, dict(fo=1.6)),
}
for e in B['battle-voices'].values(): e[3].setdefault('r', 32000); e[3].setdefault('c', 1)
B['battle-amb-land'] = {
  'amb.wood': ('lq:378725', 2.5, 20.5, dict(x=1.5, c=1, r=24000)),
  'amb.water': ('lq:548373', 2.0, 17.0, dict(x=1.5, c=2, r=24000)),
}
B['battle-amb-grass'] = {
  'amb.grass': ('lq:639459', 22.0, 46.0, dict(x=2.0, c=2, r=24000)),
  'amb.grass.life': ('lq:164656', 40.0, 58.0, dict(x=1.5, c=2, r=24000)),
}
B['battle-amb-frost'] = {'amb.frost': ('lq:405601', 8.0, 27.0, dict(x=2.0, c=2, r=24000))}
B['battle-amb-desert'] = {'amb.desert': ('lq:402710', 20.0, 36.0, dict(x=2.0, c=2, r=24000))}
B['battle-amb-swamp'] = {'amb.swamp': ('lq:32655', 10.0, 30.0, dict(x=1.5, c=2, r=24000))}

STEP = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143,
        157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552,
        1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487,
        12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767]
IDX = [-1, -1, -1, -1, 2, 4, 6, 8]
def ima(x):
    """int16 samples → 4-bit IMA ADPCM nibbles (low nibble first), the decoder's state tracked exactly"""
    pred, ix, out = 0, 0, bytearray((len(x) + 1) // 2)
    for i, s in enumerate(x.tolist()):
        st = STEP[ix]; d = s - pred; n = 0
        if d < 0: n = 8; d = -d
        diff = st >> 3
        if d >= st: n |= 4; d -= st; diff += st
        st >>= 1
        if d >= st: n |= 2; d -= st; diff += st
        st >>= 1
        if d >= st: n |= 1; diff += st
        pred = max(-32768, min(32767, pred - diff if n & 8 else pred + diff))
        ix = max(0, min(88, ix + IDX[n & 7]))
        out[i >> 1] |= n << (4 * (i & 1))
    return bytes(out)

def wav_mono22(path):
    w = wave.open(path); n = w.getnframes(); ch = w.getnchannels(); sr = w.getframerate(); a = np.frombuffer(w.readframes(n), '<i2').astype(np.float64)
    a = a.reshape(-1, ch).mean(1)
    if sr != 22050: g = math.gcd(sr, 22050); a = resample_poly(a, 22050 // g, sr // g)
    return a

def lame_delay(d):
    fr = mp3tool.frames(d)
    if fr and fr[0][6]:
        b = d[fr[0][0]:fr[0][0] + fr[0][1]]; i = b.find(b'LAME')
        if i >= 0: x = b[i + 21:i + 24]; return (x[0] << 4) | (x[1] >> 4)
    return 576

used, sizes = {}, {}
for bank, ents in B.items():
    out = {}
    for name, (src, t0, t1, o) in ents.items():
        x = o.get('x', 0); e = {'r': o.get('r', 32000), 'c': o.get('c', 1)}
        if src.startswith('wav:'):
            a = wav_mono22(EXT + src[4:] + '.wav'); seg = a[int(t0 * 22050):int(t1 * 22050)]
            pk = np.abs(seg).max() or 1; seg = np.clip(np.round(seg / pk * 29000), -32767, 32767).astype(np.int16)
            e.update(f='ima', n=len(seg), r=22050, c=1, o=0, d=round(len(seg) / 22050, 4), b=base64.b64encode(ima(seg)).decode())
            used.setdefault(src[4:].split('_')[0], set()).add(src)
        else:
            parts = src.split(':'); whole = parts[0] == 'whole'; q, sid = parts[-2], parts[-1]
            p = RAW + ('fs_%s.mp3' % sid if q == 'hq' else 'lq_%s.mp3' % sid); d = open(p, 'rb').read()
            if whole:
                cut = d[mp3tool.skip_id3(d):]; e.update(f='mp3', o=0, d=t1 - t0, b=base64.b64encode(cut).decode())
            else:
                fr = [f for f in mp3tool.frames(d) if not f[6]]; sr, spf = fr[0][2], fr[0][3]
                dl = lame_delay(d) + 529        # samples the full decode skips at its start
                cut, ta = mp3tool.slice_mp3(d, t0 + dl / sr, t1 + x + dl / sr, pre=2, post=2)
                e.update(f='mp3', o=round(t0 + dl / sr - ta + DEC_DELAY / sr, 4), d=round(t1 - t0, 4), b=base64.b64encode(cut).decode())
            used.setdefault('fs', set()).add(sid)
        if x: e['x'] = x
        if o.get('loop'): e['x'] = 0; e['loop'] = 1
        if o.get('fo'): e['fo'] = o['fo']
        out[name] = e
    js = ("'use strict';\n// " + bank + ": battle sound samples for battlesound.js (CC0: see LICENSE-sfx.md). Generated by a script from the\n"
          "// sources listed there: MP3 cut at frame boundaries (not re-encoded), WAV as 4-bit IMA ADPCM. Do not edit by hand.\n"
          "SFXBANK.put('" + bank + "'," + json.dumps(out, separators=(',', ':')) + ");\n")
    open(os.path.join(OUT, bank + '.js'), 'w', encoding='utf8', newline='\n').write(js)
    sizes[bank] = len(js)
    print('%-20s %3d entries %8d bytes' % (bank, len(out), len(js)))
print('total', sum(sizes.values()))
