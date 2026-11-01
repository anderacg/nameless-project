'use strict';
/* ---------- pronouns: whether a person is a he or a she, and the words that go with it (the owner, 2026-11-01: "the people in
   the world should have gender") ----------
   genderOf(o): 'm' or 'f' for one person; null for no one, a group or someone unknown. o is a record (a lord, a chieftain, a
   story's person), a Character, a companion's id, a name, or your hero (P). Nothing is drawn and nothing stored but your hero's
   choice (P.gender, kept only when 'f', as P.name: a save without it is a man's): each time, from the first that answers:
     o.gender         its own (data people: COMPS; story people made with one);
     FACS[f].gender   a realm's named lords, by their portraits (data/factions.js);
     its title        TITLE_GENDER (Lady, Lord, Clanmother...; Ser, Warden, Captain and the like say nothing);
     its given name   GIVEN_GENDER: the women and men of each name list, given by the list's owner (givenNames: world/folk.js,
                      world/leaders.js);
     a hash           of its name past a neutral title (genderHash): the same name, the same gender, in every game and save.
   pr(o): the words for o ({he, him, his, hers, himself} and capitalised); null, a group: they. lordWord, sirWord, manWord: lord or
   lady, sir or my lady, man or woman. prFill(text, o): a text's {he} {his} {him} {hers} {himself} {lord} {sir} {man} (capitalised
   too: {He}) for o, and {you.he} and the like for your hero. ---------- */
const TITLE_GENDER={Lord:'m',Lady:'f',Thane:'m',Clanmother:'f',Warchief:'m',Warmother:'f',Chief:'m',Chieftess:'f',Brother:'m',Sister:'f',
  Ser:null,Warden:null,Admiral:null,Captain:null};
const GIVEN_GENDER={};
// (a name list's genders: every name in lists a man's, but those in women; lists: an array (of names, or of arrays), or an object
// of arrays)
function givenNames(lists,women){const F=new Set(women);for(const n of (Array.isArray(lists)?lists:Object.values(lists)).flat(Infinity))GIVEN_GENDER[n]=F.has(n)?'f':'m'}
// (a name's hash: the generator's own swap of a lord's title reads it too, world/worldplace.js)
function genderHash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^h>>>15,0x2c1b3c6d);return (h^h>>>13)&1?'f':'m'}
function nameGender(n){
  n=String(n||'').trim();if(!n)return null;
  for(const f in FACS){const g=FACS[f].gender?.[n];if(g)return g}
  const w=n.split(/\s+/),t=TITLE_GENDER[w[0]];if(t)return t;
  const rest=t===null?w.slice(1):w;
  return GIVEN_GENDER[rest[0]]||genderHash(rest.join(' '))}
function genderOf(o){
  if(o==null||Array.isArray(o)||o.group)return null;
  if(o==='m'||o==='f')return o;
  if(typeof P!=='undefined'&&o===P)return P.gender==='f'?'f':'m';
  if(typeof o==='string')return typeof COMPS!=='undefined'&&COMPS[o]?genderOf(COMPS[o]):nameGender(o);
  if(o.gender==='m'||o.gender==='f')return o.gender;
  if(o.isChar)return o.id&&COMPS[o.id]?genderOf(COMPS[o.id]):genderOf(o.o)||nameGender(o.name);
  return nameGender(o.n||o.name)}
const PRONOUNS={m:{he:'he',him:'him',his:'his',hers:'his',himself:'himself'},f:{he:'she',him:'her',his:'her',hers:'hers',himself:'herself'},
  n:{he:'they',him:'them',his:'their',hers:'theirs',himself:'themselves'}};
// (the words that go with one: wife, the word for o's own spouse)
const GENDER_WORDS={lord:{m:'lord',f:'lady',n:'lord'},sir:{m:'sir',f:'my lady',n:'friend'},man:{m:'man',f:'woman',n:'one'},wife:{m:'wife',f:'husband',n:'family'}};
function pr(o){const g=PRONOUNS[genderOf(o)||'n'],out={...g};for(const k in g)out[cap1(k)]=cap1(g[k]);return out}
const genderWord=(k,o)=>GENDER_WORDS[k][genderOf(o)||'n'];
const lordWord=o=>genderWord('lord',o),sirWord=o=>genderWord('sir',o),manWord=o=>genderWord('man',o);
// (a text's tokens for o, and for your hero: {he} {His} {lord} {you.him} ...; others are left as they are. PR_WORDS: the words a
// token may name, for a text's own tokens: story/forms.js)
const PR_WORDS=[...Object.keys(PRONOUNS.m),...Object.keys(GENDER_WORDS)].join('|'),PR_TOKEN=new RegExp('\\{(you\\.)?('+PR_WORDS+')\\}','gi');
const prWord=(k,o)=>{const low=k.toLowerCase(),v=GENDER_WORDS[low]?genderWord(low,o):PRONOUNS[genderOf(o)||'n'][low];return k[0]===k[0].toUpperCase()?cap1(v):v};
function prFill(s,o){return String(s).replace(PR_TOKEN,(m,you,k)=>prWord(k,you?P:o))}
