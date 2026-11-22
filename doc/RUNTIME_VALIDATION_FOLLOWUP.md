# Runtime validation follow-up — 2026-11-22

Follow-up to `RUNTIME_REFACTOR_BASELINE.md`, on `codex`. The separate casual battle prototype and renderer/engine choice remain outside this batch.

## Long suites now complete

`tests/run-progress.cjs` runs explicit suites with at most two browser pages, streams phase/chunk progress and writes JSON, text and progress logs. It supports a no-progress watchdog independently of the total timeout. The same progress events are available to other console runners. Assertions and canonical world hashes are unchanged.

The full world-save matrix passed **22 checks** in 769.922 seconds, including Normal, Large and Huge worlds, plain/compressed records, repeated loading, version rejection and world switching. This completed before the final painter subdivision; the save implementation did not change afterward.

The final painter revision completed `worldprint` in 908.564 seconds: **15 passed, one existing mismatch**, no JavaScript errors. W1–W5, W7, W8, second-start B2 and every generator checksum match their canonical values. W6 is `f9a69e4c` against canonical `36c65d13`. A separate run serving untouched production at `5ecd53f` reproduced the same W6 and all six component hashes:

`5cbb4d8b 2b577532 3a67c292 935db470 594ad63c f59f1f4a`

No fingerprints were re-recorded. Linux resolves Arial to Liberation Sans here; platform rasterization is a possible contributor, not an established cause. This is not a clean full-suite baseline claim.

## Painter changes

Measured long generator steps were in props, fine-height calculation, colour blending, occupancy smoothing and shoreline metadata. These loops now yield at smaller intervals without changing arithmetic order. The colour blur reuses the job-local bank field after its final read, avoiding one extra fine-resolution Float32 allocation.

Concurrent chunks also shared the flora material. A job-local last-climate memo could skip restoring the global material after another job changed it. Each valid prop now restores its climate material and snow cap. The new `terrainmaterial` suite forces competing frost/grass material between resumes: untouched code passes one assertion and fails one; the fix passes both with isolated/interleaved pixel equality.

The worker parity fixture now stops the automatic page animation loop before asynchronous testing. Otherwise the game camera could overwrite its fake viewport queue while it waited for a worker. Explicit test draws and worker work still run. All 16 paintings match across page/worker paths, including terrain, props, grass and standing indices.

## Focused checks on the final painter

| Suite | Passed | Failed |
|---|---:|---:|
| worldprint | 15 | 1 existing W6 mismatch |
| paintworker | 5 | 0 |
| mobilehud | 27 | 0 |
| mobilebattlehud | 26 | 0 |
| artpace | 12 | 0 |
| structure | 36 | 0 |
| frametime | 14 | 0 |
| terrainmaterial | 2 | 0 |

The phone checks use Chromium at 844×390 with touch enabled. No physical phone or Safari validation was possible; an installed WebKit browser was unavailable. The coordinator's full sweep remains outstanding.

## Timing comparison

A single Chromium page measured the saved `937a988` terrain generators followed by the new generators. Each version first painted one unmeasured warmup chunk. The same visible chunk was then rebuilt with either visible painting alone or visible painting plus background work. All four cases retain pixel hash `f0605ca6` (four checks passed).

| Generator / synthetic iteration | Iterations | Median ms | 95th percentile ms | Max ms |
|---|---:|---:|---:|---:|
| Before / visible paint | 573 | 4.9 | 26.1 | 108.9 |
| After / visible paint | 481 | 4.2 | 6.7 | 36.4 |
| Before / paint + background | 214 | 15.8 | 44.5 | 134.7 |
| After / paint + background | 236 | 10.0 | 15.5 | 41.0 |

These are synthetic paint iterations, not full game frames: simulation and entity rendering are omitted. Versions run sequentially and shared background caches continue warming, so the background comparison cannot isolate the terrain change. The before-loop outlier includes a 124.7 ms `lotWarm` call. The final implementation still shows generator/native outliers around 32–36 ms and a 36.7 ms background call. More yields reduce measured terrain stalls, but neither this single run nor the cooperative budget establishes a hard frame-time bound or a portable speedup.

The comparison report is `comparison-paint.json`, with its CPU profile in `comparison.cpuprofile`, under the artifact directory below.

## Remaining work

The cooperative deadline cannot preempt native canvas operations, allocation, garbage collection or one indivisible callback. The current profiler is diagnostic, not a phone FPS guarantee.

`WorldArt.whole().cnt` retains full chunk render records while aggregating their statistics. Whole-world tests have a large memory footprint; reducing that retention deserves a separate measured change. This batch does not alter whole-map lifetime or caching. Renderer passes and worker dependency extraction still wait for the engine decision.

Raw reports and CPU profiles are outside the repository under `/workspace/artifacts/runtime-followup/`. Final world and targeted reports are in `/tmp/ashmark-progress-6GRd1V/` and `/tmp/ashmark-progress-gLxUEi/` respectively.
