/* Dungeon of 52: the rules of the card RPG, with no drawing code, so they can also be run and tested on their own.

   The whole deck is the dungeon. Each room is four cards dealt face up; deal with three of them and the fourth
   waits for the next room. Or flee an untouched room: its cards go to the bottom of the deck.
     ♠ ♣  monsters. 2-10 are worth their number; J 11, Q 12, K 13, A 14 are bosses.
     ♦    weapons (2-10). A monster's value minus your weapon's is the damage you take. Every kill dulls the
          weapon: afterwards it only works on monsters no stronger than the last one it killed.
     ♥    potions (2-10). Heal that much, but only the first potion in each room works.
     red J Q K A   allies and relics.
   Kill monsters for XP and level up. Clear the deck to win. Cards are named like "10H" or "QS". */
(function(){
"use strict";
const VALUE=r=>({A:14,K:13,Q:12,J:11})[r]||+r;
const rankOf=c=>c.slice(0,-1),suitOf=c=>c.slice(-1),valueOf=c=>VALUE(rankOf(c));
const SUIT_SIGN={S:"♠",H:"♥",D:"♦",C:"♣"};
const label=c=>rankOf(c)+SUIT_SIGN[suitOf(c)];

const MONSTERS={
  S:[,,"Bat","Skeleton","Ghoul","Wraith","Zombie Knight","Banshee","Vampire","Lich","Death Knight","the Assassin","the Witch Queen","the Black King","the Dragon"],
  C:[,,"Rat","Goblin","Wolf","Orc","Bandit","Cave Bear","Troll","Ogre","Minotaur","the Bandit Captain","the Sorceress","the Warlord King","the Hydra"],
};
const WEAPONS=[,,"Knife","Dagger","Hand Axe","Mace","Short Sword","Spear","Longsword","War Hammer","Greatsword"];
const POTION=v=>v<=4?"Minor Healing Potion":v<=7?"Healing Potion":"Greater Healing Potion";
const ALLIES={
  JH:{name:"the Healer",text:"Heals you to full health."},
  QH:{name:"the Priestess",text:"Blesses you: +4 maximum health, and heals 4."},
  KH:{name:"the Paladin King",text:"Grants a holy shield that blocks the next blow completely."},
  AH:{name:"the Phoenix Feather",text:"Kept until needed: if you fall, you rise again with 10 health."},
  JD:{name:"the Blacksmith",text:"Sharpens your weapon: +1, and it is no longer dulled."},
  QD:{name:"the Enchantress",text:"Enchants your weapon: +2."},
  KD:{name:"the Royal Armoury",text:"Arms you with the Royal Blade (11)."},
  AD:{name:"Dragonslayer",text:"A legendary blade (9) that never dulls."},
};
const CLASSES={
  knight:{name:"Knight",hp:24,text:"24 health. Hard to kill."},
  rogue:{name:"Rogue",hp:22,text:"22 health. Can flee any untouched room, even twice in a row."},
  cleric:{name:"Cleric",hp:20,text:"20 health. Potions heal 1 more, and two potions work in each room."},
};
const LEVELS=[0,12,30,55,85,120,160]; // total XP needed for each level

// what a card is, in this game
function info(c){
  const s=suitOf(c),v=valueOf(c);
  if(s==="S"||s==="C")return{kind:"monster",name:MONSTERS[s][v],value:v,boss:v>10};
  if(ALLIES[c])return{kind:"ally",...ALLIES[c],value:v};
  if(s==="D")return{kind:"weapon",name:WEAPONS[v],value:v};
  return{kind:"potion",name:POTION(v),value:v};
}

function fullDeck(){const d=[];for(const s of"SHDC")for(const r of["A","2","3","4","5","6","7","8","9","10","J","Q","K"])d.push(r+s);return d}
function shuffled(rand=Math.random){const d=fullDeck();for(let i=d.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}

class Game{
  // deck: card names, the last one is the top card
  constructor(cls="knight",deck=shuffled()){
    this.cls=cls;this.hero=CLASSES[cls];
    this.maxHp=this.hp=this.hero.hp;this.xp=0;this.level=1;
    this.deck=[...deck];this.room=[null,null,null,null];this.discard=[];
    this.weapon=null;  // {card, name, value, limit (strongest monster it still works on, or null), neverDull}
    this.slain=[];     // monsters killed with the current weapon, piled on it
    this.relics=[];    // allies kept until used: the Phoenix Feather and the holy shield
    this.done=0;this.drunk=0;this.fledLast=false;
    this.over=null;    // "won" or "lost"
    this.log=[];this.say(`You enter the dungeon as a ${this.hero.name}.`);
    this.fill();
  }
  say(t){this.log.push(t)}
  get roomCards(){return this.room.filter(Boolean)}
  get cardsLeft(){return this.deck.length+this.roomCards.length}
  get nextLevel(){return LEVELS[this.level]??null}
  // deal new cards into the empty slots
  fill(){
    for(let i=0;i<4;i++)if(!this.room[i]&&this.deck.length)this.room[i]=this.deck.pop();
    this.done=0;this.drunk=0;
  }
  canFlee(){return!this.over&&this.done===0&&this.deck.length>0&&(!this.fledLast||this.cls==="rogue")}
  flee(){
    if(!this.canFlee())return;
    const fled=this.roomCards;this.room=[null,null,null,null];
    this.deck.unshift(...fled.reverse()); // to the bottom of the deck
    this.fledLast=true;this.say("You slip away. The room's cards go to the bottom of the deck.");
    this.fill();
  }
  // can the current weapon be used on this monster?
  weaponWorks(v){return!!this.weapon&&(this.weapon.limit==null||v<=this.weapon.limit)}
  // the choices a card in the room offers, each {id, label, detail}
  options(c){
    if(this.over||!this.room.includes(c))return[];
    const i=info(c);
    if(i.kind==="monster"){
      const o=[],shield=this.relics.some(r=>r==="KH");
      if(this.weaponWorks(i.value)){const dmg=shield?0:Math.max(0,i.value-this.weapon.value);o.push({id:"weapon",label:`Fight with ${this.weapon.name}`,detail:`take ${dmg}`})}
      o.push({id:"bare",label:"Fight barehanded",detail:`take ${shield?0:i.value}`});
      return o;
    }
    if(i.kind==="weapon")return[{id:"take",label:`Equip ${i.name}`,detail:this.weapon?`drops your ${this.weapon.name}`:""}];
    if(i.kind==="potion"){const heal=this.potionHeal(i.value);return[{id:"take",label:"Drink",detail:heal==null?"no effect: you already drank this room":`heal ${Math.min(heal,this.maxHp-this.hp)}`}]}
    return[{id:"take",label:`Meet ${i.name}`,detail:""}];
  }
  potionHeal(v){const extra=this.cls==="cleric";return this.drunk<(extra?2:1)?v+(extra?1:0):null}
  // why the weapon can't be used on a monster, if it can't
  weaponNote(c){
    const i=info(c);
    if(i.kind!=="monster"||!this.weapon||this.weaponWorks(i.value))return"";
    return`Your ${this.weapon.name} is too dull for it: it now only works on monsters of ${this.weapon.limit} or less.`;
  }
  act(c,opt){
    const slot=this.room.indexOf(c);if(this.over||slot<0)return;
    const i=info(c);this.room[slot]=null;
    if(i.kind==="monster")this.fight(c,i,opt==="weapon"&&this.weaponWorks(i.value));
    else if(i.kind==="weapon")this.equip(c,i.name,i.value,false);
    else if(i.kind==="potion")this.drink(c,i);
    else this.meet(c,i);
    this.done++;this.fledLast=false;
    if(this.over)return;
    if(!this.roomCards.length&&!this.deck.length){this.over="won";this.say(`You have cleared the dungeon! Score: ${this.score()}.`);return}
    if(this.done>=3||!this.roomCards.length)this.fill(); // three cards dealt with: on to the next room
  }
  fight(c,i,armed){
    const shield=this.relics.indexOf("KH");
    let dmg=armed?Math.max(0,i.value-this.weapon.value):i.value;
    const who=i.boss?i.name:`a ${i.name}`;
    if(dmg>0&&shield>=0){this.relics.splice(shield,1);this.discard.push("KH");this.say(`The holy shield takes the blow from ${who}, and fades.`);dmg=0}
    if(armed){this.slain.push(c);if(!this.weapon.neverDull)this.weapon.limit=i.value}else this.discard.push(c);
    this.hp-=dmg;
    this.say(`${armed?"With your "+this.weapon.name+", y":"Y"}ou defeat ${who}${dmg?`, taking ${dmg} damage`:" without a scratch"}.`);
    this.gainXp(i.value);
    if(this.hp<=0){
      const f=this.relics.indexOf("AH");
      if(f>=0){this.relics.splice(f,1);this.discard.push("AH");this.hp=10;this.say("You fall... and the Phoenix Feather burns bright. You rise again with 10 health!")}
      else{this.hp=0;this.over="lost";this.say(`You have fallen in the dungeon. Score: ${this.score()}.`)}
    }
  }
  equip(c,name,value,neverDull){
    if(this.weapon){this.discard.push(...(this.weapon.card?[this.weapon.card]:[]),...this.slain);}
    this.slain=[];this.weapon={card:c,name,value,limit:null,neverDull};
    this.say(`You take up the ${name} (${value}).`);
  }
  drink(c,i){
    this.discard.push(c);const heal=this.potionHeal(i.value);this.drunk++;
    if(heal==null)return this.say("You drink, but you've had all the potion you can stomach this room. No effect.");
    const was=this.hp;this.hp=Math.min(this.maxHp,this.hp+heal);
    this.say(this.hp>was?`You drink the ${i.name} and heal ${this.hp-was}.`:`You drink the ${i.name}, but you were already at full health.`);
  }
  meet(c,i){
    const w=this.weapon;
    switch(c){
      case"JH":this.hp=this.maxHp;break;
      case"QH":this.maxHp+=4;this.hp=Math.min(this.maxHp,this.hp+4);break;
      case"KH":case"AH":this.relics.push(c);break;
      case"JD":if(w){w.value+=1;w.limit=null}break;
      case"QD":if(w)w.value+=2;break;
      case"KD":this.equip(c,"Royal Blade",11,false);break;
      case"AD":this.equip(c,"Dragonslayer",9,true);break;
    }
    if(c!=="KH"&&c!=="AH"&&c!=="KD"&&c!=="AD")this.discard.push(c);
    if((c==="JD"||c==="QD")&&!w)return this.say(`You meet ${i.name}, but you have no weapon for them to work on.`);
    if(c!=="KD"&&c!=="AD")this.say(`You meet ${i.name}. ${i.text}`);
  }
  gainXp(v){
    this.xp+=v;
    while(this.nextLevel!=null&&this.xp>=this.nextLevel){this.level++;this.maxHp+=2;this.hp+=2;this.say(`Level up! You are now level ${this.level}: +2 maximum health.`)}
  }
  // winning scores your health left plus your XP; falling scores minus the monsters still waiting
  score(){
    if(this.over==="won")return this.hp+this.xp;
    return-[...this.deck,...this.roomCards].filter(c=>info(c).kind==="monster").reduce((a,c)=>a+valueOf(c),0);
  }
}

const api={Game,info,label,valueOf,shuffled,fullDeck,CLASSES,LEVELS};
if(typeof module!=="undefined")module.exports=api;else window.Dungeon=api;
})();
