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
   very friendly)", "Give lords spouses and children so houses have real families"; world/lineage.js LordHouse): a house is set down
   here once you know one of it. Its family: each child below the one they were born to, the one wed to them a small tile beside them
   (one of afar who took up the place of one dead below them, dashed); its dead, its lords and its kin; one you do not know a ??
   (LordHouse#knows: met or named to you, read on its crypt, or told of by a close friend of the house). G.hsHouse, G.hsPick:
   runtime, never saved */
// (one of a house's picture: a lord's face, a dead one's as they were, one of its kin's (a child's young); '' unknown)
function houseFace(h,m){if(!h.knows(m.id))return '';const l=W.lords.find(o=>o.id===m.id);
  return lordPic(l||{name:m.name,id:m.id,fac:m.fac||h.fac,race:m.race,gender:m.gender,kinFace:m.kin||m.kinFace,young:m.kin&&!h.adult(m),plain:m.kin,lv:m.lv})||''}
// (what one is to a house, in a word over their name: a lord of it, one dead or gone from it, wed into it, a child, a grown one of its blood)
function houseRole(h,m){return m.away?'Gone day '+m.day:m.dead?'Died day '+m.day:!m.kin?'Lord':m.inlaw?(m.gender==='f'?'Wife':'Husband'):!h.adult(m)?'Child':(m.gender==='f'?'Daughter':'Son')}
function housePage(){const hs=Houses.known();
  if(!hs.length)return '<div class="ft"><p class="muted">You know no lord\'s house yet. Meet a lord, or hear one named, and his house is set down here. A close friend of a house will tell you of all of it.</p></div>';
  const h=hs.find(x=>x.id===G.hsHouse)||hs[0],all=h.members,by=new Map(all.map(m=>[m.id,m])),kn=m=>h.knows(m.id),F=FACS[h.fac];
  // (its blood in the tree: wed into it, one beside the one they wed while they are in it; each below the one born to, else the one whose place they took)
  const beside=m=>m.inlaw&&by.has(m.spouse)&&!by.get(m.spouse).inlaw,blood=all.filter(m=>!beside(m)).sort((a,b)=>(a.born??-1e9)-(b.born??-1e9));
  // (one drawn beside the one they wed stands in the tree by them: one below them is below their spouse)
  const node=id=>{const o=by.get(id);return o&&beside(o)?o.spouse:id},up=m=>by.has(m.parent)?node(m.parent):by.has(m.succeeded)?node(m.succeeded):null,wedTo=m=>all.filter(o=>beside(o)&&o.spouse===m.id);
  const picked=(by.get(G.hsPick)||all.find(m=>!m.dead&&!m.kin&&kn(m))||all.find(kn)).id;
  const nm=m=>kn(m)?m.name:'??',who=id=>{const o=by.get(id);return o?(kn(o)?htmlText(o.name):'??'):''};
  const tile=(m,cls)=>ftTile('lh-pick',m.id,picked,houseFace(h,m),kn(m)?houseRole(h,m):'Unknown',nm(m),cls+(m.dead?' ft-dead':'')+(kn(m)?'':' ft-unknown'));
  const row=m=>{const ws=wedTo(m);return '<div class="ft-row'+(ws.length?' ft-hh':'')+'">'+tile(m,'')+(ws.length?'<div class="ft-side ft-wed">'+ws.map(w=>tile(w,' ft-heir ft-spouse')).join('')+'</div>':'')+'</div>'};
  // (the one chosen, told: who, born to whom and wed to whom, how they stand toward you, or how they died and where they lie)
  const info=()=>{const m=by.get(picked),pa=m.parent&&by.get(m.parent),sp=m.spouse&&by.get(m.spouse),f=m.gender==='f';
    if(!kn(m))return '<div class="ft-head"><span class="ft-pic"><span class="ft-unk">?</span></span><div><span class="ft-n">'+htmlText(h.name)+'</span><b>??</b></div></div>'+
      '<p>One of '+htmlText(h.name)+', '+(m.away?'gone from it,':m.dead?'dead now,':'living,')+' but not known to you.</p><p class="muted">'+(m.dead&&!m.away?'Their name is cut over the crypt at '+htmlText(h.seat||'its seat')+'; ':m.kin?'':'Meet them, or hear them named; ')+'a close friend of the house might tell you of them.</p>';
    const l=!m.dead&&!m.kin&&m,rep=KNOWLEDGE.lords[m.id],pic=houseFace(h,m),two=pa&&pa.spouse&&by.get(pa.spouse);
    return '<div class="ft-head">'+(pic?'<img src="'+pic+'" alt="">':'')+'<div><span class="ft-n">'+htmlText(houseRole(h,m))+'</span><b>'+htmlText(m.name)+'</b></div></div>'+
      (pa?'<p>'+(f?'Daughter':'Son')+' of '+who(pa.id)+(two?' and '+who(two.id):'')+'.</p>':'')+
      (sp?'<p>'+(m.inlaw?'Wed into the house, '+(f?'wife':'husband')+' of ':'Wed to ')+who(sp.id)+(sp.dead?', now dead':'')+'.</p>':'')+
      (m.succeeded&&by.has(m.succeeded)?'<p>Took up the place of '+who(m.succeeded)+(m.cousin?', a cousin from afar':'')+'.</p>':'')+
      (m.kin?'<p>'+(h.adult(m)?'Of age':'A child yet')+(m.born!=null&&m.born>0?', born day '+m.born:'')+'.</p>':'')+
      (l?'<p>A lord of the '+(FACS[l.fac]?htmlText(FACS[l.fac].n):'realm')+' · level '+(l.lv||1)+' · renown '+(l.renown||0)+'</p><p>Toward you: '+relTag(relWith(l))+'</p>'+(rep?.text?'<p class="muted">'+htmlText(rep.text)+(rep.at!=null?' (day '+rep.at+')':'')+'</p>':''):'')+
      (m.away?'<p>'+cap1(htmlText(m.how))+'.</p>':m.dead?'<p class="bad">'+cap1(htmlText(m.how))+(m.byYou?', by your line\'s hand':'')+'.</p><p>Lies in the crypt of '+htmlText(h.name)+(h.seat?' at '+htmlText(h.seat):'')+'.</p>':'')};
  const chips='<div class="ft-houses">'+hs.map(x=>'<button type="button" class="ft-house'+(x===h?' ft-sel':'')+'" data-act="lh-house" data-arg="'+x.id+'" aria-pressed="'+(x===h)+'">'+htmlText(x.name)+'</button>').join('')+'</div>';
  const n=all.filter(kn).length;
  return '<div class="ft">'+chips+'<div class="lab">'+htmlText(h.name)+(h.seat?' · seat '+htmlText(h.seat):'')+(F?' · the '+htmlText(F.n):'')+' · '+n+' of '+all.length+' known'+(h.buried.length?' · '+h.buried.length+' in its crypt':'')+'</div>'+
    (h.grudged()?'<p class="bad">It bears you a grudge: '+(h.grudge.half?'your kin':'you')+' killed '+htmlText(h.grudge.name)+'.</p>':'')+
    '<div class="ft-body">'+ftChart(blood,m=>m.id,up,row,m=>(!m.dead&&!m.kin?' ft-now':'')+(!by.has(m.parent)&&by.has(m.succeeded)?' ft-cousin':''))+'<div class="ft-info" aria-live="polite">'+info()+'</div></div></div>'}
defineJournalSection('houses',{label:'Houses',icon:'tower',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:houses">'+housePage()+'</div>',
  sub:()=>{const n=Houses.known().length;return n?n+' house'+(n===1?'':'s')+' known':'No house known yet'}});
onAct('lh-',(a,arg)=>{if(a==='lh-house')ftPick('houses',()=>{G.hsHouse=arg;G.hsPick=null});if(a==='lh-pick')ftPick('houses',()=>{G.hsPick=arg})});
