'use strict';
/* ---------- the Journal's Family (the owner, 2026-11-09: a family tree of your line; journal.js section): you now, the
   generation you are, then each of your line who fell, the last first (world/legacy.js Legacy.line): their people and past, the
   days they lived, their level and renown, what killed them and where, the heir who kept their company, and where they lie now
   (their resting place, world/lineage.js RestSite: buried or not, prayed at or what lingers there) ---------- */
// (where one of your line lies: their grave, if it is known, and its place)
function familyRest(r){const g=Remains.list.find(o=>o.grave&&o.who===r.who&&o.day===r.day);if(!g)return '<span class="muted">Where they lie is not known.</span>';
  const s=W.sites.find(x=>x.type==='rest'&&x.members().includes(g)),at=s?htmlText(s.name):htmlText(g.name);
  return (g.unburied?'<span class="bad">Lies unburied</span>, '+at:'Lies in '+at)+(g.spent?' · prayed at':g.xp?' · <span class="gold">'+g.xp+' experience lingers</span>':'')}
// (the heir who kept one's company: their lord, if they still are one, and how they stand now)
function familyHeirLord(r){return r.heirId&&W.lords.find(o=>o.id===r.heirId)||null}
function familyHeirNow(r){const l=familyHeirLord(r);return !l?'':l.gone||l.dead&&l.back>=1e9?'<span class="bad">fallen</span>':(FACS[l.fac]?'a lord of the '+htmlText(FACS[l.fac].n):'a lord')}
// (a life's picture: the face they wore (Faces, ui/faces.js; one drawn by their name if none was kept), else a figure of their
// people; yours as you are now)
function familyPic(r){if(r.now)return portrait('hero',true);if(typeof Faces!=='undefined'&&Faces.ok())return Faces.pic(r.face||Faces.random(seedNum('face:'+r.who+':'+r.n),r.race,r.g));return hudPic(RACES[r.race]?.melee||'hum_levy')}
/* ---- the chart (the owner, 2026-11-09: "Make the tree clean, with the sprite in the square box and click to show text"): square
   tiles, each one's picture, a line and their name under it; each below the one they came from, side by side with their siblings;
   a tile chosen tells its life beside the chart. Your line's (Family) and the lords' houses' (Houses) alike. style.css .ft-chart */
// (a tile: its picture in its square (none: unknown, a ?), the line over its name; picked: the tile chosen, act: its action)
function ftTile(act,arg,picked,pic,top,name,cls){const on=String(picked)===String(arg);
  return '<button type="button" class="ft-tile'+cls+(on?' ft-sel':'')+'" data-act="'+act+'" data-arg="'+htmlText(String(arg))+'" aria-pressed="'+on+'">'+
    '<span class="ft-pic">'+(pic?'<img src="'+pic+'" alt="">':'<span class="ft-unk">?</span>')+'</span><span class="ft-n">'+top+'</span><b>'+htmlText(name)+'</b></button>'}
// (the tree: key(r) one's own, up(r) the key of the one above them (null: a root of their own); row(r) their tile(s), cls(r) their classes)
function ftChart(all,key,up,row,cls){const kids=new Map(),roots=[];for(const r of all){const p=up(r);if(p==null)roots.push(r);else{if(!kids.has(p))kids.set(p,[]);kids.get(p).push(r)}}
  const li=r=>{const ks=kids.get(key(r))||[];return '<li class="ft-li'+cls(r)+'">'+row(r)+(ks.length?'<ul>'+ks.map(li).join('')+'</ul>':'')+'</li>'};
  return '<div class="ft-chart" data-ft-chart><ul class="ft-tree">'+roots.map(li).join('')+'</ul></div>'}
// (a tile chosen (set: what it changes), on the section open: the journal drawn again, the chart kept where it was scrolled to)
function ftPick(sec,set){if(!journalOn(sec))return;const c=panel.querySelector('[data-ft-chart]'),x=c?c.scrollLeft:0,y=c?c.scrollTop:0;
  fbRemember();set();renderJournal();const d=panel.querySelector('[data-ft-chart]');if(d){d.scrollLeft=x;d.scrollTop=y}
  panel.querySelector('.ft-tile.ft-sel,.ft-house.ft-sel')?.focus({preventScroll:true})}
/* your line: a child below the one they came from, a sibling or a cousin beside them (a cousin's line dashed), a stranger who
   took up the name a root of their own, the heir who kept one's company a small tile beside them (G.famPick: runtime, never saved;
   you, until one is chosen) */
function familyPage(){const L=Legacy.line,f=Legacy.family,who=r=>(RACES[r.race]?RACES[r.race].n+' ':'')+(BGS[r.bg]?BGS[r.bg].n.toLowerCase():'');
  const now={n:L.length+1,now:true,who:heroName()||'You',race:P.race,bg:P.bg,rel:Legacy.kin?.rel||null,of:Legacy.kin?.of||null},all=[...L,now],by=new Map(all.map(r=>[r.n,r]));
  const up=r=>!r.rel||!by.has(r.of)?null:r.rel==='child'?r.of:up(by.get(r.of));
  const kinLine=r=>r.rel&&by.has(r.of)?KIN[r.rel].n+' of '+htmlText(by.get(r.of).who):r.n>1?'A stranger, who took up the name':'The first of the line';
  // (the tile chosen: a life's generation, or 'h' and theirs for their heir; else you)
  const pick=String(G.famPick??''),hp=/^h\d+$/.test(pick)?by.get(+pick.slice(1)):null,heirOf=hp&&hp.heir?hp:null,picked=heirOf?pick:by.has(+pick)?+pick:now.n;
  const tile=(arg,pic,top,name,cls)=>ftTile('fam-pick',arg,picked,pic,top,name,cls);
  const heirTile=r=>{if(!r.heir)return '';const l=familyHeirLord(r);return '<div class="ft-side">'+tile('h'+r.n,l?lordPic(l):'','Heir',r.heir,' ft-heir')+'</div>'};
  const row=r=>'<div class="ft-row'+(r.heir?' ft-hh':'')+'">'+tile(r.n,familyPic(r),ordinal(r.n)+(r.now?' · you':''),r.who,r.now?'':' ft-dead')+heirTile(r)+'</div>';
  // (the life chosen, told: who they were, how they lived and fell, where they lie; an heir's: whose company, and now)
  const info=()=>{if(heirOf){const r=heirOf,l=familyHeirLord(r),n=familyHeirNow(r),pic=l&&lordPic(l);
      return '<div class="ft-head">'+(pic?'<img src="'+pic+'" alt="">':'')+'<div><span class="ft-n">Heir of the '+ordinal(r.n)+'</span><b>'+htmlText(r.heir)+'</b></div></div>'+
        '<p>Kept the company of '+htmlText(r.who)+' when they fell.</p>'+(n?'<p>Now '+n+'.</p>':'')}
    const r=by.get(picked);return '<div class="ft-head"><img src="'+familyPic(r)+'" alt=""><div><span class="ft-n">'+ordinal(r.n)+(r.now?' · you':'')+'</span><b>'+htmlText(r.who)+'</b></div></div>'+
      '<p>'+kinLine(r)+'.</p>'+(r.now?'<p>'+who(P)+'. On the road since day '+(P.born||1)+'.</p><p>Level '+P.level+' · renown '+Math.round(P.renown||0)+'</p>':
      '<p>'+who(r)+'. Day '+r.born+' to '+r.day+' ('+r.days+' day'+(r.days===1?'':'s')+').</p><p>Level '+r.level+' · renown '+r.renown+'</p>'+
      '<p class="bad">Fell to '+htmlText(r.by)+(r.near?' near '+htmlText(r.near):'')+'.</p><p>'+familyRest(r)+'.</p>'+
      (r.heir?'<p>'+htmlText(r.heir)+' kept their company'+(familyHeirNow(r)?', now '+familyHeirNow(r):'')+'.</p>':''))};
  return '<div class="ft"><div class="lab">'+(f?'The '+htmlText(f)+' family':'Your line')+(L.length?' · '+L.length+' fallen':'')+'</div>'+
    (L.length?'':'<p class="muted">No one of your line has fallen yet. Those who do take their place above you here, and where they lie.</p>')+
    '<div class="ft-body">'+ftChart(all,r=>r.n,up,row,r=>(r.now?' ft-now':'')+(r.rel==='cousin'?' ft-cousin':''))+'<div class="ft-info" aria-live="polite">'+info()+'</div></div></div>'}
defineJournalSection('family',{label:'Family',icon:'altar',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:family">'+familyPage()+'</div>',
  sub:()=>(Legacy.family?'The '+Legacy.family+' family':'Your line')+(Legacy.line.length?' · '+Legacy.line.length+' fallen':'')});
onAct('fam-',(a,arg)=>{if(a==='fam-pick')ftPick('family',()=>{G.famPick=arg})});
/* ---- the lords' houses (the owner, 2026-11-09: "only appear once you know them or someone tell you about their family (only when
   very friendly)"; world/lineage.js LordHouse): a house is set down here once you know one of it; its dead and its living, each
   below the one whose place they took up; one you do not know a ?? (LordHouse#knows: met or named to you, read on its crypt, or told
   of by a close friend of the house). G.hsHouse, G.hsPick: runtime, never saved */
// (one of a house's picture: a living lord's face, a dead one's as he was; '' unknown)
function houseFace(h,m){if(!h.knows(m.id))return '';const l=W.lords.find(o=>o.id===m.id);return lordPic(l||{name:m.name,fac:m.fac,race:m.race,gender:m.gender})||''}
function housePage(){const hs=Houses.known();
  if(!hs.length)return '<div class="ft"><p class="muted">You know no lord\'s house yet. Meet a lord, or hear one named, and his house is set down here. A close friend of a house will tell you of all of it.</p></div>';
  const h=hs.find(x=>x.id===G.hsHouse)||hs[0],all=h.members,by=new Map(all.map(m=>[m.id,m])),kn=m=>h.knows(m.id),prev=m=>m.dead?m.of:m.succeeded;
  const picked=(by.get(G.hsPick)||all.find(m=>!m.dead&&kn(m))||all.find(kn)).id,F=FACS[h.fac];
  const chips='<div class="ft-houses">'+hs.map(x=>'<button type="button" class="ft-house'+(x===h?' ft-sel':'')+'" data-act="lh-house" data-arg="'+x.id+'" aria-pressed="'+(x===h)+'">'+htmlText(x.name)+'</button>').join('')+'</div>';
  const row=m=>'<div class="ft-row">'+ftTile('lh-pick',m.id,picked,houseFace(h,m),kn(m)?m.dead?'Died day '+m.day:'Living':'Unknown',kn(m)?m.name:'??',(m.dead?' ft-dead':'')+(kn(m)?'':' ft-unknown'))+'</div>';
  // (the one chosen, told: who, what they are to the house, how they stand toward you, or how they died and where they lie)
  const info=()=>{const m=by.get(picked),p=prev(m)&&by.get(prev(m)),pn=p?(kn(p)?htmlText(p.name):'??'):'';
    if(!kn(m))return '<div class="ft-head"><span class="ft-pic"><span class="ft-unk">?</span></span><div><span class="ft-n">'+htmlText(h.name)+'</span><b>??</b></div></div>'+
      '<p>One of '+htmlText(h.name)+', '+(m.dead?'dead now,':'living,')+' but not known to you.</p><p class="muted">'+(m.dead?'Their name is cut over the crypt at '+htmlText(h.seat||'its seat')+'; ':'Meet them, or hear them named; ')+'a close friend of the house might tell you of them.</p>';
    const l=!m.dead&&m,rep=KNOWLEDGE.lords[m.id],pic=houseFace(h,m);
    return '<div class="ft-head">'+(pic?'<img src="'+pic+'" alt="">':'')+'<div><span class="ft-n">'+(m.dead?'Died day '+m.day:'Of '+htmlText(h.name))+'</span><b>'+htmlText(m.name)+'</b></div></div>'+
      (pn?'<p>Took up the place of '+pn+'.</p>':'')+
      (l?'<p>A lord of the '+(FACS[l.fac]?htmlText(FACS[l.fac].n):'realm')+' · level '+(l.lv||1)+' · renown '+(l.renown||0)+'</p><p>Toward you: '+relTag(relWith(l))+'</p>'+(rep?.text?'<p class="muted">'+htmlText(rep.text)+(rep.at!=null?' (day '+rep.at+')':'')+'</p>':''):
        '<p class="bad">'+cap1(htmlText(m.how))+(m.byYou?', by your line\'s hand':'')+'.</p><p>Lies in the crypt of '+htmlText(h.name)+(h.seat?' at '+htmlText(h.seat):'')+'.</p>')};
  const n=all.filter(kn).length;
  return '<div class="ft">'+chips+'<div class="lab">'+htmlText(h.name)+(h.seat?' · seat '+htmlText(h.seat):'')+(F?' · the '+htmlText(F.n):'')+' · '+n+' of '+all.length+' known'+(h.dead.length?' · '+h.dead.length+' in its crypt':'')+'</div>'+
    (h.grudged()?'<p class="bad">It bears you a grudge: '+(h.grudge.half?'your kin':'you')+' killed '+htmlText(h.grudge.name)+'.</p>':'')+
    '<div class="ft-body">'+ftChart(all,m=>m.id,m=>prev(m)&&by.has(prev(m))?prev(m):null,row,m=>m.dead?'':' ft-now')+'<div class="ft-info" aria-live="polite">'+info()+'</div></div></div>'}
defineJournalSection('houses',{label:'Houses',icon:'tower',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:houses">'+housePage()+'</div>',
  sub:()=>{const n=Houses.known().length;return n?n+' house'+(n===1?'':'s')+' known':'No house known yet'}});
onAct('lh-',(a,arg)=>{if(a==='lh-house')ftPick('houses',()=>{G.hsHouse=arg;G.hsPick=null});if(a==='lh-pick')ftPick('houses',()=>{G.hsPick=arg})});
