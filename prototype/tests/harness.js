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
  s.onload=()=>{try{T.G.quietEvents=true;RUN()}catch(e){fail('EXC '+e.message+'\n'+e.stack)}};
  s.onerror=()=>fail('FAIL no suite named '+suite);
  document.body.appendChild(s);
})();
