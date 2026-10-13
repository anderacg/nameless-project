'use strict';
// Loads tests/<suite>.js, runs its RUN(), and the suite writes results into <pre id="OUT"> for run-tests.sh to read.
window.ERR=[];
addEventListener('error',e=>ERR.push(e.message+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
// T.name reads any top-level game binding by name, including let/const ones that change (T.B, T.bandits)
window.T=new Proxy({},{get:(_,k)=>(0,eval)(String(k))});
(()=>{
  const suite=new URLSearchParams(location.search).get('test'),s=document.createElement('script');
  const fail=m=>{const d=document.createElement('pre');d.id='OUT';d.textContent=m;document.body.appendChild(d)};
  s.src='tests/'+suite+'.js';
  // suites that just want out of an encounter call act('flee'): there it calls the fight off, as it always did; the real
  // escape (odds, being caught) is tested on its own through flee() (tests/flee.js)
  s.onload=()=>{try{const act0=(0,eval)('act');window.__act0=act0;(0,eval)('act=function(a,arg){if(a==="flee"&&G.enc){G.enc.mine=true;G.enc.noFlee=false;if(G.enc.ref)delete G.enc.ref.sab;G.enc.foes=[]}return __act0(a,arg)}');
    T.G.quietEvents=true;(0,eval)('BDEPLOY.on=false;BAUTO.on=false');RUN()}catch(e){fail('EXC '+e.message+'\n'+e.stack)}};
  s.onerror=()=>fail('FAIL no suite named '+suite);
  document.body.appendChild(s);
})();
