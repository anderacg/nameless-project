'use strict';
// Companions grow as you do: they share your experience and level up (a perk every third level), wear the gear you give them
// (and it shows), learn disciplines by fighting, and one you trust leads a party of your soldiers on the map: riding with you,
// patrolling and hiring, coming back, fighting beside you.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;W.monsters=[];W.critters=[];t.bandits.length=0;
 P.comps={brann:{ap:0,role:''}};const c=t.compInit('brann');
 ok(c.lv===1&&c.sk.oneh.lv===3&&c.sk.lead.lv===2,'Brann joins at level 1 with the disciplines he brings (One-Handed 3, Leadership 2)');
 const s0=t.compStats('brann');ok(s0.hp>=t.ST.brann.hp&&s0.dmg>t.ST.brann.dmg,'his One-Handed already adds to his damage ('+t.ST.brann.dmg+' → '+s0.dmg+')');
 // shared experience, levels and perks
 t.gainXp(500);ok(c.lv>=3&&c.perkPend>=1,'he shares the experience you gain and levels up (level '+c.lv+', a perk to choose)');
 const s1=t.compStats('brann');ok(s1.hp>s0.hp&&s1.dmg>s0.dmg,'each level makes him stronger ('+s0.hp+' → '+s1.hp+' health)');
 G.mode='world';G.modal=false;t.hidePanel();t.openComp('brann');ok(G.mode==='comp'&&/Choose|Stalwart/.test(document.getElementById('panel').innerHTML),'his window offers the perk');
 t.act('cm-perk','stalwart');ok(c.perks.includes('stalwart')&&t.compStats('brann').hp>s1.hp,'Stalwart: more health');
 // gear
 const sw=t.gearId('greatsword',3);t.invAdd('gear',sw,1);const i=P.inv.findIndex(x=>x&&x.id===sw),spr0=t.unitSprite('brann',0,false,0,0);
 t.act('cm-eq','weapon:'+i);ok(c.gear.weapon===sw&&!P.inv.some(x=>x&&x.id===sw),'you give him a Silver Greatsword from your bag');
 const s2=t.compStats('brann');ok(s2.dmg>s1.dmg&&t.compMeleeSk('brann')==='twoh','it adds to his damage, and he fights two-handed now');
 ok(t.unitSprite('brann',0,false,0,0)!==spr0,'and it shows on him');
 t.act('cm-off','weapon');ok(!c.gear.weapon&&P.inv.some(x=>x&&x.id===sw),'he gives it back when you ask');t.act('cm-eq','weapon:'+P.inv.findIndex(x=>x&&x.id===sw));
 // disciplines by fighting
 {const b0=c.sk.twoh.lv*1e4+c.sk.twoh.xp;t.compTrain('brann',t.compMeleeSk('brann'),5);ok(c.sk.twoh.lv*1e4+c.sk.twoh.xp>b0,'his blows train the discipline of his weapon (Two-Handed)')}
 // in battle with his own stats
 {t.act('cm-back');G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_levy:3};G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['bandit']};
  const ST=t.ST;if(!ST.bandit)G.enc.list=['militia'];t.startBattle({enemies:G.enc.list,tournament:false});const u=t.B.units.find(x=>x.comp&&x.type==='brann');
  ok(u&&u.max>=t.compStats('brann').hp*.8,'in battle he fights with his grown stats ('+(u&&u.max)+' health)');t.B.over=true;t.B.win=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0])}
 // a role uses his own discipline
 P.comps.elske={ap:0,role:'surgeon'};t.compInit('elske');ok(t.roleBonus('med')===2+Math.floor(t.compSkill('elske','med')/3),'Elske as surgeon adds her own Medicine');
 // leading a party (on open ground 8 tiles every way round you: a generated world's start may stand among hills, then the
 // nearest such spot)
 {const TL=t.TILE,open=(x,y)=>{for(let j=-8;j<=8;j++)for(let i=-8;i<=8;i++){const k=t.tAt(x+i,y+j);if(k!==t.T_OPEN&&k!==t.T_ROAD)return false}return true},x0=Math.floor(P.x/TL),y0=Math.floor(P.y/TL);
  if(!open(x0,y0))find:for(let r=1;r<80;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(Math.max(Math.abs(i),Math.abs(j))===r&&open(x0+i,y0+j)){P.x=(x0+i+.5)*TL;P.y=(y0+j+.5)*TL;break find}}
 G.mode='world';G.modal=false;t.hidePanel();c.ap=0;P.troops={hum_levy:8};ok(t.cpGive('brann','hum_levy',3)===0,'he will not lead your soldiers until he trusts you');
 c.ap=3;ok(t.cpGive('brann','hum_levy',4)===4&&c.party&&P.troops.hum_levy===4,'trusted, he takes 4 soldiers to lead');
 ok(!t.compsInBand().includes('brann'),'while he leads them he is not in your band');
 const p=c.party;P.x+=60;for(let k=0;k<40;k++)t.updateCParties(.1);ok(Math.hypot(p.x-P.x,p.y-P.y)<40,'his party rides with you');
 t.cpOrder('brann','patrol');const base=t.townBy(p.base);ok(!!base,'ordered to patrol, he takes the land of '+p.base);
 p.x=base.x;p.y=base.y+20;t.ensureEcon(base);base.vol=6;P.gold=500;const n0=p.troops.length;t.compDay();ok(p.troops.length>n0&&P.gold<500,'patrolling, he hires its volunteers with your gold ('+n0+' → '+p.troops.length+')');
 // fighting beside you
 {p.order='follow';p.x=P.x+20;p.y=P.y;G.mode='world';G.modal=false;G.encCool=0;const b={x:P.x+5,y:P.y,n:4,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(t.asParty(b));
  t.startEncounter({kind:'party',ref:b,n:4,band:'bandits'});ok(G.enc&&G.enc.allies.some(a=>a.src===p),'near you, his party rides into your battles');t.act('flee');t.hidePanel();G.mode='world';G.modal=false}
 // coming back
 t.cpOrder('brann','return');for(let k=0;k<120&&c.party;k++)t.updateCParties(.1);ok(!c.party&&P.troops.hum_levy>=4+n0,'told to come back, he rejoins you with his soldiers');
 // a broken party
 {c.ap=3;t.cpGive('brann','hum_levy',2);const q=c.party;// (fleeing above cost his trust: Brann hates running)
  t.uidOf(q);q.fight=null;t.routParty(q,[]);ok(!c.party&&c.hurt>G.day&&!t.compsInBand().includes('brann'),'if his party is broken, he comes back wounded for a few days')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
