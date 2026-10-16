'use strict';
// Shared roster operations conserve soldiers, reject malformed counts, and keep XP/capacity rules across every boundary.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
  const t=T,P=t.P,G=t.G;try{localStorage.clear()}catch(e){}
  const initial=JSON.stringify(P),make=c=>new t.TroopRoster({tc:{...c}},'tc',{valid:k=>['a','b'].includes(k)});
  const a=make({a:4,b:2}),b=make({b:1}),total=()=>a.size+b.size;
  ok(a.count('a')===4&&a.size===6&&a.list.join()===['a','a','a','a','b','b'].join(),'a roster exposes counts, size and an expanded view');
  let before=total();ok(a.transferTo(b,'a',9,2)===2&&total()===before&&a.count('a')===2&&b.count('a')===2,'a named transfer is capped by receiving room and conserves headcount');
  before=JSON.stringify([a.counts,b.counts]);ok(a.transferTo(b,'a',1,0)===0&&JSON.stringify([a.counts,b.counts])===before,'a full destination leaves both rosters unchanged');
  ok(a.transferTo(a,'a',1)===0,'a roster cannot transfer to itself');
  const alias=new t.TroopRoster(a.owner,'tc');ok(a.transferTo(alias,'a',1)===0,'two adapters for the same counts cannot duplicate soldiers');
  const rejecting=new t.TroopRoster({tc:{}},'tc',{valid:()=>false});ok(a.transferTo(rejecting,'a',1)===0&&JSON.stringify([a.counts,b.counts])===before,'a destination must accept a kind before the source is changed');
  for(const n of [-1,0,.5,NaN,Infinity,'2']){
    const snap=JSON.stringify([a.counts,b.counts]);a.add('a',n);a.remove('a',n);a.removeAny(n);a.transferTo(b,'a',n);a.transferAnyTo(b,n);
    ok(JSON.stringify([a.counts,b.counts])===snap,'invalid quantity '+String(n)+' cannot change a roster');
  }
  for(const k of ['missing','constructor','__proto__'])ok(a.add(k)===0&&a.remove(k)===0,'invalid kind '+k+' cannot create or remove soldiers');
  const old=a.counts;a.owner.tc={a:3};ok(a.count('a')===3&&a.size===3&&old!==a.counts,'the adapter follows replacement counts, not an obsolete array or snapshot');
  const rng=Math.random;try{
    Math.random=()=>.5;before=total();const moved=a.transferAnyTo(b,99,2);ok(moved.length===2&&a.count('a')===1&&total()===before,'random transfer respects availability and capacity');
    const c=make({a:3,b:2}),snap=JSON.stringify(c.counts),lost=c.losses(.6);ok(JSON.stringify(c.counts)===snap&&lost.a===3&&lost.b===2,'sampling casualties does not change the roster before healing');
    const removed=c.lose({a:99,b:1,missing:2});ok(removed.a===3&&removed.b===1&&c.size===1&&!c.counts.a,'applying losses reports only actual removals and deletes empty kinds');
    ok(c.removeAny(99).length===1&&c.size===0,'random losses cannot remove more soldiers than exist');
  }finally{Math.random=rng}
  const moved=a.transferAllTo(b);ok(moved.a===1&&a.size===0&&a.transferAllTo(b).a===undefined,'return-all drains its source and cannot be replayed');
  const x=make({a:40,b:20}),y=make({a:5});let conserved=true;
  for(let i=0;i<100;i++){const from=i%2?x:y,to=i%2?y:x,kind=i%3?'a':'b';from.transferTo(to,kind,1+i%7,2+i%5);conserved=conserved&&x.size+y.size===65&&Object.values(x.counts).concat(Object.values(y.counts)).every(t.troopAmount)}
  ok(conserved,'100 alternating partial transfers preserve totals and positive integer counts');
  ok(JSON.stringify(P)===initial,'standalone roster checks do not change the live player');

  // Numeric garrisons deliberately do not retain the stationed soldier's type (the existing save/game rule).
  const p={gold:500},r=new t.TroopRoster({tc:{a:4,b:2}},'tc',{valid:k=>['a','b'].includes(k)}),town={owner:'player',gar:2,cap:5,vol:3,pop:40};let room=2;
  const service=new t.GarrisonService(p,{roster:()=>r,capacity:h=>h.cap,room:()=>room,unit:()=> 'a',price:30,draft:(h,n)=>{const got=Math.min(n,h.vol);h.vol-=got;h.pop-=got;return got}});
  ok(service.station(town,'a',99)===3&&town.gar===5&&r.count('a')===1,'stationing is bounded by garrison room and source troops');
  before=JSON.stringify({p,town,tc:r.counts});ok(service.station(town,'a',1)===0&&service.station(town,'b',.5)===0&&JSON.stringify({p,town,tc:r.counts})===before,'full or malformed station commands are read-only');
  town.owner='vale';ok(service.station(town,'b',1)===0&&service.callup(town)===0&&service.hire(town,1)===0,'foreign garrisons cannot be changed through direct service calls');town.owner='player';
  room=0;ok(service.callup(town)===0&&town.gar===5,'a call-up checks the whole party capacity');room=2;
  ok(service.callup(town)===1&&town.gar===4&&r.count('a')===2,'a call-up adds one local guard and removes one from the walls');
  town.gar=1;ok(service.callup(town)===0,'a call-up leaves the last defender on the walls');
  town.gar=0;town.cap=10;ok(service.hire(town,5)===3&&p.gold===410&&town.gar===3&&town.pop===37&&town.vol===0,'hiring guards pays only for the volunteers actually drafted');
  before=JSON.stringify({p,town});ok(service.hire(town,-1)===0&&service.hire(town,.5)===0&&JSON.stringify({p,town})===before,'invalid guard quantities cannot change funds or population');

  t.act('begin','soldier');G.quietEvents=true;const cached=t.partyRoster(P);
  P.troops={hum_levy:3};P.txp={hum_levy:120};P.remove('hum_levy');ok(P.txp.hum_levy===80,'every player removal clamps pooled XP to the remaining soldiers');
  t.applyLosses({hum_levy:99});ok(!P.troops.hum_levy&&!P.txp.hum_levy,'battle losses remove the last soldier and its unusable XP');
  P.comps={brann:{ap:5,role:''}};const comp=t.compInit('brann');comp.lv=3;
  P.troops={hum_levy:6};P.txp={hum_levy:240};ok(t.cpGive('brann','hum_levy',3)===3&&P.txp.hum_levy===120&&comp.party.tc.hum_levy===3,'companion handover uses the shared transfer and trims unusable hero-pool XP');
  const cp=comp.party;cp.x=P.x;cp.y=P.y;P.wounded={hum_levy:1};P.troops={hum_levy:t.partyCap()-2};
  ok(t.cpTake('brann','hum_levy',3)===0&&cp.size===3,'taking soldiers back includes companions and wounded in the capacity check');
  P.remove('hum_levy');ok(t.cpTake('brann','hum_levy',3)===1&&cp.size===2,'a partial return fills only the free slot');
  before=P.size;t.cpDisband('brann',false);ok(!comp.party&&cp.size===0&&P.size===before+2,'automatic disband preserves the existing over-cap return policy but drains its old source');
  before=P.size;t.cpDisband('brann',false);t.partyTransferAll(cp,P);ok(P.size===before,'repeating a disband or using its stale party reference cannot duplicate soldiers');
  const fief=t.TOWNS.find(h=>h.kind==='town');fief.owner='player';fief.gar=1;P.troops={hum_levy:1};P.txp={hum_levy:40};
  ok(t.garrisons.station(fief,'hum_levy',1)===1&&!P.txp.hum_levy,'garrison stationing also removes unusable troop XP');
  const band=t.asParty({kind:'bandits',list:['militia','militia'],x:0,y:0});const list=band.list;band.remove('militia');ok(band.n===1&&band.list!==list&&band.list.length===1,'shared mutations invalidate the immutable band list and count');
  P.troops={hum_levy:2};P.txp={hum_levy:999};G.mode='world';G.modal=false;t.hidePanel();t.saveGame(true);t.loadGame();
  ok(t.partyRoster(P)===cached&&P instanceof t.PlayerParty&&cached.count('hum_levy')===2&&P.txp.hum_levy===80,'load keeps the cached adapter and clamps stale XP without changing the save schema');
  const saved=t.readSave();ok(saved.P.troops.hum_levy===2&&!saved.P.tc&&!saved.P.roster&&!saved.P.rules,'saves still contain plain troop counts, never roster services');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
