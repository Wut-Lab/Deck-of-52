/* The rules of the game, with no 3D or buttons in them, so they are easy to read, test and change.
   Goal: pick 2-5 of the 5 dealt cards whose values add up as close to the target as possible without going over. */
(function(root){
"use strict";

// Card values: Ace = 1, number cards = their number, Jack/Queen/King = 11
const value=rank=>rank==="A"?1:"JQK".includes(rank)?11:Number(rank);

const HAND=5,MIN_CARDS=2,ROUNDS=5;

// Closeness: an exact hit is worth 100, and every point short of the target costs 10
const EXACT=100,PER_POINT_SHORT=10;
// Using more cards multiplies the score
const CARD_BONUS={2:1,3:1.5,4:2,5:3};

// Score a play. values = the values of the chosen cards.
function score(target,values){
  const sum=values.reduce((a,b)=>a+b,0),n=values.length;
  const r={sum,cards:n,gap:target-sum,valid:n>=MIN_CARDS&&n<=HAND&&sum<=target};
  r.close=r.valid?Math.max(0,EXACT-r.gap*PER_POINT_SHORT):0;
  r.mult=CARD_BONUS[n]||0;
  r.points=Math.round(r.close*r.mult);
  r.exact=r.valid&&r.gap===0;
  return r;
}

// The best play possible with this hand: try every group of 2-5 cards (only 26 groups, so just try them all)
function best(target,values){
  let top=null;
  for(let mask=0;mask<1<<values.length;mask++){
    const pick=values.map((v,i)=>i).filter(i=>mask&1<<i);
    if(pick.length<MIN_CARDS)continue;
    const r=score(target,pick.map(i=>values[i]));
    if(r.valid&&(!top||r.points>top.points))top={...r,pick};
  }
  return top;
}

// Choose the target for a hand: somewhere from 10 to 40, but never so low that no two cards fit under it
function makeTarget(values,random=Math.random){
  const [a,b]=[...values].sort((x,y)=>x-y);
  const lo=Math.max(10,a+b),hi=40;
  return lo+Math.floor(random()*(hi-lo+1));
}

const Rules={value,score,best,makeTarget,HAND,MIN_CARDS,ROUNDS,CARD_BONUS,EXACT,PER_POINT_SHORT};
if(typeof module==="object"&&module.exports)module.exports=Rules; // lets the tests load it in Node
else root.Rules=Rules;
})(this);
