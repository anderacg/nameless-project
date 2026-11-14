'use strict';
// Safe near a holding (the owner, 2026-11-14): "bandits keep chasing me into the holding area" (data/outlaws.js BAND_SHY, world/
// brains.js BandBrain shy), "guards not kill the bandits or not react to the bandits when chasing me" (data/factions.js DEFEND
// withYou, world/defence.js afterYou, sidePower), "lord army still moving back and forth or keep changing the formation between
// column and normal marching formation" (world/marchstyles.js TRAVEL_STYLES band, hold; world/hosts.js places).
Kit.suite(({ok,info})=>{const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;t.WORLD_LOD.on=false;G.quietEvents=true;G.encCool=1e9;
 const town=t.TOWNS.find(h=>h.owner&&h.owner!=='player'&&h.kind!=='hamlet'&&!h.ruined()),watch=t.Watches.of(town).power(),X=t.BAND_SHY;
 W.lords.forEach(l=>{l.x=-9000;l.y=-9000});W.patrols=[];t.bandits.length=0;W.monsters=[];P.hostile={};
 Kit.goTo(town.x,town.y+30);const band=n=>{const b=t.asParty({kind:'bandits',x:P.x+70,y:P.y,troops:Array(n).fill('militia'),cool:0,t:9,a:0});t.bandits.length=0;t.bandits.push(b);return b};
 const step=(b,k=20)=>{for(let i=0;i<k;i++)t.BRAINS.band.think(b,.1,false)};
 // ---- a band after you near a holding's homes turns back, unless it is far the stronger
 {let n=4,b=band(n);while(b.power()*b.nerve>=watch*X.dare&&n>1)b=band(--n);
  t.TravelSearch.seen(b);const d0=Math.hypot(b.x-P.x,b.y-P.y),h0=t.homeDist(town,b.x,b.y);ok(!!t.BRAINS.band.shy(b),'you '+Math.round(t.homeDist(town,P.x,P.y))+' px from '+town.name+'\'s homes: a band of '+b.troops.length+' (power '+Math.round(b.power())+', its watch '+Math.round(watch)+') is shy of it');
  step(b);ok(Math.hypot(b.x-P.x,b.y-P.y)>d0&&t.homeDist(town,b.x,b.y)>h0&&!t.TravelSearch.of(b),'it hunts and searches for you no further, turning back for the wilds ('+Math.round(d0)+' → '+Math.round(Math.hypot(b.x-P.x,b.y-P.y))+' px from you)');
  n=4;b=band(n);while(b.power()*b.nerve<watch*X.dare)b=band(++n);t.TravelSearch.seen(b);P.x+=0;const e0=Math.hypot(b.x-P.x,b.y-P.y);step(b);
  ok(!t.BRAINS.band.shy(b)&&Math.hypot(b.x-P.x,b.y-P.y)<e0,'a band '+X.dare+' times its watch or more (power '+Math.round(b.power())+') dares it and keeps coming');
  Kit.goTo(town.x+4000,town.y+4000);b=band(3);ok(!t.BRAINS.band.shy(b),'out in the wilds, no holding near you: no shyness');Kit.goTo(town.x,town.y+30)}
 // ---- the watch rides out at a band after you, weighing your army with its own
 {const D=t.DEFEND,pw=t.partyPower();let n=2,b=band(n);while(b.power()*D.edge<=watch&&n<200)b=band(++n);
  const alone=t.canBeat(watch,b),withYou=t.canBeat(watch+pw,b);info('watch '+Math.round(watch)+', you '+Math.round(pw)+', the band '+Math.round(b.power())+' (it needs '+D.edge+'×)');
  if(withYou&&!alone){t.Watches.of(town).send();const w=t.Watches.of(town).out();b.x=P.x+40;b.y=P.y;w.hunt=null;t.watchAt(town,b,D.see+40);ok(!!w.hunt&&t.huntable(w,b),'too strong for the watch alone, but after you, beside you on its land: the watch is set on it (and runs it down)');
   Kit.goTo(town.x-300,town.y-300);b.x=town.x+40;b.y=town.y+30;w.hunt=null;t.watchAt(town,b,t.homeDist(town,b.x,b.y));ok(!w.hunt,'the same band with you far off: the watch leaves it be, as before');Kit.goTo(town.x,town.y+30)}
  else ok(false,'fixture: a band the watch beats only with you ('+alone+', '+withYou+')')}
 // ---- a lord's column: kept till nearer than band × long, held a while even far from you
 {const T=t.TRAVEL_STYLES,l=W.lords.find(x=>!x.dead&&x.fac),to=t.TOWNS.find(h=>h.owner===l.fac);Object.assign(l,{x:to.x+T.long*.85,y:to.y,state:'march',tgt:to.name,inside:null,fight:null,defend:null,follow:null,with:null,waylay:null});
  const el=t.TravelStyle.enemyLand(l,T.near*T.band);ok(el||(!t.TravelStyle.far(l,false)&&t.TravelStyle.far(l,true)),'a lord '+Math.round(T.long*.85)+' px from his goal: no column set out (long '+T.long+'), one he marches in kept till '+Math.round(T.long*T.band));
  t.TravelStyle.forget(l);const c0=t.TravelStyle.column(l);const k=t.TRAVEL_SEEN.get(l);k.at=t.worldTime();k.n=-Infinity;l.x=to.x+T.long*1.6;const c1=t.TravelStyle.column(l);k.at=-Infinity;k.n=-Infinity;const c2=t.TravelStyle.column(l);
  ok(c1===c0&&(c2!==c0||t.TravelStyle.enemyLand(l)),'and a lord far from you, not marched man by man, holds his formation '+T.hold+' s of the world\'s time before he switches (column '+c0+', still '+c1+' within it, '+c2+' after)')}
 // ---- a host's column: a place behind one that lags moves back smoothly, not all at once
 {const Ls=W.lords.filter(x=>!x.dead).slice(0,3),[L,a,b]=Ls;for(const x of Ls)Object.assign(x,{inside:null,fight:null,follow:null,with:null});
  L.x=3000;L.y=3000;t.Host.trails.delete(L);const H=new t.Host(L,[a,b]);for(let i=0;i<40;i++){L.x+=6;H.mark()}
  const pl=()=>H.places(),p0=pl(),need=t.hostRing(L)+t.hostRing(a)+t.HOSTS.gap,run=[];for(let s=0;s<=10;s++){const q=p0.get(a);a.x=q.x-(s*.4);a.y=q.y;run.push(pl().get(b).x)}
  let jump=0;for(let i=1;i<run.length;i++)jump=Math.max(jump,Math.abs(run[i]-run[i-1]));ok(jump<1,'the one ahead lagging 0 to 4 px past its place (lagTol '+t.HOSTS.lagTol+'), the place behind moves at most '+jump.toFixed(2)+' px a step (it jumped '+Math.round(need)+' px before)')}
});
