/* Native adapter parity, lossless frame data and portable source checks. */
(function(){
 'use strict';
 const A=SpriteAssets,lines=[],ok=(value,name)=>{if(!value)throw Error(name);lines.push('PASS '+name);},pixels=c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 try{
  ok(new Set(A.catalog.map(e=>e.id)).size===A.catalog.length,'catalog identifiers are unique');
  const wolf=A.project('monster:wolf');ok(equal(pixels(A.image(wolf.frames[0])),pixels(cellOf(PX.beast('wolf',{pose:0,v:0,team:1})))),'monster pixels match the native beast generator');
  const animal=A.project('animal:deer');ok(equal(pixels(A.image(animal.frames[0])),pixels(critterSprite('deer',0))),'wildlife uses the actual world drawing source');
  const weapon=A.project('weapon:sword'),raw=weaponSprite('sword','blue','#e8c39e',0);ok(equal(pixels(A.image(weapon.frames[0])),pixels(raw))&&weapon.frames[0].anchors.pivot[0]===raw.R,'weapon pixels and grip pivot match the game');
  const troop=A.project('unit:hum_spear');ok(equal(pixels(A.image(troop.frames[0])),pixels(cellOf(peopleSprite(lookOf('hum_spear',0,false,0),0)))),'unit artwork matches the game figure renderer');
  ok(wolf.frames.some(f=>f.clip==='Death')&&wolf.frames.some(f=>f.clip==='Attack')&&weapon.frames.length===WEAPON_STEPS,'native attacks, death poses and weapon rotations remain separate frames');
  const changed=A.clone(wolf),f=changed.frames[0];f.palette.push('#ff00ffff');f.pixels[0]=f.palette.length-1;ok(A.image(f).toDataURL()!==A.image(wolf.frames[0]).toDataURL()&&A.image(changed.frames[1]).toDataURL()===A.image(wolf.frames[1]).toDataURL(),'painting one frame leaves other frames intact');
  f.pixels[0]=-1;ok(A.image(f).getContext('2d').getImageData(0,0,1,1).data[3]===0,'erasing a pixel produces transparency');
  changed.left=true;const normal=A.image(wolf.frames[0]),left=A.image(wolf.frames[0],{left:true}),a=pixels(normal),b=pixels(left),w=normal.width;for(let y=0;y<normal.height;y++)for(let x=0;x<w;x++)for(let k=0;k<4;k++)if(a[(y*w+x)*4+k]!==b[(y*w+w-1-x)*4+k])throw Error('Mirror mismatch');ok(true,'mirroring preserves every source pixel');
  ok(equal(A.read(JSON.parse(JSON.stringify(changed))),changed),'project JSON preserves frame data, durations, pivots and facing');
  const registry={};new Function('globalThis',A.source(changed))(registry);ok(equal(registry.AshmarkSpriteAssets[changed.id],changed),'JavaScript source recreates the complete asset');
  let bad=0;for(const value of [{}, {...wolf,frames:[]},{...wolf,frames:[{...wolf.frames[0],pixels:[999999]}]}])try{A.read(value);}catch(e){bad++;}ok(bad===3,'invalid and unrelated project data is rejected');
  const small={...A.clone(wolf.frames[0]),width:2,height:3,pixels:[-1,0,0,-1,-1,0],anchors:{pivot:[1,2]}},mixed=A.read({...wolf,left:true,frames:[wolf.frames[0],small]}),sheet=A.sheet(mixed),cell=sheet.manifest.frames[1];ok(cell.width===wolf.frames[0].width&&cell.height===wolf.frames[0].height&&cell.anchors.pivot[0]===small.width-1-1+cell.offset[0]&&cell.anchors.pivot[1]===2+cell.offset[1],'mixed-size sheet cells align mirrored pivots with their padding');
  for(const [i,f]of mixed.frames.entries()){const cell=sheet.manifest.frames[i],c=document.createElement('canvas');c.width=cell.width;c.height=cell.height;c.getContext('2d').drawImage(A.image(f,{left:true}),...cell.offset);const actual=Array.from(sheet.image.getContext('2d').getImageData(cell.x,cell.y,cell.width,cell.height).data);if(!equal(pixels(c),actual))throw Error('Sheet cell pixel mismatch');}ok(true,'sheet PNG cells match independently rendered frames');
  lines.push('DONE '+(lines.length)+' checks');
 }catch(e){lines.push('FAIL '+e.message);console.error(e);}
 document.getElementById('out').textContent=lines.join('\n');window.assetCheckResults=lines;
})();
