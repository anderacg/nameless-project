'use strict';
/* ---------- the road's encounters: who you meet travelling and what happens (doc/ENCOUNTERS_DESIGN.md). Each kind is an Encounter
   kind (story/kinds.js defineKinds; the shape: story/encounter.js Encounter), plain data with hooks, a class of its own only
   where it has behaviour (Shepherd, Stray): its text, choices and outcomes, its looks, and the helpers it alone uses. A new
   encounter is one entry here (its numbers: data/encounters.js); when and where one comes, how it moves and ends, its page and
   the save are the road's (world/road.js); its figures are drawn by gfx/encounterscene.js ---------- */
const diceLeft=e=>ENC_GAMBLE.hands-(e.hands||0);
/* ---------- your stats on the road (their numbers: data/encounters.js ENC_STAT) (owner, 2026-10-19: stats only add to what anyone gets, up to a cap; a stat of 0 is today's
   odds or outcome, never worse). ENC_STAT, each check: {base (what anyone gets), parts: [[stat, per]…] (a stat: a discipline,
   P.sk, or an attribute, str, agi, int, cha; a list of them: the highest counts), cap}. statOdds(k): base + Σ stat × per, at
   most cap. A chance (horse: Catch it; dice: a hand won; mine: the tunnels hold, mineGear: gear deep inside; wisps: the
   treasure) or a share added on top (care: how well you tend the wounded traveller, 0–1, kept on him as e.care; push: of the
   stamina and time a cart takes, taken off; hunt, respect: × (1 + it) the haul, or the honour, reputation and morale given).
   statRead: a chance's Insight read (vague, rough or exact by Scouting); statHelps: the stats that help, by name; statParts:
   each stat's worth, for the wiki ---------- */
const statOf=s=>Array.isArray(s)?Math.max(...s.map(statOf)):Math.max(0,s in P.attr?P.attr[s]:skill(s));
const statOdds=k=>{const S=ENC_STAT[k];return Math.min(S.cap,S.parts.reduce((a,[s,p])=>a+p*statOf(s),S.base))};
const statMore=(k,v)=>Math.round(v*(1+statOdds(k)));// (a share's worth on top of v)
const statName=s=>Array.isArray(s)?s.map(statName).join(' or '):ATTRS[s]?ATTRS[s][0]:SKILLS[s].n;
function statHelps(k){const n=ENC_STAT[k].parts.map(([s])=>statName(s));return(n.length>1?n.slice(0,-1).join(', ')+' and '+n[n.length-1]+' help':n[0]+(Array.isArray(ENC_STAT[k].parts[0][0])?' (the higher) helps':' helps'))}
const statParts=k=>ENC_STAT[k].parts.map(([s,p])=>'+'+Math.round(p*1000)/10+'% '+(Array.isArray(s)||ATTRS[s]?'a point of ':'a level of ')+statName(s)).join(', ');
// (o: vague, what (the words after a rough or exact chance), rough(p) and exact(p) (words of their own), more (its tooltip))
function statRead(k,o){const p=statOdds(k);return insight([o.vague,o.rough?o.rough(p):oddsWord(p)+' '+o.what,o.exact?o.exact(p):Math.round(p*100)+'% '+o.what],o.more||'know your odds')}
// the people in them (folk of the nearest holding's race, v a variant): today's map figures in small variants
const ENC_LOOK={traveller:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'bare',outer:'blue',team:'linen'}),healed:(r,v)=>({...ENC_LOOK.traveller(r,v),helm:'bandage'}),
  peddler:(r,v)=>({...folkLook('merchant',r,v),load:'pack',weapon:'crook'}),pilgrim:(r,v)=>({...folkLook('priest',r,v),weapon:v%2?'crook':null}),
  hunter:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'hood',hood:'forest',outer:'leather',team:'forest',weapon:v%2?'bow':'spear'}),
  child:(r,v)=>({...folkLook('folk',r,v),robe:false,short:true,beard:null,helm:'bare',weapon:null}),
  bard:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'hood',hood:'violet',outer:'red',team:'gold',cape:'violet',weapon:'lute'}),
  thief:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'hood',hood:'dark',outer:'dark',team:'leather',weapon:'dagger'}),
  victim:(r,v)=>({...folkLook('merchant',r,v),weapon:null}),
  mourner:(r,v)=>({...folkLook('folk',r,v),robe:v%2===0,helm:'hood',hood:'dark',outer:'dark',team:'dark',weapon:null}),
  shroud:(r,v)=>({...folkLook('folk',r,v),robe:true,helm:'hood',hood:'linen',outer:'linen',team:'linen',inner:'linen',beard:null,weapon:null}),
  villager:(r,v)=>({...folkLook('folk',r,v),helm:'bare',weapon:null}),
  beggar:(r,v)=>({...folkLook('folk',r,v),robe:false,hair:'grey',beard:'grey',helm:'hood',hood:'leather',outer:'linen',team:'dark',cape:'leather',weapon:'crook'}),
  messenger:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'cap',outer:'leather',team:'white',weapon:null})};
// (Tend his wounds' tooltip, the real wounded traveller's and the lure's: roadTend)
const ROAD_TEND_TIP='Bandage him and share your food. Medicine and Intellect: the better he mends, the more he owes you.';
const roadCol=e=>e.fac&&FACS[e.fac]?FACS[e.fac].col:'#8a7458',roadPrice=e=>Math.round(ITEMS[e.item].v*.7);
// a fight on the road, as today's events made them: the raiders on a caravan, or an ambush's band (amb: its own band by the land,
// its fighters mustered here; or the lure's, mustered when it came: e.band, e.foes); edge (as amb unless given): you in their
// trap, the ambush's battle; false: you came ready for them
const roadBand=(x,y)=>{const c=climAt(x,y);return c==='desert'?'raiders':c==='swamp'?'bog':'bandits'};
const roadBandN=()=>roadRng().int(5,7)+Math.floor(G.day/15);
function roadFight(e,amb,edge=amb){e.done=1;e.gone=1;G.road=null;const k=amb?e.band||roadBand(P.x,P.y):'bandits',n=e.foes?e.foes.length:amb?roadBandN():e.n,b=asParty({x:P.x,y:P.y,cool:0,n,kind:k,...(e.foes?{troops:e.foes.slice()}:{})});
  startEncounter({kind:'party',ref:b,n,list:b.troops.slice(),band:k,...(edge?{btype:{kind:'ambush',hid:1}}:{})})}
/* the kinds: Encounter kinds (story/kinds.js defineKinds; their trigger 'travelHour', the pity timer's: ROAD_ENC is their view;
   a kind of its own class, cls: the shepherd). n, ico (its page's icon), w (weight; wf: × by your band), ok() (can it come here and now: today's event's rule), on
   (its ground: ENC_ON), beh, call (its call-out), hear (the log line when it is first heard: {d} its way; none: seen only), tip,
   trace (left when its time is up unresolved: ROAD_TRACE), setup(e) (its own state, made when it comes), scene(e) (its pieces:
   EncounterScene), text(e), facts(e) (what you can tell: Insight), left(e) (the log line when you leave it be), acts (its
   choices: Choices, story/choice.js: {icon, label, need(e) (why not), ask(e) (asks first: what cannot be undone), again
   (it stays open), out(e) (its outcome, story/outcome.js: what it does, declared; its facts are written from it, also(e) adding
   the lines no outcome can say: a trap, a stat that helps) or run(e, choice) (a hook: a roll, a chase, its own state; it returns
   an outcome, or the result's line; facts(e), its words by hand), odds (an ENC_STAT check), when(e) (offered only then)}), hidden
   (seen only by Scouting INSIGHT.rough+), spring (springs as
   you pass), forced (no Leave until chosen; or forced(e)), vanish (gone once dealt with), glow (lights: seen from farther), foe;
   wn (its name in the wiki, when its page's is another's: the lure), after(e) (the log line when it leaves, seen and unmet),
   heard(e) (what follows when it is first heard or seen), under(e) (pictures under its own on its page's banner: a place it is at);
   and leave (its Leave's word), life (its time by another behaviour's: ENC_LIFE), near (px past your sight it comes, if not ENC_SPAWN's), spd (ENC_SPD: how fast it comes), far (a
   click on it opens its page at once: one you cannot walk up to), wary() (× your sight: he flees if he sees you there before you see him), stop (flees
   a little way, then stops), spook (× your sight: it runs as you come), lost (the log line when one you chase gets away), they (what it does, in the wiki's words);
   ends (how it ends when its time is up in your sight, if not its behaviour's: story/happening.js Behaviours), goes(piece) (which of its pieces go
   when it walks off, if not its people) */
/* the road's talkers and their news (news.js): the peddler, the bard and the pilgrims tell a rumour of the roads near where you
   meet them (Ask for news, once), the refugees why they fled (a raid or a siege at their home, when there was one), the
   messenger his news (Read the news: roadNews, and a rumour of the road). One a meeting: its key, the meeting's own (e.i) */
const roadRumour=(e,kind)=>rumourFrom(rumourSource(kind||'road',e.i,e)).today[0]||null;
const ROAD_ASK=new Choice({icon:'scroll',label:'Ask for news',again:true,facts:()=>['a rumour of the roads near here'],need:e=>e.asked&&'You have heard their news.',tip:'Ask what they have heard on the road.',
  run:e=>{e.asked=1;const it=roadRumour(e);return it?'“'+rumourText(it)+'”':'They have heard nothing worth the telling.'}});
const ROAD_FLED=new Choice({icon:'scroll',label:'Ask why they fled',again:true,facts:()=>['what drove them from home'],need:e=>e.asked&&'They have told you their story.',tip:'Ask what drove them onto the road.',
  run:e=>{e.asked=1;const it=roadRumour(e,'refugees'),why=it&&['raid','siege','fell'].includes(it.k);return !it?'They only shake their heads: hard times, nothing more.':why?'They fled '+((it.detail&&it.detail.town)||it.near)+': “'+rumourText(it)+'”':'They will not say why they left, but they tell you: “'+rumourText(it)+'”'}});
/* strayed sheep (ENC_SHEEP): the one kind with behaviour of its own, so it has its classes (story/kinds.js cls). The shepherd
   scatters his strays when he comes (fewer than two on open ground you can reach: no such shepherd here), counts them home and
   thanks you once for what came back; a stray grazes (Behaviours.graze), and once he has your help, ride into it (within
   catchReach) and it is back with the flock */
class Shepherd extends Encounter{
  setup(){
    const S=ENC_SHEEP,R=roadSt(),r=roadRng(),n=r.int(S.n[0],S.n[1]),at=[];
    for(let k=0;k<60&&at.length<n;k++){
      const a=r.next()*6.2832,d=S.r[0]+r.next()*(S.r[1]-S.r[0]),x=this.x+Math.cos(a)*d,y=this.y+Math.sin(a)*d,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
      if(tx<2||ty<2||tx>=MW-2||ty>=MH-2||!passable(tAt(tx,ty))||occAt(tx,ty)||!Router.reach(P,{x,y})||at.some(([u,v])=>Math.hypot(u-x,v-y)<14))continue;
      at.push([x,y]);
    }
    if(at.length<2)return false;
    this.n=at.length;
    this.got=0;
    for(const [x,y] of at)R.on.push(asRoadEnc({rd:1,i:++R.id,k:'stray',pk:this.i,x,y,dir:x<this.x?-1:1,beh:'graze',race:this.race,t0:this.t0,end:this.end,d0:Math.hypot(x-P.x,y-P.y),seed:r.int(1,9999),seen:0,met:0,done:0}));
  }
  // his wool or his cheese (for each sheep back); his strays still out, and how many, in words
  good(){
    return this.seed%2?'wool':'cheese';
  }
  strays(){
    return roadList().filter(o=>o.pk===this.i&&!o.gone&&!o.caught);
  }
  astray(){
    const n=this.strays().length;
    return n===1?'One':n?String(n):'None';
  }
  // a stray driven home: back with the flock (it leaves the map; he counts it)
  herd(o){
    o.caught=1;
    this.got=(this.got||0)+1;
    train('athl',2);
    this.say('You drive a stray back to the shepherd ('+this.got+' of '+this.n+').');
    sfx('notify');
    o.over();
  }
  // every stray back or gone: he is done, and on his way with his flock
  check(){
    if(!this.help||this.ended||this.strays().length)return;
    this.done=1;
    this.goOff();
  }
  // his thanks, once, for what came back (he ends, or walks off): reputation and his wool or cheese a sheep, more for all
  ending(){
    if(this.ended)return;
    this.ended=1;
    const n=this.got||0;
    if(!this.help||!n)return;
    const S=ENC_SHEEP,all=n>=this.n,t=nearHold(),g=this.good(),k=invAdd('good',g,S.good*n);
    if(t)addRep(t.name,S.rep*n+(all?S.all.rep:0),true);
    if(all)P.morale=clamp(P.morale+S.all.morale,0,100);
    updateHUD(true);
    this.say((all?'Every sheep home. ':n+' of his '+this.n+' sheep home. ')+'The shepherd thanks you'+(k?' with '+k+' '+GOODS[g].n.toLowerCase():'')+(t?'; '+t.name+' will hear of it':'')+'.','good');
  }
}
class Stray extends Encounter{
  shepherd(){
    return roadList().find(h=>h.i===this.pk&&!h.gone)||null;
  }
  meet(){
    if(!this.chaseable())return;
    const h=this.shepherd();
    if(h&&h.help&&!h.ended)h.herd(this);
    else this.say('A stray sheep. Its shepherd must be near.');
  }
  ending(){
    const h=this.shepherd();
    if(h)h.check();
  }
  // (sent home: ridden into while its shepherd has your help)
  herded(m){
    const h=this.shepherd();
    if(h&&h.help&&!h.ended&&m.dist<=catchReach()&&!G.modal){
      h.herd(this);
      return true;
    }
    return false;
  }
}
defineKinds('encounter',{trigger:'travelHour'},{
  traveller:{n:'Wounded traveller',ico:'wounded',w:2,ok:()=>true,on:'road',beh:'stay',ends:'die',call:'Help! Over here!',hear:'Someone calls out from the road to the {d}.',trace:'body',tip:'Lying by the road',
    scene:e=>e.healed?[['walk','healed',0,0]]:[['down','traveller',0,0,{blood:1}]],// (tended: up on his feet, bandaged, and on his way)
    text:()=>'A wounded traveller lies by the road, robbed and left for dead. He clutches a purse the bandits missed.',
    facts:e=>[insight(['badly hurt','he will not last the day without help','he has about '+Math.max(1,Math.round(e.end-roadNow()))+' hours left'],'know how long he has'),'a purse: about 20 gold'],
    left:()=>'You leave him to his fate.',
    acts:[{icon:'food',label:'Tend his wounds',facts:()=>roadTendFacts(),need:()=>foodN()<ENC_TUNE.traveller.food&&'You have no food to spare.',tip:ROAD_TEND_TIP,
        run:e=>roadTend(e)},
      {icon:'gold',label:'Take his purse',ask:()=>'Take the last coins of a dying man? Your band will see it, and word gets round.',
        out:()=>{const t=nearHold(),f=t&&FACS[t.owner]&&t.owner;return{gold:20,honor:[f,-5],morale:-3,say:'You take 20 gold. Some of your band look away.'+(f?' Word reaches the '+FACS[f].n+'.':'')}}}]},
  /* the fake wounded (phase 4): the wounded traveller to the eye (his name, picture, call, page and choices), bandits lying in the
     woods by the road, a band the size of an ambush's (mustered when he comes: band, foes). Scouting warn sees the brush move,
     count how many and the odds; below it, his page is the real one's, and helping him (or robbing him) springs the ambush. Warned:
     come ready (no ambush edge), or call them out (they show themselves: fight, or leave; a small band may run). Left be, the
     bandits move on (after: the word on the road) */
  lure:{n:'Wounded traveller',wn:'Fake wounded (a lure)',ico:'wounded',w:1,wf:()=>roadLureW(),ok:(c=storyCtx())=>c.troops>=3,on:'lure',beh:'stay',ends:'unseen',call:'Help! Over here!',hear:'Someone calls out from the road to the {d}.',tip:'Lying by the road',they:'stay; bandits lie hidden near',
    setup:e=>{e.band=roadBand(e.x,e.y);e.foes=Rng.use('road',()=>makeEnemies(roadBandN(),false,e.band))},
    scene:e=>e.out?[['stand','traveller',0,0],['soldier','',-9,-3,{band:1,col:ENC_RAIDER,v:1}],['soldier','',9,-4,{band:1,col:ENC_RAIDER,v:3,face:-1}],['soldier','',14,1,{band:1,col:ENC_RAIDER,v:5,face:-1}]]:[['down','traveller',0,0,{blood:1}]],
    text:e=>e.out?'The “wounded man” gets up, grinning. '+e.foes.length+' bandits rise from the brush behind him, weapons out.':ROAD_ENC.traveller.text(e),
    facts:e=>e.out?[e.foes.length+' bandits',roadLureOdds(e)]:[...ROAD_ENC.traveller.facts(e),roadWarned()&&'<span class="bad">something moves in the brush behind him</span>',skill('scout')>=ENC_TUNE.lure.count&&'<span class="bad">'+e.foes.length+' bandits lie in wait: '+roadLureOdds(e)+'</span>'],
    left:e=>e.out?'You ride on. The bandits watch you go.':'You leave him to his fate.',after:()=>'Word on the road: a “wounded man” lay by the road as bait for bandits.',
    acts:[{icon:'food',label:'Tend his wounds',when:e=>!roadWarned(),facts:()=>roadTendFacts(),need:()=>foodN()<ENC_TUNE.traveller.food&&'You have no food to spare.',tip:ROAD_TEND_TIP,run:e=>roadSpring(e)},
      {icon:'gold',label:'Take his purse',when:e=>!roadWarned(),facts:e=>ROAD_ENC.traveller.acts[1].factsFor(e),ask:()=>'Take the last coins of a dying man? Your band will see it, and word gets round.',run:e=>roadSpring(e)},
      {icon:'sword',label:'Approach ready',when:e=>roadWarned()&&!e.out,also:e=>['no ambush: they lose their edge',skill('scout')>=ENC_TUNE.lure.count&&e.foes.length+' bandits'],tip:'Walk up to him with your band closed up and weapons drawn.',
        out:()=>({fight:{amb:true,edge:false},say:'Your band closes up, weapons drawn. The bandits break cover too late.'})},
      {icon:'eye',label:'Call them out',when:e=>roadWarned()&&!e.out,again:true,facts:e=>[e.foes.length<=ENC_TUNE.lure.scare.max?insight(['they may run',oddsWord(roadScare())+' they run','a '+Math.round(roadScare()*100)+'% chance they run'],'know if they run'):'too many to scare off','then fight, or leave'],tip:'Shout to the brush that you see them. Leadership and Charisma may scare a small band off.',
        run:e=>{e.out=1;if(e.foes.length<=ENC_TUNE.lure.scare.max&&roadRng().chance(roadScare()))return{end:true,gone:true,say:'You call them out. Seeing your band ready, they melt back into the woods, their “wounded man” limping after them.'};
          return'You call them out. '+e.foes.length+' bandits rise from the brush, weapons out.'}},
      {icon:'sword',label:'Fight them',when:e=>!!e.out,also:e=>[e.foes.length+' bandits',roadLureOdds(e)],out:()=>({fight:{amb:true,edge:false},say:'You ride at them.'})}]},
  merchant:{n:'Wandering merchant',ico:'stall',w:2,ok:()=>true,on:'road',beh:'approach',call:'Wares! Fine wares!',hear:'A peddler hails you from the road to the {d}.',tip:'A peddler with his pack',
    setup:e=>{e.item=Rng.use('road',()=>randomGear(0,Math.min(MATERIALS.length-1,1+Math.floor(G.day/15))))},
    scene:()=>[['walk','peddler',0,0]],
    text:e=>{const I=ITEMS[e.item];return 'A travelling peddler opens his pack: a <span style="color:'+RARITY[I.r]+'">'+I.n+'</span> ('+I.d+') for '+roadPrice(e)+' gold.'},
    left:()=>'The peddler shrugs and moves on.',
    acts:[{icon:'gold',label:'Buy it',need:e=>P.gold<roadPrice(e)?'Not enough gold.':!invFree()&&'Your bag is full.',
      out:e=>({gold:-roadPrice(e),gear:e.item,say:'The '+ITEMS[e.item].n+' goes in your bag.'})},ROAD_ASK]},
  // (pilgrims: on the road to the nearest real shrine on the map, or, one near you, already praying at it beside its own picture:
  // roadPilgrims; they draw no shrine of their own)
  pilgrims:{n:'Pilgrims',ico:'altar',w:2,ok:(c=storyCtx())=>c.climate!=='desert'&&roadShrines().length>0,on:'road',beh:'walk',hear:'Pilgrims’ singing drifts from the {d}.',tip:'Pilgrims bound for a shrine',they:'walk to a shrine, or pray at one',
    setup:e=>roadPilgrims(e),heard:e=>{const s=e.pray&&roadShrineOf(e);if(s)s.seen=true},under:e=>{const s=e.pray&&roadShrineOf(e);return s?s.view().ps:[]},
    scene:e=>(e.pray?[['kneel','pilgrim',-10,-3,{v:1}],['kneel','pilgrim',10,-2,{v:2,face:-1}],['stand','pilgrim',-4,2,{v:3}],['stand','pilgrim',5,3,{v:4,face:-1}]]
      :[['walk','pilgrim',0,0,{v:1}],['walk','pilgrim',-8,1,{v:2}],['walk','pilgrim',-15,-1,{v:3}],['walk','pilgrim',-22,1,{v:4}]]).slice(0,e.n),
    text:e=>roadPraying(e)?'Pilgrims'+(e.to?' from '+e.to:'')+' kneel at the '+e.site+', singing low. Offerings of coin lie in a bowl before its altar.'
      :'Pilgrims'+(e.to?' from '+e.to:'')+(e.left?' walk on from the '+e.site+', their prayers said, singing, a bowl of offerings carried before them.':' walk the road to the '+e.site+', singing, a bowl of offerings carried before them.'),
    facts:e=>[e.n+' pilgrims',e.to&&'they will speak of you in '+e.to],
    left:e=>roadPraying(e)?'You leave them to their prayers.':'They walk on, singing.',
    acts:[{icon:'morale',label:'Pray with them',when:e=>roadPraying(e),out:e=>roadPray(e)},
      {icon:'morale',label:'Walk and pray with them',when:e=>!roadPraying(e),facts:e=>Outcome.facts({hours:ENC_TUNE.pilgrims.walk,...roadPray(e)}),run:e=>{roadHours(ENC_TUNE.pilgrims.walk);return roadPray(e)}},
      {icon:'gold',label:'Give alms',need:()=>P.gold<ENC_TUNE.pilgrims.alms&&'Not enough gold.',
        out:()=>{const x=ENC_TUNE.pilgrims;return{gold:-x.alms,morale:x.almsMorale,xp:x.xp,say:'You feel watched over. (+'+x.xp+' XP)'}}},
      {icon:'sack',label:'Take the coins',ask:()=>'Take the offerings from the pilgrims’ bowl? Nobody will sleep well.',
        out:()=>{const x=ENC_TUNE.pilgrims;return{gold:x.coins,morale:-x.coinsMorale,say:x.coins+' gold richer. Nobody sleeps well that night.'}}},ROAD_ASK]},
  deserters:{n:'Deserters',ico:'troops',w:1.2,ok:(c=storyCtx())=>c.size<c.cap,on:'wild',beh:'stay',tip:'Soldiers with no banner',
    setup:e=>{const t=Spatial.nearestHolding(P.x,P.y);e.race=t.races[0];e.unit=RACES[e.race].melee;e.fac=t.owner&&FACS[t.owner]?t.owner:null;if(e.fac&&P.fac===e.fac)e.beh='flee'},
    scene:e=>[['soldier','',-4,0,{col:roadCol(e),v:1}],['soldier','',5,2,{col:roadCol(e),v:4,face:-1}]],
    text:e=>'Two '+ST[e.unit].n.toLowerCase()+'s who fled their lord ask to join your band for food and 15 gold.',
    facts:e=>[e.fac&&'deserters from the '+FACS[e.fac].n,insight(['soldiers, by their gear','two '+ST[e.unit].n.toLowerCase()+'s, worn but armed','2 × '+ST[e.unit].n+', tier '+ST[e.unit].tier],'know what they are')],
    left:()=>'They vanish into the trees.',
    acts:[{icon:'troops',label:'Take them in',need:e=>P.gold<15?'Not enough gold.':partySize()+2>partyCap()?'No room in your party.':!partyRoster(P).canAdd(e.unit)&&'No free army group.',
        out:e=>({gold:-15,troops:{[e.unit]:2},say:'Two new '+ST[e.unit].n.toLowerCase()+'s fall in line.'})},
      {icon:'prisoners',label:'Turn them in',need:e=>!e.fac&&'They serve no realm.',ask:e=>'Hand them to the '+FACS[e.fac].n+'’s men? Deserters hang.',
        out:e=>({honor:[e.fac,3],gold:10,say:()=>'You hand them over to the '+FACS[e.fac].n+'. The bounty is 10 gold.'})}]},
  gamblers:{n:'Gamblers',ico:'mug',w:1.2,ok:(c=storyCtx())=>c.gold>=20,on:'road',beh:'stay',hear:'Laughter and the rattle of dice to the {d}.',tip:'Soldiers at dice',
    setup:e=>{const t=Spatial.nearestHolding(P.x,P.y);e.race=t.races[0];e.fac=t.owner&&FACS[t.owner]?t.owner:null},
    scene:e=>[['cloth','',0,1],['soldier','',-6,0,{col:roadCol(e),v:0}],['soldier','',6,0,{col:roadCol(e),v:2,face:-1}],['soldier','',1,-4,{col:roadCol(e),v:5}],['fire','',-13,-2]],
    text:()=>'Off-duty soldiers wave you over to a game of bones. Pick your stake.',
    facts:e=>[statRead('dice',{vague:'they seem to win a fair share',rough:p=>p<.5?'the dice favour them a little':'you can read their game',what:'to win a hand',more:'know the odds'}),statHelps('dice'),diceLeft(e)+(diceLeft(e)===1?' hand':' hands')+' left in them'],
    left:()=>'You leave them to it.',
    acts:[10,20,50].map(s=>({icon:'gold',label:'Play for '+s,facts:()=>[s+' gold a hand'],again:true,odds:'dice',need:()=>P.gold<s&&'Not enough gold.',
      run:(e,c)=>{const w=c.roll(),o={gold:w?s:-s};e.hands=(e.hands||0)+1;e.net=(e.net||0)+(w?s:-s);const m=w?'You win '+s+' gold. They grumble.':'You lose '+s+' gold. They laugh.';
        if(e.net>=ENC_GAMBLE.quit)return{...o,end:true,say:m+' "Enough! You have had enough of our coin." They sweep up the bones.'};
        if(diceLeft(e)<=0)return{...o,end:true,say:m+' "That is the last hand," they say, and pack up the bones.'};return{...o,say:m}}}))},
  mine:{n:'Collapsed mine',ico:'pick',w:2,ok:(c=storyCtx())=>c.terrain===T_HILL||c.byMountains,on:'hill',beh:'stay',ends:'unseen',tip:'An old shaft in the hillside',
    scene:()=>[['bld','minehead',0,2]],
    text:()=>'A collapsed mine shaft opens into the hillside. Old carts still sit inside.',
    facts:()=>[statRead('mine',{vague:'the timbers creak',rough:p=>p<.75?'the tunnels look unsafe, though more hold than fall':'you can tell which tunnels will hold',exact:p=>Math.round(p*100)+'% the tunnels hold: iron inside, and a '+Math.round(statOdds('mineGear')*100)+'% chance of gear',more:'know the risk'}),statHelps('mine')],
    left:()=>'You mark it on your map and move on.',
    acts:[{icon:'pick',label:'Search it',facts:()=>['iron, maybe gear','a cave-in may cost you'],odds:'mine',tip:'Go in with lamps and see what is left.',
      // (both rolls first, then the haul: the iron into your bag before the gear, as ever)
      run:(e,c)=>{if(c.roll()){const id=roadRng().chance(statOdds('mineGear'))?Rng.use('road',()=>randomGear(1,3)):null;
          return{goods:{iron:5},...(id?{gear:id}:{}),say:r=>'The tunnels hold. You haul out '+r.goods.iron+' iron.'+(r.gear?' Deep inside lies a '+ITEMS[id].n+'.':'')}}
        const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);if(ks.length){const k=ks[roadRng().int(0,ks.length-1)];return{lose:k,say:'A tunnel caves in. You lose '+an(ST[k].n.toLowerCase())+'.'}}return{morale:-8,say:'A tunnel caves in. You barely crawl out.'}}}]},
  hunters:{n:'Hunters’ camp',ico:'fire',w:2,ok:(c=storyCtx())=>c.terrain===T_FOREST||c.climate==='frost',on:'wood',beh:'stay',hear:'Smoke rises from a hunters’ fire to the {d}.',tip:'Hunters drying pelts by a fire',
    scene:()=>[['bld','tent',-12,1],['prop','woodpile',13,0],['fire','',2,2],['stand','hunter',-3,5,{v:1}],['stand','hunter',8,5,{v:2,face:-1}]],
    text:()=>'A camp of hunters drying pelts by the fire.',
    left:()=>'You nod and ride past.',
    acts:[{icon:'furs',label:'Buy 3 furs',need:()=>P.gold<15?'Not enough gold.':goodRoom('furs')<3&&'No room in your bag.',out:()=>({gold:-15,goods:{furs:3},say:'Three warm furs for the road.'})},
      {icon:'eye',label:'Join the hunt',also:()=>[statHelps('hunt')],tip:'Ride with them after deer. Survival, Hunting and Archery bring home more.',
        out:()=>{const x=ENC_TUNE.hunters,h=roadHaul();return{xp:x.xp,train:['scout',8],goods:h.furs?{meat:h.meat,furs:h.furs}:{meat:h.meat},say:r=>'A good chase. (+'+x.xp+' XP, '+r.goods.meat+' meat'+(r.goods.furs?', '+r.goods.furs+' furs':'')+')'}}}]},
  child:{n:'Lost child',ico:'people',w:1,ok:(c=storyCtx())=>!!c.nearHold,on:'road',beh:'approach',call:'Please, help me!',hear:'A child is crying on the road to the {d}.',tip:'A child alone',
    setup:e=>{const t=nearHold();e.to=t.name;e.race=t.races[0]},
    scene:()=>[['walk','child',0,0]],
    text:e=>'A lost child sits crying by the road. She says she lives in '+e.to+'.',
    left:()=>'She trudges off toward home.',
    acts:[{icon:'house',label:'Take her home',out:e=>{const t=townBy(e.to);return{rep:[t&&t.name,6],morale:5,say:'Her family in '+e.to+' will not forget you.'}}}]},
  bard:{n:'Wandering bard',ico:'renown',w:1.2,wf:()=>1+Math.min(1,P.renown/60),ok:()=>true,on:'road',beh:'approach',call:'A song for a hero?',hear:'A lute plays on the road to the {d}.',tip:'A bard with a lute',
    scene:()=>[['walk','bard',0,0]],
    text:()=>'A wandering bard offers to make a song of your deeds.',
    left:()=>'He sings something rude as he leaves.',
    acts:[{icon:'renown',label:'Hear his song',need:()=>P.gold<10&&'Not enough gold.',out:()=>({gold:-10,morale:8,renown:2,say:'The song spreads from tavern to tavern. (+2 renown)'})},ROAD_ASK]},
  wisps:{n:'Will-o’-wisps',ico:'moon',w:3,ok:(c=storyCtx())=>c.climate==='swamp'&&c.dark>0,on:'bog',beh:'flee',glow:true,vanish:true,hear:'Pale lights flicker over the bog to the {d}.',tip:'Pale lights over the bog',
    scene:()=>[['wisp','',0,0,{v:0}],['wisp','',-9,-3,{v:1}],['wisp','',8,-6,{v:2}]],
    text:()=>'Pale lights dance over the bog, drifting deeper into the mire.',
    facts:()=>[statRead('wisps',{vague:'who knows where they lead',rough:p=>p<.6?'half the tales end in treasure':'you know the old tales: most end in treasure',exact:p=>Math.round(p*100)+'%: 40 gold, or a night lost',more:'know the tales'}),statHelps('wisps')],
    left:()=>'The lights fade behind you.',
    acts:[{icon:'moon',label:'Follow them',facts:()=>['treasure, or a night lost'],odds:'wisps',run:(e,c)=>c.roll()?{gold:40,say:'They lead to a drowned chest with 40 gold.'}:{morale:-6,say:'They lead you in circles until dawn.'}}]},
  caravan:{n:'Caravan under attack',ico:'sword',w:1.2,ok:(c=storyCtx())=>c.troops>=3,on:'road',beh:'scene',goes:p=>!!(p[4]&&p[4].band),call:'Raiders! Help us!',hear:'Shouts and the clash of steel on the road to the {d}.',trace:'wreck',foe:true,tip:'Raiders falling on a caravan',
    setup:e=>{e.n=roadRng().int(4,6)+Math.floor(G.day/15);const t=Spatial.nearestHolding(P.x,P.y);e.fac=t.owner&&FACS[t.owner]?t.owner:null},
    scene:e=>[['cart','',0,0,{col:roadCol(e)}],['soldier','',18,2,{col:roadCol(e),v:2}],['soldier','',20,-3,{col:roadCol(e),v:4}],['dust','',25,0],['soldier','',29,1,{band:1,col:ENC_RAIDER,v:1,face:-1}],['soldier','',32,-3,{band:1,col:ENC_RAIDER,v:4,face:-1}],['soldier','',30,5,{band:1,col:ENC_RAIDER,v:5,face:-1}]],
    text:()=>'A merchant caravan is under attack by raiders just ahead.',
    facts:e=>[insight(['raiders','about '+roughly(e.n)+' raiders',e.n+' raiders'],'know how many'),'it will not hold out long'],
    left:()=>'You wait until the screams stop.',
    acts:[{icon:'sword',label:'Join the fight',also:e=>[insight(['raiders','about '+roughly(e.n),e.n+' raiders'],'know how many')],out:()=>({fight:true,say:'You draw steel and ride at the raiders.'})}]},
  ambush:{n:'Ambush',ico:'sword',w:1.5,ok:(c=storyCtx())=>TERRAIN.on&&c.troops>=3&&!!c.cover,on:'cover',beh:'stay',ends:'unseen',hidden:true,spring:true,forced:true,vanish:true,foe:true,call:'Movement in the trees…',hear:null,tip:'Movement in the trees',
    scene:()=>[['soldier','',-4,0,{band:1,col:ENC_RAIDER,v:1,a:.7}],['soldier','',5,-2,{band:1,col:ENC_RAIDER,v:3,face:-1,a:.7}]],
    text:e=>'The road runs on between '+COVER_SAY[coverAt(e.x,e.y)||'field']+'. No birdsong. Too late, your outriders see the glint of steel beside the road: an ambush.',
    acts:[{icon:'sword',label:'Close up and fight',also:()=>['caught in their trap'],out:()=>({fight:{amb:true},say:'Your band closes up on the road, weapons drawn.'})},
      {icon:'exit',label:'Cut the baggage loose and run',out:()=>({food:-4,gold:{n:-15,min:0},morale:-4,say:'You leave the baggage to them and ride hard. They are too busy looting to follow.'})}]},
  refugees:{n:'Refugees',ico:'people',w:2,ok:()=>true,on:'road',beh:'approach',call:'Spare some bread, friend?',hear:'A family with a cart hails you from the road to the {d}.',tip:'A family with a cart',
    scene:()=>[['cart','',0,0,{col:'#9a8a6a'}],['refugee','',-19,1,{v:0}],['refugee','',-24,-2,{v:1}],['walk','child',-14,3,{v:2}]],
    text:()=>'Refugee farmers on the road with all they own on a cart, a child at their heels.',
    left:()=>'They trudge on.',
    acts:[{icon:'troops',label:'Escort them',also:()=>['safe passage'],out:()=>({goods:{grain:4},renown:1,say:r=>'Refugee farmers thank you for safe passage and leave you '+r.goods.grain+' grain.'})},
      {icon:'food',label:'Give food',need:()=>foodN()<3&&'You have no food to spare.',out:()=>({food:-3,renown:1,morale:3,mood:'kind',say:'They eat their first warm meal in days and bless your name.'})},ROAD_FLED]},
  warning:{n:'Shepherd’s warning',ico:'sheep',w:1,ok:()=>true,on:'open',beh:'approach',call:'Raiders about!',hear:'A shepherd waves to you from the {d}.',tip:'A shepherd and his flock',
    scene:()=>[['worker','herder',0,0],['beast','sheep',-8,1,{v:0}],['beast','sheep',-13,-2,{v:3}],['beast','sheep',-6,-3,{v:5}]],
    text:()=>'A shepherd leaves his flock and hurries over, waving his crook.',
    left:()=>'He goes back to his sheep, shaking his head.',
    acts:[{icon:'eye',label:'Listen',out:()=>({train:['scout',6],band:true,say:r=>'He warns of raiders on the move'+(r.band?' to the '+compass(r.band.x-P.x,r.band.y-P.y):'')+'. You keep your eyes open.'})}]},
  sheep:{n:'Strayed sheep',ico:'sheep',w:1.2,ok:(c=storyCtx())=>c.isDay&&!!c.nearHold&&!['desert','swamp'].includes(c.climate),on:'open',beh:'stay',call:'My sheep! They have scattered!',
    hear:'A shepherd shouts after his flock to the {d}.',tip:'A shepherd, his flock scattered',they:'stay; his strays graze about and shy from you',
    cls:Shepherd,
    scene:e=>[['worker','herder',0,0],...ROAD_FLOCK.slice(0,e.got||0).map(([dx,dy],i)=>['beast','sheep',dx,dy,{v:i}])],
    text:e=>e.help?'The shepherd waits with '+(e.got?'the '+e.got+' you have brought back':'his crook raised')+'. '+e.astray()+' still astray.':'A shepherd runs about, crook raised: his sheep have scattered across the fields.',
    facts:e=>[e.n+' sheep astray',e.help&&(e.got||0)+' back with him','ride into each stray to drive it home','Agility lets you grab them from farther'],
    left:e=>e.help?'You leave the shepherd to his sheep.':'He goes on calling after his flock.',
    acts:[{icon:'sheep',label:'Round them up',again:true,when:e=>!e.help,facts:e=>['ride after each stray','reputation and '+GOODS[sheepGood(e)].n.toLowerCase()+' for each one back'],tip:'Ride out after them and drive them back to him.',
      run:e=>{e.help=1;e.end=Math.max(e.end,roadNow()+ENC_SHEEP.hours);for(const o of e.strays()){o.seen=1;o.end=e.end}return'You ride out after the strays. Ride into each one to send it home.'}}]},
  // ---- phase 2: the new ones (their numbers: ENC_TUNE)
  mud:{n:'Cart stuck in the mud',ico:'wheat',w:1.5,ok:(c=storyCtx())=>c.isDay&&c.climate!=='desert',on:'mud',beh:'stay',call:'Give us a push!',hear:'Someone shouts for help with a cart on the road to the {d}.',trace:'cart',tip:'A farmer and his cart, stuck fast',
    setup:e=>{const x=ENC_TUNE.mud,t=Spatial.nearestHolding(e.x,e.y);e.home=t.name;e.race=t.races[0];const r=roadRng();e.got=r.int(x.give[0],x.give[1]);e.load=r.int(x.goods[0],x.goods[1]);e.coins=r.int(x.coins[0],x.coins[1])},
    scene:()=>[['mud','',-6,0],['cart','',0,0,{col:'#9a8a6a'}],['worker','farmer',-17,1]],
    text:e=>'A farmer from '+e.home+' leans on the back of his cart, its wheels sunk to the hubs in the mud. His ox strains and gets nowhere.',
    facts:e=>['a load of grain for '+e.home],
    left:()=>'You leave him to his mud.',
    acts:[{icon:'hero',label:'Help push',also:()=>[statHelps('push')],tip:'Put your shoulder to the wheel. Strength and Athletics make it quicker work.',
        out:e=>({...(roadPush()?{sp:-roadPushSp()}:{hours:roadPushH()}),rep:[e.home,ENC_TUNE.mud.rep],goods:{grain:e.got},mood:'kind',say:r=>'The cart lurches free. The farmer thanks you'+(r.goods.grain?' with '+r.goods.grain+' grain':'')+' and will speak well of you in '+e.home+'.'})},
      {icon:'bag',label:'Rob',ask:e=>'Rob a farmer of '+e.home+' stuck in the mud? '+e.home+' will hear of it, and its workers will keep off the fields.',
        out:e=>({goods:{grain:e.load},gold:e.coins,wrong:[townBy(e.home),CONDUCT.robWorker],mood:'cruel',say:r=>'You take '+(r.goods.grain?r.goods.grain+' grain and ':'')+e.coins+' coins from his cart.'+(r.cost?' It costs you: '+r.cost+'.':'')})}]},
  thief:{n:'Thief on the run',ico:'bag',w:1.2,ok:(c=storyCtx())=>c.isDay&&!!c.nearHold,on:'road',near:[0,20],beh:'flee',life:'run',far:true,leave:'Let go',call:'Stop, thief!',hear:'Someone shouts “Stop, thief!” on the road to the {d}.',tip:'A man running off with a purse',they:'run across your view',
    setup:e=>{const x=ENC_TUNE.thief,t=nearHold()||Spatial.nearestHolding(e.x,e.y);e.home=t.name;e.race=t.races[0];e.fac=roadFac(t);e.purse=roadRng().int(x.purse[0],x.purse[1]);e.vx=e.x;e.vy=e.y;roadAcross(e)},
    scene:e=>[['walk','thief',0,0],['stand','victim',0,0,{at:[e.vx,e.vy],face:e.x>=e.vx?1:-1}]],
    text:e=>e.nab?'You run the thief down. He throws the purse at your feet: '+e.purse+' gold.':'A man sprints off with a purse in his fist. Back on the road its owner, a merchant of '+e.home+', shouts after him.',
    facts:e=>e.nab?[]:[roadChaseRead(e),'a stolen purse: about '+e.purse+' gold'],
    left:()=>'You let him run.',lost:'The thief slips away. You have lost him.',forced:e=>!!e.nab,
    acts:[{icon:'speed',label:'Chase',when:e=>!e.nab,also:()=>['Agility and Riding help'],tip:'After him, before he gets away.',out:()=>({chase:true})},
      {icon:'gold',label:'Return the purse',when:e=>!!e.nab,
        out:e=>{const x=ENC_TUNE.thief;return{gold:x.reward,rep:[e.home,x.rep],mood:'kind',say:'You hand the purse back. Its owner pays you '+x.reward+' gold and will speak well of you in '+e.home+'.'}}},
      {icon:'bag',label:'Keep it',when:e=>!!e.nab,ask:()=>'Keep the stolen purse for yourself? Its owner saw who caught the thief.',
        out:e=>({gold:e.purse,honor:[e.fac,-ENC_TUNE.thief.honor],say:'You pocket the '+e.purse+' gold and send the thief off with a kick.'+(e.fac?' Word reaches the '+FACS[e.fac].n+'.':'')})}]},
  poacher:{n:'Poacher',ico:'furs',w:1.5,ok:(c=storyCtx())=>!!c.owned&&c.climate!=='frost'&&c.by(T_FOREST,4),on:'lordwood',beh:'stay',goes:()=>true,wary:()=>{const x=ENC_TUNE.poacher;return Math.max(.4,x.see-x.scout*skill('scout'))},tip:'A hunter with a deer, in a lord’s wood',they:'stay; run if he sees you first',
    setup:e=>{const t=roadOwned(e.x,e.y)||Spatial.nearestHolding(e.x,e.y);e.home=t.name;e.race=t.races[0]},
    scene:()=>[['carcass','deer',7,1],['stand','hunter',-4,0,{v:1}]],
    text:e=>'A man in a hood kneels over a deer he has brought down in the woods of '+e.home+'. The hunting here is its lord’s alone.',
    facts:e=>['the deer is the lord of '+e.home+'’s'],
    left:()=>'He drags the deer off into the trees.',
    acts:[{icon:'prisoners',label:'Turn him in',
        out:e=>{const x=ENC_TUNE.poacher;return{rep:[e.home,x.rep],gold:x.bounty,say:'You march him to the reeve of '+e.home+', who pays a '+x.bounty+'-gold bounty.'}}},
      {icon:'food',label:'Buy the meat',need:()=>P.gold<ENC_TUNE.poacher.price?'Not enough gold.':goodRoom('meat')<1&&'No room in your bag.',
        out:()=>{const x=ENC_TUNE.poacher;return{gold:-x.price,goods:{meat:x.meat},say:r=>'He sells you '+r.goods.meat+' meat, cheap, and melts into the trees.'}}}]},
  funeral:{n:'Funeral procession',ico:'altar',w:1,ok:(c=storyCtx())=>c.isDay&&!!c.nearHold&&roadSites().length>0,on:'road',beh:'walk',hear:'A slow dirge drifts from the road to the {d}.',tip:'Mourners bearing a bier',
    setup:e=>{const x=ENC_TUNE.funeral,t=Spatial.nearestHolding(e.x,e.y),s=roadGoal(e,roadSites());if(!s)return false;e.home=t.name;e.race=t.races[0];e.fac=roadFac(t);e.n=roadRng().int(x.n[0],x.n[1]);e.gx=s.x;e.gy=s.y+10;e.site=s.name;roadWalkEnd(e)},
    scene:e=>[['walk','mourner',8,0,{v:0}],['down','shroud',0,-3,{v:5}],['walk','mourner',-8,0,{v:1}],...[[-16,-1],[-22,2],[-28,0]].slice(0,e.n-2).map(([dx,dy],i)=>['walk','mourner',dx,dy,{v:i+2}])],
    text:e=>'Mourners from '+e.home+(e.left?' walk home from the '+e.site+', their dead laid to rest.':e.pray?' stand by their dead at the '+e.site+', heads bowed.':' bear one of their dead on a bier to the '+e.site+', singing low.'),
    facts:e=>[e.n+' mourners'],
    left:()=>'They pass on, still singing.',
    acts:[{icon:'altar',label:'Pay respects',also:()=>[statHelps('respect')],
      out:e=>{const x=ENC_TUNE.funeral;return{honor:[e.fac,statMore('respect',x.honor)],morale:statMore('respect',x.morale),say:'You bare your head as the bier passes. The mourners nod their thanks.'}}}]},
  wedding:{n:'Wedding party',ico:'mug',w:1,wf:()=>P.morale<50?1.5:1,ok:(c=storyCtx())=>c.isDay&&!!c.nearHold&&TOWNS.filter(z=>Math.hypot(z.x-P.x,z.y-P.y)<ENC_WALK.far+ENC_SPAWN.near[1]).length>1,on:'road',beh:'walk',call:'Drink to the bride!',hear:'Music and laughter on the road to the {d}.',tip:'A wedding party with a lute player',
    setup:e=>{const t=Spatial.nearestHolding(e.x,e.y),to=roadGoal(e,TOWNS.filter(z=>z!==t));if(!to)return false;e.home=t.name;e.tw=to.name;e.race=t.races[0];roadWalkEnd(e)},
    scene:()=>[['notes','',12,0],['walk','bard',12,0],['walk','villager',3,-1,{v:1}],['walk','villager',-3,2,{v:2}],['walk','villager',-11,0,{v:3}],['walk','villager',-17,2,{v:4}]],
    text:e=>'A wedding party from '+e.home+' dances along the road to '+e.tw+' behind a lute player, the bride in flowers.',
    left:()=>'Their music fades behind you.',
    acts:[{icon:'mug',label:'Join',also:()=>[statHelps('respect')],out:()=>{const x=ENC_TUNE.wedding;return{hours:x.hours,morale:statMore('respect',x.morale),say:'You drink to the bride and dance a while. Your band marches on merrier.'}}},
      {icon:'gold',label:'Give a gift',also:()=>[statHelps('respect')],need:()=>P.gold<ENC_TUNE.wedding.gift&&'Not enough gold.',
        out:e=>{const x=ENC_TUNE.wedding;return{gold:-x.gift,rep:[e.home,statMore('respect',x.rep)],say:'The couple thank you, and '+e.home+' will remember your gift.'}}}]},
  horse:{n:'Runaway horse',ico:'shoe',w:1,wf:()=>P.gear.mount?1:1.5,ok:(c=storyCtx())=>c.climate!=='swamp',on:'open',beh:'flee',life:'stay',ends:'leave',stop:true,spook:ENC_CATCH.spook,tip:'A saddled horse, no rider',they:'bolt, then graze',
    setup:e=>{e.mk=roadMount(e);e.stop=roadRng().int(ENC_CATCH.bolt[0],ENC_CATCH.bolt[1]);e.coat=['horse','chestnut','horseB','horseG'][e.seed%4]},
    scene:e=>[['horse','',0,0,{coat:e.coat}]],
    text:e=>'A saddled '+(e.mk==='horse'?'horse':MOUNTS[e.mk].n.toLowerCase())+' with no rider, its reins trailing, '+(e.calm?'grazing by the way. It keeps one eye on you.':'wild-eyed.'),
    facts:e=>[statRead('horse',{vague:'skittish',what:'to catch it'}),statHelps('horse'),P.gear.mount?'you have a mount: it is worth '+itemPrice('m_'+e.mk)+' gold':'a '+MOUNTS[e.mk].n],
    left:()=>'You leave it to its grazing.',
    acts:[{icon:'shoe',label:'Catch it',facts:e=>[P.gear.mount?'+'+itemPrice('m_'+e.mk)+' gold':'a '+MOUNTS[e.mk].n],tip:'Walk up slowly and take the reins. Fail and it bolts.',run:e=>roadCatchHorse(e)}]},
  beggar:{n:'Beggar',ico:'gold',w:1.2,wf:()=>P.gold>=200?1.5:1,ok:(c=storyCtx())=>!!c.nearHold,on:'road',beh:'approach',leave:'Ignore',call:'Alms, my lord?',hear:'An old man calls to you from the road to the {d}.',tip:'An old man with a bowl',
    setup:e=>{const t=Spatial.nearestHolding(e.x,e.y);e.race=t.races[0];e.fac=roadFac(t)},
    scene:()=>[['walk','beggar',0,0]],
    text:()=>'An old man in rags hobbles up and holds out a wooden bowl. His hands shake.',
    left:()=>'You ride on. He calls a blessing after you anyway.',
    acts:ENC_TUNE.beggar.gold.map((g,i)=>({icon:'gold',label:'Give '+g+' gold',need:()=>P.gold<g&&'Not enough gold.',
      out:e=>{const h=ENC_TUNE.beggar.honor[i];return{gold:-g,...(e.fac?{honor:[e.fac,h]}:{morale:2*h}),mood:'kind',say:'He blesses you and your band. ('+g+' gold given)'}}}))},
  messenger:{n:'Messenger',ico:'scroll',w:1,ok:()=>FIDS.length>0,on:'road',beh:'approach',spd:'ride',call:'News from the realm!',hear:'Hoofbeats: a rider on the road to the {d}.',tip:'A realm’s rider',
    setup:e=>{const x=ENC_TUNE.messenger,t=Spatial.nearestHolding(e.x,e.y),f=roadFac(t)||FIDS.filter(k=>k!=='player')[roadRng().int(0,FIDS.filter(k=>k!=='player').length-1)],h=Spatial.nearestHolding(e.x,e.y,z=>z.owner===f)||t;
      e.fac=f;e.home=h.name;e.race=h.races[0];e.purse=roadRng().int(x.purse[0],x.purse[1]);e.coat=['horse','chestnut','horseB'][e.seed%3];e.letter=letterMake(e)},
    scene:e=>[['rider','messenger',0,0,{col:roadCol(e),coat:e.coat}]],
    text:e=>'A rider in the colours of the '+FACS[e.fac].n+' reins in beside you, a sealed letter in his satchel.',
    facts:e=>['bound for '+e.letter.to],
    left:()=>'He spurs on.',
    acts:[{icon:'scroll',label:'Read the news',facts:()=>['a rumour: a place, a lord or a war'],run:e=>{const it=roadRumour(e);return 'He tells you the news: '+roadNews()+'.'+(it?' And from the road: “'+rumourText(it)+'”':'')}},
      {icon:'bag',label:'Rob',also:e=>['his sealed letter, to '+e.letter.to],ask:e=>'Rob a rider of the '+FACS[e.fac].n+'? His realm will hear of it.',
        out:e=>({gold:e.purse,wrong:[townBy(e.home),CONDUCT.robMessenger],call:()=>letterTake(e),mood:'cruel',say:r=>'You take his purse ('+e.purse+' gold)'+r.call+'.'+(r.cost?' It costs you: '+r.cost+'.':'')})}]}
});
// (the road's kinds, by id: the pity timer's bucket, as the tests and the wiki read them)
const ROAD_ENC=Kinds.view('encounter','travelHour');
// (each kind's choices as Choices: story/choice.js, the shared ones kept as they are)
for(const D of Object.values(ROAD_ENC))D.acts=Choice.list(D.acts);
// (the realm a holding's people answer to: none for yours, or none at all)
const roadFac=t=>t&&t.owner&&t.owner!=='player'&&FACS[t.owner]?t.owner:null;
/* pushing a cart (ENC_TUNE.mud), less by your Strength and Athletics (ENC_STAT.push): its stamina, if you have that much left;
   else its time */
const roadPushSp=()=>Math.round(ENC_TUNE.mud.sp*(1-statOdds('push'))),roadPushH=()=>ENC_TUNE.mud.hours*(1-statOdds('push'));
const roadPush=()=>(P.sp||0)>=roadPushSp();
/* Tend his wounds (the real wounded traveller, ENC_TUNE.traveller): he always mends; your Medicine and Intellect, how well
   (ENC_STAT.care, 0–1: kept on him as e.care, for what may follow), and the more he owes you: reputation and renown × (1 + it),
   and a chance (gift × it) he presses a little gold from his purse on you. The lure shows the same (its tend springs the ambush) */
const roadCareWord=c=>c<.25?'he will live':c<.5?'he will mend':c<.8?'he will recover well':'he will be on his feet in days';
const roadTendFacts=()=>{const x=ENC_TUNE.traveller,c=statOdds('care');return['−'+x.food+' food','reputation +'+statMore('care',x.rep)+', renown +'+statMore('care',x.renown),'Medicine: '+roadCareWord(c),c>0&&'maybe a gift from his purse']};
// (he is on his feet and his gift rolled first, then the outcome: the food, the word of you, the gold; nothing of yours is read
// in between, and the one draw is the same)
function roadTend(e){const x=ENC_TUNE.traveller,c=statOdds('care'),t=nearHold();
  e.care=Math.round(c*100)/100;e.healed=1;e.done=1;e.goOff();const r=roadRng(),g=c>0&&r.chance(c*x.gift)?r.int(x.gold[0],x.gold[1]):0;
  return{food:-x.food,rep:[t&&t.name,statMore('care',x.rep)],renown:statMore('care',x.renown),gold:g,
    say:'Bandaged and fed, he gets to his feet. He swears to tell '+(t?t.name:'everyone')+' of your kindness, and '+(c<.5?'limps':'walks')+' off down the road.'+(g?' He presses '+g+' gold from his purse into your hand.':'')}}
// Join the hunt (ENC_TUNE.hunters): the haul, more by your Survival, Hunting and Archery (ENC_STAT.hunt): meat × (1 + it), furs × it
const roadHaul=()=>{const x=ENC_TUNE.hunters,h=statOdds('hunt');return{meat:Math.round(x.meat*(1+h)),furs:Math.round(x.furs*h)}};
// (a runaway's kind: the mount of the region, by its climate)
const roadMount=e=>({desert:'camel',swamp:'strider',frost:'pony'})[climAt(e.x,e.y)]||'horse';
// (one running across your view: from where it starts toward a point beside you, a little over a third of your sight to one
// side, and on)
function roadAcross(e){const V=vis(),ux=P.x-e.x,uy=P.y-e.y,L=Math.hypot(ux,uy)||1,s=roadRng().chance(.5)?1:-1,qx=P.x-uy/L*s*V*.35,qy=P.y+ux/L*s*V*.35,M=Math.hypot(qx-e.x,qy-e.y)||1;
  e.hx=(qx-e.x)/M;e.hy=(qy-e.y)/M;e.x+=e.hx*10;e.y+=e.hy*10}
/* a procession's places to go: the shrines and ruins near you; its goal, of those (or of the holdings), the one whose way passes
   nearest you (the least detour from where it is through you), not too near, not too far to walk in its time (ENC_WALK), and
   reachable; its time: as long as its walk takes, at least and at most ENC_LIFE.walk's */
const roadSites=()=>W.sites.filter(s=>(s.type==='shrine'||s.type==='ruins')&&Math.hypot(s.x-P.x,s.y-P.y)<ENC_WALK.far+ENC_SPAWN.near[1]);
const roadWalkHour=()=>moveStep(ENC_SPD.walk,Clock.hourSecs());// (px a procession walks in an hour)
const roadWalkFar=()=>ENC_LIFE.walk[1]*roadWalkHour()*ENC_WALK.wind;// (the farthest, as the crow flies, it walks in its time)
function roadGoal(e,ps){let best=null,bs=Infinity;const far=roadWalkFar();
  for(const p of ps){const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<ENC_WALK.min||d>far||!Router.reach(e,p))continue;
    const s=Math.hypot(P.x-e.x,P.y-e.y)+Math.hypot(p.x-P.x,p.y-P.y)-d;if(s<bs){bs=s;best=p}}return best}
function roadWalkEnd(e){const g=e.goal(),L=ENC_LIFE.walk;e.end=e.t0+clamp(Math.hypot(g.x-e.x,g.y-e.y)/roadWalkHour()/ENC_WALK.wind+.5,L[0],L[1])}
/* the pilgrims and the real shrines (sites.js): the shrines near you (as a procession's places, ENC_WALK.far); a shrine just past
   your sight (ENC_SPAWN.near's ring), with open ground before it: they are found praying there (stay: before its altar, by its
   own picture on the map, from dy px under its point; heard or seen, the shrine is known: drawn, and on their page's banner); else they walk the roads to the nearest shrine they can reach in their
   time, and end there. None: they do not come */
const roadShrines=()=>W.sites.filter(s=>s.type==='shrine'&&Math.hypot(s.x-P.x,s.y-P.y)<ENC_WALK.far+ENC_SPAWN.near[1]);
const roadShrineOf=e=>e.st?W.sites.find(s=>s.tx===e.st[0]&&s.ty===e.st[1]):null;// (their shrine: st, its tile; names repeat)
function roadPilgrims(e){const x=ENC_TUNE.pilgrims,V=vis(),t=nearHold(),d=(s,o)=>Math.hypot(s.x-o.x,s.y-o.y);e.to=t?t.name:null;e.n=roadRng().int(x.n[0],x.n[1]);
  const pray=roadShrines().filter(s=>d(s,P)>=V&&d(s,P)<=V+ENC_SPAWN.near[1]&&passable(tAt(Math.floor(s.x/TILE),Math.floor((s.y+ENC_PRAY.dy)/TILE)))).sort((a,b)=>d(a,P)-d(b,P))[0];
  if(pray){const L=ENC_LIFE.stay;e.pray=1;e.site=pray.name;e.st=[pray.tx,pray.ty];e.x=pray.x;e.y=pray.y+ENC_PRAY.dy;e.dir=1;e.beh='stay';e.d0=d(e,P);e.end=e.t0+L[0]+roadRng().next()*(L[1]-L[0]);return}
  const far=roadWalkFar(),s=roadShrines().filter(s=>d(s,e)>=ENC_WALK.min&&d(s,e)<=far&&Router.reach(e,s)).sort((a,b)=>d(a,e)-d(b,e))[0];if(!s)return false;
  e.site=s.name;e.st=[s.tx,s.ty];e.gx=s.x;e.gy=s.y+ENC_PRAY.dy;roadWalkEnd(e)}
const roadPraying=e=>!!e.pray&&!e.left;// (at their prayers: at the shrine, not yet walking on)
// (Pray with them: morale, and they speak well of you at home)
function roadPray(e){const x=ENC_TUNE.pilgrims,t=e.to&&townBy(e.to);return{morale:x.morale,rep:[t&&t.name,x.rep],say:'A quiet moment. The band rises calmer.'+(t?' The pilgrims spread good words about you in '+t.name+'.':'')}}
/* the lure (ENC_TUNE.lure): its weight (the night, the wild, the bands and camps near you); warned (Scouting); the odds of its
   band against yours; the chance a call scares a small band off; and the ambush sprung as you help him */
function roadLureW(){const x=ENC_TUNE.lure,nr=o=>Math.hypot(o.x-P.x,o.y-P.y)<x.near,n=bandits.filter(nr).length+W.sites.filter(s=>(s.type==='camp'||s.type==='hideout')&&!s.cleared&&nr(s)).length;
  return Math.min(x.cap,x.w*(darkness()>0?x.night:1)*(landHold(P.x,P.y)?1:x.wild)*(1+x.bandit*Math.min(x.bands,n)))}
const roadWarned=()=>skill('scout')>=ENC_TUNE.lure.warn;
const roadLureOdds=e=>{const [w,c]=odds(rating(e.foes));return '<span class="'+c+'">'+w+'</span> odds'};
const roadScare=()=>{const s=ENC_TUNE.lure.scare;return clamp(s.base+s.lead*skill('lead')+s.cha*P.attr.cha,s.lo,s.hi)};
function roadSpring(e){const m='You kneel beside him, and he grins. Bandits burst from the brush: an ambush!';return{log:[m,'bad'],fight:{amb:true},say:m}}
// the messenger's news: a place you have not found (it goes on your map), where a lord rides, or the wars
function roadNews(){const out=[],s=W.sites.filter(x=>!x.seen&&x.scoutable).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0],
    ls=W.lords.filter(l=>!l.dead&&!l.inside&&l.x>=0&&l.y>=0&&FACS[l.fac]),wars=FIDS.flatMap(a=>FIDS.filter(b=>a<b&&atWar(a,b)).map(b=>[a,b]));
  if(s)out.push(()=>{s.seen=true;return'the '+s.label+' lies to the '+compass(s.x-P.x,s.y-P.y)+'. It is on your map now'});
  if(ls.length)out.push(()=>{const l=roadRng().pick(ls);return l.name+' of the '+FACS[l.fac].n+' rides near '+Spatial.nearestHolding(l.x,l.y).name+', to the '+compass(l.x-P.x,l.y-P.y)});
  out.push(()=>{if(!wars.length)return'the realms keep the peace, for now';const w=roadRng().pick(wars);return'the '+FACS[w[0]].n+' and the '+FACS[w[1]].n+' are at war'});
  return roadRng().pick(out)()}
/* the chase and the catch (ENC_CATCH), shared: how fast one you chase runs (by your Agility), how near you must come, the hours
   you would take to close on one dist px away at your sprint (Infinity: never); the odds of a catch by hand (Riding, Agility);
   roadSprint: × your pace on the map while you chase one (world.js updateWorld) */
const roadSprint=()=>G.chase&&G.chase.rd&&G.chase.chase?ENC_CATCH.sprint:1;
const catchSpd=()=>ENC_SPD.run*Math.max(ENC_CATCH.lo,1-ENC_CATCH.agi*P.attr.agi);
const catchReach=()=>ENC_CATCH.reach+ENC_CATCH.agiReach*P.attr.agi;
function catchHours(dist){const g=MAP_BASE*travelMul()*(P.morale<25?.8:1)*ENC_CATCH.sprint-catchSpd();return dist<=catchReach()?0:g>0?(dist-catchReach())/moveStep(g,Clock.hourSecs()):Infinity}
const catchOdds=()=>statOdds('horse');
// (the thief's Insight read: can you run him down, from here)
function roadChaseRead(e){const h=catchHours(e.fromYou()),H=ENC_CATCH.hours;
  return insight(['he runs like a hare',h<=H*.6?'you could run him down':h<=H?'it will be close':'he is too quick for you',h===Infinity?'he runs faster than you: you cannot catch him':'you would close on him in '+h.toFixed(1)+' h; he is away after '+H+' h'],'know if you can catch him')}
// Chase: off his page and after him on the map (G.chase: you follow him) until you have him or he is away (Behaviours.chase)
function roadChase(e){e.chase=roadNow()+ENC_CATCH.hours;e.hx=e.hy=null;G.road=null;G.mode='world';hidePanel();G.chase=e;P.tx=e.x;P.ty=e.y;P.stuck=0;const m='You run after the thief!';log(m);return m}
// Catch it: a Riding check (and Agility); caught, the mount is yours (its worth in gold if you have one); missed, it bolts
function roadCatchHorse(e){const id='m_'+e.mk;train('ride',4);
  if(roadRng().chance(catchOdds())){e.gone=1;if(!P.gear.mount){P.gear.mount=id;fitInv();return'You take the reins and swing into the saddle: the '+ITEMS[id].n+' is yours.'}
    const g=itemPrice(id);P.gold+=g;return'You take the reins, and sell the '+ITEMS[id].n+' on for '+g+' gold.'}
  e.beh='bolt';return'It shies, rears and bolts. Gone.'}
/* the parts of another (pk: its i), never coming on their own (no trigger): a stray sheep of the shepherd's (its class, Stray:
   it grazes, and trots off from you within ENC_SHEEP.shy; once you help him, ride into it, within catchReach, and it is back
   with the flock) */
const ROAD_PART=defineKinds('encounter',{},{stray:{n:'A stray sheep',ico:'sheep',beh:'graze',part:true,tip:'A sheep astray',cls:Stray,scene:e=>[['beast','sheep',0,0,{v:e.seed%6}]]}});
// (today's names: the shepherd's good and strays)
const sheepGood=h=>h.good(),sheepStrays=h=>h.strays();
// what an encounter left unresolved leaves when its time is up: the body, the burnt wagon (fading over its last hours; no
// trigger: each an encounter kind, started only by another)
const ROAD_TRACE=defineKinds('encounter',{},{body:{n:'A dead traveller',scene:()=>[['down','traveller',0,0,{blood:1}]]},wreck:{n:'A burnt wagon',scene:()=>[['wreck','',0,0],['smoke','',-1,-6]]},
  cart:{n:'An abandoned cart',scene:()=>[['mud','',0,0],['oldcart','',0,0]]}});
