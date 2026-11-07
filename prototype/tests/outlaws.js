'use strict';
// Outlaws (data/outlaws.js; the owner, 2026-11-07: "add more variations for bandits not to use the soldier knight sprites"): a band's
// men its own kinds, as strong as the kinds they stand for; none of the realms' soldiers among bandits; each man dressed his own way,
// his side's colour on a headscarf or a sash, never a tabard; off, the old troops
Kit.suite(({ok,info})=>{const t=T;Kit.begin('soldier');
  const K=t.OUTLAWS.kinds.map(k=>k[0]);
  ok(K.every(k=>t.ST[k]&&t.ST[k].hp===t.ST[t.OUTLAWS.kinds.find(q=>q[0]===k)[2]].hp&&t.PEOPLE_LOOK[k]),'five outlaw kinds, each as strong as the kind it stands for, each its own look');
  const keep=Math.random;let list=[];try{Math.random=t.seeded(7);for(let i=0;i<40;i++)list.push(...t.makeEnemies(8,i%4===0,'bandits'))}finally{Math.random=keep}
  const soldiers=list.filter(k=>['militia','spearman','archer','orc_grunt'].includes(k)),kinds=new Set(list);info('kinds in 40 bands: '+[...kinds].join(', '));
  ok(!soldiers.length&&K.every(k=>kinds.has(k)),'bandits: every outlaw kind among them, none of the realms\' soldiers ('+soldiers.length+')');
  const px=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data.join(),looks=new Set([0,1,2,3,4,5].map(v=>px(t.unitSprite('band_cutthroat',1,false,v))));
  ok(looks.size===6,'six cutthroats, six looks ('+looks.size+')');
  const parts=[0,1,2,3,4,5].map(v=>t.dollParts(t.spriteLook('band_looter',1,false,v)).map(p=>p[0]));
  ok(parts.every(p=>!p.includes('tabard')&&p.includes('sash')),'an outlaw wears no tabard, his side on a sash (and a headscarf)');
  t.OUTLAWS.on=false;try{Math.random=t.seeded(7);ok(t.makeEnemies(8,false,'bandits').every(k=>!K.includes(k)),'off: the old troops')}finally{t.OUTLAWS.on=true;Math.random=keep}
});
