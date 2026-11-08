# Approved tiger artwork

tiger.png is the approved 96 × 64-cell master sheet. manifest.json lists the clips and frame durations. The death_back slot holds the final approved side-resting fall, with folded legs and a sideways head. It replaces the earlier belly-up study.

engine/tiger-data.js stores these pixels losslessly for synchronous offline rendering. engine/tiger.js decodes the frames and renders them at half size, with nearest-neighbor pixels, beside the existing 16-pixel people. The master art is retained at full resolution here. Combat uses all eight frames for idle, walk, run, attacks and the side-fall; it uses the pounce clip when its ability fires and hurt frames after a hit. Roar and stalking clips play during idle and slow movement. The other clips remain available through PX.tiger.pose.

No combat statistics change. Wild tigers keep the approved orange coat; the other two seeded variants tint that coat. Allied tigers wear a blue collar.
