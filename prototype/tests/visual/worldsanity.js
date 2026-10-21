'use strict';
// Not a test (run by name: -Suites visual/worldsanity -TimeoutSeconds 600): tests/worldsanity.js's rows (doc/WORLD_DESIGN.md §8.14)
// over 30 seeds at Normal and 10 at Large (s1-s30, s1-s10), as §14.2 asks; the suite in the sweep takes 8 and 2. Its last line
// tallies every rule over the 40 worlds.
window.RUN=()=>{window.WSAN={normal:30,large:10};const s=document.createElement('script');s.src='tests/worldsanity.js';
 s.onload=()=>window.RUN();s.onerror=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent='FAIL tests/worldsanity.js did not load';document.body.appendChild(d)};
 document.body.appendChild(s)};
