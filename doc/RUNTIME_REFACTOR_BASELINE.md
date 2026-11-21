# Runtime refactor baseline — 2026-11-21

The runtime review starts at `5ecd53f`, after merging `origin/codex` through `4828831`. The detached baseline has no runtime changes. Work stays on `codex`; the separate casual battle prototype is outside this task.

## Targeted baseline

Untouched tests: frameprof 7, coreparts 33, campaignhud 37, structure 36 and artpace 11 passed. Worldui passed 40 and failed 8; buildmodels passed 41 and failed 3. These are targeted results, not a clean full-suite claim.

Worldui fixtures used flat screen coordinates after terrain lift was added. They now project clicks, hover boxes and footprints through the same existing ground transform. Fine-resolution artwork retains its logical dimensions; native effects still require pixel alignment. Footprint position allows the screen rounding and inverse-ground quantization error while retaining the expected side and distance.

Buildmodels still recorded earlier building artwork. The 235 changed hashes were captured from the untouched baseline, before runtime edits. Existing cloth and pennants (`508ad8c`), the Vale roof correction (`a24474d`) and intervening shared renderer changes are retained. The exact old/new values are in `RUNTIME_BUILDING_RECORDS.json`; each record pins an existing baseline output, not newly generated art. Intentional fine model faces (poles and pennants) are exempt from the roof-stick rule; ordinary roof faces remain checked. No production building artwork changes in this batch.

## Measurements and scope

The untouched artpace suite reports first live draw 1072 ms and longest incremental frame 2284 ms despite passing. Its incremental and synchronous chunk hashes match (`f0605ca6`). A synchronous day probe took 213 ms in this environment; trainers, sieges, economy and autosave all contributed. These timings include browser/environment variation and are diagnostic, not hardware guarantees.

The accepted order is baseline, frame timing and daily work, HUD and icon names, shared ground query, then marching presentation. Renderer passes and terrain worker dependency work wait for an engine decision. Full test sweeping remains the coordinator's responsibility.
