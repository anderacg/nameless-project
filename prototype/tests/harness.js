'use strict';
// Loads tests/<suite>.js, runs its RUN(), and the suite writes results into <pre id="OUT"> for run-tests.sh to read.
window.ERR=[];
addEventListener('error',e=>ERR.push(e.message+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
// T.name reads any top-level game binding by name, including let/const ones that change (T.B, T.bandits)
window.T=new Proxy({},{get:(_,k)=>(0,eval)(String(k))});
// Older execution fixtures refer to a tactical role, not a particular persistent army formation.
// Resolve that role to a real ID; explicitly supply an empty fixture control when a case injects soldiers later.
function testGroup(role){
  const side=role.startsWith('e_')?'foe':role.startsWith('a_')?'ally':'player',kind=role.replace(/^[ea]_/,''),b=T.B;
  const found=Object.values(b.groups).find(g=>g[side]&&g.role===kind);if(found)return found.id;
  const id='fixture_'+role;b.groups[id]=new T.BattleControl(id,side==='foe'?1:0,{[side]:true,role:kind,name:kind,ax:100,ay:300});return id;
}
(()=>{
  const suite=new URLSearchParams(location.search).get('test'),s=document.createElement('script');
  const fail=m=>{const d=document.createElement('pre');d.id='OUT';d.textContent=m;document.body.appendChild(d)};
  s.src='tests/'+suite+'.js';
  // suites that just want out of an encounter call act('flee'): there it calls the fight off, as it always did; the real
  // escape (odds, being caught) is tested on its own through flee() (tests/flee.js)
  s.onload=()=>{try{const act0=(0,eval)('act');window.__act0=act0;(0,eval)('act=function(a,arg){if(a==="flee"&&G.enc){G.enc.mine=true;G.enc.noFlee=false;if(G.enc.ref)delete G.enc.ref.sab;G.enc.foes=[]}return __act0(a,arg)}');
    const seed=new URLSearchParams(location.search).get('seed');if(seed!==null&&/^\d+$/.test(seed))Math.random=T.seeded(+seed);
    T.G.quietEvents=true;(0,eval)('BDEPLOY.on=false;BAUTO.on=false;TERRAIN.on=false;FOG.on=false;AUDIO.on=false;FIELD_SIZES.on=false;EXITS.on=false;COMMAND_POWERS.on=false;LOADING.sync=true');RUN();// (terrain: the older suites see today's flat field; tests/terrain.js turns it on; no fog of war: tests/battlefog.js turns it on; no sound: tests/audio.js turns it on; today's field, its size by the screen, and your edge and theirs the only ways off it: tests/fieldsize.js turns sizes and exits on; no commander powers: tests/commandpowers.js turns them on; long work (a new game, a load) runs at once, in order, with no overlay: loading.js, tests/loading.js turns it off)
    // Assertions are synchronous. Once the report exists, stop animating the finished scene while Chrome waits to dump it.
    if(document.getElementById('OUT'))window.requestAnimationFrame=()=>0;
  }catch(e){fail('EXC '+e.message+'\n'+e.stack)}};
  s.onerror=()=>fail('FAIL no suite named '+suite);
  document.body.appendChild(s);
})();
