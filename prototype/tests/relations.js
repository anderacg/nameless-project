'use strict';
// Relations: each lord feels something about you (and about each other lord). Fighting beside them, doing their work,
// sparing them and gifts win them; beating, ransoming and failing them sours them, and their friends and rivals feel some
// of it. Friends help you in battle, sworn friends won't attack you, warm ones lend soldiers, cold ones give no work. Lords
// who win together grow closer; rivals won't ride to each other's aid. It all softens over time and is saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,R=t.RELATION;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;W.monsters=[];W.patrols=[];G.quietEvents=true;G.encCool=1e9;
 const panel=()=>document.getElementById('panel').innerHTML,world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.enc=null},done=()=>{t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);world()};
 const L=W.lords.filter(l=>!l.dead),a=L[0],mates=L.filter(l=>l!==a&&l.fac===a.fac);
 ok(L.every(l=>t.relWith(l)===0)&&t.relName(0)==='Neutral','every lord starts neutral toward you');
 ok(mates.every(m=>t.lordRel(a,m)>=15),'lords of one realm start as friends ('+mates.map(m=>t.lordRel(a,m)).join(', ')+')');
 ok(t.lordRel(a,L[5])===t.lordRel(L[5],a),'and how two lords feel is the same both ways');
 // fighting beside a lord
 world();P.troops={hum_knight:20};const ally=L.find(l=>l.fac!==a.fac);Object.assign(ally,{inside:null,x:P.x+10,y:P.y,troops:Array(12).fill('hum_spear')});
 G.enc={kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,troops:['militia','militia']}),list:['militia','militia'],allies:[ally],foes:[]};t.startEncounter(G.enc);t.act('auto');
 ok(t.relWith(ally)===R.fightBeside&&/fought beside them/.test(t.P.lrelWhy[ally.id][0].why),ally.name+' remembers you fought beside them (+'+t.relWith(ally)+')');done();
 // beating a lord: they hate it, their friends somewhat, their rivals are glad
 const foe=a,fr=t.lordFriends(foe).filter(x=>x!==foe)[0],rv=t.lordRivals(foe)[0],fr0=fr?t.relWith(fr):0,rv0=rv?t.relWith(rv):0;
 Object.assign(foe,{inside:null,troops:['hum_levy','hum_levy'],x:P.x+8,y:P.y});P.hostile[foe.fac]=G.day+20;G.enc={kind:'lord',ref:foe,list:foe.troops.slice(),allies:[],foes:[]};t.startEncounter(G.enc);t.act('auto');
 ok(t.relWith(foe)===R.beatThem,'beating '+foe.name+' sours them ('+t.relWith(foe)+')');
 ok(!fr||t.relWith(fr)<fr0,'their friend '+(fr?fr.name:'—')+' thinks less of you too'+(fr?' ('+t.relWith(fr)+')':''));
 ok(!rv||t.relWith(rv)>rv0,'and their rival '+(rv?rv.name:'—')+' is glad'+(rv?' ('+t.relWith(rv)+')':''));done();P.hostile={};
 // gifts and favours
 const b=L.find(l=>!l.dead&&l!==foe&&l!==ally);Object.assign(b,{inside:null,troops:Array(15).fill('hum_spear'),x:P.x+8,y:P.y});P.gold=500;t.lordMeet(b);
 ok(/Toward you/.test(panel())&&/Give 100 gold/.test(panel()),'a lord\'s audience shows how they feel, and offers a gift');
 const gb=t.relWith(b);t.act('lr-gift',b.id);ok(P.gold===500-R.gift.gold&&t.relWith(b)===gb+R.gift.rel,'a gift warms them (+'+R.gift.rel+')');t.act('lr-gift',b.id);ok(t.relWith(b)===gb+R.gift.rel&&P.gold===400,'once a week');
 t.P.lrel[b.id]=R.troopsAt;const tc=t.troopCount(),bt=b.troops.length;P.troops={hum_knight:4};t.lordMeet(b);t.act('lr-troops',b.id);ok(t.troopCount()===4+R.troops&&b.troops.length===bt-R.troops,'a friend lends you '+R.troops+' soldiers from their army');world();
 // no work from a lord who dislikes you; a bonus from a friend
 t.P.lrel[b.id]=R.jobsAt-5;ok(/no work for you/.test(t.lordJobHtml(b)),'a lord who dislikes you has no work for you');
 t.P.lrel[b.id]=60;const q={id:999,lord:true,giver:b.name,fac:b.fac,title:'Test job',reward:{gold:100,xp:0}};P.quests=[q];const g0=P.gold;t.payQuest(q,t.TOWNS[0].name);
 ok(P.gold===g0+100+30&&t.relWith(b)===60+R.jobDone,'a friend pays a bonus for work done ('+(P.gold-g0)+' gold), and likes you more');
 // friendship's protection
 world();P.hostile[b.fac]=G.day+20;P.fac=null;b.x=P.x+5;b.y=P.y;b.cool=0;G.encCool=0;b.troops=Array(30).fill('hum_knight');t.P.lrel[b.id]=R.spareAt+5;
 for(let i=0;i<10;i++)t.updateLords(.05);ok(G.mode==='world'&&!G.enc,'a sworn friend will not attack you, even when their realm is hostile');
 t.lordMeet(b);ok(/will not draw on a friend/.test(panel())&&G.mode==='dialog'&&!G.enc.list,'and meets you in peace');world();P.hostile={};
 const h=L.find(l=>!l.dead&&l.fac!==b.fac&&l!==foe);Object.assign(h,{inside:null,x:P.x+20,y:P.y,troops:Array(10).fill('hum_spear'),state:'rest'});P.honor[h.fac]=0;
 G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:['militia']};t.P.lrel[h.id]=0;ok(!t.nearAllies(G.enc).includes(h),'a lord who is merely neutral leaves you to it');
 t.P.lrel[h.id]=R.helpAt;ok(t.nearAllies(G.enc).includes(h),'a friend rides to help you');G.enc=null;
 // parley: a friend yields more readily
 t.P.lrel[h.id]=0;for(let n=1;n<60;n++){h.troops=Array(n).fill('hum_spear');const c=t.yieldChance(h,'lord');if(c<.6)break}// a lord who might go either way
 const yc0=(t.P.lrel[h.id]=0,t.yieldChance(h,'lord')),yc1=(t.P.lrel[h.id]=60,t.yieldChance(h,'lord'));ok(yc1>yc0,'a friend is likelier to yield to you ('+Math.round(yc0*100)+'% → '+Math.round(yc1*100)+'%)');
 // lords between themselves
 const x1=L[1],x2=L.find(l=>l.fac!==x1.fac),r0=t.lordRel(x1,x2);t.changeLordRel(x1,x2,R.together);ok(t.lordRel(x1,x2)===Math.min(100,r0+R.together),'lords who win side by side grow closer');
 // the days soften it
 t.P.lrel[b.id]=50;t.relDay();ok(t.relWith(b)<50&&t.relWith(b)>45,'feelings soften a little each day');
 // saved, and listed
 t.P.lrel[b.id]=33;W.lrel={'x|y':7};t.saveGame(true);t.P.lrel={};W.lrel={};t.loadGame();ok(t.relWith(W.lords.find(l=>l.id===b.id))===33&&W.lrel['x|y']===7,'relations are saved');
 world();t.openChar();t.act('char-tab','lords');ok(/Lords/.test(panel())&&new RegExp(b.name).test(panel())&&/Friend|Warm/.test(panel()),'the character screen lists every lord and how they feel');t.act('char-close');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
