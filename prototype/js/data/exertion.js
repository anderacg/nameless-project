'use strict';
// Escape capacity is in simulation seconds of continuous running. Player supplies are separate and unchanged.
const ESCAPE_STAMINA={delay:5,recovery:.1,floor:.55,safe:100,capacity:{worker:16,refugee:18,caravan:24,lord:30,band:24,patrol:28,cparty:28,monster:24,other:20},wild:{rabbit:7,hare:8,fowl:9,deer:16,stag:22,ibex:18,reindeer:22,gazelle:20},mounted:1.25};
const HUNT_AREA={radius:110,hunters:3,range:70,contact:6,collect:10,escape:4,interval:1.2,shots:12,arrow:140};
