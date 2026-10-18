# mp3tool.py: MPEG audio frame parsing and slicing (no decoding, no re-encoding)
import sys
BR = {(1, 3): [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],   # MPEG-1 layer III
      (2, 3): [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]}       # MPEG-2/2.5 layer III
SR = {1: [44100, 48000, 32000], 2: [22050, 24000, 16000], 25: [11025, 12000, 8000]}

def skip_id3(d):
    if d[:3] == b'ID3':
        sz = (d[6] & 127) << 21 | (d[7] & 127) << 14 | (d[8] & 127) << 7 | (d[9] & 127)
        return 10 + sz + (10 if d[5] & 0x10 else 0)
    return 0

def frames(d):
    """[(offset, size, samplerate, samples_per_frame, channels, bitrate_kbps, is_info)]"""
    i = skip_id3(d); out = []
    while i + 4 <= len(d):
        h = d[i:i + 4]
        if h[0] != 0xFF or (h[1] & 0xE0) != 0xE0:
            if out: break
            i += 1; continue
        ver = (h[1] >> 3) & 3; lay = (h[1] >> 1) & 3
        if ver == 1 or lay != 1: i += 1; continue
        v = 1 if ver == 3 else 2 if ver == 2 else 25
        bri = h[2] >> 4; sri = (h[2] >> 2) & 3; pad = (h[2] >> 1) & 1
        if bri in (0, 15) or sri == 3: i += 1; continue
        br = BR[(1 if v == 1 else 2, 3)][bri]; sr = SR[v][sri]
        spf = 1152 if v == 1 else 576
        size = (144 if v == 1 else 72) * br * 1000 // sr + pad
        ch = 1 if (h[3] >> 6) == 3 else 2
        body = d[i:i + size]
        info = (b'Xing' in body[:64] or b'Info' in body[:64]) and not out
        out.append((i, size, sr, spf, ch, br, info))
        i += size
    return out

def slice_mp3(d, t0, t1, pre=2, post=1):
    """frames covering [t0, t1] s (decoded time), with pre/post spare frames; → (bytes, start time of the first frame kept)"""
    fr = [f for f in frames(d) if not f[6]]
    sr, spf = fr[0][2], fr[0][3]; fd = spf / sr
    a = max(0, int(t0 / fd) - pre); b = min(len(fr), int(t1 / fd) + 1 + post)
    return b''.join(d[f[0]:f[0] + f[1]] for f in fr[a:b]), a * fd

if __name__ == '__main__':
    for p in sys.argv[1:]:
        d = open(p, 'rb').read(); fr = frames(d)
        if not fr: print(p, 'no frames'); continue
        brs = sorted(set(f[5] for f in fr))
        print(p.split('/')[-1], 'frames', len(fr), 'sr', fr[0][2], 'ch', fr[0][4], 'kbps', brs[:3], '..', brs[-1], 'info', fr[0][6], 'dur %.2f' % (len(fr) * fr[0][3] / fr[0][2]), 'bytes', len(d))
