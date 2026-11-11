'use strict';
// Rules that gave the wrong result (a review of the rules, 2026-11-11). No autosave over a death by beasts (save.js: a load of it had
// the hero alive again); a passenger the beasts killed is dead, not delivered (death.js, forms.js STORY_BAD); a band that moves into
// an outpost is not beaten by you, and a quest's quarry is not taken off the map so (standards.js contest); yours on the field are
// your own band, not an ally's leader, and a router off the field is no withdrawal (morale.js yourOwn, leaveField, retreating); a deed
// that costs standing costs honour too (reputation.js repNear); outside a gate that will not have you there is no lodging (stay.js);
// a sally out of a besieged holding is no free way out (engage.js fleeOdds); no siege kept by a captive (siege.js siegeDay,
// captivity.js defeat); a lord slain does not also get away (realms.js lordWon).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,rnd=Math.random;Kit.begin('soldier',23);Kit.world();Kit.clear();t.GUIDE.on=false;
 const ash=t.townBy('Ashford'),other=t.TOWNS.find(x=>x!==ash&&x.owner&&x.owner!=='player'&&!x.gone);
 try{
  // ---- slain: no autosave over it
  {const snap=()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));G.mode='world';t.hidePanel();
   t.Death.slain={how:'slain'};const a=snap();t.saveGame(true);ok(snap()===a,'slain by beasts: the autosave writes nothing');
   t.Death.slain=null;t.saveGame(true);ok(snap()!==a,'alive: it saves as ever (the check bites)')}
  // ---- a passenger dead is not a goal done
  ok(t.STORY_BAD.includes('dead')&&!t.STORY_OK.includes('dead')&&/'dead'\)/.test(String(t.Death.passengers)),'a passenger the beasts killed ends its quest dead, a story\'s bad end, not slain (a beast hunt\'s done)');
  // ---- an outpost taken by a band: no band beaten by you; a quest's quarry left on the map
  {const s=t.Standards.all()[0];if(!s)info('no outpost in this world: the contest not tried');else{const keep={owner:s.owner,guards:s.guards,ld:s.ld,taking:s.taking,choose:s.choose},L=W.lords,bs=t.bandits.slice();
    let heard=0;const off=t.worldOn('band:beaten',()=>heard++);W.lords=[];s.owner=null;s.guards=0;s.taking=null;s.choose=false;window.Math.random=()=>0;
    const mk=q=>{const b=t.asParty({kind:'bandits',x:s.x+10,y:s.y,troops:Array(5).fill('militia')});if(q)b.qid=q;t.bandits.push(b);return b};
    const q=mk(7);s.contest();ok(t.bandits.includes(q)&&!s.band,'a quest\'s quarry by an empty outpost: left on the map, the outpost not its lair');
    const b=mk(0);s.contest();ok(!t.bandits.includes(b)&&s.band==='bandits'&&heard===0,'a common band moves in: the outpost its lair, and no band beaten by you told');
    window.Math.random=rnd;if(typeof off==='function')off();t.bandits.length=0;t.bandits.push(...bs);W.lords=L;Object.assign(s,keep)}}
  // ---- yours on the field
  ok(t.yourOwn({team:0})&&!t.yourOwn({team:0,leader:{}})&&!t.yourOwn({team:0,lord:{}})&&!t.yourOwn({team:1}),'yours: your own band, not a lord\'s man, not an ally\'s leader');
  {P.troops={hum_foot:4};const band=t.asParty({kind:'bandits',x:P.x+20,y:P.y,troops:Array(4).fill('militia')});W.monsters=[];t.bandits.length=0;t.bandits.push(band);
   G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B;for(let i=0;i<600&&b.muster?.active;i++)t.updateBattle(.05);
   const mine=b.units.filter(u=>u.team===0);b.withdrawn=1;b.lastOut='left';for(const u of mine){u.hp=0;u.left=true}
   const ally={team:0,leader:{},hp:10,x:0,y:0};b.units.push(ally);ok(t.retreating(),'all of yours withdrawn, an ally\'s leader still fighting: the battle is over for you');
   b.units.pop();const r={team:0,hp:5,fled:true,grp:mine[0].grp};b.lastOut='died';t.leaveField(r);ok(b.lastOut==='died','one of yours routed off the field: no withdrawal');
   const w={team:0,hp:5,grp:mine[0].grp};t.leaveField(w);ok(b.lastOut==='left','one who walked off it: left');t.B=null;G.mode='world';G.enc=null;Kit.clear();Kit.world()}
  // ---- honour follows the deed
  {const f=other.owner,h0=t.honorWith(f),r0=P.rep[other.name]||0;t.repNear(other.x,other.y,-6);ok(t.honorWith(f)<h0&&(P.rep[other.name]||0)<r0,'a deed that costs standing by a holding costs honour with its realm ('+h0+' to '+t.honorWith(f)+')');
   const h1=t.honorWith(f);t.repNear(other.x,other.y,6);ok(t.honorWith(f)>h1,'one that earns it earns honour')}
  // ---- outside the walls
  {const why0=t.yourShelterWhy(ash,0);G.town={ref:ash,outside:true,tab:'trade'};const why=t.yourShelterWhy(ash,0);G.town=null;ok(/outside/i.test(why)&&!/outside/i.test(why0),'at the market outside a gate: no lodging within ("'+why+'")')}
  // ---- a sally
  {const l=W.lords.find(x=>!x.dead&&x.troops.length)||W.lords[0];if(l){const keep=l.troops;l.troops=Array(60).fill('hum_foot');P.troops={hum_foot:3};
    const a=t.fleeOdds({kind:'lord',ref:l,mine:true}),s=t.fleeOdds({kind:'lord',ref:l,mine:true,sally:true});ok(a.leave&&!s.leave&&s.ch<1,'a fight you began you may leave; a sally out of a besieged holding is a flight at its odds ('+Math.round(s.ch*100)+'%)');l.troops=keep}}
  // ---- no siege kept by a captive
  {P.troops={hum_foot:6};P.siege={town:other.name,days:1};t.Timed.of(P,'hostile').extend(other.owner,5);const h=t.Captivity.held;t.Captivity.held={k:'x'};t.siegeDay();ok(P.siege===null,'a captive keeps no siege');
   t.Captivity.held=h;P.siege={town:other.name,days:1};P.troops={};t.siegeDay();ok(P.siege===null,'nor one with no men');P.troops={hum_foot:6};P.siege={town:other.name,days:1};t.siegeDay();ok(P.siege&&P.siege.days>=2,'with men, and free: it goes on');P.siege=null}
  // ---- a lord slain
  {const l=W.lords.find(x=>!x.dead&&!x.gone),was=t.Houses.slain;if(l){const rec={...l,troops:l.troops.slice()};t.Houses.slain=(x,by)=>{x.dead=true;return true};
    const txt=t.lordWon(l,{gold:0},true);t.Houses.slain=was;ok(/falls in the fighting/.test(txt)&&!/gets away/.test(txt)&&!/captive/.test(txt),'a lord slain in the fighting neither gets away nor is taken');Object.assign(l,rec)}}
 }finally{window.Math.random=rnd;t.Death.slain=null}
});
