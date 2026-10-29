'use strict';
// Named faces follow the person through allegiances, gear changes and captivity, not their troop type.
Kit.suite(({ok})=>{
 const t=T;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});
 const names=t.FIDS.flatMap(f=>t.FACS[f].lords),lords=names.map(name=>t.lordPic({name,fac:t.FIDS.find(f=>t.FACS[f].lords.includes(name))}));
 ok(lords.every(s=>s.startsWith('art/portrait/game/'))&&new Set(lords).size===20,'the twenty founding lords have distinct authored portraits');
 const comps=['brann','elske','tavi','ander'].map(id=>t.portrait(id));
 ok(comps.every(s=>s.startsWith('art/portrait/game/'))&&new Set(comps.concat(lords)).size===24,'all four named companions have their own faces, separate from lords');
 const animals=['bear','wolf','boar','tiger','griffin','dragon'];
 for(const id of animals){const pic=t.portrait(id);ok(pic.startsWith('art/portrait/game/'+id+'.webp?v='),'the '+id+' uses its corrected animal-pose artwork in the game');ok(t.unitCard(id).includes('src="'+pic+'"'),'the '+id+' unit card displays that same corrected portrait')}
 const l={id:'vale0',name:'Lord Aldric',fac:'vale'},a=t.lordPic(l);l.fac='karn';
 ok(t.lordPic(l)===a&&t.TALK_PIC.lord(l)===a,'a lord keeps his face when his allegiance changes, and dialogue uses it');
 ok(t.lordPic({name:'Lord Aldric',fac:'vale'})===a,'a captured record without the world party still resolves the same face');
 const b=t.portrait('brann');t.P.comps.brann={gear:{weapon:'unknown'}};
 ok(t.portrait('brann')===b,'a companion keeps his identity when equipment changes');
 const extra={id:'vale8',name:'Lord Newface',fac:'vale'},fallback=t.lordPic(extra);
 ok(fallback.startsWith('data:image/')&&t.lordPic({...extra})===fallback,'extra generated lords have a stable sprite fallback, with no missing asset URL');
 // (the troops' painted portraits, the owner 2026-10-29: "change all unit icon to portrait"; the battle's own cards keep the sprite)
 {const types=Object.keys(t.ST),miss=types.filter(k=>!t.portrait(k).startsWith('art/portrait/game/'));
  ok(!miss.length,'every one of the '+types.length+' unit types shows a painted portrait'+(miss.length?': not '+miss.slice(0,6).join(', '):''));
  ok(t.portrait('hum_sword').startsWith('art/portrait/game/hum_sword.webp?v=')&&t.portrait('hero',true).startsWith('data:image/'),'a troop\'s is its kind\'s painted portrait; the customizable player keeps the generated one');
  ok(t.hudPic('hum_sword').startsWith('data:image/')&&t.hudPic('brann')===t.portrait('brann'),'the battle\'s own cards keep the sprite for troops (a named face stays a face)')}
 // (the unit card: a button shows its sprite, enlarged and played through its poses; again, the portrait)
 {const panel=document.getElementById('panel');t.showPanel(t.unitCard('hum_sword'));const card=panel.querySelector('.ucard-x'),img=card.querySelector('img.uc-pic'),cv=card.querySelector('canvas.uc-anim');
  ok(img.src.includes('hum_sword.webp')&&cv.hidden&&card.querySelector('.uc-sprbtn[data-act="uc-sprite"]'),'its card: the portrait, and a View sprite button');
  t.act('uc-sprite','hum_sword');const px=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<px.length;i+=4)if(px[i])n++;
  const seq=t.SpriteView.poses('hum_sword',false),walk=seq.some(p=>p>=2&&p<=5),blow=seq.some(p=>p>=6&&p<=14),beast=t.SpriteView.poses('wolf',false);
  ok(!cv.hidden&&img.hidden&&n>200&&cv.tick&&/View portrait/.test(card.innerHTML),'pressed: the sprite in its place, drawn large ('+n+' pixels), playing (the button now says View portrait)');
  ok(seq.length>20&&walk&&blow&&beast.length&&beast.every(p=>t.PX.BEAST_POSES.includes(p)),'played through its poses: standing, walking, running and its blows; a beast through its own');
  t.act('uc-sprite','hum_sword');ok(cv.hidden&&!img.hidden,'pressed again: the portrait back');t.hidePanel()}
 const card=t.railCard({pic:a,fac:'vale',name:'Lord Aldric',role:'Your prisoner'});
 ok(card.includes('src="'+a+'"')&&!card.includes('rc-em'),'prison cards display the individual face when both face and faction are supplied');
 const known=t.W.lords.find(l=>l.name==='Lord Aldric');if(known){t.KNOWLEDGE.lord(known);ok(t.lordsPage().includes(t.lordPic(known)),'the known-lords journal includes its individual portrait')}
});
