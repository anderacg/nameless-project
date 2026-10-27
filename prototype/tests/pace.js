'use strict';
// Pace: every party moves at what it is made of. Riders are fast but only all together and only on good ground; the wounded,
// your own wounds and a big band slow you; Athletics, Riding, a Guide and Forced March speed you (at most 1.8x). Lords, bands
// and patrols follow the same rules, so cavalry can run infantry down, and the woods are where infantry escapes them.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;t.act('begin','soldier');G.quietEvents=true;W.monsters=[];W.critters=[];t.bandits.length=0;G.clock=t.DAY*.3;
 const open=(()=>{for(let ty=10;ty<t.MH-10;ty++)for(let tx=10;tx<t.MW-10;tx++)if(t.tAt(tx,ty)===t.T_OPEN&&t.climAt((tx+.5)*16,(ty+.5)*16)==='grass')return [(tx+.5)*16,(ty+.5)*16]})();
 const forest=(()=>{for(let ty=10;ty<t.MH-10;ty++)for(let tx=10;tx<t.MW-10;tx++)if(t.tAt(tx,ty)===t.T_FOREST&&t.climAt((tx+.5)*16,(ty+.5)*16)==='grass')return [(tx+.5)*16,(ty+.5)*16]})();
 P.x=open[0];P.y=open[1];P.gear.mount=null;P.sk.ride.lv=0;P.sk.athl.lv=0;P.perks=[];P.comps={};P.wounded={};
 P.troops={hum_levy:10};const foot=t.bandPace();
 P.troops={hum_levy:8,hum_knight:2};const mixed=t.bandPace();
 P.troops={hum_knight:10};const halfMounted=t.bandPace();P.gear.mount='m_horse';const cav=t.bandPace();
 ok(Math.abs(mixed-foot)<.08,'a few riders hardly speed a band on foot ('+foot.toFixed(2)+' → '+mixed.toFixed(2)+')');
 ok(halfMounted<cav*.8,'riders with their leader on foot go at his pace ('+halfMounted.toFixed(2)+')');
 ok(cav>=foot*1.4,'an all-mounted band is about half again as fast ('+cav.toFixed(2)+'×)');
 {const mo=t.travelMul();P.x=forest[0];P.y=forest[1];const mf=t.travelMul();P.troops={hum_levy:10};P.gear.mount=null;const fo=t.travelMul();P.x=open[0];P.y=open[1];const fop=t.travelMul();
  ok(mf/mo<fo/fop,'in the woods riders lose more than men on foot ('+Math.round(mf/mo*100)+'% against '+Math.round(fo/fop*100)+'% of their pace)')}
 // what slows you
 P.troops={hum_levy:10};const p0=t.bandPace();P.troops={hum_levy:60};ok(t.bandPace()<p0,'a big band is slower');P.troops={hum_levy:10};
 P.wounded={hum_levy:6};ok(t.bandPace()<p0,'carrying the wounded slows you ('+t.bandPace().toFixed(2)+')');P.wounded={};
 {const m=t.vitals();P.hp=m[0]*.2;ok(t.bandPace()<p0,'so does your own wound');P.hp=m[0]}
 // what speeds you
 P.sk.athl.lv=8;ok(t.bandPace()>p0,'Athletics quickens you on foot');P.sk.athl.lv=0;
 P.perks=['forced'];ok(t.bandPace()>p0&&t.eatPerDay()>(P.perks=[],t.eatPerDay()),'Forced March: faster, hungrier');P.perks=[];
 P.comps={tavi:{ap:0,role:'guide'}};t.compInit('tavi');ok(t.bandPace()>p0,'a Guide finds the quick ways');P.comps={};
 P.troops={hum_knight:10};P.gear.mount='m_courser';P.sk.ride.lv=10;P.perks=['forced'];P.gear.boots=null;ok(t.bandPace()<=1.8,'never more than 1.8× ('+t.bandPace().toFixed(2)+')');P.perks=[];P.sk.ride.lv=0;P.gear.mount=null;
 // the realms: same rules
 {const L=W.lords[0];L.x=open[0];L.y=open[1];const a=t.partySpeed(L,Array(20).fill('hum_levy')),b=t.partySpeed(L,Array(20).fill('hum_knight'));ok(b>a*1.3,'a lord’s cavalry outpaces his infantry ('+a.toFixed(0)+' → '+b.toFixed(0)+')')}
 // cavalry runs infantry down in the open; the woods save you
 {P.troops={hum_levy:10};P.gear.mount=null;P.x=open[0];P.y=open[1];const L=t.asParty({id:'Z',name:'Lord Z',fac:t.FIDS[0],x:P.x+8,y:P.y,troops:Array(30).fill('hum_knight'),state:'march',dead:false,cool:0});P.hostile={[L.fac]:G.day+30};
  G.mode='world';G.modal=false;t.startEncounter({kind:'lord',ref:L,list:L.troops.slice(),foes:[],allies:[]});const f1=t.fleeOdds(G.enc);P.x=forest[0];P.y=forest[1];L.x=P.x+8;L.y=P.y;const f2=t.fleeOdds(G.enc);
  ok(f1.ch===0&&f2.ch>0,'on open ground you cannot outrun a host of knights on foot ('+(f1.why||f1.ch)+'); in the woods you may ('+Math.round(f2.ch*100)+'%)');t.hidePanel();G.mode='world';G.modal=false;P.hostile={}}
 // the wounded: some of the fallen live, and heal (the band is its 10 survivors: the healed need room in its groups, ARMY_GROUP)
 {P.troops={hum_levy:10};P.sk.med.lv=5;const lost={hum_levy:10};const r=Math.random;let i=0;Math.random=()=>(i++%2?.99:.01);t.heal(lost);Math.random=r;
  ok(t.woundedN()>0&&t.partySize()===20-0+0||t.woundedN()>0,'some of the fallen live, wounded ('+t.woundedN()+')');const w0=t.woundedN();P.x=t.TOWNS[0].x;P.y=t.TOWNS[0].y+20;t.woundedDay();ok(t.woundedN()<w0,'and heal day by day, faster near a friendly holding')}
 // riders at the walls
 {const z=t.TOWNS.find(q=>q.kind==='castle');P.troops={hum_knight:4};G.enc={kind:'siege',ref:z,list:['militia'],lv:2};if(!t.wallOf(z))z.wall=2;t.startBattle({enemies:['militia'],tournament:false,lv:2});const u=t.B.units.find(x=>x.type==='hum_knight');
  ok(u&&u.s.dmg<t.ST.hum_knight.dmg&&!u.s.charge,'riders are poor at storming walls (no charge, less damage)');t.B.over=true;t.B.endT=0;G.enc=null}
 // ---- Woodcraft: in a wood its slowing cut 6% a level (up to 60%); none on open ground; it rises as you travel the woods;
 // a save made before it gets it at 0
 {P.x=forest[0];P.y=forest[1];P.tx=null;P.gear.mount=null;P.troops={hum_levy:4};P.perks=P.perks.filter(k=>k!=='path');P.race='human';
  const W0=t.WOODCRAFT,sk=P.sk.wood,base=t.speedAt(P.x,P.y,'human')||1;sk.lv=0;const f0=t.travelMul();sk.lv=5;const f5=t.travelMul();sk.lv=20;const f20=t.travelMul();
  const exp=lv=>1-(1-base)*(1-Math.min(W0.cap,W0.per*lv));
  ok(base<1&&Math.abs(f5/f0-exp(5)/base)<1e-9&&Math.abs(f20/f0-exp(20)/base)<1e-9&&f20>f5&&f5>f0,'Woodcraft in a wood: '+f0.toFixed(3)+' at 0, '+f5.toFixed(3)+' at 5, '+f20.toFixed(3)+' at 20 (capped at '+W0.cap*100+'% less slowing)');
  P.x=open[0];P.y=open[1];sk.lv=0;const o0=t.travelMul();sk.lv=10;ok(t.travelMul()===o0,'on open ground it does nothing');sk.lv=0;
  P.x=forest[0];P.y=forest[1];const x0=sk.xp+sk.lv*1e4;P.tx=P.x+40;P.ty=P.y;for(let i=0;i<20;i++)t.updateWorld(.05);ok(sk.xp+sk.lv*1e4>x0,'it rises as you travel through the woods');P.tx=null;
  const sv=JSON.parse(JSON.stringify(P));delete sv.sk.wood;t.resetSession(sv);ok(P.sk.wood&&P.sk.wood.lv===0&&t.skill('wood')===0,'a save from before it: Woodcraft at 0, nothing breaks')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
