'use strict';
// Not a test (run by name: -Suites visual/terrainbalance -Seed 0,1,2,3,4 -TimeoutSeconds 600): AI-on-AI battles in the lab (mirror armies: 20
// foot, 12 bows, 6 riders in a wedge a side; morale on; 500 px apart; seeds 1-10) on a flat field and on phase 4's grounds:
// cliffs (the crags recipe: sheer and one-way hills, rock; fairness-checked, its seed the battle's), mountains (two in the
// middle with a pass between, spires), a river (the river recipe with a road bridge: a bridge and a ford, deep water impassable)
// and one bridge with no ford. Per ground: wins left/right, unfinished (300 s), battle length (mean, median). Never fails.
// -Seed N runs only the Nth ground (0 flat ... 4 bridge): -Seed 0,1,2,3,4 runs them one tab each, within the runner's timeout.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ev=s=>(0,eval)(s);
 const SEEDS=[1,2,3,4,5,6,7,8,9,10],CAP=300,arm=[{type:'hum_foot',count:20},{type:'hum_bow',count:12},{type:'hum_knight',count:6,form:'wedge'}];
 const GROUNDS={flat:s=>({hills:[],woods:[],seed:s}),cliffs:s=>({recipe:'crags',seed:s}),mountains:s=>({rocks:[{x:.5,y:.3,r:52},{x:.5,y:.74,r:48},{x:.4,y:.5,r:12},{x:.6,y:.52,r:12}],seed:s}),
  river:s=>({recipe:'river',river:{bridge:true},seed:s}),bridge:s=>({rivers:[{x:.5,crossings:[{kind:'bridge',y:.45}]}],seed:s})};
 try{window.requestAnimationFrame=()=>0;ev('TERRAIN.on=true');t.act('begin','soldier');t.G.quietEvents=true;t.GUIDE.on=false;
  const pick=new URLSearchParams(location.search).get('seed');
  for(const [name,gf] of Object.entries(GROUNDS).filter((e,i)=>pick===null||String(i)===pick)){const len=[];let l=0,r=0,un=0;
   for(const seed of SEEDS){t.G.mode='world';t.G.modal=false;L.start({leftGroups:arm,rightGroups:arm,morale:true,deploy:false,paused:true,ai:true,seed,distance:500,ground:gf(seed)});
    let s=0;while(!L.session.result&&t.B.t<CAP&&s++<2000)L.step(60);const res=L.session.result;if(!res)un++;else{len.push(t.B.t);if(/Left/.test(res))l++;else r++}L.exit()}
   len.sort((a,b)=>a-b);const mean=len.length?len.reduce((a,b)=>a+b,0)/len.length:0,med=len.length?len[len.length>>1]:0;
   o.push('INFO '+name.padEnd(10)+' left '+l+' / right '+r+' / unfinished '+un+'; length mean '+mean.toFixed(0)+' s, median '+med.toFixed(0)+' s ('+len.map(v=>Math.round(v)).join(' ')+')')}
  o.push('PASS terrain balance report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit();try{ev('TERRAIN.on=false')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
