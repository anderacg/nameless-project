'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.troops={hum_foot:4};P.comps={};P.hostile={};
 const town=t.TOWNS.find(x=>x.owner&&x.owner!=='player'),fac=town.owner,lord=W.lords.find(l=>l.fac===fac),other=W.lords.find(l=>l.fac!==fac),alt=other.fac;
 for(const a of t.FIDS)for(const b of t.FIDS)if(a!==b)W.rel[t.rk(a,b)]={s:'peace',since:G.day};
 Kit.goTo(town.x+100,town.y+100);Object.assign(lord,{dead:false,inside:null,fight:null,state:'rest',x:P.x+10,y:P.y});lord.troops=['hum_foot','hum_foot','hum_foot'];
 const watch=t.asParty({pt:true,home:town.name,fac,troops:['hum_foot','hum_foot'],x:P.x+12,y:P.y,cool:0}),job=Object.keys(t.TRADES)[0],worker=t.asWorker({folk:true,id:'allegiance-worker',home:town.name,k:'field',job,st:'field',x:P.x+20,y:P.y,dir:1,ph:0});W.folk=[worker];
 const e={kind:'villagers',ref:{town:town.name,k:'field',f:worker,ws:[worker],gs:0,fac,x:worker.x,y:worker.y},list:[t.recruitKind(town,worker)],allies:[],foes:[],mine:true};G.enc=e;
 P.fac=fac;P.honor={[fac]:100};P.lrel={[lord.id]:100};
 ok(t.foeRealm(e)===fac,'worker and estate-guard resistance is a faction conflict rather than a common enemy');
 ok(!t.watchWhy(e,watch)&&!t.lordWhy(e,lord),'own-faction watch and friendly lord never volunteer to attack their own workers');
 let area=new t.WorldBattleArea(e);ok(area.teamFor(watch)===1&&area.teamFor(lord)===1,'watch and lord defend their faction even before it becomes hostile to the player');
 const force=t.forceOf(watch);e.allies=[force,lord];ok(area.teamFor(watch)===1&&area.teamFor(lord)===1,'faction allegiance takes priority over stale ally lists');
 t.alignReinforcements(e);ok(!e.allies.length&&e.foes.includes(force)&&e.foes.includes(lord),'initial participants are moved onto their faction side before spawning');
 ok(t.forceRealm({...force,fac:alt})===fac,'the real source army determines allegiance instead of a stale force snapshot');
 for(const kind of ['lord','patrol','estate','caravan','party','siege','raid']){const encounter={kind,ref:kind==='siege'||kind==='raid'?{owner:fac,x:P.x+20,y:P.y}:{fac,x:P.x+20,y:P.y},list:['hum_foot'],allies:[],foes:[]};G.enc=encounter;ok(new t.WorldBattleArea(encounter).teamFor(watch)===1,kind+': same-faction watch reinforces its own side')}
 P.fac=null;P.honor={};P.lrel={};G.enc=e;e.allies=[];e.foes=[];W.rel[t.rk(fac,alt)]={s:'ally',since:G.day};ok(area.teamFor(other)===1,'an allied realm supports the defender before personal-help rules');W.rel[t.rk(fac,alt)]={s:'peace',since:G.day};
 ok(area.teamFor(other)===-1,'an unrelated peaceful lord does not fight on either side');
 const field={kind:'field',list:['hum_foot'],ref:{x:P.x+20,y:P.y},allies:[],foes:[lord]};G.enc=field;ok(area.teamFor(watch)===1,'a field battle also respects the factions already fighting against the player');
 P.comps.brann={ap:5};t.compInit('brann');const companion=t.asParty({cid:'brann',troops:['hum_foot'],x:P.x,y:P.y});P.comps.brann.party=companion;G.enc=e;ok(area.teamFor(companion)===0,'personal companion parties retain their allegiance to the player');P.comps={};
 const band=t.asParty({kind:'bandits',troops:['militia'],x:P.x+20,y:P.y}),same=t.asParty({kind:'bandits',troops:['militia'],x:P.x,y:P.y}),different=t.asParty({kind:'raiders',troops:['militia'],x:P.x,y:P.y});G.enc={kind:'party',ref:band,list:band.troops,allies:[],foes:[]};ok(area.teamFor(same)===1&&area.teamFor(different)===-1,'leaderless bands only reinforce matching band kinds rather than all outlaws');
 G.enc=e;W.lords=[lord];W.patrols=[watch];W.monsters=[];t.bandits.length=0;e.allies=[];e.foes=[];t.startBattle({enemies:e.list,tournament:false});const b=t.B;b.world.reinforce(1/60);
 const joined=b.units.filter(u=>u.sourceArmy===lord||u.sourceArmy?.src===watch);ok(joined.some(u=>u.sourceArmy===lord)&&joined.some(u=>u.sourceArmy?.src===watch)&&joined.every(u=>u.team===1),'real late-arriving watch and lord actors join the workers side');
 ok(!b.units.some(u=>u.team===0&&(u.sourceArmy===lord||u.sourceArmy?.src===watch)),'no same-faction defender is spawned as a player helper');
 ok(!t.hostileTo(fac),'choosing the correct side does not invent an earlier diplomacy penalty');
});
