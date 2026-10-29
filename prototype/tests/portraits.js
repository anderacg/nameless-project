'use strict';
// Named faces follow the person through allegiances, gear changes and captivity, not their troop type.
Kit.suite(({ok})=>{
 const t=T;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});
 const names=t.FIDS.flatMap(f=>t.FACS[f].lords),lords=names.map(name=>t.lordPic({name,fac:t.FIDS.find(f=>t.FACS[f].lords.includes(name))}));
 ok(lords.every(s=>s.startsWith('art/portrait/game/'))&&new Set(lords).size===20,'the twenty founding lords have distinct authored portraits');
 const comps=['brann','elske','tavi','ander'].map(id=>t.portrait(id));
 ok(comps.every(s=>s.startsWith('art/portrait/game/'))&&new Set(comps.concat(lords)).size===24,'all four named companions have their own faces, separate from lords');
 const l={id:'vale0',name:'Lord Aldric',fac:'vale'},a=t.lordPic(l);l.fac='karn';
 ok(t.lordPic(l)===a&&t.TALK_PIC.lord(l)===a,'a lord keeps his face when his allegiance changes, and dialogue uses it');
 ok(t.lordPic({name:'Lord Aldric',fac:'vale'})===a,'a captured record without the world party still resolves the same face');
 const b=t.portrait('brann');t.P.comps.brann={gear:{weapon:'unknown'}};
 ok(t.portrait('brann')===b,'a companion keeps his identity when equipment changes');
 const extra={id:'vale8',name:'Lord Newface',fac:'vale'},fallback=t.lordPic(extra);
 ok(fallback.startsWith('data:image/')&&t.lordPic({...extra})===fallback,'extra generated lords have a stable sprite fallback, with no missing asset URL');
 ok(t.portrait('hum_sword').startsWith('data:image/')&&t.portrait('hero',true).startsWith('data:image/'),'troops and the customizable player retain their generated portraits');
 const card=t.railCard({pic:a,fac:'vale',name:'Lord Aldric',role:'Your prisoner'});
 ok(card.includes('src="'+a+'"')&&!card.includes('rc-em'),'prison cards display the individual face when both face and faction are supplied');
 const known=t.W.lords.find(l=>l.name==='Lord Aldric');if(known){t.KNOWLEDGE.lord(known);ok(t.lordsPage().includes(t.lordPic(known)),'the known-lords journal includes its individual portrait')}
});
