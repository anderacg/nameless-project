'use strict';
// Not a test: scenes for screenshots of the Chronicle (ui/chronicle.js; headless Chrome --screenshot at a window size), and its
// save's size. ?shot=all (every kind, a quest's and a rumour's links) | war (the War & battles filter) | hub (the Menu) | dock
// (the map and its bar) | size (no picture: the
// save part's size, plain JSON and gzipped, for 1,000, 5,000 and 20,000 messages, into OUT); &w=844&h=390: the screen that size
window.RUN=()=>{
 const t=T,G=t.G,P=t.P,W=t.W,u=new URLSearchParams(location.search),shot=u.get('shot')||'all';
 window.requestAnimationFrame=()=>0;Math.random=t.seeded(23);
 Kit.begin('soldier',23);Kit.clear();Kit.world();
 const size=()=>{if(u.get('w')){const e=document.getElementById('screen').style;e.width=u.get('w')+'px';e.height=u.get('h')+'px'}};
 size();addEventListener('resize',()=>{size();if(G.mode==='journal')t.renderJournal()});
 P.name='Bran Redhand';P.band='The Grey Company';
 const ash=Kit.goHome('Ashford'),T2=t.TOWNS.find(x=>x!==ash&&x.owner!==ash.owner)||t.TOWNS[1],L=W.lords.slice(0,3).map(l=>l.name),F=n=>t.FACS[n]?t.FACS[n].n:'realm';
 // (lines as the game writes them, each its kind)
 const lines=[
  ['Battle near '+ash.name+': '+L[0]+' against Bandits (14).','','war'],['War! The '+F(ash.owner)+' and the '+F(T2.owner)+' are at war.','gold','war'],
  ['Your band makes camp. Stamina comes back faster, and the wounded mend.','good','band'],['You fill your waterskins: 12 water.','good','band'],
  [L[1]+' wins the battle near '+T2.name+'.','','war'],['Your band goes hungry. Buy food in a town, or hunt.','bad','band'],['Tile grid on (G to hide).',''],
  ['The siege of '+T2.name+' fails. '+L[2]+' falls back.','','war'],['3 of your wounded are fit to fight again.','good','band'],['Victory. +38 gold, renown now 21.','good','war'],
  ['A caravan leaves '+ash.name+' for '+T2.name+' with grain and cloth.','gold'],['A soldier deserts in the night.','bad','band']];
 // (the size's: every line its own holding, lord and numbers, as a long game's would be)
 const vary=(m,i)=>{const H=t.TOWNS,Ls=W.lords;return m.split(ash.name).join(H[i%H.length].name).split(T2.name).join(H[(i*7+3)%H.length].name).split(L[0]).join(Ls[i%Ls.length].name).replace(/\d+/g,d=>String((+d*(i%17+1))%97+1))};
 const fill=(n,dayOf,v)=>{G.msgs=[];for(let i=0;i<n;i++){const [m,c,k]=lines[i%lines.length];G.day=dayOf(i);t.log(v?vary(m,i):m,c,k)}};
 if(shot==='size'){
  const out=[],run=n=>{fill(n,i=>1+Math.floor(i/12),true);for(let i=0;i<n;i+=9){const r=G.msgs[i];if(i%2){r.kind='story';r.ref='q'+(i%40)}else{r.kind='rumour';r.ref='n'+i}}
   const json=JSON.stringify(t.Saves.saveOf('chronicle').chronicle);return t.gzip64(json).then(z=>out.push(n+' messages: '+json.length+' chars of JSON ('+(json.length/n).toFixed(1)+' each), '+Math.round(z.length*3/4)+' bytes gzipped ('+z.length+' in base64)'))};
  run(1000).then(()=>run(5000)).then(()=>run(20000)).then(()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=out.map(l=>'INFO '+l).join('\n');document.body.appendChild(d)});
  return;
 }
 fill(34,i=>4+Math.floor(i/9));
 const job=t.makeQuest('bounty',ash);t.acceptQuest(job);
 const it=t.newsRecord('beast',{x:ash.x+40,y:ash.y+30},{id:'wolf',n:5});t.rumourHear(it,t.rumourSource('tavern',ash.name,ash));
 t.log(L[0]+' is routed near '+ash.name+'.','','war');
 Kit.world();if(shot==='hub')t.openHub();else if(shot==='dock')t.updateHUD(true);else{t.chronicleKey();if(shot==='war')t.act('ch-filter','war')}
 const p=document.getElementById('panel');if(p)p.style.animation='none';
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS chronicle '+shot;document.body.appendChild(d);
};
