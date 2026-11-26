'use strict';
// How hard a job looks as it is offered (the owner, 2026-11-26: "Add quest difficulty indicator when giving in the board etc, so player
// can decide whether its hard or not"; world/quests.js QUEST_DANGER, JobQuest danger, dangerHtml): a fight's by its foes' power
// against your band's (Easy, Fair, Hard, Deadly), a job with no fight by the land it sends you through; on the board's papers and in
// the offers' facts (a lord's, a giver's).
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,D=t.QUEST_DANGER;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);G.paused=true;
 const towns=t.TOWNS.filter(x=>!x.gone),mk=(k,n)=>{for(const x of towns){const q=t.makeQuest(k,x,null);if(q)return q}return null};
 // (a bounty: its band's strength against yours; more of them, harder; a stronger band of yours, easier)
 const b=mk('bounty');ok(!!b,'a bounty offered');
 if(b){const tr=P.troops;try{P.troops={hum_spear:6};b.n=3;const a=b.danger();b.n=30;const z=b.danger();
   ok(a&&z&&a.by==='foe'&&z.i>a.i&&z.i===3,'a bounty by its band: '+a.n+' for 3 of them, '+z.n+' for 30 ('+z.tip+')');
   P.troops={hum_knight:40};const y=b.danger();ok(y.i<z.i,'your band grown, the same band is less to fear ('+y.n+')')}finally{P.troops=tr}}
 // (beasts by their kind, count and level)
 const m=mk('beast');if(m){const d=m.danger();ok(d&&d.by==='foe'&&D.lv[d.i]===d.n,'beasts by their kind and count: '+d.n+' ('+d.tip+')')}
 // (a letter: no fight, the land on its road)
 const c=mk('courier');if(c){const d=c.danger();ok(d&&d.by==='land'&&/No fight/.test(d.tip),'a letter: no fight, the road\'s land: '+d.n+' ('+d.tip+')')}
 // (on the board's paper and in an offer's facts)
 const q=b||m||c,html=t.NoticeBoard.note(q,0),row=t.offerRow(q,'q-accept',0);
 ok(/class="nb-risk"/.test(html)&&/qdanger d\d/.test(html)&&(html.match(/<i><\/i>/g)||[]).length===4,'on its paper: four pips and its word');
 ok(/<dt>Danger<\/dt>/.test(row)&&/qdanger/.test(row),'in an offer\'s facts, a lord\'s or a giver\'s: its danger');
 // (one taken: none in its facts, it is yours now)
 ok(!/<dt>Danger<\/dt>/.test(t.questFactsHtml(Object.assign(Object.create(Object.getPrototypeOf(q)),q,{id:999}))),'one taken shows none');
 ok(!ERR.length,'no runtime errors')});
