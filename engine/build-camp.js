'use strict';
/* ---------- PX engine: a camp's tents and pieces as models (the owner, 2026-11-14: "make more tent variety", "make each object such
   as barrel etc more detailed", "if they are a cluster then just stack them", "it should be top down view") ----------
   Registered as a style of its own (no culture builds with it): the tent styles and a camp's pieces as 16 px types, made of the
   model's parts (boxes, roofs, round towers, wheels, decals) so model.js draws them in the map's own view, lit, outlined and snowed
   as every building; a set of models, not a culture (set: PX.MODEL_CULTURES leaves it out). Their cloth and trim come from PX.CAMP_COLOURS (each colour three materials: cloth with seams, hide stitched,
   cloth striped with linen); a spec's lv carries them and a heap's count: lv = 1 + n + 8 * (trim + 64 * cloth) (PX.campLv).
     tents: camp_ridge, camp_bell, camp_tepee, camp_yurt, camp_pavilion, camp_leanto, camp_pup, camp_marquee, camp_porch, camp_hut
     (each varying by its seed: size, door, porch, bands, gear)
     pieces: camp_barrels, camp_crates, camp_sacks, camp_logs (n of them heaped: a bottom row, the rest sitting on it), camp_wagon,
     camp_cart, camp_stall, camp_shrine, camp_rack, camp_mound. At the figures' scale (5 px a metre: a man 8 or 9 px): the tents,
     the wagon and the stall stand in 32 px cells (a door a man walks through, a yurt's wall a man high), the small pieces in 16 ---------- */
(function(PX){
  const COLOURS=['#d8ccb0','#c8b890','#cbbd9c','#e0d6c0','#ece6d4','#d8d0bc','#b09070','#9a7a58','#8a6a4a','#a07850','#8a6040','#b89068','#a89a80','#8a8270',
    '#b0a490','#8a7a5a','#7a7468','#8a8070','#5a9a6a','#4f8a4e','#9ac8a8','#3d74d6','#50a0d0','#3a5a9a','#7a98c8','#c8d8e8','#c58af0','#e0a040','#d8a040','#e0c890',
    '#d85050','#b03a2a','#a04030','#c86a40','#7e2a26','#e07a48','#f0e070','#c8a040','#d8a840','#e8e0b0','#f4f0e8','#5a4a3a','#6a5a4a','#4a4440','#c08040','#2e2a28'];
  PX.CAMP_COLOURS=COLOURS;
  const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]},css=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  // (a colour's four tones, lit to dark: warmer in the light, cooler in the shade, as the model's own ramps)
  const ramp=h=>{const [r,g,b]=hex(h);return[css([r+(255-r)*.28+6,g+(255-g)*.28+3,b+(255-b)*.22]),h,css([r*.74-4,g*.74,b*.78+6]),css([r*.5-6,g*.5,b*.56+8])]};
  const materials={},textures={};COLOURS.forEach((c,i)=>{const R=ramp(c);materials['campC'+i]=R;materials['campH'+i]=R;materials['campS'+i]=R;textures['campC'+i]='canvas';textures['campH'+i]='hide';textures['campS'+i]='awning'});
  // (the nearest of the colours to any colour: a lord's banner, a kind's cloth)
  const near=h=>{const a=hex(h);let best=0,bd=1e9;COLOURS.forEach((c,i)=>{const b=hex(c),d=(a[0]-b[0])**2+(a[1]-b[1])**2*1.3+(a[2]-b[2])**2;if(d<bd){bd=d;best=i}});return best};
  PX.campLv=(cloth,trim,n)=>1+(n|0)+8*(near(trim||'#8a6a4a')+64*near(cloth||'#d8ccb0'));
  const lvOf=o=>{const k=Math.max(0,(o.lv|0)-1);return{n:k%8,t:(k>>3)%64,c:Math.floor(k/512)%64}};
  const C=o=>'campC'+lvOf(o).c,H=o=>'campH'+lvOf(o).c,S=o=>'campS'+lvOf(o).c,Tr=o=>'campC'+lvOf(o).t;
  // (an awning striped in its trim before a tent: half wide w, from v0 to v1, at z, on two poles at its front corners)
  const porch=(Q,o,w,v0,v1,z)=>{Q.box('aw',[-w,w],[v0,v1],[z,z+.5],'campS'+lvOf(o).t,{thin:true,keep:1});for(const a of [-w,w-2])Q.box('ap'+a,[a,a+2],[v1-2,v1],[0,z],'timber',{top:true,fine:true})};
  // (gear by a tent, by its seed: a barrel, a crate, sacks, a woodpile or a stump to sit on; or nothing)
  const gear=(Q,o,u,v)=>{const g=o.d.pick(['barrel','crate','sacks','woodpile','stump',null,null]);if(g)Q.prop(g,[u,v],0,1)};
  // (a thin pole and a pennant of its trim at its head)
  const pennant=(Q,o,u,v,z)=>{Q.box('pole',[u-1,u+1],[v-1,v+1],[z,z+3],'timber',{top:true,fine:true});Q.box('pen',[u+.5,u+2.5],[v-.5,v+.5],[z+2,z+3],Tr(o),{top:true,fine:true,thin:true})};
  const types={
    // (each tent varies by its seed: its size, its door tied open or shut, a porch awning on poles, a painted band, gear before it)
    // a ridge tent (a scale of 5 px a metre, as the figures: a man 8 or 9 px): walls knee high, its ridge over a man's head, its
    // gable and flap to the front, a hem of its trim
    camp_ridge:{cell:32,plan(Q,o){const c=C(o),d=o.d,w=d.pick([5.5,6.5,7.5]);Q.box('t',[-w,w],[-6,6],[0,3],c,{keep:1});Q.roof('t','gable','v',7+w/2.5,c,{o:0,ov:0,lip:1});
      Q.box('tv',[-w-.1,w+.1],[5.4,6.1],[0,1],Tr(o),{thin:true,top:true});Q.dec('t.S',d.chance(.5)?'Flap':'Door',.5,d.chance(.5)?3:0,true);if(d.chance(.35))porch(Q,o,w-1,6,9,5);gear(Q,o,w+2,4)}},
    // a bell tent: its round wall shoulder high, its cone over it with a valance of its trim, a pennant on its pole
    camp_bell:{cell:32,plan(Q,o){const c=C(o),d=o.d,r=d.pick([6.5,7.5,8.5]),h=d.pick([5,6]);Q.round('t',[0,0],r,[0,h],c,{form:'cone',rise:r+1.5,mat:c,o:1});Q.round('tb',[0,0],r+.3,[h-1,h],Tr(o),null);
      Q.dec('t.S','Flap',.5,0);Q.dec('t.S','Flap',.5,4);if(d.chance(.7))pennant(Q,o,0,0,h+r+1);gear(Q,o,r+1.5,3)}},
    // a hide tepee: a tall cone of stitched hides, a band or two painted round it, its poles' tips out of its smoke hole, a bundle by its door
    camp_tepee:{cell:32,plan(Q,o){const h=H(o),d=o.d,r=d.pick([5.5,6.5,7]),rise=d.pick([15,18,20]);Q.round('t',[0,0],r,[0,1],h,{form:'cone',rise,mat:h,o:0,lip:0});Q.round('tb',[0,0],r+.1,[0,.8],Tr(o),null);
      if(d.chance(.5))Q.round('tb2',[0,0],r*.8,[rise*.22,rise*.22+.8],Tr(o),null);Q.box('pl',[-1,1],[-1,1],[rise-1,rise+3],'timber',{top:true,fine:true});Q.dec('t.S','Flap',.5,0);Q.dec('t.S','Flap',.5,4);
      if(d.chance(.6))Q.box('bd',[r-1.5,r+1],[4,6.5],[0,2],'hide',{top:true});else gear(Q,o,-r-1,3)}},
    // a yurt: its felt wall a man high banded in its trim, a low cone roped to the crown ring, its wooden door; a little store yurt by
    // some
    camp_yurt:{cell:32,plan(Q,o){const c=C(o),d=o.d,r=d.pick([7.5,8.5,9.5]);Q.round('t',[0,0],r,[0,8],c,{form:'cone',rise:5,mat:c,o:1});Q.round('tb',[0,0],r+.3,[6,7],Tr(o),null);Q.round('cr',[0,0],2,[13,14],'timber',{form:'lid',mat:'timber'});
      Q.dec('t.S','Door',.5,0);if(d.chance(.4))Q.round('ta',[-r-2,1],3.5,[0,5],c,{form:'cone',rise:2.5,mat:c,o:1});else gear(Q,o,r+1.5,3)}},
    // a pavilion: striped walls a man high and more, a hipped roof, a valance of its trim, a pennant over its middle, a porch on some
    camp_pavilion:{cell:32,plan(Q,o){const c=C(o),d=o.d,w=d.pick([8,9,10]);Q.box('t',[-w,w],[-6.5,6.5],[0,10],S(o),{keep:1});Q.roof('t','hip','u',7,c,{o:1,ov:1,lip:1,finial:1});Q.box('tv',[-w-.3,w+.3],[6.1,6.9],[8,10],Tr(o),{thin:true,top:true});
      Q.dec('t.S','Flap',.5,0);Q.dec('t.S','Flap',.5,4);pennant(Q,o,0,0,17);if(d.chance(.4))porch(Q,o,4,6.5,10,9);else gear(Q,o,w+1.5,4)}},
    // a lean-to: a patched sheet on a bar a man high on two poles, sloping to the ground at its back, a bedroll before it
    camp_leanto:{cell:32,plan(Q,o){const c=C(o),d=o.d,w=d.pick([6,7]);Q.box('t',[-w,w],[-5,4],[0,1],c,{keep:1});Q.roof('t','shed','v',9,c,{o:0,ov:0,lip:1,hi:'b1'});
      for(const a of [-w,w-2])Q.box('po'+a,[a,a+2],[3,5],[0,10],'timber',{top:true,fine:true});for(let k=0,n=d.int(1,3);k<n;k++){const a=d.int(-w+1,w-4),b=d.int(-4,-1);Q.box('pa'+k,[a,a+3],[b,b+2],[5,5.5],Tr(o),{thin:true,top:true,fine:true})}
      Q.box('bed',[-5,0],[5,8],[0,1],Tr(o),{top:true});if(d.chance(.5))Q.prop('woodpile',[w-1,7],0,1);else gear(Q,o,w+1,6)}},
    // a small pup tent: a ridge tent low to the ground, a pack by some
    camp_pup:{cell:16,plan(Q,o){const c=C(o),d=o.d,w=d.pick([3.5,4]);Q.box('t',[-w,w],[-4,4],[0,1],c,{keep:1});Q.roof('t','gable','v',5,c,{o:0,ov:0,lip:1});Q.dec('t.S','Flap',.5,1,true);
      if(d.chance(.5))Q.prop('sacks',[w+1.5,3],0,1)}},
    // a marquee: a long tent of two poles, its gable along it, two pennants, its flaps along its front
    camp_marquee:{cell:32,long:'a marquee is long',plan(Q,o){const c=C(o),d=o.d,w=d.pick([9,10.5]);Q.box('t',[-w,w],[-5,5],[0,4],c,{keep:1});Q.roof('t','gable','u',7,c,{o:0,ov:0,lip:1});
      Q.box('tv',[-w-.2,w+.2],[4.5,5.2],[3,4],Tr(o),{thin:true,top:true});Q.dec('t.S','Flap',.3,0);Q.dec('t.S','Flap',.7,0);for(const a of [-w/2,w/2])pennant(Q,o,a,0,11);gear(Q,o,w+1.5,3)}},
    // a wall tent: upright walls under a gable, an awning striped in its trim on poles before its door
    camp_porch:{cell:32,plan(Q,o){const c=C(o),d=o.d,w=d.pick([6,7]);Q.box('t',[-w,w],[-6,2],[0,5],c,{keep:1});Q.roof('t','gable','v',6,c,{o:0,ov:0,lip:1});Q.dec('t.S','Door',.5,0);
      porch(Q,o,w,2,7,6);gear(Q,o,-w-1.5,-2)}},
    // a hide hut: a low vault of hides on bent poles, its flap to the front, smoke-stained, a rack of drying meat by some
    camp_hut:{cell:32,plan(Q,o){const h=H(o),d=o.d,w=d.pick([6,7.5]);Q.box('t',[-w,w],[-5,5],[0,2],h,{keep:1});Q.roof('t','vault','u',8,h,{o:0,ov:0,lip:1});Q.dec('t.S','Flap',.5,0);
      if(d.chance(.5))Q.box('mr',[w+1,w+3],[0,4],[0,6],'timber',{top:true});gear(Q,o,-w-1.5,3)}},
    // n barrels heaped: a row on the ground, the rest standing on them, hooped in iron
    camp_barrels:{cell:16,plan(Q,o){heap(o,(i,u,v,z)=>{Q.round('b'+i,[u,v],2.2,[z,z+5],'plank',{form:'lid',mat:'plank'});Q.dec('b'+i+'.S','Hoop',.5,1);Q.dec('b'+i+'.S','Hoop',.5,3.5)},4.6,5)}},
    // n crates heaped, their planks braced
    camp_crates:{cell:16,plan(Q,o){heap(o,(i,u,v,z)=>{Q.box('c'+i,[u-2,u+2],[v-2,v+2],[z,z+4],'plank',{top:true});Q.dec('c'+i+'.S','Crate',.5,0)},4.4,4)}},
    // n sacks heaped, a coil of rope by them
    camp_sacks:{cell:16,plan(Q,o){heap(o,(i,u,v,z)=>{Q.round('s'+i,[u,v],1.9,[z,z+2],'linen',{form:'cone',rise:1.5,mat:'linen',o:0,lip:0})},3.6,2.6);Q.box('rp',[4.5,6.5],[1.5,3.5],[0,1],'rope',{top:true})}},
    // logs stacked, each row shorter than the one under it, longer and higher with more of them, a chopping block
    camp_logs:{cell:16,plan(Q,o){const n=Math.max(1,lvOf(o).n),w=Math.min(6,3+n),rows=Math.min(3,1+(n>>1));
      for(let r=0;r<rows;r++){const k=w-r*1.5;Q.box('w'+r,[-k,k],[-2.5+r*.6,2.5-r*.6],[r*2,r*2+2],'log',{top:true})}Q.prop('stump',[w+1.2,3.5],0,1);Q.box('ax',[w+.6,w+2.6],[4,6],[2,3],'iron',{top:true})}},
    // a covered wagon: its bed on two wheels a man's waist high, its cloth hood over a man's head, its shaft
    camp_wagon:{cell:32,long:'a wagon is long',plan(Q,o){const c=C(o);Q.box('b',[-8,6],[-3.5,3.5],[3,6],'plank',{top:true});Q.box('cv',[-7.5,5.5],[-3.5,3.5],[6,8],c,{keep:1,thin:true});Q.roof('cv','vault','u',5,c,{o:0,ov:0,lip:1});
      Q.wheel('wf',-5,3.5,3.5,3.5);Q.wheel('wr',3,3.5,3.5,3.5);Q.box('sh',[6,11],[-.75,.75],[3,4],'timber',{top:true});Q.dec('b.W','hatch',.5,0)}},
    // a cart: an open bed on its wheel, its shafts, a load (sacks, a barrel, hay or logs)
    camp_cart:{cell:16,plan(Q,o){const d=o.d;Q.box('b',[-4,3],[-2.5,2.5],[2,4],'plank',{top:true});Q.wheel('w',-.5,2.5,2,2.5);Q.box('sh',[3,7],[-.5,.5],[2,3],'timber',{top:true});
      const g=d.pick(['sacks','barrel','hay','logs']);Q.prop(g,[-.5,-.5],0,g==='logs'?1:1.5,4)}},
    // a market stall: goods on its counter at a man's waist under an awning striped in its trim on posts over his head
    camp_stall:{cell:32,long:'a counter is long',plan(Q,o){const d=o.d,aw='campS'+lvOf(o).t;Q.box('ct',[-7,7],[0,4],[0,4],'plank',{top:true,topMat:d.pick(['crop','linen','gold']),keep:1});
      for(const [a,b] of [[-8,-4],[7,-4],[-8,4],[7,4]])Q.box('po'+a+b,[a,a+1.5],[b,b+1.5],[0,10],'timber',{top:true});Q.box('aw',[-8.5,8.5],[-4.5,5.5],[10,11],aw,{thin:true,keep:1});Q.roof('aw','gable','u',3,aw,{o:1,ov:0});Q.dec('ct.S','Goods',.5,0)}},
    // a wayside shrine: a stone plinth, a post, a little gabled box with its holy light, two candles, flowers at its foot
    camp_shrine:{cell:16,plan(Q,o){Q.box('pl',[-3,3],[-2,2],[0,2],'stone',{top:true});Q.box('po',[-.6,.6],[-.6,.6],[2,7],'timber',{top:true,fine:true});Q.box('bx',[-2,2],[-1.5,1.5],[7,10],'plank',{keep:1});
      Q.roof('bx','gable','u',2,'plank',{o:1,ov:0});Q.dec('bx.S','Win',.5,1);for(const a of [-2.5,2.5])Q.box('cn'+a,[a-.5,a+.5],[1.5,2.5],[2,3],'linen',{top:true,topMat:'flame',fine:true});
      for(const [a,b] of [[-4,3],[4,3.5],[-3.5,-1]])Q.box('fl'+a,[a-.5,a+.5],[b-.5,b+.5],[0,1],'flower',{top:true,fine:true})}},
    // a drying rack: two posts and a bar, hides stretched on it, a skull on a post
    camp_rack:{cell:16,plan(Q,o){for(const a of [-6,4])Q.box('po'+a,[a,a+2],[-1,1],[0,9],'timber',{top:true,fine:true});Q.box('bar',[-6,6],[-1,1],[8,9],'timber',{top:true,fine:true});
      [[-5,-1.5,'hide'],[-1.5,2,'campH9'],[2,5,'campH10']].forEach(([a,b,m],i)=>Q.box('h'+i,[a,b],[-.2,.2],[2+i%2,8],m,{thin:true,keep:1}));Q.box('sk',[-7,-4.5],[-1,1],[9,11],'bone',{top:true})}},
    // a charcoal mound: earth and turf over the stacked wood, its vents glowing, a rake by it
    camp_mound:{cell:16,plan(Q,o){Q.round('m',[0,0],6,[0,1.5],'soil',{form:'cone',rise:4.5,mat:'soil',o:0,lip:0});Q.round('mt',[0,0],6.2,[0,.6],'moss',null);for(const [a,b] of [[-2.5,4],[2,4.3]])Q.box('v'+a,[a-.6,a+.6],[b,b+.6],[1,2],'darkrock',{top:true,topMat:'flame',fine:true});
      Q.box('rk',[6,6.6],[-1,4],[0,1],'timber',{top:true,fine:true})}}
  };
  // (n of a piece heaped round the plan's middle: a row on the ground (as many as hold the rest), the rest on top in their gaps, each
  // put by at(i, u, v, z); step px apart, h px tall)
  function heap(o,at,step,h){const n=Math.max(1,Math.min(7,lvOf(o).n)),lo=n<=2?n:n<=4?n-1:Math.ceil(n/2)+1,hi=n-lo;let i=0;
    for(let k=0;k<lo;k++)at(i++,(k-(lo-1)/2)*step,lo>3?(k%2?-1.5:1.5):0,0);for(let k=0;k<hi;k++)at(i++,(k-(hi-1)/2)*step,0,h)}
  PX.registerBuildStyle('camp',{set:true,look:{},materials,textures,own:{types}});
  PX.CAMP_TYPES=Object.keys(types);
})(window.PX=window.PX||{});
