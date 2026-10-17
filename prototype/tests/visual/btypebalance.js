'use strict';
// Not a test (run by name: -Suites visual/btypebalance -TimeoutSeconds 600; -Seed N runs only the Nth set): AI-on-AI battle types in the
// lab (setup.js BTYPE; mirror armies: 20 foot, 12 bows, 6 riders in a wedge a side; morale on; 500 px apart; its ground 'auto' (the
// open recipe), seeds 1-10): hold the bridge with the left side holding it and with the right (a ford far off it by the seed), and
// an ambush with the left side caught on the road and with the right. Per set: wins of the side set upon (holders, the ambushed)
// and of the other, unfinished (300 s), battle length (mean, median); then the bridge's two sets together. Never fails.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ev=s=>(0,eval)(s);
 const SEEDS=[1,2,3,4,5,6,7,8,9,10],CAP=300,arm=[{type:'hum_foot',count:20},{type:'hum_bow',count:12},{type:'hum_knight',count:6,form:'wedge'}];
 const SETS=[['bridge, left holds',{kind:'bridge',side:'left'}],['bridge, right holds',{kind:'bridge',side:'right'}],['ambush, left caught',{kind:'ambush',side:'left'}],['ambush, right caught',{kind:'ambush',side:'right'}]];
 try{window.requestAnimationFrame=()=>0;ev('TERRAIN.on=true');t.act('begin','soldier');t.G.quietEvents=true;t.GUIDE.on=false;
  const pick=new URLSearchParams(location.search).get('seed'),all={bridge:{set:0,other:0,un:0,len:[]}};
  for(const [name,type] of SETS.filter((e,i)=>pick===null||String(i)===pick)){const len=[];let set=0,other=0,un=0,fords=0;
   for(const seed of SEEDS){t.G.mode='world';t.G.modal=false;L.start({leftGroups:arm,rightGroups:arm,morale:true,deploy:false,paused:true,ai:true,seed,distance:500,ground:'auto',type});
    if(t.B.terrain.ai.crossings.some(c=>c.kind==='ford'))fords++;
    let s=0;while(!L.session.result&&t.B.t<CAP&&s++<2000)L.step(60);const res=L.session.result;if(!res)un++;else{len.push(t.B.t);if(/Left/.test(res)===(type.side==='left'))set++;else other++}L.exit()}
   len.sort((a,b)=>a-b);const mean=len.length?len.reduce((a,b)=>a+b,0)/len.length:0,med=len.length?len[len.length>>1]:0;
   o.push('INFO '+name.padEnd(22)+(type.kind==='bridge'?'holders ':'ambushed ')+set+' / '+(type.kind==='bridge'?'takers ':'ambushers ')+other+' / unfinished '+un+'; length mean '+mean.toFixed(0)+' s, median '+med.toFixed(0)+' s ('+len.map(v=>Math.round(v)).join(' ')+')'+(type.kind==='bridge'?'; '+fords+' with a ford':''));
   if(type.kind==='bridge'){const A=all.bridge;A.set+=set;A.other+=other;A.un+=un;A.len.push(...len)}}
  {const A=all.bridge;if(A.len.length){A.len.sort((a,b)=>a-b);o.push('INFO bridge, both sides    holders '+A.set+' / takers '+A.other+' / unfinished '+A.un+' ('+Math.round(100*A.set/Math.max(1,A.set+A.other))+'% to the holders); length mean '+(A.len.reduce((a,b)=>a+b,0)/A.len.length).toFixed(0)+' s, median '+A.len[A.len.length>>1].toFixed(0)+' s')}}
  o.push('PASS battle type balance report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit();try{ev('TERRAIN.on=false')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
