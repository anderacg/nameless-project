# Runtime refactor baseline — 2026-11-21

The runtime review starts at `5ecd53f`, after merging `origin/codex` through `4828831`. The detached baseline has no runtime changes. Work stays on `codex`; the separate casual battle prototype is outside this task.

## Targeted baseline

Untouched tests: frameprof 7, coreparts 33, campaignhud 37, structure 36 and artpace 11 passed. Worldui passed 40 and failed 8; buildmodels passed 41 and failed 3. These are targeted results, not a clean full-suite claim.

Worldui fixtures used flat screen coordinates after terrain lift was added. They now project clicks, hover boxes and footprints through the same existing ground transform. Fine-resolution artwork retains its logical dimensions; native effects still require pixel alignment. Footprint position allows the screen rounding and inverse-ground quantization error while retaining the expected side and distance.

Buildmodels still recorded earlier building artwork. The 235 changed hashes were captured from the untouched baseline, before runtime edits. Existing cloth and pennants (`508ad8c`), the Vale roof correction (`a24474d`) and intervening shared renderer changes are retained. The exact old/new values are in `RUNTIME_BUILDING_RECORDS.json`; each record pins an existing baseline output, not newly generated art. Intentional fine model faces (poles and pennants) are exempt from the roof-stick rule; ordinary roof faces remain checked. No production building artwork changes in this batch.

## Measurements and scope

The untouched artpace suite reports first live draw 1072 ms and longest incremental frame 2284 ms despite passing. Its incremental and synchronous chunk hashes match (`f0605ca6`). A synchronous day probe took 213 ms in this environment; trainers, sieges, economy and autosave all contributed. These timings include browser/environment variation and are diagnostic, not hardware guarantees.

The accepted order is baseline, frame timing and daily work, HUD and icon names, shared ground query, then marching presentation. Renderer passes and terrain worker dependency work wait for an engine decision. Full test sweeping remains the coordinator's responsibility.

The legacy bridges suite also referenced removed `BRIDGE_ART` and a removed ferry on/off comparison. It now examines the visible `bridgePic` artwork rather than `WorldArt.deck` (a monochrome clearance mask), checking colour detail, transparency and deterministic redraw. Ferry rope, shadow and post checks remain, with the always-enabled artwork checked directly. No bridge artwork changes or bridge hash updates are part of this repair.

## Runtime validation notes

The isolated page-painter comparison disables workers in both revisions. Both pass all 12 checks, including interleaving two unfinished chunks, with matching `f0605ca6` pixels. This run measured first live draw 323 ms before and 195 ms after; the longest incremental frame was 282 ms before and 292 ms after. These outliers remain: the cooperative frame budget is not a hard limit on one operation or garbage collection. The earlier multi-second measurements also included worker startup and parallel world rebuilding and must not be compared as a clean before/after speedup.

Live midnight cooperates only when requested by the map loop. Direct Clock.advance calls (including bulk developer commands), explicit waits and synchronous tests retain their original behavior. The interrupted world step resumes once after the daily transaction releases, preserving movement and allowing an encounter to start its own transaction. The existing loading overlay may become visible for a slow midnight; daily callbacks themselves remain indivisible.

## Completed focused checks

372 assertions passed across 19 focused suites on the refactored code:

| Suite | Passed |
|---|---:|
| frameprof | 8 |
| coreparts | 33 |
| uiicons | 17 |
| battleui | 39 |
| campaignhud | 37 |
| session | 10 |
| artpace | 12 |
| ground | 8 |
| hudcontrols | 6 |
| frametime | 14 |
| structure | 36 |
| mobilehud | 27 |
| mobilebattlehud | 26 |
| marchlooks | 7 |
| bridges | 13 |
| bridgeroads | 16 |
| paintworker | 5 |
| daybudget | 10 |
| worldui | 48 |

The repaired fixtures also pass on untouched production code: worldui 48, buildmodels 44, isolated artpace 12, bridges 13. Worker parity includes 16 paintings (eight chunks at two resolutions), their terrain layers, props, grass and standing indices.

Full `worldprint` reached the 600-second limit on both the untouched and changed revisions. The current broad `worldsave` matrix reached the limit too, after an earlier 240-second attempt. Neither reported JavaScript errors before timeout, but these runs are **unverified**, not passes. No world fingerprints were re-recorded. The focused midnight suite does exercise the real compressed autosave and read its record back; session checks also pass. This is not a full-suite green-baseline claim.

Renderer passes and worker dependency extraction remain deferred until the engine choice. Terrain kernels and daily callbacks still need finer subdivision to eliminate the remaining long operations. The coordinator's full sweep remains outstanding.
