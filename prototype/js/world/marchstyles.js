'use strict';
/* ---------- march styles (the owner, 2026-10-31: AI armies "bunch too close" round their leader; room between groups, and
   styles like a real battle setup, so you read an army's intent from its order on the march). Every army not yours, with no
   layout saved, stands in one of MARCH_STYLES (march.js marchLayout, each time its rows change): chosen by its kind (a band, a
   beast pack, a caravan), else its troops' race as a battle captain reads it (commander.js temperFor: orcs come on, dwarves hold
   the line, elves keep their distance), else a lord's errand (to war, a siege or a relief, in a marshal's host, riding out to
   defend his land: offensive; home, patrol or rest: defensive), else defensive.
   Each group goes by its kind (data/matchups.js unitClass, a beast, its leader) to a place [band, form, ranks]. Bands front to
   back, van, main and rear: groups abreast gap px apart, at most wrap abreast a rank (the first in the middle, the rest out to
   either side); wings beside the band it flanks (flank: the main unless said), right then left. ring: round the middle (a pack
   round its leader or its biggest group, a caravan's guards round its wagon, facing out). Its form when its men suit it (FORMS
   who, a wedge WEDGE.min riders at least, a pack two), else loose, else a line; ranks: its depth (its files from its men). gap
   and margin (px its farthest man stands inside its ring, every army's: march.js marchOuter) are the world map's px ---------- */
const MARCH_STYLES={gap:8,margin:4,wrap:3,
  styles:{
    // (riders forward in wedges, the infantry behind the centre round its leader, the shooters at the rear)
    offensive:{cav:['van','wedge'],leader:['main'],spear:['main','line',3],foot:['main','line',3],beast:['main','pack'],ranged:['rear','line',2],magic:['rear','line',2]},
    // (a spear or shield line in front, the shooters behind it round its leader, the riders in columns on the flanks)
    defensive:{spear:['van','line',3],foot:['van','line',3],leader:['main'],ranged:['main','line',2],magic:['main','line',2],cav:['wings','column'],beast:['rear','pack']},
    // (a loose screen of foot, the archers out on its sides, the chief and any riders behind it)
    screen:{flank:'van',foot:['van','loose',4],spear:['van','loose',4],leader:['main'],cav:['main','line',2],ranged:['wings','loose',5],magic:['wings','loose',5],beast:['rear','pack']},
    // (a loose pack round its leader, else its biggest group)
    pack:{ring:'pack',all:['ring','pack']},
    // (the guards round the wagon, each facing out)
    convoy:{ring:'out',all:['ring','line',2]},
    // (yours, the owner, 2026-11-01: battle lanes, as a battle opens from it: the infantry in front, the mages a step behind it beside
    // your hero, the archers and crossbows behind them, the riders on the flanks a little back. own: each group keeps its own
    // formation (the march window's); wrap, span: so many of a kind abreast, a rank no wider than span of its widest groups; mid:
    // your hero (its leader) at the middle, on the lanes' line; flank: a list, each wing beside whichever it stands least far out)
    lanes:{own:true,mid:true,wrap:4,span:2,flank:['main','rear'],spear:['van'],foot:['van'],leader:['main'],magic:['main'],ranged:['rear'],cav:['wings'],beast:['rear']}},
  // (yours, and any army with a layout saved: its groups not placed stand where this one puts them)
  yours:'lanes',
  kind:{band:'screen',monster:'pack',caravan:'convoy'},
  race:{orc:'offensive',dwarf:'defensive',elf:'screen'},
  errand:{march:'offensive',siege:'offensive',relieve:'offensive',host:'offensive',defend:'offensive'},
  base:'defensive'};
// (an army's race as a battle captain reads it, commander.js temperFor: the race of 60% of its raced troops, else mixed; null when
// under half its troops have one. groups: its roster's)
function marchRace(groups){const n={};let all=0,raced=0;for(const g of groups){all+=g.count;const k=ST[g.type]?.race;if(k){n[k]=(n[k]||0)+g.count;raced+=g.count}}
  if(!raced||raced*2<all)return null;const top=Object.keys(n).sort((a,b)=>n[b]-n[a])[0];return n[top]>=raced*.6?top:'mixed'}
// (a row's place in a style: its leader (a band's chief among its troops too), a beast, else its battle class)
const marchRole=(row,o)=>{if(row.character||o.ld&&row.type==='chief')return 'leader';const S=ST[row.type];return !S?'foot':S.beast||S.big?'beast':unitClass(S)};
// (whether form f suits a row's men: FORMS who; a wedge WEDGE.min riders at least, a pack two; a leader in a line)
const marchFormOk=(row,f)=>{const F=FORMS[f];return !!F&&(!F.who||!!ST[row.type]&&FORM_WHO[F.who]({s:ST[row.type]}))&&(!F.wedge||row.count>=WEDGE.min)&&(!F.pack||row.count>1)&&(!row.character||f==='line')};
// (a group's half depth and half width as it stands facing the army's way, its bodies included: world px)
function marchHalf(row){let hx=0,hy=0;for(const [x,y] of formSlots(row.form,row.count,0,row.files,WORLD_BATTLE.sprite*marchRoomK(row))){hx=Math.max(hx,Math.abs(x));hy=Math.max(hy,Math.abs(y))}
  const b=marchPad(row);return{hx:hx/WORLD_BATTLE.scale+b,hy:hy/WORLD_BATTLE.scale+b}}
class MarchStyle{
  constructor(key){this.key=key;this.def=MARCH_STYLES.styles[key]}
  static of(key){return (MarchStyle.made||(MarchStyle.made={}))[key]||(MarchStyle.made[key]=new MarchStyle(key))}
  // the style an army takes (groups: its roster's, its leader aside)
  static pick(o,groups){const T=MARCH_STYLES;return T.kind[o.mapKind]||T.race[marchRace(groups)]||(o.mapKind==='lord'?T.errand[o.defend?'defend':o.follow||o.with?'host':o.state]:null)||T.base}
  // rows (march.js marchLayout: id, type, count, character) laid out: each its form, files, facing and spot (x forward, y right)
  lay(rows,o){
    const D=this.def,laid=rows.map(r=>{const role=marchRole(r,o),[band,want='line',ranks=1]=D[role]||D.all||['main','line',3],form=D.own?r.form:[want,'loose','line'].find(f=>marchFormOk(r,f));
      const files=D.own?r.files:form==='line'||form==='loose'?Math.ceil(r.count/ranks):form==='column'?1:null,row={...r,face:D.own?r.face:0,form,files,role,band};return Object.assign(row,marchHalf(row))});
    if(this.def.ring)this.round(laid);else this.bands(laid);
    return laid.map(({role,band,hx,hy,...r})=>r);
  }
  // van, main and rear front to back, a rank of at most wrap abreast at a time (its leader first: your hero before your companions),
  // and no wider than span of its widest groups abreast (mid: its leader on the army's line, the rest of his rank beside him); then
  // the wings beside the band they flank (flanks: a list); centred (mid: on its leader)
  bands(laid){
    const D=this.def,G=MARCH_STYLES.gap,W=D.wrap||MARCH_STYLES.wrap,wide=D.span?D.span*(2*Math.max(...laid.filter(r=>r.band!=='wings').map(r=>r.hy))+G)-G:Infinity,first=r=>r.role!=='leader'?0:r.id==='hero'||r.id==='leader'?2:1,by=k=>laid.filter(r=>r.band===k).sort((a,b)=>first(b)-first(a)),span={};let x=0;
    for(const k of ['van','main','rear'])for(let i=0,n,list=by(k);i<list.length;i+=n){
      for(n=1;i+n<list.length&&n<W&&list.slice(i,i+n+1).reduce((w,r)=>w+2*r.hy+G,-G)<=wide+1e-9;n++);
      const rank=list.slice(i,i+n).reduce((a,r,j)=>(j%2?a.unshift(r):a.push(r),a),[]),d=Math.max(...rank.map(r=>r.hx));let y=-(rank.reduce((n,r)=>n+2*r.hy,0)+G*(rank.length-1))/2;
      for(const r of rank){r.x=x-d;r.y=y+r.hy;y+=2*r.hy+G}const c=D.mid&&rank.find(r=>first(r)===2);if(c){const dy=c.y;for(const r of rank)r.y-=dy}span[k]={x0:x-2*d,x1:span[k]?.x1??x};x-=2*d+G}
    // (each wing beside whatever stands at its depth, right then left, by the band it flanks (flank: the main band unless said),
    // else the main band, the van, the rear)
    if(Array.isArray(D.flank))this.flanks(laid,span);
    else{const at=span[D.flank||'main']||span.main||span.van||span.rear,mid=at?(at.x0+at.x1)/2:0,side=[0,0];by('wings').forEach((r,i)=>{const s=i%2?-1:1,clear=Math.max(side[i%2],...laid.filter(q=>q.band!=='wings'&&q.x!=null&&Math.abs(q.x-mid)<q.hx+r.hx+G).map(q=>s*q.y+q.hy));
      r.x=mid;r.y=s*(clear+G+r.hy);side[i%2]=clear+G+2*r.hy})}
    let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;for(const r of laid){x0=Math.min(x0,r.x-r.hx);x1=Math.max(x1,r.x+r.hx);y0=Math.min(y0,r.y-r.hy);y1=Math.max(y1,r.y+r.hy)}
    const c=D.mid&&laid.find(r=>first(r)===2),cx=c?c.x:(x0+x1)/2,cy=c?c.y:(y0+y1)/2;for(const r of laid){r.x-=cx;r.y-=cy}
  }
  // (each wing beside one of the bands its style lists (flank), either side, where it stands least far out from the army's line, the
  // first so in a tie; clear of all that stands at that depth, the wings before it too)
  flanks(laid,span){
    const G=MARCH_STYLES.gap,ks=this.def.flank.filter(k=>span[k]);
    for(const r of laid.filter(r=>r.band==='wings')){let best=null;
      for(const k of ks.length?ks:[null])for(const s of [1,-1]){const mid=k?(span[k].x0+span[k].x1)/2:0,out=Math.max(0,...laid.filter(q=>q!==r&&q.x!=null&&Math.abs(q.x-mid)<q.hx+r.hx+G).map(q=>s*q.y+q.hy))+G+2*r.hy;
        if(!best||out<best.out)best={x:mid,y:s*(out-r.hy),out}}
      r.x=best.x;r.y=best.y}
  }
  // round the middle (a pack: its leader, else its biggest group there; a caravan: its wagon), the first in front, each as near as
  // keeps a gap from what stands in the middle (by its shape that way) and from its neighbours; facing out round a wagon
  round(laid){
    const G=MARCH_STYLES.gap,out=this.def.ring==='out',c=out?null:laid.find(r=>r.role==='leader')||laid.reduce((a,r)=>r.count>a.count?r:a,laid[0]),ring=laid.filter(r=>r!==c),n=ring.length,big=Math.max(0,...ring.map(marchExtent));
    const reach=(r,a)=>Math.abs(Math.cos(a))*r.hx+Math.abs(Math.sin(a))*r.hy,wagon=marchBodyOf('militia')*WORLD_BATTLE.sprite/WORLD_BATTLE.scale/2,at=i=>i/n*2*Math.PI;
    const R=Math.max(n>1?(2*big+G)/(2*Math.sin(Math.PI/n)):0,...ring.map((r,i)=>(c?reach(c,at(i)):wagon)+(out?r.hx:reach(r,at(i)))+G));
    if(c){c.x=0;c.y=0}ring.forEach((r,i)=>{r.x=Math.cos(at(i))*R;r.y=Math.sin(at(i))*R;if(out)r.face=at(i)});
  }
}
