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
/* the tree (the owner, 2026-11-09: "Make the tree clean, with the sprite in the square box and click to show text"): a chart of
   square tiles, each one of your line's picture, its generation and name under it; a child below the one they came from, a
   sibling or a cousin beside them (a cousin's line dashed), a stranger who took up the name a root of their own, the heir who
   kept one's company a small tile beside them. A tile chosen shows its life beside the chart (G.famPick: runtime, never saved;
   you, until one is chosen). style.css .ft-chart */
function familyPage(){const L=Legacy.line,f=Legacy.family,who=r=>(RACES[r.race]?RACES[r.race].n+' ':'')+(BGS[r.bg]?BGS[r.bg].n.toLowerCase():'');
  const now={n:L.length+1,now:true,who:heroName()||'You',race:P.race,bg:P.bg,rel:Legacy.kin?.rel||null,of:Legacy.kin?.of||null},all=[...L,now],by=new Map(all.map(r=>[r.n,r]));
  const up=r=>!r.rel||!by.has(r.of)?null:r.rel==='child'?r.of:up(by.get(r.of));
  const kids=new Map(),roots=[];for(const r of all){const p=up(r);if(p==null)roots.push(r);else{if(!kids.has(p))kids.set(p,[]);kids.get(p).push(r)}}
  const kinLine=r=>r.rel&&by.has(r.of)?KIN[r.rel].n+' of '+htmlText(by.get(r.of).who):r.n>1?'A stranger, who took up the name':'The first of the line';
  // (the tile chosen: a life's generation, or 'h' and theirs for their heir; else you)
  const pick=String(G.famPick??''),hp=/^h\d+$/.test(pick)?by.get(+pick.slice(1)):null,heirOf=hp&&hp.heir?hp:null,picked=heirOf?pick:by.has(+pick)?+pick:now.n;
  const tile=(arg,pic,top,name,cls)=>'<button type="button" class="ft-tile'+cls+(String(picked)===String(arg)?' ft-sel':'')+'" data-act="fam-pick" data-arg="'+arg+'" aria-pressed="'+(String(picked)===String(arg))+'">'+
    '<span class="ft-pic">'+(pic?'<img src="'+pic+'" alt="">':'')+'</span><span class="ft-n">'+top+'</span><b>'+htmlText(name)+'</b></button>';
  const heirTile=r=>{if(!r.heir)return '';const l=familyHeirLord(r);return '<div class="ft-side">'+tile('h'+r.n,l?lordPic(l):'','Heir',r.heir,' ft-heir')+'</div>'};
  const li=r=>{const ks=kids.get(r.n)||[];return '<li class="ft-li'+(r.now?' ft-now':'')+(r.rel==='cousin'?' ft-cousin':'')+'"><div class="ft-row'+(r.heir?' ft-hh':'')+'">'+
    tile(r.n,familyPic(r),ordinal(r.n)+(r.now?' · you':''),r.who,r.now?'':' ft-dead')+heirTile(r)+'</div>'+(ks.length?'<ul>'+ks.map(li).join('')+'</ul>':'')+'</li>'};
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
    '<div class="ft-body"><div class="ft-chart" data-ft-chart><ul class="ft-tree">'+roots.map(li).join('')+'</ul></div><div class="ft-info" aria-live="polite">'+info()+'</div></div></div>'}
defineJournalSection('family',{label:'Family',icon:'altar',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:family">'+familyPage()+'</div>',
  sub:()=>(Legacy.family?'The '+Legacy.family+' family':'Your line')+(Legacy.line.length?' · '+Legacy.line.length+' fallen':'')});
// a tile chosen: its life told beside the chart, the chart kept where it was scrolled to
onAct('fam-',(a,arg)=>{if(a!=='fam-pick'||!journalOn('family'))return;const c=panel.querySelector('[data-ft-chart]'),x=c?c.scrollLeft:0,y=c?c.scrollTop:0;
  fbRemember();G.famPick=arg;renderJournal();const d=panel.querySelector('[data-ft-chart]');if(d){d.scrollLeft=x;d.scrollTop=y}
  panel.querySelector('[data-act="fam-pick"].ft-sel')?.focus({preventScroll:true})});
