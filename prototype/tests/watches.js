'use strict';
// Watches: every holding keeps two standing watches, the day watch and the night watch, each with its own captain (seeded by
// the holding) and make-up (riders and archers by day, spearmen and shield foot by night). The one on duty goes out at its
// hour; beaten, only it keeps in, short of its fallen, who come back from the garrison one a day; the other still goes out.
// They fly different pennants, have different names and words, and are saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;W.monsters=[];G.quietEvents=true;G.encCool=1e9;G.clock=t.DAY*.3;
 const panel=()=>document.getElementById('panel').innerHTML,world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.enc=null;G.pt=null};
 const h=t.townBy('Ashford'),N=h.T.patrol.size,ws=t.watchesOf(h),R=t.RACES[h.races[0]],out=w=>W.patrols.find(p=>p.home===h.name&&p.watch===w);
 const run=(w,n)=>{for(let i=0;i<(n||3000)&&!out(w);i++)t.updatePatrols(.05)};
 // two standing watches, two captains, two make-ups
 ok(ws.day&&ws.night&&ws.day.cap&&ws.night.cap&&ws.day.cap!==ws.night.cap,'two watches, under Captain '+ws.day.cap+' (day) and Captain '+ws.night.cap+' (night)');
 ok(ws.day.kinds.length===N&&ws.night.kinds.length===N&&ws.day.n===N&&ws.night.n===N,'each '+N+' strong, the patrol size of '+t.an(h.kind));
 ok(ws.day.kinds.includes(R.horse)&&ws.day.kinds.includes(R.ranged),'the day watch rides: '+ws.day.kinds.join(', '));
 ok(ws.night.kinds.includes(t.UP[R.melee][0])&&!ws.night.kinds.includes(R.horse)&&!ws.night.kinds.includes(R.ranged),'the night watch keeps close, spears and shields: '+ws.night.kinds.join(', '));
 {const a=JSON.stringify(ws);delete h.watches;ok(JSON.stringify(t.watchesOf(h))===a,'seeded by the holding: made again, the same')}
 {const caps=new Set(t.TOWNS.filter(x=>x.owner).map(x=>t.watchesOf(x).day.cap));ok(caps.size>3,caps.size+' different day captains across the holdings')}
 // the day watch by day, the night watch by night
 world();P.x=10;P.y=10;G.clock=t.DAY*.3;run('day');const d=out('day');
 ok(d&&!out('night')&&d.troops.length===N&&d.troops.slice().sort().join()===t.watchesOf(h).day.kinds.slice().sort().join(),'by day the day watch is out, as it is made');
 ok(d.label()==='Day watch of '+h.name,'its name: '+d.label());
 t.patrolMeet(d);const pd=panel();ok(/<h2>Day watch of /.test(pd)&&pd.includes('Captain '+ws.day.cap)&&t.WATCH.day.say.quiet.concat(t.WATCH.day.say.band).some(s=>pd.includes(s.replace(/'/g,'&#39;'))||pd.includes(s)),'its captain talks of the roads');
 world();G.clock=t.DAY*(t.NIGHT_AT+.02);run('night');const n=out('night');
 ok(n&&n.troops.slice().sort().join()===t.watchesOf(h).night.kinds.slice().sort().join(),'by night the night watch is out');
 {for(let i=0;i<3000&&out('day');i++)t.updatePatrols(.05);ok(!out('day'),'and the day watch has gone home')}
 ok(n.label()==='Night watch of '+h.name,'its name: '+n.label());
 t.patrolMeet(n);const pn=panel();ok(/<h2>Night watch of /.test(pn)&&pn.includes('Captain '+ws.night.cap)&&t.WATCH.night.say.quiet.concat(t.WATCH.night.say.band).some(s=>pn.includes(s)),'its captain is wary of the dark');
 ok(pd.replace(/Day|day/g,'')!==pn.replace(/Night|night/g,''),'the two talk differently');world();
 // banners
 {const bd=d.banner(),bn=n.banner(),cd=t.bannerSprite(bd,0),cn=t.bannerSprite(bn,0);
  ok(bd.k==='pennant'&&bd.col===t.FACS[h.owner].col&&bn.k==='pennant'&&bn.dev==='lantern'&&bn.col===t.WATCH.night.pennant,'the day watch flies the realm’s pennant, the night watch a dark one with a lantern');
  const px=c=>{const k=document.createElement('canvas');k.width=c.width;k.height=c.height;k.getContext('2d').drawImage(c,0,0);return k.toDataURL()};ok(px(cd)!==px(cn),'and they look different')}
 t.drawWorld();ok(!ERR.length,'both draw');
 // beat the night watch: only it keeps in, short of its fallen
 {const g0=h.gar;P.x=n.x+30;P.y=n.y;P.tx=null;G.encCool=0;t.patrolMeet(n);t.act('pt-attack');const r=Math.random;Math.random=()=>0;const tr0=P.troops;P.troops={hum_knight:40};t.act('auto');Math.random=r;
  ok(/night watch of .* is scattered/.test(panel()),'the night watch is beaten and scattered');t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);P.troops=tr0;world();P.x=10;P.y=10;G.encCool=1e9;
  const X=t.watchesOf(h);ok(X.night.off>t.worldTime()&&!(X.day.off>t.worldTime())&&X.night.n<N&&X.day.n===N,'only the night watch keeps in ('+X.night.n+' of '+N+' left; the day watch '+X.day.n+')');
  ok(h.gar>=g0,'those still standing make their way home ('+g0+' → '+h.gar+' in the garrison)');
  for(let i=0;i<60;i++)t.updatePatrols(.05);ok(!out('night'),'no night watch goes out again tonight');
  G.day+=1;G.clock=t.DAY*.3;run('day');ok(out('day'),'next morning the day watch goes out as ever');
  ok(t.crimeAt(h)===null&&t.hostileTo(h.owner),'and the realm you fought is hostile: both watches know it')}
 // the fallen made good from the garrison, one a day
 {const X=t.watchesOf(h).night;X.n=0;h.gar=h.T.gar;const seen=[];for(let k=0;k<N+2;k++){G.day+=1;t.patrolDay();seen.push(X.n)}
  ok(seen.slice(0,N).every((v,k)=>v===k+1)&&X.n===N,'its fallen come back from the garrison one a day: '+seen.join(', '));
  X.n=1;const g=h.gar;h.gar=0;W.patrols=W.patrols.filter(p=>p.home!==h.name);G.day+=1;t.patrolDay();ok(X.n===1,'but not while the garrison cannot spare them');h.gar=g}
 // a watch at half strength or more goes out; less, it waits
 {world();W.patrols=W.patrols.filter(p=>p.home!==h.name);const X=t.watchesOf(h).night;X.off=0;X.n=Math.floor((N-1)/2);G.clock=t.DAY*(t.NIGHT_AT+.02);t.sendWatch(h);ok(!out('night'),'a watch below half its strength waits ('+X.n+' of '+N+')');
  X.n=Math.ceil(N/2);t.sendWatch(h);ok(out('night')&&out('night').troops.length===X.n,'from half it goes out ('+X.n+')');
  const p=out('night');p.troops=p.troops.slice(1);const g=h.gar;t.watchBack(h,p);ok(X.n===Math.ceil(N/2)-1&&h.gar===g+p.troops.length,'back home, it counts its fallen ('+X.n+')');W.patrols=W.patrols.filter(q=>q!==p)}
 // saved and loaded; with no record, made fresh
 {world();const X=t.watchesOf(h);X.night.n=2;X.night.off=t.worldTime()+50;const a=JSON.stringify(X);t.saveGame(true);h.watches=null;t.loadGame();
  ok(JSON.stringify(t.townBy(h.name).watches)===a,'the watches are saved and loaded');
  const h2=t.townBy(h.name),c=h2.watches.day.cap;delete h2.watches;ok(t.watchesOf(h2).day.cap===c&&h2.watches.night.n===N,'with none saved, they are made fresh, the same captains')}
 // a holding that grows keeps its captains, its watches now bigger
 {const v=t.TOWNS.find(x=>x.kind==='village'&&x.owner),X=t.watchesOf(v),c=X.night.cap,k0=v.kind;v.kind='town';const Y=t.watchesOf(v);
  ok(Y.night.cap===c&&Y.night.kinds.length===v.T.patrol.size&&Y.night.n===X.night.n,'a village grown to a town keeps its captains; its watches grow over the days');v.kind=k0;delete v.watches}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
