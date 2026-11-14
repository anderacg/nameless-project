'use strict';
// Escape capacity is in simulation seconds of continuous running. Player supplies are separate and unchanged.
const ESCAPE_STAMINA={delay:5,recovery:.1,floor:.55,safe:100,capacity:{worker:16,refugee:18,caravan:24,lord:30,band:24,patrol:28,cparty:28,monster:24,other:20},wild:{rabbit:7,hare:8,fowl:9,deer:16,stag:22,ibex:18,reindeer:22,gazelle:20},mounted:1.25};
const HUNT_AREA={radius:110,hp:4,alertOpen:2,alertCover:4,replan:1,threatShift:60};
// A herd after a hunt (battle/hunting.js finish, world/critters.js Herd): each animal left where it stood, its own spot about the
// herd's point (Herd m), walking back to its place in the herd at gather map px a s (none jumps back); near px: all back, the herd
// as before. Animals still bolting when it ended keep the herd running their way (on: their speed, run s more)
const HERD_SCATTER={on:true,gather:6,near:1,run:4};
// A hunt's tracks (battle/hunting.js HuntTracks): a print every sample field px an animal runs, kept life s, at most keep a beast;
// read by your hunters within read px of one (scout px more a level of Scouting); one with no prey in sight follows the freshest
// trail it reads, ahead prints on from the nearest; drawn as the map's prints (gfx/tracks.js), faded with their age
const HUNT_TRACK={sample:10,life:60,keep:80,read:70,scout:8,ahead:4};
