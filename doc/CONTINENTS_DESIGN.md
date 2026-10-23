# Several continents and bigger worlds: design

**Status:** design only, 2026-10-22, for the owner's review. Nothing here is built. Written against `main` at f538fa7.
**Starts:** after agents R, S, T and U merge (they are changing `world/worldgen.js`, `world/worldplace.js`, `gfx/worldart.js` and `data/world.js` now). Phase C0 (the refactors) is the first step.
**Readers:** the owner, and the developer agents who will build it.
**Measured or estimated:** every number marked *measured* comes from headless Chrome on the owner's PC, 2026-10-22, at f538fa7 with `-Gen`: `tests/visual/worldscale.js -Seed 2` (Huge), and a throw-away probe (not in the tree) that ran the same steps at Huge, Vast and Immense with `WORLD_LIMITS` raised at run time. Everything else is an *estimate*, and says so.

**The owner's decisions (2026-10-22)**, fixed:
1. **Sea travel is passage at ports.** You pay at a port for passage to another port, by distance and band size. The voyage takes days, and your band comes ashore at the other port. A small chance of storms or pirates on the way. Lords' armies and caravans use the same sea lanes. Owning ships may come later: leave a hook.
2. **Realms are mixed by suitability.** Each people settles where the land suits it, so a continent can hold several realms. A realm may hold land on two continents through its ports. Wars can cross the sea.
3. **How many continents is a Land setting.** Today's choices (Continent, Coasts, More sea, Lakes) gain **Continents** (2–3 landmasses) and **Archipelago** (many big islands). The default stays Coasts.
4. **Bigger sizes:** **Vast** (about 1536 × 1152 tiles) and **Immense** (about 2048 × 1536), **on every device**, phones included. This overturns D1 ("one continent") and D44's cap (Huge, 786,432 tiles).
5. **Later, not now:** more peoples and realms. The design keeps realms and peoples open to any number.
6. **Today's hand-made map is being retired.** This design is for the generated world only.

---

## 0. Where we start

### 0.1 What the code assumes today

| What | Today | Where |
|---|---|---|
| Land | One warped fbm field minus one centred edge falloff, cut at the setting's share (60–80% land). Land pieces under 40 tiles are sunk | `worldgen.js` `genLandField`, `genLand`, `GEN_LAND` |
| Where holdings may stand | **Only on the largest piece of land** a road can join (`F.conn[i] === F.main`). Isles are never settled | `worldplace.js` `genHoldings` `site()` |
| Capitals | The best sites per people, map-wide, at least 0.3 × the diagonal apart (shrunk to 0.6 of that if none fit) | `genHoldings` |
| Ports | A coastal holding on the open sea (`placeOpen`); **at most one port per realm**, the League as many as it likes | `genHoldings` (`ports[h.f]`); the check asks one port in the world |
| Realms | `PLACE_REALMS` from `PLACE_SHARE` (5 keys); its counts read the list, but texts and `FACS` assume five | `worldplace.js`, `ui/worldsetup.js` |
| Roads, camps, checks | Every holding and camp reachable **from the first capital** | `placeCheck`, `genCamps` |
| Router | Land only. Edge kinds 0–5 (road, track, crossing, river down and up, portal step); river legs never taken by land ways. `Router.reach` is the land's pieces, a ferry's two landings joined | `world/router.js` |
| Ships | Trade ships and fishing boats on water joined to ports. Each launch is a **breadth-first search over the whole map** (`shipPath`: an `Int32Array(MW × MH)` a call). Frost-climate water is closed to them. Not saved | `world/ships.js` |
| Lords | Target the nearest enemy holding **by straight line** (`Spatial.nearest`), go home to the nearest own holding by straight line | `world/realms.js` `lordThink` |
| Level of detail | Near, mid and far tiers exist, but **near and mid are unbounded**: everything thinks every frame; no kind has a `farStep` | `world/worldobject.js` `WORLD_LOD` |
| Size limits | 320–1024 × 224–768 tiles, at most 786,432 (Huge) on every device (D44) | `worldsettings.js` `WORLD_LIMITS` |

### 0.2 Measured costs at Huge, Vast and Immense

Seed `s1`, holdings 66 / 100 / 136, everything else Normal. Wild things still use today's caps (`DENSITY.classic`, before agent U's change), so the entity counts below do not grow with the map.

| | Huge 1024 × 768 | Vast 1536 × 1152 | Immense 2048 × 1536 |
|---|---|---|---|
| Tiles | 786,432 | 1,769,472 | 3,145,728 |
| Generation, desktop headless | 3.8 s and 6.5 s (two runs) | 11.9 s | **43.3 s**: roads 32.7 s, 8 tries, one pair never joined ("no road Thornmoor to Aldmoor", relaxed). About 14.6 s with one roads try |
| Slowest stage | mountains 1.1–1.5 s | roads 4.3 s | roads about 4.1 s a try |
| Typed arrays made while generating (a sum, not the peak: freed as it goes) | 422 MB | 779 MB | 2,164 MB (905 MB in the roads' 8 tries) |
| Busiest stage's arrays | mountains 112 MB (3 tries) | holdings 201 MB (3 tries) | mountains 300 MB (2 tries), climates 270, rivers 249 |
| Put in, then the start | 0.6–1.0 s, 0.6–1.0 s | 1.9 s, 1.8 s | 2.0 s, 1.8 s |
| Way graph | 9,748 nodes | 21,342 | 37,959 |
| **Router, 60 trips between random holdings, cold** | median 13 ms, slowest 832 ms | median 344 ms, slowest 2.0 s | **median 508 ms, slowest 3.4 s** |
| … the same trips again (chunk tables as the LRU left them) | median 7.9 ms, slowest 457 ms | 229 ms, 1.4 s | 514 ms, 3.4 s |
| … every chunk table made first | **median 1.1 ms, slowest 5.1 ms** | 1.1 ms, 4.9 ms | **1.7 ms, 11 ms** |
| Making every chunk table | 346 ms, 0.6 MB | 1.6 s, 1.3 MB | 3.7 s, 2.3 MB |
| The fog's minimap, each rebuild (at most every 0.5 s while you explore) | 52 ms | 76 ms | **128 ms** |
| The land's minimap, the art's minimap | 30, 34 ms | 45, 46 ms | 36, 29 ms |
| The full map's picture at 1:2, 1:4 | 24, 4.6 ms | 35, 9.8 ms | 30, 12 ms |
| `updateWorld` a frame (entities on the map) | 2.3–2.4 ms (330) | 1.5 ms (402) | 1.9 ms (478) |
| A day's jobs | 29–70 ms | 41 ms | 65 ms |
| Save, plain and gzipped | 273–279 KB, 62–64 KB | 373 KB, 81 KB | 473 KB, 100 KB |

**What the router numbers say:** the slowness is not the graph. A long trip's A\* touches hundreds of chunks, and each chunk's table of costs between its nodes is made on first use and kept in an LRU of `WAY.chunks` = 512. Huge has 768 chunks, Vast 1,728, Immense 3,072, so one trip can evict tables it needs again (the warm rerun stays slow). Made once, all of them cost 0.6–2.3 MB and trips fall to 1–2 ms.

### 0.3 Memory a tile, at run time (measured)

The same at every size, so it is a cost per tile:

| Part | Bytes a tile | Huge | Vast | Immense |
|---|---|---|---|---|
| Map layers (`MAP_LAYERS`: 12 bytes and `basin` 16-bit) | 14 | 10.5 MB | 23.6 MB | 42 MB |
| Territory (`LAND` 2, `LAND_EDGE` 1, `landBest` 8, `landDist` 8) | 19 | 14.3 | 32.1 | 57 |
| The install copy (`WM.first`: land, lots, deposits) | 6 | 4.5 | 10.1 | 18 |
| `OCC` (lots, Int32) | 4 | 3.0 | 6.8 | 12 |
| `DEP_AT` | 2 | 1.5 | 3.4 | 6 |
| `W.seen` | 1 | 0.8 | 1.7 | 3 |
| **The fog's grid (`WFOGV`: four Float32 grids of 8-px cells, 4 cells a tile)** | **64** | **48** | **108** | **192** |
| Land pieces (`LAND_PIECE`, Int32) | 4 | 3.0 | 6.8 | 12 |
| Water bodies (`WATER_ID`, Int32) | 4 | 3.0 | 6.8 | 12 |
| The art plan (`WorldArt.bytes().plan`) | 24–25 | 18.8 | 40.4 | 73 |
| **In all** | **142–143** | **107 MB** | **240 MB** | **427 MB** |

Plus what comes and goes: the painted chunks (1 MB each, 20 on a phone, 32 on a desktop), the fog's minimap rebuilt at full size (a `MW × MH` canvas, its `ImageData` and two Float32 grids: 16 bytes a tile, 50 MB at Immense, every 0.5 s while exploring), and each trade ship's launch (`shipPath`: 4 bytes a tile, 12.6 MB at Immense).

**On a phone** (an *estimate*: iOS Safari and mid Android kill a tab somewhere between 400 MB and 1.2 GB, lower on 3 and 4 GB devices): Immense today does not fit. §4.2 brings it to about 40 bytes a tile.

---

## 1. Land with several landmasses (stage 1)

### 1.1 The Land setting

| Land | Landmasses | Land share | Sea between landmasses | Each landmass |
|---|---|---|---|---|
| Continent | 1 (and isles) | 79–80% | — | — |
| **Coasts** (default) | 1 | 75.5–78.5% | — | — |
| More sea | 1 | 64–68% | — | — |
| Lakes | 1 | 76.5–78.5% | — | — |
| **Continents** (new) | **2 at Normal, 2–3 at Large and up** (3 at even odds) | 58–64% | at least 28 tiles at the narrowest, a mean of 48 or more along the shared side | each at least 22% of the land (two: a 35–65 split at most) |
| **Archipelago** (new) | big islands: Normal 5–7, Large 6–9, Huge 8–12, Vast 10–15, Immense 12–18 | 46–54% | at least 16 tiles, a mean of 28 or more | each big island at least 4% of the land and 6,000 tiles |

Every land setting may also have **isles** (40 to 4,000 tiles), as today. They are never inhabited (§2.8).

**Why these widths:** a ferry spans 12 tiles at most (`PLACE.ferry`) and a bridge 3, so 28 tiles can never be crossed by a road's crossing. The game's view is about 44 × 25 tiles (700 × 400 game px), so from one shore of a 28-tile strait you see only water ahead on a phone's short side, and two continents never look like one coast with a bay. The minimum is the narrowest point; most of the shared side is much wider (the mean rule).

### 1.2 How they are shaped

One field, as today, so the sketch and the real map agree (§4.3 of WORLD_DESIGN), with two new terms:

1. **Plates.** `K` landmass centres are drawn from the land stage's stream: two side by side across the long side of the map (offset up or down by up to 20% of its height), three as a ragged triangle, an archipelago's by a Poisson disc (spacing by area ÷ `K`), all kept 12% of the map off the rim. Each has a radius from its share of the land, drawn within the limits of §1.1.
2. **The field at a tile:** today's warped fbm, plus a **bump** `sstep(1 − d1 / r)` round the nearest centre (`d1`, by the domain-warped position), minus a **channel**: `depth × (1 − sstep((d2 − d1) / gap))`, where `d2` is the warped distance to the second nearest centre. `d2 − d1` is small along the line halfway between two centres, so the channel follows a ragged, warped line, never a straight cut or a circle. Then today's edge falloff and the cut at the share.
3. **Only allowed arithmetic:** `+ − × ÷` and `Math.sqrt`, as every stage (§8.1 of WORLD_DESIGN).
4. **One landmass settings keep today's field exactly:** with `K = 1` no bump or channel is added, and the stream draws nothing new, so Continent, Coasts, More sea and Lakes worlds stay byte for byte (§6, C0.2).
5. **Inland seas and lakes** come as today (`GEN_LAND.seas`, `lakes`), per landmass by its share: a continent of 40% of the land gets 40% of them.

**What a landmass is:** the land a band can walk over, with the rivers (their crossings come later) and any water a bridge spans (3 tiles or less). It is today's `F.conn` rule, labelled in stage 1 (`WM.mass`, §2.1) and again after the rivers (stage 4), since a lake or a delta may cut a corner off; a landmass keeps its id by its largest part. Two pieces joined by a 3-tile strait are one landmass.

### 1.3 Climates, rivers and the new rules, per landmass

The fields are map-wide, so most rules need nothing per landmass:

| Rule | Per landmass? | What changes |
|---|---|---|
| Temperature by latitude, the west wind's moisture, rain shadows | No: map-wide fields | A landmass's climates follow where it lies: a northern continent is cold. More sea makes the land wetter (moisture is gained over water), so Archipelago has more forest and fen. The swamp's share keeps its cap (`GEN_CLIMATE.swamp.hi` 18%) |
| Each climate 6–26% of all land (the check) | No: of all land | Unchanged. A climate may be missing from a whole landmass |
| **Big climates** (blur, strips, `minArea` pieces given to their larger neighbour) | Partly | `minArea` scales with the map's area today; on an island it becomes `min(that, 15% of the landmass)`, so a small island keeps two climates if it has room. A piece with no larger neighbour (an isle's) stays, as today |
| **Brooks end in water**, oases, ponds (play-test 4; agents R–U) | No: per tile | Unchanged. Where a rule counts per map (so many oases), it counts per land area instead (agent U's rule for `DENSITY`) |
| River systems | Yes | Today's count scales with the map's area (`ap`). It scales with **land area** instead, and is shared among landmasses by area. A great river needs a big basin: one on each landmass of 30,000 tiles and more, at most today's count for the size |
| Mountain ranges | Yes | Ranges start inland (14 tiles or more from water): fine on any landmass. Count by land area; **every landmass of 25,000 tiles and more gets a range**, so dwarves find peaks wherever they settle |
| Wild regions (Phase 4) | Yes | A whole uninhabited island may be one wild region (§2.8) |

### 1.4 The New world screen's sketch

- The sketch samples the same field (`genLandField`, now with the plates) at its 256 cells, so continents and islands show as they will be.
- **The counts line** gains the landmasses: "3 landmasses · 2 settled · 66 holdings · 41 rivers · 61% land".
- **The capitals** are placed by the sketch's own cheap pass, now per landmass (§2.3's rules on the coarse cells).
- **Sea lanes** are not drawn in the sketch (they need the ports); the real map's full map draws them (§3.7).
- The Land row gets two more chips: Continent, Coasts, More sea, Lakes, **Continents**, **Archipelago**. On a phone the row wraps to two lines of three (each ≥ 36 CSS px tall, as today).

### 1.5 The stage's checks

| Check | Rule | On failure |
|---|---|---|
| Land share | Within the setting's range (§1.1), not today's fixed 60–80% | Retry |
| Landmasses | The count in range; each big one at least its minimum | Retry |
| Straits | The narrowest water between any two landmasses ≥ the minimum (a breadth-first distance from each landmass over water); the mean along their shared side ≥ the mean rule | Retry |
| Open sea | Every landmass touches the open sea (`placeOpen`), so it can have a port | Retry |
| Today's | Land under 40 tiles sunk, sea pockets under 12 filled; a ring of water at the rim | As today |

After 8 tries the stage **relaxes, never fails**: Continents 3 → 2; Archipelago one big island fewer at a time, down to 4; then the strait minimum −4 tiles at a time down to 20 (Continents) or 12 (Archipelago). Each step is listed in `relaxed` and on the World page.

---

## 2. Placement across landmasses

### 2.1 A `Landmass` record

Made in stage 1, filled in by stages 7–9:

```js
WM.mass   // Uint8Array(w*h): 0 water, isles and pieces too small to settle; 1..n a landmass (derived from kind: not in MAP_LAYERS or WM.sum)
WM.masses = [{id, tiles, box, cx, cy,          // its land, bounding box and middle (tiles)
  kind: 'main'|'island',                       // Continents and the one-landmass settings: main; Archipelago: island
  open,                                        // it touches the open sea
  suit: {human, dwarf, elf, orc, league},      // its tiles each people likes (placeSuit ≥ .4): any number of peoples
  realms: [], holdings: [], ports: [],         // stage 7
  settled, wild}]                              // settled: a holding on it; wild: an uninhabited big landmass (§2.8)
```

- Each holding gets `h.mass`. `massAt(x, y)` reads the layer.
- On a one-landmass world there is one record, and every holding's `mass` is 1.
- A Uint8 layer allows 255 landmasses; Archipelago at Immense needs 18.

### 2.2 Peoples' liking across landmasses

`placeSuit` stays per tile. The capitals' candidates (today the best 64 sites per people, 24 tiles apart, map-wide) become **the best 16 per people on each landmass**, then the best 64 of those. A small landmass that one people loves still offers that people a site.

### 2.3 Capitals and realms

| Rule | One landmass (today) | Several landmasses |
|---|---|---|
| Capitals apart | 0.3 × the map's diagonal, by straight line, shrunk to 0.6 of it if none fit | The same, global: it spreads the realms over the world |
| Capitals per landmass | — | **Continents:** each continent gets at least 1 capital (a score bonus, not a lock) and at most `ceil(realms × its share of the land) + 1`. **Archipelago:** capitals on the islands their peoples like best, at most 2 on one island |
| A capital's land (`PLACE.land` suitable tiles within 90 tiles) | Counted in a circle | Counted **on the capital's own landmass** only |
| A fair start (3 holdings within a day) | From the capital | The same, on its landmass |
| Capitals' nearest rivals alike (skew ≤ 25%) | Straight line | Straight line (a strait does not make a rival far: ships are 3 times a march) |
| Growth | Poisson-disc candidates within reach of its own holdings | **On the capital's landmass first**. A candidate across water is never taken by the home growth |
| Overseas | — | After the home growth, a realm short of its quota (its landmass full), or the League always, plants **a beachhead**: a port town on another landmass its people like, then villages within reach of it. At most 40% of a realm's holdings overseas (the League 60%). This is how a realm "holds land on two continents through its ports" |
| Castles facing rivals | Rival distance by straight line | Rivals on the **same landmass** only: a castle faces a land border, not the sea |

**Open to any number of realms:** every count reads `PLACE_REALMS.length` and `PLACE_SHARE`; no rule says five. The New world screen's "shared among the five realms" reads the number. When more peoples come (owner's point 5), each brings its `placeSuit` row, `PLACE_SYL` and `LORD_SYL` rows and a `PLACE_SHARE` entry, and nothing here changes.

### 2.4 Holdings' density per landmass

- **The world's holdings by default follow land area**, as agent U is doing for `DENSITY`: the size's default (`WORLD_LIMITS.holdings.def`, §4.10) × the land share ÷ 0.77 (Coasts' mean). Continents at 61% land get about 79% of Coasts' holdings; Archipelago about 65%.
- **The maximum** gains two factors beside today's `wild` (0.75) and `sea` (0.85): `continents` 0.85 and `archipelago` 0.75.
- **Per landmass:** no quota of its own. Realms grow where their capitals stand; the spacing table (`PLACE_GAP`) and room rule spread them. A landmass no capital took is filled by beachheads, hamlets (Phase 4) and founding sites (Phase 4b), or stays wild.

### 2.5 Ports on every settled landmass

| Rule | How many |
|---|---|
| Every settled landmass | At least 1 port (today's check, for the whole world: at least one port) |
| With Continents and Archipelago | **At least 2** on a landmass of 30,000 land tiles or more, or one shared by 2 realms or more |
| A realm on two landmasses | A port on each (a beachhead is one) |
| Kept from today | A realm's first coastal town or village is its port; the League as many as it likes |
| A beachhead | Is itself a port |
| Where | On the open sea, as today (`placeOpen`, `placePort`): a sea port, never a lake's |

**How:** the kinds step already makes a coastal town or village a port. When a landmass or realm would end without one, the next holding it places there scores coastal sites +0.5 and must be within 2 of open water; if no holding of that realm is left to place, its best coastal village becomes the port. On a one-landmass setting the rules ask only today's (a port in the world), so its holdings are the same (§6, C0.3).

### 2.6 Roads per landmass

- **Pairs** (a spanning tree and each holding's two nearest) are made **within each landmass** only. A pair across the sea is never asked, so the roads stage never searches for a way that cannot exist.
- **A failed pair retries only that pair** with a new noise on its costs (up to 3 times), then is dropped and listed, instead of retrying the whole stage. Today one bad pair at Immense cost 8 full tries: 32.7 s of 43.3 s (§0.2).
- **The roads' check:** every holding reachable from **its landmass's first holding** (with the flooding fords shut, as today), not from the first capital.
- **Camps** (stage 9): reachable from their landmass's first holding; only on settled landmasses (they need roads 6–16 tiles away).

### 2.7 Balance with sea between

| Check | One landmass | Continents | Archipelago |
|---|---|---|---|
| Each realm's land within this share of the mean (`PLACE.even` as placed, `PLACE.spread` after the roads) | 24% / 30% | 30% / 36% | 36% / 42% |
| How a realm's land is counted | Its holdings' reach over land (`placeRealmLand`) | The same, every landmass it holds summed | The same |
| Relax order | As today: one holding fewer a realm, twice | Then beachheads allowed to 50% of a realm | Then at most 3 capitals an island (from 2) |

The land counts never reach over water (the reach is a travel cost over land), so a realm's land on two continents is two pieces, summed. Territory's contiguity rule (cut-off pieces under 40 tiles become wild) works per holding and needs nothing new.

### 2.8 Empty and wild landmasses

- **Allowed.** A big landmass no capital or beachhead took is **wild**: no holdings, no roads, no camps.
- **What it holds:** beasts (monsters spawn only in the wilds already, §11.1 of WORLD_DESIGN), ruins, caves and lairs (Phase 4 weights them there). **The dragon's lair prefers an uninhabited landmass** when one exists (the interiors roadmap's "hard to find").
- **Reaching it:** no port, so passage there is a **landing** (§3.1): a beach the ship puts you ashore on, and comes back to on the day you choose (§3.3).
- **Isles** (under 4,000 tiles) are scenery and later sites; nobody lands there in v1.

---

## 3. Sea lanes and passage

### 3.1 The lane graph (a new stage, after the roads)

| | What |
|---|---|
| **Nodes** | Every port's **dock** (open-sea water within 3 tiles of it), and **landings**: a beach on open ground for each coastal holding within 12 tiles of it (for armies landing to besiege it), and one on each wild landmass of 6,000 tiles or more |
| **The grid** | A coarse sea grid of 4 × 4-tile cells (Huge 256 × 192, Immense 512 × 384); a cell is sea if 12 of its 16 tiles are open-sea water. Its step costs 1, ×3 within 2 cells of land (lanes keep 8 tiles off the coast where the sea is wide enough), ×1.25 on frost-climate water (floes) |
| **One search** | A single Dijkstra from every node at once over the grid. Each sea cell learns its nearest node: the sea is cut into regions, one a node. **Two nodes whose regions touch get a lane** between them, its cost the two sides' costs to the touching cells. Every node on one sea is joined; lanes go round land by themselves |
| **Each lane** | Its cells traced back from the touching point to both nodes, string-pulled and rounded as the roads' lines are (`placeRound`): a polyline in tiles. Its length (tiles), days (§3.3), `frost` (its share over frost water), `closed` (a byte: Phase 5's winter, a blockade later) |
| **Kept** | `WM.lanes = {nodes:[{tile, kind:'port'|'landing', hold, mass}], edges:[{a, b, len, days, line, frost, closed}]}`. Made from the seed, never saved |
| **Size** | Huge: about 30 nodes and 80 lanes; Immense about 90 and 250 (*estimate*). A few KB |
| **Time** | One search over 49k cells (Huge) to 197k (Immense): about 15–60 ms (*estimate*, from the flood fills of §0.2) |

**Seeded and isolated** like every stage (its own stream `lanes`, the banned functions, no `Math.random`).

### 3.2 The router's sea edges

Walking stays on land; sailing is a leg the party's mind handles.

| Call | What it does |
|---|---|
| `Router.travel(o, goal, step)` | Unchanged: land only |
| `Router.reach(a, b)` | Unchanged: the same land |
| **`Router.reachSea(a, b)`** | Both landmasses have docks or landings on one lane network |
| **`Router.days(a, b, pace, {sea:true})`** | The cheapest of: by land; by land to a dock, the lanes, then land from a dock. With `sea` off (the default), today's answer |
| **`Router.plan(o, goal, {sea:true})`** | An itinerary: `[{k:'land', to: dock node}, {k:'sail', lanes:[…], from, to}, {k:'land', to: goal}]`. A walker follows its land legs with `Router.travel`; its mind starts a voyage (§3.6) at a sail leg |

**In the way graph:** each dock is already a node (kind 3, the port's landing). Lanes become **edge kind 6** between them, cost = the lane's days + `SEA.board` (a quarter day, loading and the tide). `wayGraph` skips kind 6 unless the query asks for the sea, as it skips the river legs (kinds 3 and 4) today. A matrix of **landmass-to-landmass days** (the cheapest dock to dock, a few hundred entries) answers the AI's "is it worth sailing" before any search.

### 3.3 Passage: prices and times

Every number in one table, `SEA` (a new `data/sea.js`):

| Entry | Value | Note |
|---|---|---|
| `speed` | **300 tiles a day** (75 km) | WORLD_DESIGN §6.6.3's sea cog; 3 times a band on foot, 2.3 times a road |
| `board` | 0.25 day | Loading at the dock, once a voyage |
| `fare` | **5 + people × tiles ÷ 120 gold** | People: you, soldiers, companions, prisoners; a rider counts 1.5 (with his horse). A third of D20's river rate (people × tiles ÷ 40), because sea legs are long |
| `fareMul` | your realm's ports ×0.8; at peace ×1; hostile to you ×1.5; at war with you: refused | |
| `landing` | the fare ×1.8 | To a beach (§2.8): the ship comes back for you on the day you choose (3–20 days on) and waits a day |
| `fast` | time aboard runs at the Travel fast speed (8×) | D20 said 4× for the river; the sea's days are longer |

**Examples** (*the first numbers, to tune in play*):

| Band | Lane | Fare | Days aboard | Real time at 8× |
|---|---|---|---|---|
| 10 people | 300 tiles | 30 gold | 1.25 | 28 s |
| 30 people | 400 tiles | 105 gold | 1.6 | 36 s |
| 30 people, all mounted | 400 tiles | 155 gold | 1.6 | 36 s |
| 80 people | 900 tiles (across Huge) | 605 gold | 3.25 | 73 s |
| 80 people | 1,800 tiles (across Immense) | 1,205 gold | 6.25 | 2.3 min |

### 3.4 Storms and pirates

Rolled once a game day at sea, from the named stream `voyage` (story content draws from named streams, `core/rng.js`):

| | Chance a day | Shape | What happens |
|---|---|---|---|
| **Storm** | `SEA.storm` 0.06; ×1.6 where the lane is mostly frost water; (Phase 5: by season) | A new **`Incident`** trigger, `'voyage'` (`defineKinds('incident', {trigger:'voyage'}, …)`, rolled by `Incident.voyage()`), so it is one more bucket beside `'day'` | **Squall** (weight 4): +0.25 day. **Gale** (3): +0.5–1 day, food −10%, morale −3. **Man overboard** (2): 1–2 men lost, or a share of the cargo; Survival 4 saves them. **Blown off course** (1): you come ashore at the next port along the lanes, wherever that is, with no refund |
| **Pirates** | `SEA.pirate` 0.04 × the Bandits setting (0.6, 1, 1.5); ×0.5 on lanes within 40 tiles of a dock of a realm at peace with you | A new **`Encounter`** kind, `pirates`, met on a page (no figure on the map: you are at sea). Its choices are a `ChoicePage` (`story/choice.js`), its results outcomes (`story/outcome.js`) | **Fight:** `autoResolve` (battle/engage.js) with your band and the ship's 6–12 sailors on your side. **Pay tribute:** 10% of your gold (at least 20). **Run:** the captain tries, 45% (+10% with a Guide); failing, they strike first (your side −10% in the fight). **Surrender:** captivity (CAPTIVITY_DESIGN's hook). A deck battle is the hook for later (§5) |

Expected on a 2-day crossing: a storm about 12% of the time, pirates about 8%: a small chance.

**At sea, the AI rolls too,** once a day at the far tier: a storm delays it; pirates take a trade ship's or caravan's cargo (they leave alone armies of 40 and more).

### 3.5 Supply at sea

| | At sea |
|---|---|
| Food and drink | Eaten and drunk each hour at the **resting** rate (`SUPPLY.eat.rest`, `drink.rest`) |
| Waterskins | **Never fill**: sea water. No well, no river |
| Foraging and hunting | None (LOGISTICS_DESIGN's foraging, when built, is off at sea) |
| Stamina | Comes back as when stopped (+2 an hour) |
| The land's drains | None: no desert, frost or rough ground; no shelter either |
| Short of food or drink | Hunger and thirst run as on land, their tolls too |

`supplyLand()` returns a sea record while `P.voyage` is set. **The booking window** shows the food and drink the voyage needs (days × the band's need × 1.25) beside what you carry, and offers **Buy provisions** for the shortfall at the port's prices.

### 3.6 The Harbour: booking passage

A new place in the holding's window, on the menu rail (the owner's places and people dock): **Harbour**, at every port (`bldLv(t, 'port') ≥ 1`). It follows the frame rule:

| Part | Content |
|---|---|
| **Header** | "Harbour of Saltmere", and the harbourmaster's card (`railCards`: his picture, "Ships sail with the morning tide") |
| **Content: destinations** | One row each (`railRow`, ≥ 36 CSS px tall), nearest first: the port's name with its realm's colour, its landmass ("across the Grey Sea"), **days**, **fare**, a storm and a pirate mark (none, one, two), and a **Choose** button (`railBtn`). Refused rows say why ("At war with you", "Under siege"). Landings on wild landmasses are listed after the ports, marked "Landing" |
| **Content: the chosen** | Fare in parts (people, horses, distance), days and the arrival day, provisions needed and carried with **Buy provisions**; for a landing, **Return on day** with − and + |
| **Hook** | A greyed "Your ships" row (owning ships, later) |
| **Bottom bar** (`nav()`) | **Back** on the left (to the holding's menu), **Sail** on the right (the way out): disabled until a destination is chosen and you can pay |
| **Esc** | Back |
| **Phone (844 × 390)** | The destinations list scrolls on the left (55%), the chosen on the right (45%); on a narrower screen the chosen opens under the list |

Ports you have never seen are listed too (sailors know them), so the sea is worth crossing.

### 3.7 On the map while sailing

- **You are a ship:** your band is drawn as a cog (`shipSprite`, big) with your banner's colour on its sail, moving along the lane's line; the camera follows. Fishing boats and trade ships go on around you.
- **Time:** runs at 8× by itself. A strip at the top: "At sea: Saltmere → Brinewatch · day 1 of 2" with **Skip to arrival**.
- **Skip** runs the remaining hours as steps (each hour's systems, `Systems.hour`), behind the loading overlay if it takes over 300 ms. A storm or pirates stop it and open their page.
- **What you can do:** open the full map, the party, the inventory; not walk, camp or meet anyone.
- **Sight:** ×1.25 at sea; the fog lifts along the lane.
- **Painting:** the lane is known, so the chunks ahead along it are queued first (the painter's prefetch by heading, given the lane's next point).
- **Arrival:** at the port's gate (or the landing's beach); a log line; the voyage ends.
- **The full map** draws the lanes you know (from ports you have seen) as faint dotted lines over the sea, and you on yours.
- **AI ships:** a lord's or caravan's voyage is drawn as a ship on its lane when it is near you; far away it moves by time (§4.5).

### 3.8 Save fields

| Where | Field | Shape |
|---|---|---|
| You (`Saves.add({key:'voyage', defaults:null})`) | `voyage` | `{from, to (a holding's name, or 'landing:<node>'), lanes:[edge ids], t0 (G.clock at departure), days, extra (storm delays), rolled (the last day rolled), fare, back (a landing's return day, or null)}` |
| A lord, a caravan | `o.voyage` | The same shape, on its own record (saved with it) |
| The world | `settings.land` | Gains `continents` and `archipelago` (the setting's key is unchanged) |
| Not saved | `WM.lanes`, `WM.mass`, `WM.masses`, trade ships at sea | From the seed (lanes, masses); decoration (ships, as today) |

A save made at sea loads at sea: the ship is put on its lane by `(G.clock − t0) / days`. No old-save migration (the owner's rule): new fields default to null.

### 3.9 Lords and caravans across the sea

| Who | What |
|---|---|
| **Lords: targets** | `lordThink` picks foes by **travel days with the sea** (`Router.days(…, {sea:true})`), as WORLD_DESIGN §10.5 planned (`ai.lordTarget`): the nearest by days, never past `SEA.ai.maxDays` (6) unless it is the realm's last enemy. Home is the nearest own holding by days |
| **Expeditions** | A lord whose target lies overseas goes to his realm's (or an ally's) nearest dock on his landmass, **musters** there (waits up to 2 days for another lord of his realm with the same target), pays the fare from the treasury (`payRealm`) and sails. He lands at a friendly port on the target landmass, else at the landing beside his target. Then he marches and besieges as today. **One expedition per realm at a time** |
| **Coastal sieges** | As today, by land. A besieged holding books no passage and sends no ships (it already sends none). **Relief by sea:** a lord sails to relieve his realm's besieged holding overseas (`relieve` by days). A blockade is a hook (the lane's `closed` byte) |
| **Lords at sea** | Off the map as at a holding (`l.voyage`, like `l.inside`): no meetings, no fights; they land where they planned. Captured, killed or recalled lords never sail mid-voyage |
| **Realm caravans** | May sail to a friendly holding overseas within `econ.caravanFar` **days**: walk to the dock, voyage (storms and pirates can take cargo), land and go on. Their pick (`neediest`) reads travel days, not straight lines, so a caravan never aims across a strait it cannot walk |
| **Trade ships** (`ships.js`) | Stay decoration and economy, port to port, now **along the lanes**: dock → the nearest lane node (a search in a 12-tile box) → lane lines → dock. Their partner port is the one with the need on the same lane network (no whole-map flood, `waterIds`, at launch) |
| **Your caravans** | Stay on their landmass in v1 (sailing them is a hook) |
| **Never sail** | Bands, patrols, monsters, critters, refugees, folk. Companions' own parties stay on their landmass; an order to an overseas holding says "Across the sea: take them with you" |

**Wars cross the sea** by these rules alone: realms at war on two landmasses send expeditions; a beachhead is besieged by an expedition or by its landmass's neighbours.

---

## 4. Bigger sizes on every device

### 4.1 The presets

| Preset | Tiles | ×Huge | Pixels | Chunks | Across by road (longest trip, measured) |
|---|---|---|---|---|---|
| Normal | 448 × 320 = 143,360 | 0.18 | 7,168 × 5,120 | 140 | about 4 days |
| Large | 640 × 448 = 286,720 | 0.36 | 10,240 × 7,168 | 280 | about 6 days |
| Huge | 1024 × 768 = 786,432 | 1 | 16,384 × 12,288 | 768 | 10–11 days |
| **Vast** | 1536 × 1152 = **1,769,472** | 2.25 | 24,576 × 18,432 | 1,728 | 14–16 days |
| **Immense** | 2048 × 1536 = **3,145,728** | 4 | 32,768 × 24,576 | 3,072 | 20–21 days |

**Limits:** `WORLD_LIMITS` width 320–2048, height 224–1536, steps of 32, aspect 1.2–1.6 as today, **at most 3,145,728 tiles on every device**. Custom sizes go up to Immense. The size row shows Normal, Large, Huge, Vast, Immense and Custom (two rows of three on a phone). Phones show the slow-on-this-device note (D44's) with the time estimate measured on that device (§4.3).

### 4.2 Memory: what changes to fit a phone

**The aim:** about **40 bytes a tile** resident (Immense about 120 MB), the generation's peak under about 300 MB at Immense, nothing that rebuilds a whole-map array while you play.

| Part | Today | After | How | Behaviour |
|---|---|---|---|---|
| Map layers | 14 | 14 | Kept: they are the world | — |
| The install copy (`WM.first`) | 6 | 0 | Dropped after install; a second `begin` regenerates from the seed (it is already deterministic) | Same |
| Territory | 19 | 3 | `LAND` (2) and `LAND_EDGE` (1) kept; `landBest` and `landDist` are scratch for `computeLand`: a buffer the size of one holding's box (its reach ×2 + 1 squared), reused | Same results |
| `OCC` | 4 | 2 | Uint16 lot ids (Immense at 400 holdings × 60 lots = 24k ids) | Same |
| `DEP_AT`, `W.seen` | 3 | 3 | Kept | — |
| **The fog's grid** | **64** | **≈ 0** | A window round the view instead of the whole map: 4 × 3 chunks of 8-px cells (256 × 192 cells × 4 grids × 4 bytes = 0.8 MB), slid when you cross a chunk, its cells rebuilt from `W.seen`. The blur reaches 3 cells, so the window is wider than the view by more than that | The same pixels in view |
| Land pieces | 4 | 2 | Uint16 piece ids (`WM.mass` answers most questions) | Same |
| Water bodies | 4 | 0 | Trade ships use the lanes; fishing boats search a 12-tile box | Ships' routes change (decoration) |
| The art plan | 24–25 | ≤ 8 | **Paged by chunk region:** the plan's per-tile parts (its deposit, clear and nature masks) made for 8 × 8-chunk regions when a chunk there is first painted, at most 6 regions kept (an LRU); the plan's lists (roads' segments, boxes, fords) stay whole (small) | The same pixels (the plan's values are local) |
| **In all** | **142** | **≈ 36–40** | | |
| **At Immense** | 427 MB | **≈ 120 MB** | | |

**What comes and goes:**

| | Today | After |
|---|---|---|
| The fog's minimap | `MW × MH` canvas and grids rebuilt each 0.5 s while exploring (128 ms and 50 MB at Immense) | Built at the minimap's scale (1 px per `k` tiles: Immense 256 × 192), only the rows that changed: ≤ 2 ms |
| The land's minimap | `MW × MH` canvas, a `fillRect` a tile | `ImageData` at `k` |
| A trade ship's launch | 4 bytes a tile (whole-map search) | The lanes |
| Chunk canvases | 20 (phone) or 32 (desktop) × 1 MB | Unchanged. The view is the same size at every preset |
| The router's chunk tables | LRU of 512 | All of them, never evicted: 0.6 MB (Huge), 1.3 (Vast), 2.3 (Immense) (§4.4) |

**Generation's peak:** today each stage allocates its own working fields (§0.2: Immense's mountains made 150 MB a try, climates 270 MB, rivers 249 MB, the roads 113 MB a try). Two changes, both byte-identical:
1. **A buffer pool** in the stage context (`g.buf(name, Type, n)`): the same named buffer reused across stages and retries, released at the end. Fields keep their type (a Float64 stays Float64: a change of precision would change the worlds).
2. **The placement fields per landmass box:** stage 7–9's distance fields (`placeFields`: 21 bytes a tile) are map-wide today; per landmass they cover its bounding box only. On one landmass, the box is the map (same result).

*Estimate:* the peak at Immense falls from about 500 MB to about 250 MB.

### 4.3 Generation time

| | Huge | Vast | Immense |
|---|---|---|---|
| Measured, desktop headless | 3.8–6.5 s | 11.9 s | 43.3 s (14.6 s without the roads' retries) |
| After §2.6 (a failed road retries itself) and the pool, desktop (*estimate*) | 4–6 s | 11–12 s | 15–17 s |
| Mid phone, ×2.5 (WORLD_DESIGN §3.7's ratio; *estimate*) | 10–15 s | 28–30 s | 38–43 s |

The screen's estimate (`WSETUP.time`) gains Vast and Immense points and keeps measuring on the device (`localStorage`, as built). Every stage already yields every 10 ms behind "Forging the world…", so the page never freezes.

### 4.4 Routing

1. **Every chunk table made, never evicted** (`WAY.chunks` from a fixed 512 to the world's chunk count). **Built 2026-10-23** (f8104a9, by Codex: no LRU, a graph keeps one table per chunk; `tests/routercache.js`). This alone takes trips from 344–508 ms to 1.1–1.7 ms median at Vast and Immense (§0.2).
2. **When:** the tables of your landmass are made in a load step ("Charting the ways"), the rest in idle slices of ≤ 4 ms a frame (Immense: 3.7 s of work, about 15 s of play at 60 fps), and any table a search needs before then on demand (as today). On a phone *estimate* ×2.5: about 9 s spread over play.
3. **Per landmass:** a search never leaves its landmass (the sea is a lane edge), so the A\* front stays on one landmass.
4. **The pair cache** grows with the holdings: 1,024 at Huge, 4,096 at Immense.
5. **AI by days** reads the landmass-to-landmass matrix first (§3.2), so most "how far" questions never search.

### 4.5 Far from you: sleeping and slower thinking

Today every party thinks every frame (§0.1). At Huge it is 2.4 ms for 330 entities. With agent U's densities by land area, Immense will hold about 4 times Huge's (*estimate*: 1,200–1,500), about 10 ms a frame: too slow on a phone.

| Tier | Who | How often | How they move |
|---|---|---|---|
| Near | Within 600 px of you | Every frame | As today |
| Mid | Within 2,048 px | Every 4th frame, 4 × `d` | As today, coarser |
| **Far** | Beyond, on your landmass | **Once a game hour** (`farStep`) | Along their route by time: lords, caravans, patrols, bands. Two far parties meeting on a graph node or edge: `fights.js`' auto-resolve |
| **Asleep** | On another landmass | **Once a game hour**, a quarter of them each hour in turn | The same as far; beasts and herds there are not kept at all (they are made again near you when you land) |

- `WORLD_LOD.near` and `mid` become 600 and 2,048 px at Vast and Immense; Normal to Huge keep them unbounded until the far tier is proven (`tests/lod.js`), so nothing moves there.
- **Spawning** stays near you (bands, beasts, herds already spawn in a ring round you); caps per landmass by its land share, so a landmass you are not on is never filled with beasts nobody sees.
- **Daily jobs** are already sliced (`Systems.sliced`).

### 4.6 The full map and the minimap

| | Huge | Vast | Immense |
|---|---|---|---|
| Minimap (`k = ceil(MW/256)`) | 256 × 192, 1 px per 4 tiles | 256 × 192, 1 per 6 | 256 × 192, 1 per 8 |
| Full map opens at | 1 px per 2 tiles (512 × 384) | 1 per 3 (512 × 384) | 1 per 4 (512 × 384) |
| Its picture (measured) | 24 ms at 1:2 | 35 ms at 1:2, 10 ms at 1:4 | 30 ms at 1:2, 12 ms at 1:4 |
| Zoom | to 1:1 by region, as today (`FULLMAP.zooms` gains 0.25 and 0.33) | | |

The full map adds the lanes you know (§3.7) and the landmasses' names.

### 4.7 Save size

Measured (with today's wild-thing caps): Huge 62–64 KB gzipped, Vast 81 KB, Immense 100 KB. With densities by land area (agent U) the parties grow about with the land: *estimate* Vast about 120 KB and Immense about 180 KB gzipped, 7 slots about 1.3 MB of the 5 MB `localStorage`. Gzip stays required for Huge and up (`SAVE_ZIP`, D8). A voyage adds under 1 KB.

### 4.8 Loading, with its steps

A save is the seed and the changes (§9.3 of WORLD_DESIGN), so loading regenerates the world. The overlay's steps, with their bar weights:

1. The generator's stages, as today: Raising the land … Laying roads, then **Charting the sea lanes** (new), Placing camps, Charting the ways.
2. Drawing borders (install).
3. **Mapping your lands** (new: the chunk tables of your landmass, §4.4).
4. The first paint.

*Estimate* at Immense: desktop about 20 s, a mid phone about 50 s. Each step names itself, so a long load reads as progress.

### 4.9 The world code

`ASH1-<preset>-<number>-<seed>` packs the choices and `holdings` (radix 256), width ÷ 32 (radix 33) and height ÷ 32 (radix 25). Immense needs width ÷ 32 up to 64 and height up to 48, holdings up to 400 (radix 512 leaves room), and Land has 6 choices:

| | ASH1 (today) | **ASH2** |
|---|---|---|
| Land choices | 4 | 6 |
| Holdings radix | 256 | 512 |
| Width ÷ 32 radix | 33 | 65 |
| Height ÷ 32 radix | 25 | 49 |
| Largest number | about 2.7 × 10¹¹ | about 3.1 × 10¹² (under 2⁵³: safe) |
| Base-36 digits | up to 8 | up to 9 |
| Preset letters | C N L H F R X | and **V** (Vast), **I** (Immense) |

`worldCode` writes ASH2. `parseWorldCode` reads both (ASH1 with its old radices: a few lines), so a code shared today still works.

### 4.10 Holdings' counts at the new sizes

Today's defaults grow with about the square root of the area (Large → Huge: exponent 0.50), the maxima a little faster (0.59):

| `WORLD_LIMITS.holdings` | Normal | Large | Huge | **Vast** | **Immense** |
|---|---|---|---|---|---|
| `def` (Coasts' land) | 27 | 40 | 66 | **100** | **132** |
| `max` | 60 | 110 | 200 | **300** | **400** (capped below the 0.59 trend's 450: entities and lords) |
| Lords a realm (`PLACE.lords`, by the defaults) | 4 | 4 | 7 | about 10 | about 12 |
| A capital's land need (`placeNeed`) | 1 | 1.5 | 2.4 | **3.6** | **4.8** (×`PLACE.land`) |

With the land-area rule (§2.4), Continents at Immense default to about 104 and Archipelago about 86.

---

## 5. Battles

| Where | The field | Phase |
|---|---|---|
| **A coastal tile** (`feat` coast) | The sea along the north or south edge (TERRAIN D5: north and south shape their own edge): deep water a few cells in, a beach band (sand, shingle in the frost, mud in the swamp) | C7 |
| **A port's tile** | The coast field with a pier or two (wooden obstacles, a line of boats at the edge) | C7 |
| **A landing** (an army that came ashore, met there) | The landing side deploys in the beach band with the sea behind it: no withdrawal off that edge, morale −5 at the start ("backs to the sea"); the defenders on the higher ground inland | C7 |
| **Pirates at sea** | Auto-resolve in v1 (§3.4) | C4 |
| **A sea battle** | Not in scope. The hook: `BattleSite.sea` (null), a `deck` recipe name reserved in `terrainRecipeOf`, and pirates' Fight going through one function (`seaFight`) that later opens a deck battle instead of `autoResolve` | Later |

`battleSite` already reads the tile's neighbours (`kinds`) and `feat`; the coast and the pier come from them. The field seed stays `hash(tx, ty, code + WM.salt)`.

---

## 6. Refactors first

Each is behaviour-preserving: the battle prints, `rts -Seed 1,2,44`, `aishare`, and a new set of **generated-world prints** hold. `worldprint` (W1–W8) hashes today's hand-made map, which is being retired; until it is re-recorded on the generated classic world (whoever retires the map), it holds too.

**G-prints** (a new `tests/genprint.js`, recorded before C0 starts): for Classic, Normal `redwater`, Large `s1` and Huge `s1`: `WM.sum`, the holdings (JSON), roads, crossings, camps, the way graph's node and edge counts, and the world code. Every refactor keeps them.

| # | Refactor | Files | Effort |
|---|---|---|---|
| **C0.1** | **The `Landmass` record:** stage 1 labels landmasses by today's `F.conn` rule into `WM.mass` (derived, outside `MAP_LAYERS` and `WM.sum`) and `WM.masses`; `h.mass` on holdings; `massAt(x, y)`. One record on today's worlds | `worldgen.js`, `worldplace.js`, `worldmap.js` | S |
| **C0.2** | **The land stage takes N landmasses:** `genLandField(s, W, H, R, hints)` becomes `genLandPlan(…)` returning `{want, plates:[], at(x, y)}`. With one plate it draws nothing new and adds no term: today's field byte for byte. The sketch calls the same | `worldgen.js` | S |
| **C0.3** | **Placement per landmass:** `site()` asks "a settled landmass" (today: the main one only); `placeLand` counts the capital's landmass; road pairs within a landmass; the reach checks from each landmass's first holding; a failed road pair retried alone. On one landmass every answer is today's, wherever the roads stage succeeded at its first try (every G-print seed does; a world whose roads failed once gets other roads) | `worldplace.js` | M |
| **C0.4** | **Size tables in one place:** a `SIZE_POINTS` table (Normal, Large, Huge; Vast and Immense added in C6) that `WORLD_LIMITS.holdings`, `PLACE.lords`, `placeNeed`, `GEN_RIVER.great`'s choice, the "2–3 inland seas from 400,000 tiles" rule, the minimap's `k`, `FULLMAP`'s opening scale and the screen's time estimate all read through `areaTable`. Same values | `worldsettings.js`, `worldgen.js`, `worldplace.js`, `ui/map.js`, `ui/worldsetup.js` | S |
| **C0.5** | **The router takes options and more edge kinds:** `{sea, road}` options in place of the positional `rm`; edge kinds as a table (`WAY_EDGE`), so kind 6 is one row; `Router.warm(region)` makes chunk tables on purpose; `WAY.chunks` by size. Same paths | `router.js` | S–M |
| **C0.6** | **One way to the nearest reachable holding:** `Spatial.nearest(list, x, y, filter)` gets a `sameMass(o)` filter used where a party must walk there (a lord's home, refugees, caravans' `neediest`, companions); identical on one landmass. Choosing by travel days is a behaviour change and waits for C5 | `core/spatial.js`, `realms.js`, `refugees.js`, `caravans.js`, `companions.js` | S |
| **C0.7** | **Ships' routes behind one call:** `shipRoute(a, b)` wrapping today's `shipPath`, so lanes replace it later in one place | `ships.js` | S |
| **C0.8** | **The generator's buffer pool** (`g.buf`) and placement fields by box (§4.2). Same worlds | `worldgen.js`, `worldplace.js` | M |
| **C0.9** | **Any number of realms:** no "five" in texts or counts (the screen's "shared among the five realms", the check messages) | `ui/worldsetup.js`, `worldplace.js` | S |

**Order:** C0.1 and C0.2 first (the record the rest reads), then C0.3–C0.9 in parallel by file.

---

## 7. Phases and effort

All start **after agents R, S, T and U merge**. Up to 5 agents at once, split by files. "Prints" means G-prints, the battle prints, `rts` and `aishare`.

| Phase | Scope | Files (owned) | After | Effort | Prints |
|---|---|---|---|---|---|
| **C0. Refactors** (§6) | C0.1–C0.9; `tests/genprint.js` first | as §6 | R–U merged | **M** (5–6 sessions) | Hold |
| **C1. Several landmasses** (§1) | Plates, channels, the checks and relaxing; Land choices Continents and Archipelago; per-landmass climate pieces, rivers and ranges; the sketch and counts line; the Land chips | `worldgen.js`, `worldsettings.js` (choices), `ui/worldsetup.js`, its `style.css` section, `tests/landmasses.js` | C0 | **M** | Hold (one-landmass settings unchanged) |
| **C2. Placement across landmasses** (§2) | Candidates per landmass, capitals per continent, beachheads, ports per landmass and realm, roads and camps per landmass, balance by setting, wild landmasses | `worldplace.js`, `tests/worldplace.js` (cases), `tests/worldsanity.js` | C1 | **M–L** | Hold on one landmass |
| **C3. Sea lanes and the router** (§3.1–3.2) | The lanes stage; `WM.lanes`; edge kind 6; `Router.days` / `plan` / `reachSea`; the landmass matrix; every chunk table kept (no eviction) and made in idle slices (§4.4); trade ships on lanes | `world/lanes.js` (new), `router.js`, `ships.js`, `tests/lanes.js` | C0 (works on one-landmass worlds too: ports joined by sea) | **M** | `WM.sum` unchanged; graph counts move (new edges): re-record those G-print lines, reason "lane edges" |
| **C4. Passage for you** (§3.3–3.8) | `SEA` table, the Harbour place, the voyage (state, drawing, 8×, Skip, arrival), supply at sea, storms (`Incident` trigger `voyage`), pirates (`Encounter` kind), landings and the return, save | `data/sea.js` (new), `world/voyage.js` (new), `ui/harbour.js` (new), `ui/town.js` (the place's row), `world/supply.js` (`supplyLand` at sea), `world/incidents.js`, `world/encounters.js`, `style.css` (its section), `tests/voyage.js` | C3 | **L** | Hold |
| **C5. The AI across the sea** (§3.9) | Lords by days with the sea, expeditions with muster, landings, relief by sea; caravans by days and sailing; AI rolls at sea | `realms.js`, `brains.js`, `caravans.js`, `parties.js` (voyage state), `tests/seawar.js` | C3, C2 | **L** | The `worldsim` report re-baselined: reason "targets by travel days" |
| **C6. Bigger sizes** (§4) | Memory cuts (fog window, territory scratch, `OCC` 16-bit, install copy dropped, minimaps at `k`, plan paging), the far and asleep tiers, Vast and Immense in `SIZE_POINTS`, `WORLD_LIMITS`, presets, ASH2, the screen's chips, the load step "Mapping your lands" | C6a: `world/fog.js`, `world/territory.js`, `world/lots.js`. C6b: `gfx/worldart.js` (plan paging). C6c: `world/worldobject.js`, `parties.js` (tiers), `tests/lod.js`. C6d: `worldsettings.js`, `ui/worldsetup.js` (no CSS: the size chips wrap with today's classes), `ui/map.js`, `core/session.js` (the load step), `tests/worldsettings.js`, `tests/visual/worldscale.js` (Vast, Immense), `tests/bigworld.js` (new) | C0; C6d after C1 (both edit `worldsettings.js` and `ui/worldsetup.js`); C6c after C5 (both touch `parties.js`) | **L** (6–8 sessions) | Hold, but W6's minimap pixels move with the minimaps at `k` (if W6 still exists): reason "minimap built at its own scale" |
| **C7. Battles at the coast** (§5) | Coast, port and landing fields; the sea-battle hook | `battle/terrain.js`, `world/worldmap.js` (`battleSite`), `battle/engage.js`, `tests/battlesite.js` | C1 | **M** | Battle prints hold (lab fields); `battletypes` counts re-run |

**What runs in parallel:**

| Wave | Agents |
|---|---|
| 1 | C0 (2–3 agents by file) |
| 2 | C1 · C3 · C6a · C6b (no file shared) |
| 3 | C2 · C4 · C6d · C7 |
| 4 | C5, then C6c |

**Effort in all:** C0 M, C1 M, C2 M–L, C3 M, C4 L, C5 L, C6 L, C7 M: about 30–36 agent sessions.

**Playable after each:**
- **C0:** the same game.
- **C1:** the new land shapes; holdings still only on the largest landmass, the others wild. The Continents and Archipelago chips carry the screen's "later" mark (as hamlets do today) until C4.
- **C2:** realms on every landmass; you cannot cross the sea yet.
- **C3:** trade ships follow the lanes.
- **C4:** you sail; the two chips lose their mark.
- **C5:** lords and caravans sail; wars cross the sea.
- **C6:** Vast and Immense.
- **C7:** battles at the coast.

---

## 8. Tests

| Phase | Suite | Checks |
|---|---|---|
| C0 | **`tests/genprint.js`** (new) | The G-prints of §6 for Classic, Normal `redwater`, Large `s1`, Huge `s1` |
| C0 | `tests/worldplace.js`, `tests/router.js` | A failed road pair retried alone (a made-up land with one impossible pair: the stage runs once); `Router` options give today's paths; `Router.warm` tables equal lazy ones |
| C1 | **`tests/landmasses.js`** (new) | For Continents and Archipelago at Normal and Large over 5 seeds each (Huge in the visual report): counts in range, each landmass at its minimum, the narrowest strait and the mean, every landmass on open sea, land share in range, determinism (the same sum twice), the one-landmass settings' sums equal the G-prints, the sketch agrees with the real land on ≥ 95% of its points, relaxing order when forced (a tiny map) |
| C2 | `tests/worldplace.js` (cases), `tests/worldsanity.js` | Every settled landmass has its ports (2 when big or shared), every realm a port on each landmass it holds; beachheads within the overseas cap; no road pair across water; reach per landmass; balance by setting; a capital on each continent (Continents); wild landmasses have no holdings, roads or camps; names unique world-wide |
| C3 | **`tests/lanes.js`** (new) | Every dock and landing of one sea joined; no lane crosses land (every point of its line on water); lanes ≥ 8 tiles off the coast where the sea is wider than 20; a lane's length ≥ the straight line; `Router.days` with the sea ≤ without, and equal where no sea helps; `Router.plan` legs in order; trade ships launch without a whole-map search; the lanes stage's time |
| C4 | **`tests/voyage.js`** (new) | The Harbour window: header, content, `nav()` bar with Back left and Sail right, Esc, fit at 844 × 390; the fare formula and its multipliers; refused rows; provisions needed and Buy provisions; a voyage's days and arrival at the gate; 8× while aboard; Skip runs the hours and stops at an event; supply at sea (resting rates, no fill, no desert or frost); storms' kinds by a seeded `voyage` stream; pirates' four choices and their outcomes; blown off course lands elsewhere; a landing and the return; save and load mid-voyage (the ship on its lane) |
| C5 | **`tests/seawar.js`** (new) | A lord with an overseas target musters, pays, sails and lands (port or landing), then besieges; relief by sea; one expedition per realm; no lord walks into the sea (a lord's step never ends on water); caravans pick by days and sail; AI pirates and storms; a lord at sea is off the map and saved |
| C6 | **`tests/bigworld.js`** (new), `tests/visual/worldscale.js` (Vast and Immense), `tests/lod.js`, `tests/worldsettings.js` | Bytes a tile at run time ≤ 40 at every preset (the probe's inventory, kept as a check); the fog window's pixels in view equal the whole grid's; territory scratch gives today's `LAND`; minimaps at `k`; every chunk table made and kept; trips ≤ 3 ms median at Immense; far and asleep tiers: a far lord reaches the same holding on the same day (±0.1) as a near one; Vast and Immense generate and pass `worldsanity` (in the visual report, not the sweep); ASH2 round trip and ASH1 still read; the size chips and the slow note |
| C7 | `tests/battlesite.js`, `battletypes` | Coast, port and landing fields from world tiles; the landing's no-withdrawal edge; the field seed unchanged |

**The sweep stays gentle:** Vast and Immense run only in `visual/worldscale` (by name, `-Seed 3` and `4`); the sweep keeps Normal and Large.

**Which prints move:**

| Print | Moves in | Reason |
|---|---|---|
| G-prints `WM.sum`, holdings, roads | **never** for the one-landmass settings | — |
| G-prints' graph counts | C3 | Lane edges added |
| Battle prints, `rts`, `aishare` | never | — |
| `worldsim` report, `visual/worldscale` | C5, C6 | Targets by days; new presets |
| W6 (if it still exists then) | C6 | The minimap built at its own scale |

---

## 9. Open questions for the owner

Each has a recommended default.

| # | Question | Recommended |
|---|---|---|
| Q1 | Do lanes cross frost seas? | **Yes**, a quarter slower (floes); winter closes them once Phase 5's seasons come |
| Q2 | How do you reach a landmass with no port? | **A landing**: 1.8 × the fare, the ship comes back on the day you choose and waits a day |
| Q3 | Pirates: fight as a battle? | **Auto-resolve in v1**; a deck battle later (the hook in §5) |
| Q4 | The fare? | **5 + people × tiles ÷ 120 gold**, a rider 1.5 people (a third of the river's rate); tune in play |
| Q5 | Time aboard? | **8× by itself, with Skip to arrival** |
| Q6 | Continents at Normal? | **2 landmasses at Normal**, 2–3 from Large (3 crammed into 448 × 320 leaves each too small) |
| Q7 | Archipelago's realms across islands? | **Yes**: beachheads up to 40% of a realm's holdings (the League 60%), at most 2 capitals an island |
| Q8 | Do lords sail? | **Yes**, one expedition per realm at a time, with a muster at the port |
| Q9 | Can your own caravans sail? | **Not in v1** (a hook; realm caravans do) |
| Q10 | Immense on phones? | **Offered**, as you decided, with the slow note and the time measured on that device (about 40–50 s to forge, *estimate*) |
| Q11 | ASH1 codes after ASH2? | **Still read** (a few lines) |
| Q12 | Holdings at Vast and Immense? | **Defaults 100 and 132, maxima 300 and 400** (by Coasts' land; fewer with Continents and Archipelago) |
| Q13 | Wild landmasses: founding sites there? | **Yes** (Phase 4b: a frontier colony across the sea); hamlets with Phase 4 |
| Q14 | Should the dragon's lair prefer an uninhabited landmass? | **Yes**, when one of 6,000 tiles or more exists |
| Q15 | Classic? | **Stays Coasts at Normal**, unchanged |

---

## 10. Decisions to record in WORLD_DESIGN §16

To change (the owner's decisions of 2026-10-22):

| # | Decision | Decided (the owner, 2026-10-22) |
|---|---|---|
| D1 | Continent or archipelago? | ~~One continent~~ **A Land setting:** Continent, **Coasts** (default), More sea, Lakes, **Continents** (2–3 landmasses) and **Archipelago** (many big islands). Peoples settle where the land suits them, so a continent may hold several realms, and a realm may hold land on two through its ports (CONTINENTS_DESIGN.md) |
| D44 | Huge in Phase 2? / the cap | **Offered on every device, phones included** (2026-10-18). **Replaced as the cap (2026-10-22):** two more sizes, **Vast** (1536 × 1152) and **Immense** (2048 × 1536), on every device, phones included; at most 3,145,728 tiles. §3.9's ceiling no longer holds: the memory and time work is in CONTINENTS_DESIGN §4 |

New rows:

| # | Decision | Decided (the owner, 2026-10-22) |
|---|---|---|
| D46 | How does one cross the sea? | **Passage at ports:** pay by distance and band size; the voyage takes days; your band comes ashore at the other port; a small chance of storms or pirates. Lords' armies and caravans use the same sea lanes. Owning ships later (a hook) |
| D47 | Realms across landmasses? | **Mixed by suitability;** a realm may hold land on two continents through its ports; **wars cross the sea** |
| D48 | More peoples and realms? | **Later.** Everything stays open to any number of realms and peoples |
| D49 | Today's hand-made map? | **Retired;** the generated world is the only world |

Proposed with this design (for the owner to confirm, with §9's defaults): the fare (Q4), time aboard (Q5), landings (Q2), lords' expeditions (Q8), holdings at the new sizes (Q12).
