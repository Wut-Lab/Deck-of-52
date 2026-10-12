// Checks the rules work as intended. Run with:  node rules.test.js
const assert=require("node:assert");
const R=require("./rules.js");

// card values
assert.equal(R.value("A"),1);
assert.equal(R.value("7"),7);
assert.equal(R.value("10"),10);
for(const r of"JQK")assert.equal(R.value(r),11);

// exact hit with 2 cards = 100
assert.equal(R.score(21,[10,11]).points,100);
assert.ok(R.score(21,[10,11]).exact);
// 3 short with 2 cards = 70
assert.equal(R.score(21,[7,11]).points,70);
// same closeness, more cards = more points
assert.equal(R.score(21,[3,7,11]).points,150);
assert.equal(R.score(21,[1,2,3,4,11]).points,300);
// going over scores nothing
assert.equal(R.score(20,[10,11]).points,0);
assert.equal(R.score(20,[10,11]).valid,false);
// fewer than 2 cards is not a valid play
assert.equal(R.score(20,[11]).valid,false);
// 10 or more short scores nothing
assert.equal(R.score(30,[2,3]).points,0);

// best play: should find 1+2+3+4+11 = 21 using all five
const b=R.best(21,[1,2,3,4,11]);
assert.equal(b.sum,21);assert.equal(b.cards,5);

// targets always leave room for at least two cards
for(let i=0;i<2000;i++){
  const hand=Array.from({length:5},()=>R.value("A2345678910JQK".match(/10|./g)[Math.floor(Math.random()*13)]));
  const t=R.makeTarget(hand);
  assert.ok(t>=10&&t<=40);
  assert.ok(R.best(t,hand),"some play must fit under "+t+" for "+hand);
}
console.log("All rules tests passed");
