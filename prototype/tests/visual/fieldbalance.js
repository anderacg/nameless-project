'use strict';
// Not a test (run by name: -Suites visual/fieldbalance -Seed 0,1,2,3 -TimeoutSeconds 600): AI-on-AI battles in the lab on the
// field variety recipes (terrain.js), fog of war on: a forest (the dense woods; a forest tile), hills, a swamp and plains, mirror
// armies of 20 foot, 12 bows and 6 riders in a wedge a side, morale on, 500 px apart, seeds 1-10, the ground's seed the battle's.
// Per ground: wins left/right, unfinished at 300 s (a stall), length (mean, median), and the share of the soldiers' time spent in
// woods against the field's wood share (captains keeping to glades and paths spend less). Never fails.
// -Seed N runs only the Nth ground (0 forest ... 3 plains).
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ev=s=>(0,eval)(s);
 const SEEDS=(new URLSearchParams(location.search).get('n')?Array.from({length:+new URLSearchParams(location.search).get('n')},(_,i)=>i+1):[1,2,3,4,5,6,7,8,9,10]),CAP=300,arm=[{type:'hum_foot',count:20},{type:'hum_bow',count:12},{type:'hum_knight',count:6,form:'wedge'}];
 const GROUNDS={forest:{terrain:'forest',climate:'grass',recipe:'forest'},hills:{terrain:'hill',climate:'grass',recipe:'hills'},swamp:{terrain:'open',climate:'swamp',recipe:'swamp'},plains:{terrain:'open',climate:'grass',recipe:'open'}};
 try{window.requestAnimationFrame=()=>0;ev('TERRAIN.on=true;FOG.on=true');t.act('begin','soldier');t.G.quietEvents=true;t.GUIDE.on=false;
  const pick=new URLSearchParams(location.search).get('seed');
  for(const [name,gd] of Object.entries(GROUNDS).filter((e,i)=>pick===null||String(i)===pick)){const len=[];let l=0,r=0,un=0,inW=0,all=0,ws=0,rW=0,rA=0,gh=0;const lays={};
   for(const seed of SEEDS){t.G.mode='world';t.G.modal=false;L.start({leftGroups:arm,rightGroups:arm,terrain:gd.terrain,climate:gd.climate,morale:true,deploy:false,paused:true,ai:true,fog:true,seed,distance:500,ground:{recipe:gd.recipe,seed:seed*7919}});
    const TT=t.B.terrain;lays[TT.recipe.layout]=(lays[TT.recipe.layout]||0)+1;{let w=0,n=0;for(let i=0;i<TT.kind.length;i++){const y=(Math.floor(i/TT.C)+.5)*TT.cs;if(y<t.B.ftop||y>t.B.fbot)continue;n++;if(TT.kind[i]===t.TKIND.wood)w++}ws+=w/n}
    let s=0;while(!L.session.result&&t.B.t<CAP&&s++<2000){L.step(60);for(const u of t.B.units)if(u.hp>0&&!u.rout){const w=t.groundAt(u.x,u.y)===t.TKIND.wood;all++;if(w)inW++;if(u.s.mounted){rA++;if(w)rW++}}for(const k of Object.keys(t.B.captains||{}))if(t.B.captains[k].hold&&t.B.captains[k].hold.glade)gh++}
    const res=L.session.result;if(!res)un++;else{len.push(t.B.t);if(/Left/.test(res))l++;else r++}L.exit()}
   len.sort((a,b)=>a-b);const mean=len.length?len.reduce((a,b)=>a+b,0)/len.length:0,med=len.length?len[len.length>>1]:0;
   o.push('INFO '+name.padEnd(7)+' left '+l+' / right '+r+' / unfinished '+un+'; length mean '+mean.toFixed(0)+' s, median '+med.toFixed(0)+' s ('+len.map(v=>Math.round(v)).join(' ')+'); in woods '+(all?(inW/all*100).toFixed(0):0)+'% of soldier-time (riders '+(rA?(rW/rA*100).toFixed(0):0)+'%; glade holds '+gh+' captain-steps), the field’s playable ground '+(ws/SEEDS.length*100).toFixed(0)+'% woods; layouts '+JSON.stringify(lays))}
  o.push('PASS field balance report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit();try{ev('TERRAIN.on=false;FOG.on=false')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
