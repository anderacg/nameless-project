'use strict';
// Who lives at a bandit camp and a hideout (the owner, 2026-11-25: "Hideout should be the same as camp, while camp is smaller around 1-6
// men, hideout is bigger and more stationed with more population"; world/sites.js LAIR_LIFE, Lair life; world/sitelife.js): both have
// residents of their own; a camp 1 to 6, a hideout 10 to 16, filling up as the days go and taking in one a day after its losses; the
// bands shelter in both by night and join a fight there; a lair's people stay underground; a camp a tent or two, a hideout up to six.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,SL=t.SiteLife,LL=t.LAIR_LIFE;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);G.paused=true;
 const C=t.W.sites.filter(s=>s instanceof t.BanditCamp),H=t.W.sites.filter(s=>s instanceof t.Hideout&&!(s instanceof t.GoblinCamp)&&!s.within),Gb=t.W.sites.filter(s=>s instanceof t.GoblinCamp);
 ok(C.length>0&&H.length>0,'bandit camps ('+C.length+') and hideouts ('+H.length+')');
 // (how many: a camp 1-4 at the start, a hideout 10-14; at most 6 and 16; its chieftain one of them)
 const cn=C.map(s=>SL.ensure(s).length),hn=H.map(s=>SL.ensure(s).length);info('camps: '+cn.join(' ')+'; hideouts: '+hn.join(' '));
 ok(cn.every(n=>n>=LL.camp.n[0]&&n<=LL.camp.n[1]),'a bandit camp starts with 1 to 4 ('+Math.min(...cn)+'-'+Math.max(...cn)+')');
 ok(hn.every(n=>n>=LL.hideout.n[0]&&n<=LL.hideout.n[1]),'a hideout starts with 10 to 14 ('+Math.min(...hn)+'-'+Math.max(...hn)+')');
 ok([...C,...H].every(s=>SL.ensure(s).filter(p=>p.type==='chief').length===1&&s.foes().length===SL.ensure(s).length),'its chieftain one of them; its fight its residents');
 const g=G.day;try{G.day=600;ok(C.every(s=>s.lifeTarget()===LL.camp.most)&&H.every(s=>s.lifeTarget()===LL.hideout.most),'in time a camp holds 6, a hideout 16, no more')}finally{G.day=g}
 ok(Gb.length===0||Gb.every(s=>!SL.managed(s)&&s.foes().length>0),'a goblin camp keeps its goblins rolled at the fight');
 // (its losses made good: one a day)
 const h=H[0],L=SL.ensure(h),dead=L.slice(0,3);for(const p of dead){p.hp=0;p.mode='dead'}const alive=()=>L.filter(p=>p.hp>0).length,a0=alive();
 G.day++;SL.grow(h);const a1=alive();SL.grow(h);const a2=alive();G.day++;SL.grow(h);const a3=alive();
 ok(a1===a0+1&&a2===a1&&a3===a1+1,'a hideout short of its men takes in one a day ('+a0+' → '+a1+', '+a2+' the same day, '+a3+' the next)');
 // (the bands shelter in both by night, and join a fight there)
 const night=t.nightCamps();ok(C.every(s=>night.includes(s))&&H.every(s=>night.includes(s)),'the bands shelter in the camps and the hideouts by night');
 const band=t.bandits.find(b=>!b.dead&&b.kind!=='goblins'),se=window.startEncounter;let got=null;
 if(band){try{window.startEncounter=e=>{got=e};const hb=H.find(s=>!s.tunnel)||H[0];hb.bands=[band];hb.attack(null,{});const own=SL.roster(hb).length,bt=band.troops.length;ok(got&&got.list.length===own+bt,'a band sheltering in a hideout fights there with its men ('+(got&&got.list.length)+': its '+own+' and the band\'s '+bt+')')}
   finally{window.startEncounter=se;for(const s of H)s.bands=[]}}
 // (underground, a lair's people are not seen on the map)
 const lair=H.find(s=>s.tunnel);if(lair){SL.active.set(lair,SL.ensure(lair));P.x=lair.x;P.y=lair.y+20;ok(!SL.visible().some(p=>SL.ensure(lair).includes(p))&&SL.under(lair),'a lair\'s people stay underground, out of sight');SL.active.delete(lair)}
 // (their tents: a camp's one or two, a hideout's up to six)
 ok(C.every(s=>s.tents>=1&&s.tents<=2)&&H.every(s=>s.tents>=Math.ceil(10/3)&&s.tents<=6),'a camp a tent or two, a hideout four to six');
 // (a hideout spread over its ground: its places round its stockade, each on its own open ground, none on another; none for a lair;
 //  their ground worn bare in the map's plan; its watch up at its lookout)
 const open=H.filter(h=>!h.tunnel),lairs=H.filter(h=>h.tunnel),SP=t.LAIR_SPREAD;
 const lay=open.map(h=>h.layout()),tiles=q=>[[0,-1],[1,-1],[0,0],[1,0]].map(([i,j])=>[q.tx+i,q.ty+j]);
 info('places: '+lay.map(L=>L.map(q=>q.k).join('+')).join(', '));
 ok(open.length&&lay.every(L=>L.length>=3&&L.some(q=>q.k==='look')),'each hideout in the open has its places round it, its lookout among them');
 ok(lairs.every(h=>!h.layout().length),'a lair dug in has none');
 ok(open.every((h,n)=>lay[n].every(q=>{const d=Math.hypot(q.tx-h.tx,q.ty-h.ty);return d>=SP.r[0]&&d<=SP.r[1]&&tiles(q).every(([x,y])=>t.tAt(x,y)===t.T_OPEN)})),'each on open ground '+SP.r.join('-')+' tiles from its stockade');
 ok(lay.every(L=>L.every((q,i)=>L.every((o,j)=>i===j||Math.abs(q.tx-o.tx)>1+SP.gap||Math.abs(q.ty-o.ty)>1+SP.gap))),'none on another');
 const plan=t.WorldArt.ensure();ok(lay.every(L=>L.every(q=>plan.tramples.some(r=>Math.abs(r[0]-q.x)<1&&Math.abs(r[1]-(q.y-8))<1))),'their ground worn bare in the map\'s plan');
 const hh=open[0],watch=SL.ensure(hh).find(p=>p.role==='watch'),lk=hh.layout().find(q=>q.k==='look'),post=SL.post(hh,watch,'watch');
 ok(post&&Math.hypot(post.x-lk.x,post.y-lk.y)<10,'its watch keeps to its lookout');
 ok(!ERR.length,'no runtime errors')});
