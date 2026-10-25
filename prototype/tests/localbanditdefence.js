'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;P.hostile={};P.fac=null;P.honor={};P.lrel={};
 for(const f of t.FIDS)for(const g of t.FIDS)if(f!==g)W.rel[t.rk(f,g)]={s:'peace',since:G.day};
 const town=t.TOWNS.find(h=>h.owner&&h.owner!=='player'),fac=town.owner,lord=W.lords.find(l=>l.fac===fac),other=W.lords.find(l=>l.fac!==fac);
 Kit.goTo(town.x,town.y);Object.assign(lord,{x:P.x+12,y:P.y,dead:false,inside:null,fight:null,state:'rest'});lord.troops=['hum_foot','hum_foot','hum_foot'];
 const guard=t.asParty({pt:true,home:town.name,fac,x:P.x+16,y:P.y,troops:['hum_foot','hum_foot'],cool:0}),band=t.asParty({kind:'bandits',x:P.x+20,y:P.y,troops:Array(120).fill('militia')});
 const e={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],rolls:{[lord.id]:.999},mine:true};G.enc=e;
 ok(t.landHold(P.x,P.y).owner===fac,'fixture is on the helpers realm current land');
 ok(!t.neutralHelps(e,lord,lord.id,0)&&!!t.lordWhy(e,lord),'local lord joins against bandits even when the neutral roll and odds would reject help');
 ok(!!t.watchWhy(e,guard),'local guards reliably join the same bandit fight');
 const area=new t.WorldBattleArea(e);ok(area.teamFor(lord)===0&&area.teamFor(guard)===0,'late reinforcement decisions use the same local-duty rule');
 const foreign={...e,rolls:{[other.id]:.999}};ok(!t.localBanditDuty(foreign,other),'foreign lords do not gain automatic local duty');
 e.rolls['w:'+guard.home+':'+t.watchOf(guard)]=.999;const owner=town.owner;town.owner=other.fac;ok(!t.localBanditDuty(e,lord)&&!t.localBanditDuty(e,guard)&&!t.watchWhy(e,guard),'captured territory uses its current owner rather than a guard old home');town.owner=owner;
 P.hostile[fac]=G.day+5;ok(!t.lordWhy(e,lord)&&!t.watchWhy(e,guard),'hostility to the player is not silently converted into an alliance');P.hostile={};
 const factionFight={kind:'lord',ref:lord,list:lord.troops,allies:[],foes:[]};ok(!t.lordWhy(factionFight,lord)&&!t.watchWhy(factionFight,guard),'local duty never overrides loyalty to the faction being attacked');
 const field={kind:'field',ref:{x:P.x,y:P.y},list:band.troops,allies:[],foes:[band],rolls:{[lord.id]:.999}};ok(!!t.lordWhy(field,lord),'local duty also applies to a field battle against outlaw bands');
 // Exercise actual admission before avoidance can move a local defender away.
 G.enc=e;band.troops=['militia'];e.list=band.troops.slice();W.lords=[lord];W.patrols=[guard];W.monsters=[];t.bandits.length=0;t.bandits.push(band);P.troops={hum_foot:2};t.startBattle({enemies:e.list,tournament:false});const b=t.B;b.world.reinforce(.01);
 ok(b.world.participants.has(lord)&&b.world.participants.has(guard)&&b.units.some(u=>u.team===0&&u.sourceArmy===lord)&&b.units.some(u=>u.team===0&&u.sourceArmy?.src===guard),'real local lord and guard enter the bandit battle on the player side');
});
