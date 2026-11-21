# Ashmark — The Wagon Road

A standalone casual battle prototype with original chunky cartoon sprites. Serve this folder with `python -m http.server 8080 --bind 127.0.0.1`, then open `http://127.0.0.1:8080/` in a browser to play. Everything is bundled in this folder and works offline, with no build or installation.

Choose Champion, Captain, Ranger or Warden. Lead 8 shields, 6 pikemen, 6 archers and 3 riders against 12 enemies. Keep a friendly unit inside the wagon circle, with enemies outside it, for eight seconds to win. A fallen hero ends the attempt. Restart or choose another hero from the result screen.

Tap a squad banner, soldier or bottom card to select. Tap ground to move or an enemy to focus it. Follow stays near the hero, Hold defends the current position, and Attack advances toward enemies. The All button orders all four squads together. Troops fight automatically. Pause supports giving orders, and the speed button switches between 1× and 2×.

Desktop controls use 1–4 for squads, H for the hero, F for the whole company, WASD or arrow keys for hero movement, Q/E for abilities and Space for pause. The objective panel opens help. Touch controls support phone landscape and portrait layouts.

Each hero has two abilities. Champion has a damaging dash and self-heal. Captain has company damage/healing support and a movement boost. Ranger has an area volley and a healing withdrawal. Warden has company protection and nearby healing.

The fixed battlefield uses a simple local separation system, automatic targeting and lightweight sprite caching. This first skirmish is a short playable study. Rewards appear on the victory screen, and attempts start fresh. The artwork is drawn in `art.js`, combat and input live in `game.js`, and layout lives in `style.css`.

Browser smoke checks use Playwright. With Playwright and Chromium available, run `node tests/smoke.cjs`. The check serves this folder on a temporary localhost port and verifies battle completion, retreat, retry, selection, tactical pause, abilities and mobile layout.
