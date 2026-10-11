/* Card artwork: paints any of the 52 faces, or the dragon back, onto a 2D canvas.
   The 3D page turns these canvases into textures ("stickers") for the card models.
   Everything is drawn on a 300 x 420 grid (the 63 x 88 mm shape of a real card) and scaled to the canvas size. */
(function(){
"use strict";
const W=300,H=420;
const INK={red:"#c8102e",black:"#151515",paper:"#fbf9f3"};
const RANKS=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const SUITS="SHDC"; // spades, hearts, diamonds, clubs
const suitColor=s=>s==="H"||s==="D"?INK.red:INK.black;

/* ---------- suit symbols, each drawn in a 100 x 100 box ---------- */
const SYM={
  H:new Path2D("M50 94C22 68 3 52 3 30C3 14 15 4 29 4C39 4 46 10 50 19C54 10 61 4 71 4C85 4 97 14 97 30C97 52 78 68 50 94Z"),
  D:new Path2D("M50 2Q68 28 88 50Q68 72 50 98Q32 72 12 50Q32 28 50 2Z"),
  S:new Path2D("M50 3C78 30 97 45 97 63C97 77 86 85 74 85C64 85 56 80 52 72C53 84 58 92 67 98H33C42 92 47 84 48 72C44 80 36 85 26 85C14 85 3 77 3 63C3 45 22 30 50 3Z"),
  C:(()=>{const p=new Path2D();for(const[x,y]of[[50,27],[27,59],[73,59]]){p.moveTo(x+22,y);p.arc(x,y,22,0,Math.PI*2)}
    p.moveTo(62,56);p.arc(50,56,12,0,Math.PI*2);p.addPath(new Path2D("M46 60C46 80 41 91 32 98H68C59 91 54 80 54 60Z"));return p})(),
};
// draw a suit symbol centred on (x,y), `size` wide; flip turns it upside down (pips in the lower half of a card)
function suit(ctx,s,x,y,size,flip,color){
  ctx.save();ctx.translate(x,y);if(flip)ctx.rotate(Math.PI);ctx.scale(size/100,size/100);ctx.translate(-50,-50);
  ctx.fillStyle=color||suitColor(s);ctx.fill(SYM[s]);ctx.restore();
}

/* ---------- faces ---------- */
// the rank and a small suit in the top-left corner, repeated upside down in the bottom-right
function corners(ctx,rank,s){
  for(const flip of[false,true]){
    ctx.save();if(flip){ctx.translate(W,H);ctx.rotate(Math.PI)}
    ctx.fillStyle=suitColor(s);ctx.textAlign="center";ctx.textBaseline="alphabetic";
    ctx.font=`bold 40px Georgia,"Times New Roman",serif`;
    ctx.save();ctx.translate(27,52);if(rank==="10")ctx.scale(.74,1);ctx.fillText(rank,0,0);ctx.restore();
    suit(ctx,s,27,74,25);
    ctx.restore();
  }
}
// where the pips go on number cards: [column, row] with columns 0..2 and rows 0..1 (top to bottom)
const L=.25,C=.5,R=.75;
const PIPS={
  2:[[C,0],[C,1]],3:[[C,0],[C,.5],[C,1]],4:[[L,0],[R,0],[L,1],[R,1]],
  5:[[L,0],[R,0],[C,.5],[L,1],[R,1]],6:[[L,0],[R,0],[L,.5],[R,.5],[L,1],[R,1]],
  7:[[L,0],[R,0],[C,.25],[L,.5],[R,.5],[L,1],[R,1]],8:[[L,0],[R,0],[C,.25],[L,.5],[R,.5],[C,.75],[L,1],[R,1]],
  9:[[L,0],[R,0],[L,1/3],[R,1/3],[C,.5],[L,2/3],[R,2/3],[L,1],[R,1]],
  10:[[L,0],[R,0],[C,1/6],[L,1/3],[R,1/3],[L,2/3],[R,2/3],[C,5/6],[L,1],[R,1]],
};
function pips(ctx,n,s){
  const size=n===10?48:52;
  for(const[cx,cy]of PIPS[n])suit(ctx,s,60+cx*180,90+cy*240,size,cy>.5);
}
function ace(ctx,s){
  if(s!=="S")return suit(ctx,s,W/2,H/2,118);
  // the ace of spades is traditionally the fancy one: a big spade in a ring, with the deck's name
  ctx.save();ctx.strokeStyle=INK.black;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(W/2,H/2-4,92,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=1;ctx.beginPath();ctx.arc(W/2,H/2-4,86,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;ctx.save();ctx.translate(W/2+Math.cos(a)*89,H/2-4+Math.sin(a)*89);ctx.rotate(a);ctx.fillStyle=INK.black;ctx.beginPath();ctx.ellipse(0,0,2,5,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  ctx.restore();
  suit(ctx,"S",W/2,H/2-6,132);
  ctx.fillStyle=INK.black;ctx.font=`italic 15px Georgia,serif`;ctx.textAlign="center";ctx.fillText("Dragon Deck",W/2,H/2+118);
}

/* ---------- court cards (J, Q, K) and the back ----------
   The pictures are Adrian Kennard's public-domain court cards, each with a small dragon added, and his lattice back
   with a dragon medallion added (artwork.js).
   They are SVG drawings, which the browser has to load before they can be painted, so CardArt.ready
   resolves once all 12 are loaded. Only the framed picture is used; the corners stay this deck's own. */
const FRAME={x:-82.4,y:-130.4,w:164.8,h:260.8},CARD={w:240,h:336}; // the picture frame inside the source card
const courtImages={};let backImage=null;
// turn SVG text into an image, drawn ten times larger than its stated size so it stays crisp on the card texture
function loadSVG(svg){
  svg=svg.replace(/width="2.5in"/,'width="2400"').replace(/height="3.5in"/,'height="3360"');
  const img=new Image(),url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));
  img.src=url;img.loaded=img.decode().finally(()=>URL.revokeObjectURL(url));
  return img;
}
for(const[key,svg]of Object.entries(window.COURT_SVG||{}))courtImages[key]=loadSVG(svg);
if(window.BACK_SVG)backImage=loadSVG(window.BACK_SVG);
const ready=Promise.all([...Object.values(courtImages),backImage].filter(Boolean).map(i=>i.loaded));
function court(ctx,rank,s){
  const img=courtImages[rank+s];if(!img)return;
  const k=2400/CARD.w,fh=330,fw=fh*FRAME.w/FRAME.h,fx=(W-fw)/2,fy=(H-fh)/2;
  ctx.drawImage(img,(FRAME.x+CARD.w/2)*k,(FRAME.y+CARD.h/2)*k,FRAME.w*k,FRAME.h*k,fx,fy,fw,fh);
  ctx.strokeStyle="#44F";ctx.lineWidth=1.2;ctx.strokeRect(fx,fy,fw,fh);
}

/* ---------- the back: Kennard's black lattice with a line-work dragon medallion, the same both ways up ---------- */
function back(ctx){
  ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  if(backImage)ctx.drawImage(backImage,0,0,W,H);
}

/* ---------- public helpers ---------- */
// returns a canvas `px` pixels wide showing the card (rank "A".."K", suit "S","H","D","C"), or the back when rank is null
function canvas(rank,s,px=360){
  const c=document.createElement("canvas");c.width=px;c.height=Math.round(px*H/W);
  const ctx=c.getContext("2d");ctx.scale(px/W,px/W);
  if(rank==null){back(ctx);return c}
  ctx.fillStyle=INK.paper;ctx.fillRect(0,0,W,H);
  corners(ctx,rank,s);
  if(rank==="A")ace(ctx,s);else if("JQK".includes(rank))court(ctx,rank,s);else pips(ctx,+rank,s);
  return c;
}
window.CardArt={W,H,RANKS,SUITS,canvas,ready};
})();
