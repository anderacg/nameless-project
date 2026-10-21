'use strict';
// Battle types (setup.js BTYPE; IMPLEMENTATION_PLAN §4 item 5; doc/TERRAIN_DESIGN.md §8, phase 5): hold the bridge and ambush.
// The world's triggers (engage.js battleTypeFor: a road bridge on or next to the tile; an ambush by cover and band, from the
// tile and the day, never Math.random); who stands where (the holders on their bank by the bridge, your zone to the bank; the
// takers at their edge); the single-bridge field and its impassable water; a held bridge's battle run to its end, nobody ever in
// deep water; the ambushers unseen at the start, their first charge's shock and callout; no deployment on the road; Spring an
// ambush (you hidden, their column marching); the pre-battle panel and the road event keep the window frame; the lab's type key;
// terrain off: none of it.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,L=t.BattleLab,ev=s=>(0,eval)(s),K=t.TKIND,X=t.BTYPE;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;W.monsters=[];W.critters=[];t.bandits.length=0;W.patrols=[];P.troops={hum_levy:8,hum_bow:6,hum_squire:4};
 const panel=()=>document.getElementById('panel').innerHTML,TILE=t.TILE,MW=t.MW,MH=t.MH;
 const world=()=>{if(t.B){const B=t.B;B.win=true;B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont')}t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.encCool=0;G.event=null};
 const at=(tx,ty)=>{P.x=(tx+.5)*TILE;P.y=(ty+.5)*TILE};
 const band=(n,k='bandits')=>t.asParty({x:P.x+10,y:P.y,cool:0,n,kind:k});
 const meet=(o={})=>{world();const b=band(6,o.band);t.startEncounter({kind:'party',ref:b,n:6,list:b.troops.slice(),band:o.band||'bandits',...o});return G.enc};
 const counted=f=>{const r=Math.random;let n=0;Math.random=()=>{n++;return r()};try{f()}finally{Math.random=r}return n};
 ev('TERRAIN.on=true');
 // ---- the places: a road bridge (not in the frost: ice), a forest far from any bridge, open ground with no cover
 let bridge=null,forest=null,bare=null;
 for(let ty=2;ty<MH-2;ty++)for(let tx=2;tx<MW-2;tx++){const x=(tx+.5)*TILE,y=(ty+.5)*TILE,c=t.climAt(x,y);
  if(!bridge&&t.roadBridge(tx,ty)&&c!=='frost'&&c!=='desert')bridge={tx,ty};
  if(!forest&&t.tAt(tx,ty)===t.T_FOREST&&c==='grass'&&!t.bridgeNear(tx,ty)&&!t.nearWater(x,y,2))forest={tx,ty}}
 for(let ty=4;ty<MH-4&&!bare;ty+=3)for(let tx=4;tx<MW-4&&!bare;tx+=3){if(t.tAt(tx,ty)!==t.T_OPEN||t.climAt((tx+.5)*TILE,(ty+.5)*TILE)!=='grass'||t.bridgeNear(tx,ty))continue;if(!t.coverAt((tx+.5)*TILE,(ty+.5)*TILE))bare={tx,ty}}
 ok(bridge&&forest&&bare,'the map has a road bridge ('+(bridge&&bridge.tx+','+bridge.ty)+'), a forest away from water ('+(forest&&forest.tx+','+forest.ty)+') and open ground with no cover ('+(bare&&bare.tx+','+bare.ty)+')');

 // ---- the triggers
 {at(bridge.tx,bridge.ty);const e1=t.battleTypeFor({kind:'party',band:'bandits'}),e2=t.battleTypeFor({kind:'party',band:'bandits',mine:true}),e3=t.battleTypeFor({kind:'lord'}),e4=t.battleTypeFor({kind:'monster'});
  ok(e1&&e1.kind==='bridge'&&e1.def===0&&e2&&e2.kind==='bridge'&&e2.def===1&&e3&&e3.kind==='bridge'&&!e4,'on a road bridge: hold the bridge (set upon, you hold it: def 0; riding at them, they do: def 1); a lord’s fight too, never a monster’s');
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]];let next=null;for(const [a,b] of dirs){const x=bridge.tx+a,y=bridge.ty+b;if(t.passable(t.tAt(x,y))){next=[x,y];break}}
  if(next){at(next[0],next[1]);const e=t.battleTypeFor({kind:'party',band:'bandits'});ok(e&&e.kind==='bridge','next to it (a tile off): the same')}else ok(true,'(no dry tile beside the bridge)');
  at(bare.tx,bare.ty);ok(t.battleTypeFor({kind:'party',band:'bandits'})===null,'open ground away from bridges and cover: an open field')}
 {at(forest.tx,forest.ty);const d0=G.day,rate=(o)=>{let n=0;for(let d=0;d<600;d++){G.day=d;const e=t.battleTypeFor(o);if(e&&e.kind==='ambush'&&e.hid===1)n++}G.day=d0;return n/600};
  const b=rate({kind:'party',band:'bandits'}),r=rate({kind:'party',band:'raiders'}),l=rate({kind:'lord'}),p=rate({kind:'patrol'}),c=rate({kind:'caravan'}),m=rate({kind:'party',band:'bandits',mine:true});
  const C=t.BTYPE_WORLD;ok(t.coverAt(P.x,P.y)==='forest'&&Math.abs(b-C.cover.forest)<.07&&Math.abs(l-C.cover.forest*C.by.lord)<.06&&r>b&&!p&&!c&&!m,'in a forest bandits spring an ambush on '+Math.round(b*100)+'% of days (cover '+C.cover.forest+'), raiders more ('+Math.round(r*100)+'%), a lord’s army '+Math.round(l*100)+'%; patrols, caravans and a fight you started never');
  at(bare.tx,bare.ty);ok(rate({kind:'party',band:'bandits'})===0,'with no cover, no ambush on any day');
  at(forest.tx,forest.ty);G.day=7;const a=JSON.stringify(t.battleTypeFor({kind:'party',band:'bandits'})),a2=JSON.stringify(t.battleTypeFor({kind:'party',band:'bandits'}));G.day=d0;
  const n=counted(()=>{for(let i=0;i<50;i++){t.battleTypeFor({kind:'party',band:'bandits'});t.battleTypeFor({kind:'lord'})}at(bridge.tx,bridge.ty);t.battleTypeFor({kind:'party'});at(forest.tx,forest.ty)});
  ok(a===a2&&n===0,'drawn from the tile and the day: the same answer twice, no Math.random drawn (0 calls)')}

 // ---- hold the bridge in the world: who stands where; the field
 let held=null;
 {at(bridge.tx,bridge.ty);const e=meet();ok(e.btype&&e.btype.kind==='bridge'&&e.btype.def===0&&/Hold the bridge/.test(panel())&&/single bridge/.test(panel()),'set upon at a bridge: the panel says Hold the bridge, and the ground a river with a single bridge');
  t.act('fight');const B=t.B,T2=B.terrain,cr=T2.ai.crossings,br=cr.find(c=>c.kind==='bridge'),rv=T2.ai.river;held=B;
  ok(B.btype&&B.btype.kind==='bridge'&&B.btype.def===0&&T2.recipe.river.hold,'the battle is one: B.btype {bridge, def 0}');
  const ford=cr.find(c=>c.kind==='ford');ok(br&&cr.filter(c=>c.kind==='bridge').length===1&&cr.length===(ford?2:1)&&(!ford||Math.abs(ford.y-br.y)-(ford.w+br.w)/2>=X.fordGap)&&!!e.btype.ford===!!ford||br&&!ford,'one bridge'+(ford?' and a ford far off it ('+Math.round(Math.abs(ford.y-br.y))+' px)':' and no ford')+' over the river');
  const deep=[];for(let i=0;i<T2.kind.length;i++)if(T2.kind[i]===K.deep)deep.push(i);ok(deep.length>40&&deep.every(i=>T2.solid[i]===1)&&T2.blocky&&!T2.wade,'its deep water ('+deep.length+' cells) is impassable: closed on the grids, every step into it refused');
  const row=deep.map(i=>Math.floor(i/T2.C)).find(r=>Math.abs((r+.5)*T2.cs-br.y)>60);const y=(row+.5)*T2.cs;
  ok(!t.lineClear(T2.route.foot,rv.x0-20,y,rv.x1+20,y)&&t.lineClear(T2.route.foot,br.x0-20,br.y,br.x1+20,br.y),'a straight way over the water is barred; over the bridge it is clear');
  const mine=t.playerGroups().map(g=>B.groups[g]).filter(g=>t.grpUnits(g.id).length),theirs=Object.values(B.groups).filter(g=>g.team===1&&t.grpUnits(g.id).length);
  const inf=mine.filter(g=>g.role==='inf'),mid=g=>g.centre();
  ok(mine.every(g=>t.grpUnits(g.id).every(u=>{const s=t.riverSpan(u.y);return !s||u.x<s[0]}))&&inf.length&&inf.every(g=>Math.abs(mid(g).y-br.y)<130&&rv.x0-mid(g).x<90),'your band stands on its bank by the bridge, the foot at the water ('+inf.map(g=>Math.round(rv.x0-mid(g).x)+' px off it').join(', ')+')');
  ok(theirs.every(g=>mid(g).x>t.BW*.7),'they come on from their own edge (the far bank)');
  ok(B.dzone&&t.deployZone().x1===B.dzone.x1&&B.dzone.x1<=rv.x0&&B.dzone.x1>t.BW*t.DEPLOY.zone,'your deployment zone runs to your bank ('+B.dzone.x1+' px; the river from '+rv.x0+')');
  ok(t.calloutState().q.concat(t.calloutState().on).some(c=>c.text==='Hold the bridge!')&&G.msgs.some(m=>/Hold the bridge/.test(m.m)),'the battle opens with Hold the bridge (a banner and the log)');
  world();
  const e2=meet({mine:true});ok(e2.btype&&e2.btype.def===1&&/Take the bridge/.test(panel())&&!/bt-spring/.test(panel()),'riding at them by a bridge: Take the bridge (and no ambush on offer)');
  t.act('fight');{const B=t.B,rv=B.terrain.ai.river,br=B.terrain.ai.crossings.find(c=>c.kind==='bridge'),mine=t.playerGroups().map(g=>B.groups[g]).filter(g=>t.grpUnits(g.id).length),theirs=Object.values(B.groups).filter(g=>g.team===1&&t.grpUnits(g.id).length);
   const dry=g=>t.grpUnits(g.id).every(u=>{const s=t.riverSpan(u.y);return t.groundAt(u.x,u.y)!==K.deep&&(!s||u.x>s[1])});
   ok(theirs.every(g=>dry(g)&&Math.abs(g.centre().y-br.y)<240)&&theirs.filter(g=>g.role==='inf').every(g=>g.centre().x-t.riverSpan(g.centre().y)[1]<90)&&mine.every(g=>g.centre().x<t.BW*.35)&&!B.dzone,'they hold the far bank by the bridge, every man on dry ground beyond the water; you start at your edge, your zone as ever')}
  world()}

 // ---- a held bridge fought to its end in the lab (AI both sides): nobody ever stands in deep water
 {const arm=[{type:'hum_foot',count:14},{type:'hum_bow',count:8},{type:'hum_knight',count:6,form:'wedge'}];let wet=0,steps=0;world();
  L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:4,distance:500,ground:'auto',type:{kind:'bridge',side:'right',ford:false}});const B=t.B;
  const seq=[],foot=Object.values(B.groups).find(g=>g.team===0&&g.role==='inf'),rv=B.terrain.ai.river;let atCross=null;
  while(!L.session.result&&B.t<300&&steps++<1200){L.step(15);for(const u of B.units)if(u.hp>0&&t.groundAt(u.x,u.y)===K.deep)wet++;
   const P=B.captains&&B.captains[0]&&B.captains[0].take;if(P&&seq[seq.length-1]!==P.phase){seq.push(P.phase);if(P.phase==='go'&&atCross==null){const m=t.grpUnits(foot.id).filter(u=>u.hp>0&&!u.rout);atCross=m.length?m.filter(u=>u.x>rv.x).length/m.length:1}}}
  ok(L.session.result&&wet===0,'a held bridge’s battle ends ('+L.session.result+' at '+B.t.toFixed(0)+' s), and no soldier ever stood in deep water ('+wet+')');
  ok(seq.slice(0,4).join()==='wait,stage,cross,go'&&atCross>=.7,'the AI taking it waits out of reach while its shooters shoot, gathers at the crossing, goes over and forms up before it goes on ('+seq.join(' → ')+'; '+Math.round(atCross*100)+'% of its foot over when it does)');
  L.exit()}
 {const arm=[{type:'hum_foot',count:14},{type:'hum_bow',count:8}];world();L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:2,distance:500,ground:'auto',type:{kind:'bridge',side:'left',ford:false}});
  const B=t.B,br=B.terrain.ai.crossings.find(c=>c.kind==='bridge'),rv=B.terrain.ai.river;L.step(60);L.step(60);
  const Q=B.captains[0],q1=B.captains[1];ok(Q&&Q.post==='defend'&&Q.hold&&Q.hold.river&&Q.hold.cr[0]===B.terrain.ai.crossings.find(c=>c.kind==='bridge')||Q&&Q.hold&&Q.hold.cr&&Q.hold.cr[0].kind==='bridge','the AI holding it defends its bank at the bridge (its captain: '+(Q&&Q.post)+')');
  ok(q1&&q1.post==='attack'&&q1.take&&['wait','stage','cross','go'].includes(q1.take.phase),'the AI taking it attacks, going over as one (its plan: '+(q1&&q1.take&&q1.take.phase)+' by the '+(q1&&q1.take&&q1.take.c.kind)+')');
  const inf0=Object.values(B.groups).find(g=>g.team===0&&g.role==='inf');let crossed=0;for(let i=0;i<40&&!L.session.result;i++){L.step(30);if(t.grpUnits(inf0.id).some(u=>u.hp>0&&!u.rout&&u.x>rv.x1+8&&Math.abs(u.y-br.y)>20))crossed++}
  ok(crossed===0,'its holding foot never goes over the river after anyone (20 s)');L.exit()}

 // ---- ambush: the lab's (the left side caught on the road)
 {const arm=[{type:'hum_foot',count:12},{type:'hum_bow',count:8},{type:'hum_knight',count:6,form:'wedge'}];world();
  L.start({leftGroups:arm,rightGroups:arm,deploy:true,paused:true,ai:true,morale:true,seed:3,distance:500,ground:'auto',type:'ambush'});const B=t.B,T2=B.terrain;
  const col=B.units.filter(u=>u.team===0&&u.hp>0),hid=B.units.filter(u=>u.team===1&&u.hp>0),mid=(B.ftop+B.fbot)/2;
  ok(B.btype.kind==='ambush'&&B.btype.hid===1&&!B.deploy,'an ambush: no deployment for the side caught (deploy asked, none given)');
  ok(col.every(u=>Math.abs(u.y-mid)<40)&&Object.values(B.groups).filter(g=>g.team===0).every(g=>g.files<=X.files&&Math.abs(Math.cos(g.face))>.99),'the side caught stands in march order on the road down the middle, '+X.files+' files wide, facing along it');
  ok(hid.every(u=>u.hid&1)&&col.every(u=>!u.hid)&&hid.every(u=>T2.kind[t.tIx(T2,u.x,u.y)]===K.wood),'those lying in wait start unseen, every one in a wood; the column in plain sight');
  const near=Math.min(...hid.map(u=>Math.min(...col.map(c=>Math.hypot(c.x-u.x,c.y-u.y)))));ok(near>t.SIGHT.near,'the nearest of them is '+Math.round(near)+' px off the column (beyond the '+t.SIGHT.near+' px that would give him away)');
  ok(/road runs between woods/.test(T2.recipe.text)&&(()=>{for(let r=0;r<T2.R;r++){const y=(r+.5)*T2.cs;if(Math.abs(y-mid)<20)for(let c=0;c<T2.C;c++)if(T2.kind[r*T2.C+c]!==0)return false}return true})(),'the road is clear of cover edge to edge; the field told as “'+T2.recipe.text.slice(0,40)+'…”');
  let sprung=null,mul=0;for(let i=0;i<40&&!sprung;i++){L.step(15);const S=T2.sight;if(S&&S.sprung.size){sprung=[...S.sprung.keys()][0];const u=B.units.find(x=>x.grp===sprung&&x.hp>0);mul=u?t.ambushMul(u):0}}
  const C=t.calloutState(),said=C.q.concat(C.on).some(c=>c.text==='Ambush!')||Object.keys(C.last).some(k=>/^ambush:/.test(k));
  ok(sprung&&B.groups[sprung].team===1&&mul===t.AMBUSH.shock&&said,'their first charge springs it: '+(sprung&&B.groups[sprung].name)+', shock ×'+mul+', and the Ambush! callout');L.exit()}
 {const arm=[{type:'hum_foot',count:10},{type:'hum_bow',count:6}];world();L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,seed:5,climate:'desert',ground:'auto',type:{kind:'ambush',side:'right'}});
  const B=t.B,T2=B.terrain,hid=B.units.filter(u=>u.team===0&&u.hp>0);ok(B.btype.hid===0&&!T2.has.wood&&T2.has.hills&&hid.every(u=>u.hid&2),'a desert ambush lies behind low ridges (no woods there): unseen from the road all the same');L.exit()}

 // ---- ambush in the world: set upon in a forest (no deployment); the road event; Spring an ambush
 {ev('BDEPLOY.on=true');at(forest.tx,forest.ty);let day=-1;for(let d=0;d<200&&day<0;d++){G.day=d;const e=t.battleTypeFor({kind:'party',band:'bandits'});if(e&&e.kind==='ambush')day=d}
  const e=meet();ok(e.btype&&e.btype.kind==='ambush'&&/Ambush!/.test(panel())&&/data-act="flee"[^>]*disabled/.test(panel())&&/in their trap/.test(panel()),'set upon in a forest on day '+day+': the panel says Ambush!, and there is no fleeing the trap');
  const h2=document.querySelector('#panel h2');ok(h2&&!document.querySelector('#panel .nav')&&!t.escDismiss()&&document.querySelector('#panel .btns [data-act="fight"]'),'the pre-battle panel keeps the frame: its header, the fight’s choices, no bar (a forced choice: Esc picks none)');
  t.act('fight');const B=t.B;ok(B.btype&&B.btype.kind==='ambush'&&B.btype.hid===1&&!B.deploy&&B.units.filter(u=>u.team===1&&u.hp>0).every(u=>u.hid&1),'the battle: no deployment even with it on, every one of theirs unseen');
  ok(G.enc.btype===false,'sprung once: run down after it, you would face them on an open field');world();ev('BDEPLOY.on=false')}
 {at(forest.tx,forest.ty);const D=t.ROAD_ENC.ambush;ok(D&&D.ok()&&!t.EVENTS.some(x=>x.id==='ambush'),'the ambush on the road can come where there is cover (an encounter on the map: world/road.js)');
  world();const E=t.roadSpawn('ambush',P.x+8,P.y);t.roadMeet(E);ok(G.mode==='road'&&/ambush/.test(panel())&&!document.querySelector('#panel .nav [data-nav="close"]'),'its page: the choices, no Leave (a forced choice)');
  t.act('enc-do','0');ok(G.enc&&G.enc.btype&&G.enc.btype.kind==='ambush'&&G.enc.btype.hid===1&&/Ambush!/.test(panel()),'and Close up and fight leads into the ambush: the pre-battle panel says Ambush!');world()}
 {at(forest.tx,forest.ty);const e=meet({mine:true});ok(!e.btype&&/data-act="bt-spring"[^>]*>Spring an ambush/.test(panel()),'riding at them where there is cover: the panel offers Spring an ambush');
  t.act('bt-spring');const B=t.B,mid=(B.ftop+B.fbot)/2,mine=B.units.filter(u=>u.team===0&&u.hp>0),theirs=Object.values(B.groups).filter(g=>g.team===1&&t.grpUnits(g.id).length);
  ok(B&&B.btype.kind==='ambush'&&B.btype.hid===0&&!B.deploy&&mine.every(u=>u.hid&2),'sprung: your band starts hidden beside the road ('+mine.length+' unseen), no deployment');
  ok(theirs.every(g=>t.grpUnits(g.id).every(u=>Math.abs(u.y-mid)<40)&&g.ax<g.centre().x-100),'theirs is on the road in march order, marching on (west) along it');
  at(bare.tx,bare.ty);world();meet({mine:true});ok(!/bt-spring/.test(panel()),'with no cover there is none to offer');world()}

 // ---- the lab's type key
 {const v=x=>L.validate({type:x}).type;ok(v(undefined)==='field'&&v('bridge')==='bridge'&&v('ambush')==='ambush'&&JSON.stringify(v({kind:'bridge',side:'right',ford:true}))==='{"kind":"bridge","side":"right","ford":true}','the lab type key: field by default, bridge, ambush, {kind, side, ford}');
  let th=0;for(const b of ['siege',{kind:'moat'},{kind:'bridge',side:'up'},{kind:'ambush',ford:true},{kind:'bridge',ford:'yes'},[1]])try{L.validate({type:b})}catch(e){th++}ok(th===6,'bad types are refused ('+th+'/6)');
  const arm=[{type:'hum_foot',count:6}],go=type=>{world();L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,seed:9,ground:'none',type});const b=JSON.stringify(t.B.btype),T2=!!t.B.terrain;L.exit();return[b,T2]};
  const r=[go('bridge'),go({kind:'bridge',side:'right'}),go('ambush'),go({kind:'ambush',side:'right'}),go('field')];
  ok(JSON.parse(r[0][0]).def===0&&JSON.parse(r[1][0]).def===1&&JSON.parse(r[2][0]).hid===1&&JSON.parse(r[3][0]).hid===0&&r[4][0]===undefined&&r.slice(0,4).every(x=>x[1])&&!r[4][1],'it sets the battle: bridge (left holds; right: right holds), ambush (left caught; right: right caught), with ground even for ground none; field: none ('+r.map(x=>x[0]).join(' ')+')')}

 // ---- terrain off: none of it
 {ev('TERRAIN.on=false');at(bridge.tx,bridge.ty);const n=counted(()=>{t.battleTypeFor({kind:'party',band:'bandits'})});const e=meet();
  ok(n===0&&e.btype===undefined&&!/bridge/i.test(panel())&&!/bt-spring/.test(panel()),'terrain off: no battle type at a bridge (none set on the encounter, no word of it on the panel, no Math.random drawn)');
  t.act('fight');ok(t.B&&t.B.btype===undefined&&!t.B.terrain&&!t.B.dzone,'the battle as ever: no B.btype, no ground, no zone of its own');world();
  at(forest.tx,forest.ty);ok(!t.ROAD_ENC.ambush.ok(),'and no ambush on the road');meet({mine:true});ok(!/bt-spring/.test(panel()),'nor Spring an ambush');world()}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{try{if(T.BattleLab.active)T.BattleLab.exit()}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
