'use strict';
// Bare hands (battle/combat.js FISTS; the owner, 2026-10-29: "a new origin where you start from nothing", "an unarmed attack:
// mostly a one hand punch, two hands to grapple, a kick", only your hero for now): the Nobody's start (no weapon, a few coins and
// a crust), the Unarmed discipline, the fists' numbers, the combo (jab, cross, kick: each one foe), the grapple (the hard attack:
// seized and thrown), their poses on the sprite, and the brawler's chain on the skill tree.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,ev=s=>(0,eval)(s);
 try{
  // ======== the Nobody: nothing but a little to survive on
  t.act('begin','nobody');const B0=t.BGS.nobody;
  ok(P.bg==='nobody'&&!P.gear.weapon&&t.unarmed()&&P.gold===B0.gold&&P.gold<=10&&B0.cargo.grain>0&&B0.cargo.grain<=4&&!t.troopCount(),'the Nobody starts with no weapon, '+P.gold+' gold and a crust ('+B0.cargo.grain+' grain), no troops');
  ok(P.tree.includes('o_nobody')&&t.TREE.o_nobody.links.includes('start')&&t.TREE.o_nobody.links.includes('fist0'),'their origin on the tree joins the Crossroads and the brawler\'s chain');
  t.showTitle('new');ok(/Nobody/.test(document.getElementById('panel').innerHTML)&&/Bare hands · Unarmed/.test(document.getElementById('panel').innerHTML),'a card of its own on the New game page: bare hands');t.hidePanel();
  ok(t.meleeSk()==='fist'&&t.SKILLS.fist&&P.apt.fist>0,'their discipline is Unarmed, learned faster ('+P.apt.fist+')');
  // ======== the fists' numbers, against a sword
  const fist=t.heroStats();P.gear.weapon=t.gearId('sword',0);const sw=t.heroStats(),sk=t.meleeSk();P.gear.weapon=null;
  ok(sk==='oneh'&&fist.dmg<sw.dmg&&fist.reach<sw.reach&&fist.cd<sw.cd&&fist.dt==='blunt','fists hit softer ('+fist.dmg.toFixed(1)+' vs '+sw.dmg.toFixed(1)+'), reach shorter ('+fist.reach+' vs '+sw.reach+'), swing quicker ('+fist.cd.toFixed(2)+' vs '+sw.cd.toFixed(2)+' s), blunt');
  ok(t.weaponCombo()===t.COMBOS.fists&&t.COMBOS.fists.map(c=>c.n).join()==='Jab,Cross,Kick'&&t.COMBOS.fists.every(c=>c.one&&c.look),'the combo: a jab, a cross and a kick, each with its own look');
  // ======== in battle: each blow strikes one, trains Unarmed and shows its pose
  ev('MANUAL_HERO=true');P.level=5;P.troops={militia:2};P.comps={};P.sk.fist.lv=t.COMBO_UP.third;G.mouse.in=false;P.hp=P.sp=P.mp=null;G.mode='world';G.modal=false;
  G.enc={kind:'party',ref:{cool:0},list:['chief','chief']};t.startBattle({enemies:['chief','chief'],tournament:false});t.beginFight();
  const B=t.B,h=B.hero,foes=B.units.filter(u=>u.team===1);B.noMorale=true;foes.forEach((u,i)=>{u.x=h.x+12+i*2;u.y=h.y;u.cd=9;u.hp=u.max=9999});B.units.filter(u=>u.team===0&&!u.hero).forEach(u=>{u.x=10;u.y=30});B.aim=0;
  const tick=s=>{for(let i=0;i<Math.round(s/.02);i++){if(!t.B)return;h.hp=Math.max(h.hp,h.max*.5);B.hx&&(B.hx.sp=Math.max(B.hx.sp,40));foes.forEach(u=>u.hp=u.max);t.updateBattle(.02)}};
  const xp0=P.sk.fist.xp+P.sk.fist.lv*1e3,looks=[];let hitOne=true;
  for(let k=0;k<3;k++){const hp=foes.map(u=>u.hp);h.cd=0;t.swing();looks.push(h.atkStyle);const hit=foes.filter((u,i)=>u.hp<hp[i]).length;if(hit>1)hitOne=false;tick(.3)}
  ok(looks.join()==='jab,hook,kick','the hero\'s pose follows each blow: '+looks.join(', '));
  ok(hitOne,'a fist strikes one foe, never two');ok(P.sk.fist.xp+P.sk.fist.lv*1e3>xp0,'each blow landed trains Unarmed');
  {const H=t.Moveset.of(h).hard;ok(H&&H.grab&&H.n==='Grapple','the hero\'s hard attack with bare hands: the grapple ('+(H&&H.cd)+' s)');
   const e=foes[0],hp=e.hp;t.heroState().grab(e,H);ok(h.atkStyle==='grapple'&&e.hp<hp&&(e.stun>0||e.kx),'the grapple: seized and thrown, hurt and staggered');}
  // ======== the poses: twelve frames of fists, and the fists up to meet a blow
  {const px=s=>{const c=s.getContext('2d').getImageData(0,0,s.width,s.height).data;let n=0;for(let i=3;i<c.length;i+=4)if(c[i])n++;return n},still=px(t.unitSprite('hero',0,true,0,0,false));let differ=0;
   for(let p=t.FIST_POSE;p<t.FIST_POSE+12;p++)if(px(t.unitSprite('hero',0,true,0,p,false))!==still)differ++;
   ok(differ>=10,differ+' of the 12 bare-handed frames differ from standing (a jab\'s arm out, a kick\'s leg up, a grapple\'s two hands)');
   ok(px(t.unitSprite('hero',0,true,0,t.DEF_POSE,false))!==still,'meeting a blow bare-handed: his fists up')}
  B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
  // ======== the brawler's chain: its talents move the fists' numbers
  {const d0=t.heroStats().dmg,c0=t.heroStats().cd,k0=t.heroCombo()[2].mult;P.tree.push('fist0','fist1','fist2','fist3');const d1=t.heroStats().dmg,c1=t.heroStats().cd,k1=t.heroCombo()[2].mult;
   ok(d1>d0*1.4&&c1<c0&&k1>k0,'Bare Knuckles and Open Hand: harder and quicker blows ('+d0.toFixed(1)+' → '+d1.toFixed(1)+'), Iron Shins a harder kick (×'+k0+' → ×'+k1+')');
   P.gear.weapon=t.gearId('sword',0);const s1=t.heroStats();P.tree=P.tree.filter(id=>!id.startsWith('fist'));const s0=t.heroStats();P.gear.weapon=null;ok(s1.dmg===s0.dmg&&s1.cd===s0.cd,'with a weapon in hand the brawler\'s talents add nothing to its blows');
   ok(['fist0','fist1','fist2','fist3'].every(id=>t.TREE[id].d&&t.TREE[id].br==='might')&&t.TREE.fist0.links.includes('h_arcana_command'),'four nodes, reached from the Nobody\'s origin or from Sage Counsel')}
 }finally{ev('MANUAL_HERO=false');if(t.B){t.B.over=true;t.B.endT=0;t.updateBattle(.01)}}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
