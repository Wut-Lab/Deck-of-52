/* Card artwork: paints any of the 52 faces, or the dragon back, onto a 2D canvas.
   The 3D page turns these canvases into textures ("stickers") for the card models.
   Everything is drawn on a 300 x 420 grid (the 63 x 88 mm shape of a real card) and scaled to the canvas size. */
(function(){
"use strict";
const W=300,H=420;
const INK={red:"#c8102e",black:"#151515",gold:"#e0a91b",blue:"#1f4f9e",skin:"#f7dcbc",paper:"#fbf9f3",back:"#9b1b27",cream:"#f5ead2"};
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

/* ---------- court cards (J, Q, K) ----------
   Drawn in the traditional printed style: flat red, yellow, blue and black with heavy outlines and patterned robes.
   The top half is drawn once; then the canvas is turned 180 degrees and the same drawing fills the bottom half.
   The two halves meet on a diagonal, like real cards.
   Dragon touches: dragon-scale cloth, a dragon badge on each king's chest, a little dragon perched on each
   queen's shoulder, a dragon-wing plume in each jack's cap, and dragon-themed things in their hands. */
const CK={red:"#d0281e",yellow:"#f2cd1d",blue:"#2b4ea6",black:"#151515",white:"#fffdf6",steel:"#e8edf3"};
// colours, cloth pattern and the item each court card holds
const COURT={
  KS:{robe:"red",sleeve:"black",pat:"scales",item:"sword"},   KH:{robe:"red",sleeve:"blue",pat:"checker",item:"swordBehind"},
  KC:{robe:"blue",sleeve:"red",pat:"scales",item:"egg"},      KD:{robe:"red",sleeve:"blue",pat:"zigzag",item:"axe"},
  QS:{robe:"blue",sleeve:"red",pat:"scales",item:"sceptre"},  QH:{robe:"red",sleeve:"black",pat:"checker",item:"rose"},
  QC:{robe:"blue",sleeve:"red",pat:"zigzag",item:"rose"},     QD:{robe:"red",sleeve:"blue",pat:"scales",item:"rose"},
  JS:{robe:"blue",sleeve:"red",pat:"checker",item:"halberd"}, JH:{robe:"red",sleeve:"blue",pat:"scales",item:"feather"},
  JC:{robe:"blue",sleeve:"red",pat:"zigzag",item:"arrow"},    JD:{robe:"red",sleeve:"blue",pat:"scales",item:"shield"},
};
// small repeating cloth patterns, drawn once at double resolution and reused
const patterns={};
function pattern(ctx,kind,a,b){
  const key=kind+a+b;
  if(!patterns[key]){
    const size={checker:[12,12],scales:[12,10],zigzag:[12,10],stripes:[8,8],dots:[10,10]}[kind];
    const c=document.createElement("canvas");c.width=size[0]*2;c.height=size[1]*2;
    const g=c.getContext("2d");g.scale(2,2);g.fillStyle=a;g.fillRect(0,0,size[0],size[1]);g.fillStyle=b;g.strokeStyle=b;
    if(kind==="checker"){g.fillRect(0,0,6,6);g.fillRect(6,6,6,6)}
    if(kind==="scales"){g.strokeStyle=CK.black;g.lineWidth=.9;for(const[x,y]of[[0,0],[12,0],[6,5],[0,10],[12,10]]){g.beginPath();g.arc(x,y,5.6,0,Math.PI);g.fill();g.stroke()}}
    if(kind==="zigzag"){g.lineWidth=2.4;g.beginPath();g.moveTo(-1,8);g.lineTo(6,2);g.lineTo(13,8);g.stroke()}
    if(kind==="stripes")g.fillRect(0,0,3.5,8);
    if(kind==="dots"){g.beginPath();g.arc(5,5,1.5,0,7);g.fill();g.fillRect(4.4,5,1.2,3.5)}
    patterns[key]=c;
  }
  const p=ctx.createPattern(patterns[key],"repeat");p.setTransform(new DOMMatrix().scale(.5));return p;
}

function court(ctx,rank,s){
  const fx=52,fy=62,fw=196,fh=296,o=COURT[rank+s];
  ctx.fillStyle=CK.white;ctx.fillRect(fx,fy,fw,fh);
  for(const turn of[0,Math.PI]){
    ctx.save();ctx.translate(W/2,H/2);ctx.rotate(turn);
    ctx.beginPath();ctx.moveTo(-fw/2,-fh/2);ctx.lineTo(fw/2,-fh/2);ctx.lineTo(fw/2,-22);ctx.lineTo(-fw/2,22);ctx.clip(); // the diagonal half
    ctx.save();courtFigure(ctx,rank,s,o);ctx.restore();
    suit(ctx,s,-67,-118,36);
    ctx.restore();
  }
  ctx.strokeStyle=CK.black;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(fx,H/2+22);ctx.lineTo(fx+fw,H/2-22);ctx.stroke();
  ctx.strokeStyle=CK.blue;ctx.lineWidth=1.6;ctx.strokeRect(fx,fy,fw,fh);
}

// one half-figure: frame centre at (0,0), head toward -y, the figure's head a little right of centre
function courtFigure(ctx,rank,s,o){
  const C=k=>CK[k]||k;
  const ink=(lw=1.8,col=CK.black)=>{ctx.lineWidth=lw;ctx.strokeStyle=col;ctx.lineJoin="round";ctx.lineCap="round"};
  const fill=(d,f,lw=1.8)=>{const p=new Path2D(d);ctx.fillStyle=f;ctx.fill(p);ink(lw);ctx.stroke(p)};
  const line=(d,lw=1.2,col=CK.black)=>{ink(lw,col);ctx.stroke(new Path2D(d))};
  const pat=(kind,a,b)=>pattern(ctx,kind,C(a),C(b));
  const hand=(x,y)=>{fill(`M${x-8} ${y}C${x-9} ${y-8} ${x+7} ${y-10} ${x+9} ${y-2}C${x+9} ${y+6} ${x-7} ${y+7} ${x-8} ${y}Z`,CK.white,1.5);line(`M${x-3} ${y-6}V${y+4}M${x+2} ${y-6}V${y+4}`,1)};
  const roundel=(x,y,r)=>{ // a gold badge with a red dragon curled inside
    fill(`M${x+r} ${y}A${r} ${r} 0 1 1 ${x-r} ${y}A${r} ${r} 0 1 1 ${x+r} ${y}Z`,CK.yellow,1.5);
    ctx.save();ctx.translate(x,y);ctx.scale(r/14,r/14);
    fill("M-8 7C-12 2 -8 -3 -2 -1C3 1 7 -1 6 -6L10 -9L9 -4L12 -3L8 -1C8 5 1 6 -3 4C-6 3 -7 5 -5 8Z",CK.red,1);
    fill("M-1 -1L-5 -9L1 -5L3 -10L4 -2Z",CK.red,1);
    ctx.restore();
  };
  const robe=C(o.robe),sleeve=C(o.sleeve);
  ctx.translate(-6,22);ctx.scale(1.25,1.25); // enlarge so the figure fills the frame, like real court cards
  const headSpace=()=>{ctx.save();ctx.translate(10,-70);ctx.scale(.8,.8);ctx.translate(-10,70)}; // heads a little smaller than the body

  /* items carried behind the body (shifted in so they stay inside the frame) */
  const inward=()=>{ctx.save();ctx.translate(-24,o.item==="sceptre"?18:0)};
  inward();
  if(o.item==="swordBehind"){fill("M58 -40L-36 -150L-28 -152L64 -46Z",CK.steel,1.6);line("M61 -43L-32 -151",1,CK.blue)}
  if(o.item==="halberd"||o.item==="sceptre"||o.item==="axe"||o.item==="arrow")fill("M72 -16V-136H77V-16Z",o.item==="sceptre"?CK.yellow:"#9a6a2c",1.5);
  if(o.item==="feather"){fill("M70 -30C50 -70 44 -110 58 -146C76 -110 80 -70 70 -30Z",pat("scales","yellow","red"),1.6);line("M70 -30C62 -70 58 -110 58 -146",1.2)}

  ctx.restore();

  /* robe: sleeves, chest panel, trims */
  fill("M-100 40V-38C-96 -56 -74 -64 -44 -68H52C80 -64 96 -56 100 -40V40Z",robe);
  fill("M-100 40V-38C-96 -56 -80 -62 -58 -66C-62 -40 -60 -10 -52 40Z",sleeve);
  fill("M100 40V-38C96 -56 80 -62 60 -66C64 -40 62 -10 56 40Z",sleeve);
  fill("M-58 -66C-62 -40 -60 -10 -52 40H-42C-50 -10 -52 -40 -48 -67Z",pat("stripes","yellow",CK.black),1.4);
  fill("M60 -66C64 -40 62 -10 56 40H46C54 -10 54 -40 50 -67Z",pat("stripes","yellow",CK.black),1.4);
  fill("M-40 40C-44 0 -44 -40 -38 -68H44C48 -40 48 0 44 40Z",pat(o.pat,o.robe,"yellow"),1.4);
  fill("M-6 40V-68H14V40Z",pat("dots","yellow",CK.black),1.4);
  if(rank!=="Q")fill("M-40 -60L-30 -68L48 24L40 34Z",pat(o.pat==="scales"?"checker":"scales",o.pat==="scales"?"yellow":"red",o.pat==="scales"?CK.black:"yellow"),1.4);

  headSpace();
  /* hair and veil behind the head */
  if(rank==="K"){fill("M-14 -100C-20 -84 -18 -70 -12 -64H36C42 -70 42 -86 36 -100Z",CK.white,1.6);line("M-12 -90C-14 -80 -12 -72 -8 -66M32 -92C36 -82 36 -72 32 -66",1,CK.blue)}
  if(rank==="J")fill("M-16 -104C-26 -88 -24 -72 -16 -62H38C46 -72 46 -88 38 -104Z",CK.yellow,1.6);
  if(rank==="Q"){fill("M-14 -100C-22 -84 -20 -70 -14 -62H36C42 -70 42 -86 36 -100Z",CK.yellow,1.6);fill("M-14 -120C-28 -104 -32 -84 -36 -62L-18 -60C-18 -80 -14 -100 -6 -118Z",sleeve,1.6)}
  ctx.restore();

  /* neck, collar */
  fill("M2 -76V-64H18V-76Z",CK.white,1.4);
  if(rank==="K")fill("M-28 -66C-14 -52 34 -52 48 -66C40 -78 -20 -78 -28 -66Z",pat("dots",CK.white,CK.black),1.6);
  if(rank==="Q")fill("M-28 -66C-14 -52 34 -52 48 -66C40 -78 -20 -78 -28 -66Z",pat("checker","yellow",CK.black),1.6);
  if(rank==="J")fill("M-24 -66C-12 -56 32 -56 44 -66C36 -76 -16 -76 -24 -66Z",CK.yellow,1.6);
  if(rank==="K")roundel(4,-34,14);

  headSpace();
  /* face: three-quarter view, looking to the left */
  fill("M12 -124C30 -124 38 -112 38 -98C38 -82 30 -72 14 -71C2 -71 -6 -78 -10 -90L-15 -95L-10 -98C-10 -112 -4 -124 12 -124Z",CK.white,1.8);
  fill("M-7 -101Q-1 -105 5 -101Q-1 -98 -7 -101Z",CK.white,1.1);fill("M13 -101Q19 -105 25 -101Q19 -98 13 -101Z",CK.white,1.1);
  ctx.fillStyle=CK.blue;for(const x of[-1,18]){ctx.beginPath();ctx.arc(x,-101,1.7,0,7);ctx.fill()}
  line("M-8 -106Q-1 -109 5 -106M13 -106Q19 -109 26 -106",1.3);
  line("M8 -102L4 -90L9 -89",1.2);
  line("M2 -82Q8 -80 14 -82",1.4,CK.red);
  line("M28 -92Q32 -88 30 -84",1,CK.blue);
  if(rank==="K"){
    fill("M-6 -84C-4 -70 4 -62 14 -60C24 -62 32 -70 34 -84C28 -78 20 -76 14 -78C8 -76 0 -78 -6 -84Z",CK.white,1.5);
    line("M4 -76C6 -70 8 -66 12 -62M14 -74V-62M24 -76C22 -70 20 -66 16 -62",.9,CK.blue);
    fill("M-2 -86C4 -90 12 -90 18 -86C14 -84 10 -85 8 -87C6 -85 2 -84 -2 -86Z",CK.white,1.3);
  }

  /* headwear */
  if(rank==="K"){
    fill("M-12 -120L-14 -132H38L36 -120Z",pat("scales","yellow","red"),1.6);
    fill("M-14 -132L-16 -147L-5 -139L4 -148L12 -139L20 -148L28 -139L39 -147L38 -132Z",CK.yellow,1.6);
    ctx.fillStyle=CK.red;for(const x of[-4,12,28]){ctx.beginPath();ctx.arc(x,-136,2.5,0,7);ctx.fill()}
  }
  if(rank==="Q"){
    fill("M-12 -118L-14 -132L-4 -126L5 -140L14 -126L24 -140L32 -126L38 -132L36 -118Z",CK.yellow,1.6);
    fill("M-12 -118H36V-114H-12Z",pat("checker",CK.red,CK.black),1.2);
    ctx.fillStyle=CK.blue;ctx.beginPath();ctx.arc(14,-124,2.6,0,7);ctx.fill();
  }
  if(rank==="J"){
    fill("M-18 -114C-20 -136 44 -140 42 -114Z",sleeve,1.6);
    fill("M-20 -116H44V-109H-20Z",pat("checker","yellow",CK.black),1.4);
    // dragon-wing plume
    fill("M34 -128C42 -144 60 -148 74 -142C68 -138 68 -134 70 -128C64 -131 58 -130 56 -124C52 -127 46 -126 42 -120Z",robe===CK.red?CK.yellow:CK.red,1.5);
    line("M38 -124L72 -140M38 -124L68 -130M38 -124L56 -124",.9);
  }
  ctx.restore();

  /* items held in front, and the hands that hold them */
  inward();
  const R=[74,-26]; // right hand (viewer's right)
  if(o.item==="sword"){fill("M70 -38V-138L74 -146L78 -138V-38Z",CK.steel,1.6);line("M74 -40V-138",.9,CK.blue);
    fill("M58 -34C64 -42 70 -40 74 -38C78 -40 84 -42 90 -34C84 -32 80 -31 74 -31C68 -31 64 -32 58 -34Z",CK.yellow,1.4);hand(...R)} // wing-shaped crossguard
  if(o.item==="swordBehind"){fill("M50 -36L58 -48L70 -40L62 -28Z",CK.yellow,1.4);hand(62,-30)}
  if(o.item==="axe"){fill("M77 -128C94 -138 100 -120 98 -104C92 -110 86 -110 82 -104C84 -112 82 -116 77 -114Z",CK.steel,1.6);line("M80 -124L96 -118M80 -118L94 -110",.8,CK.blue);hand(...R)} // blade shaped like a dragon wing
  if(o.item==="halberd"){fill("M77 -122C92 -130 96 -112 92 -100C86 -106 82 -106 77 -104Z",CK.steel,1.5);fill("M72 -136L74.5 -150L77 -136Z",CK.steel,1.2);hand(...R)}
  if(o.item==="arrow"){fill("M70 -134L74.5 -148L79 -134Z",CK.steel,1.4);fill("M68 -44L74.5 -54L81 -44L74.5 -48Z",CK.red,1.2);hand(...R)}
  if(o.item==="sceptre"){ // topped with a dragon's head
    fill("M74 -134C64 -134 58 -140 62 -146C68 -150 78 -148 84 -142L90 -140L84 -136L78 -134Z",CK.yellow,1.5);
    fill("M70 -146L64 -154L74 -148Z",CK.yellow,1.1);ctx.fillStyle=CK.black;ctx.beginPath();ctx.arc(76,-142,1.4,0,7);ctx.fill();hand(...R)}
  if(o.item==="feather")hand(70,-30);
  ctx.restore();
  if(o.item==="egg"){ // a dragon egg instead of an orb
    ctx.save();ctx.translate(16,0);
    fill("M-60 -96C-48 -96 -44 -80 -44 -70C-44 -58 -52 -52 -60 -52C-68 -52 -76 -58 -76 -70C-76 -80 -72 -96 -60 -96Z",pat("scales",CK.red,"yellow"),1.6);
    fill("M-76 -72H-44V-66H-76Z",CK.yellow,1.2);hand(-60,-48);ctx.restore()}
  if(o.item==="shield"){ctx.save();ctx.translate(10,8);fill("M-36 -64A22 22 0 1 1 -80 -64A22 22 0 1 1 -36 -64Z",CK.blue,1.8);fill("M-41 -64A17 17 0 1 1 -75 -64A17 17 0 1 1 -41 -64Z",CK.white,1.2);roundel(-58,-64,13);ctx.restore()}
  if(o.item==="rose"){
    line("M-24 -40C-28 -50 -30 -62 -28 -74",1.6,"#2f7a2f");
    fill("M-28 -60C-36 -64 -40 -58 -38 -54C-34 -56 -30 -56 -28 -60Z","#3c8c3c",1);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;fill(`M${-28+Math.cos(a)*5} ${-80+Math.sin(a)*5}A5.5 5.5 0 1 1 ${-28+Math.cos(a)*5-.01} ${-80+Math.sin(a)*5}Z`,CK.red,1)}
    ctx.fillStyle=CK.yellow;ctx.beginPath();ctx.arc(-28,-80,3,0,7);ctx.fill();hand(-24,-40)}
  if(rank==="Q"&&o.item!=="sceptre"){ // a little dragon perched on the queen's shoulder, looking at her (the spade queen's is on her sceptre)
    ctx.save();ctx.translate(66,-64);ctx.scale(-1,1);
    fill("M-8 -18C-14 -30 -10 -42 0 -46C-2 -38 2 -34 8 -34C4 -30 0 -24 -4 -18Z",CK.red,1.2);             // wing
    fill("M-12 0C-16 -8 -12 -16 -4 -18C2 -19 6 -22 8 -28C12 -31 17 -29 18 -25L22 -22L16 -20C14 -16 12 -12 8 -8C6 -3 2 0 -12 0Z",CK.yellow,1.3); // body and head
    fill("M10 -29L6 -36L13 -31Z",CK.yellow,1);                                                            // horn
    line("M-12 0C-20 2 -24 -4 -20 -8",1.6);                                                               // tail
    ctx.fillStyle=CK.black;ctx.beginPath();ctx.arc(14,-26,1.2,0,7);ctx.fill();
    ctx.restore();
  }
}

/* ---------- the back: two dragons chasing a pearl, the same both ways up ---------- */
function back(ctx){
  ctx.fillStyle=INK.paper;ctx.fillRect(0,0,W,H);
  const m=13;
  ctx.save();ctx.beginPath();ctx.roundRect(m,m,W-2*m,H-2*m,10);ctx.clip();
  ctx.fillStyle=INK.back;ctx.fillRect(0,0,W,H);
  // fine diamond lattice with a dot at each crossing
  ctx.strokeStyle="rgba(255,226,200,.28)";ctx.lineWidth=1;
  for(let i=-H;i<W+H;i+=14){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+H,H);ctx.moveTo(i,0);ctx.lineTo(i-H,H);ctx.stroke()}
  ctx.fillStyle="rgba(255,226,200,.35)";
  for(let y=0;y<H;y+=7)for(let x=(y/7&1)*7;x<W;x+=14){ctx.beginPath();ctx.arc(x,y,1,0,7);ctx.fill()}
  ctx.restore();
  // double cream border lines and corner fans
  ctx.strokeStyle=INK.cream;ctx.lineWidth=1.6;ctx.beginPath();ctx.roundRect(m+6,m+6,W-2*m-12,H-2*m-12,6);ctx.stroke();
  ctx.lineWidth=.8;ctx.beginPath();ctx.roundRect(m+10,m+10,W-2*m-20,H-2*m-20,4);ctx.stroke();
  for(const[x,y,a]of[[m+10,m+10,0],[W-m-10,m+10,Math.PI/2],[W-m-10,H-m-10,Math.PI],[m+10,H-m-10,-Math.PI/2]]){
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.lineWidth=1.2;
    for(let r=10;r<=34;r+=8){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI/2);ctx.stroke()}
    for(let i=0;i<=4;i++){const t=i/4*Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(t)*10,Math.sin(t)*10);ctx.lineTo(Math.cos(t)*34,Math.sin(t)*34);ctx.stroke()}
    ctx.restore();
  }
  // the medallion
  const cx=W/2,cy=H/2,R=114;
  ctx.fillStyle=INK.cream;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();
  ctx.strokeStyle=INK.back;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,R-6,0,7);ctx.stroke();
  ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,R-10,0,7);ctx.stroke();
  ctx.save();ctx.translate(cx,cy);
  pearl(ctx);
  dragon(ctx);ctx.rotate(Math.PI);dragon(ctx);
  ctx.restore();
}
function pearl(ctx){
  ctx.fillStyle=INK.back;
  for(let i=0;i<6;i++){ctx.save();ctx.rotate(i/6*Math.PI*2);ctx.beginPath();ctx.moveTo(-5,-14);ctx.quadraticCurveTo(0,-30,8,-26);ctx.quadraticCurveTo(2,-22,5,-14);ctx.fill();ctx.restore()}
  ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fill();
  ctx.strokeStyle=INK.cream;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*1.4);ctx.stroke();ctx.beginPath();ctx.arc(0,0,5,Math.PI,Math.PI*2.4);ctx.stroke();
}
// one dragon: a scaly body curving clockwise around the pearl, head turned in toward it
function dragon(ctx){
  const N=90,a0=-2.55,span=2.95;
  const at=t=>{const a=a0+t*span,r=76+6*Math.sin(t*Math.PI*2.2);return{x:Math.cos(a)*r,y:Math.sin(a)*r,a}};
  const width=t=>3.5+21*Math.pow(1-t,1.2)*Math.min(1,(t+.1)/.16);
  const S=[...Array(N+1)].map((_,i)=>{const t=i/N,p=at(t),q=at(Math.min(1,t+.001)),o=at(Math.max(0,t-.001));
    let tx=q.x-o.x,ty=q.y-o.y;const l=Math.hypot(tx,ty);tx/=l;ty/=l;
    return{...p,t,w:width(t),tx,ty,nx:ty,ny:-tx}}); // n = the outer side of the curve
  const ink=INK.back,cream=INK.cream;

  // wing: a bat wing fanning outward from the shoulders
  const wingBase=[S[8],S[36]],tips=[[.02,100],[.07,92],[.11,108],[.16,95],[.21,110],[.27,97],[.33,106]];
  const polar=(t,r)=>{const p=at(t),k=r/Math.hypot(p.x,p.y);return[p.x*k,p.y*k]};
  ctx.fillStyle=ink;ctx.beginPath();ctx.moveTo(wingBase[0].x,wingBase[0].y);
  for(const[t,r]of tips){const[x,y]=polar(t,r);ctx.lineTo(x,y)}
  ctx.lineTo(wingBase[1].x,wingBase[1].y);ctx.fill();
  ctx.strokeStyle=cream;ctx.lineWidth=1;ctx.lineJoin="round";ctx.stroke();
  ctx.strokeStyle=cream;ctx.lineWidth=1;
  ctx.lineWidth=1.4;for(const i of[0,2,4,6]){const[x,y]=polar(tips[i][0],tips[i][1]-3);ctx.beginPath();ctx.moveTo(S[18].x,S[18].y);ctx.lineTo(x,y);ctx.stroke()}

  // legs: bent, with three claws, reaching in toward the pearl
  for(const i of[16,52]){
    const p=S[i],kx=p.x-p.nx*(p.w/2+10)-p.tx*6,ky=p.y-p.ny*(p.w/2+10)-p.ty*6,fx=kx-p.nx*4+p.tx*9,fy=ky-p.ny*4+p.ty*9;
    ctx.strokeStyle=ink;ctx.lineCap="round";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(kx,ky);ctx.lineTo(fx,fy);ctx.stroke();
    ctx.lineWidth=2.6;for(const k of[-1,0,1]){ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+p.tx*6-p.nx*(4+k*4)+k*2,fy+p.ty*6-p.ny*(4+k*4));ctx.stroke()}
  }

  // dorsal spikes along the outer edge, swept back toward the tail
  ctx.fillStyle=ink;
  for(let i=4;i<N-4;i+=3){const p=S[i],e=p.w/2,h=3+6*(1-p.t);
    ctx.beginPath();ctx.moveTo(p.x+p.nx*e-p.tx*3,p.y+p.ny*e-p.ty*3);ctx.lineTo(p.x+p.nx*(e+h)+p.tx*4,p.y+p.ny*(e+h)+p.ty*4);ctx.lineTo(p.x+p.nx*e+p.tx*4,p.y+p.ny*e+p.ty*4);ctx.fill()}

  // the body itself
  ctx.beginPath();
  S.forEach((p,i)=>ctx[i?"lineTo":"moveTo"](p.x+p.nx*p.w/2,p.y+p.ny*p.w/2));
  for(let i=N;i>=0;i--){const p=S[i];ctx.lineTo(p.x-p.nx*p.w/2,p.y-p.ny*p.w/2)}
  ctx.fill();
  // scales on the back, plates on the belly
  ctx.strokeStyle=cream;ctx.lineWidth=.9;
  for(let i=3;i<N-6;i+=2){const p=S[i],r=Math.max(1.5,p.w*.2);
    ctx.beginPath();ctx.arc(p.x+p.nx*p.w*.12,p.y+p.ny*p.w*.12,r,Math.atan2(p.ty,p.tx)+Math.PI*.5,Math.atan2(p.ty,p.tx)+Math.PI*1.5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(p.x-p.nx*p.w*.45,p.y-p.ny*p.w*.45);ctx.lineTo(p.x-p.nx*p.w*.25,p.y-p.ny*p.w*.25);ctx.stroke()}

  // tail tip: a little spade, for a playing-card dragon
  const T=S[N];ctx.save();ctx.translate(T.x,T.y);ctx.rotate(Math.atan2(T.ty,T.tx)+Math.PI/2);ctx.scale(.16,.16);ctx.translate(-50,-96);ctx.fillStyle=ink;ctx.fill(SYM.S);ctx.restore();

  // head: facing back along the body and turned toward the pearl, top of the head on the outside
  const h=S[0];ctx.save();ctx.translate(h.x,h.y);ctx.rotate(Math.atan2(-h.ty,-h.tx)-.75);ctx.scale(1.45,-1.45);
  ctx.fillStyle=ink;
  ctx.fill(new Path2D("M-2 -8C6 -11 12 -14 18 -13L24 -9L36 -8L41 -4L39 -1L25 0L25 3L37 7L35 11L19 10L4 9L-2 6Z")); // head and open jaw
  ctx.fill(new Path2D("M12 -12C6 -20 -4 -26 -14 -24C-6 -22 2 -18 6 -11Z"));       // horn
  ctx.fill(new Path2D("M6 -10C0 -16 -8 -16 -12 -12C-6 -12 -2 -10 0 -7Z"));        // second horn
  ctx.fillStyle=cream;ctx.beginPath();ctx.arc(19,-7,2.4,0,7);ctx.fill();          // eye
  ctx.fillStyle=ink;ctx.beginPath();ctx.arc(19.6,-7,1.1,0,7);ctx.fill();
  ctx.fillStyle=cream;for(const x of[28,32,36])ctx.fill(new Path2D(`M${x} 0L${x+1.5} 2.6L${x+3} 0Z`)); // teeth
  ctx.strokeStyle=ink;ctx.lineWidth=1.2;ctx.lineCap="round";                      // whiskers
  ctx.beginPath();ctx.moveTo(38,-6);ctx.bezierCurveTo(46,-16,40,-26,50,-30);ctx.moveTo(34,9);ctx.bezierCurveTo(44,16,38,26,48,30);ctx.stroke();
  ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(30,4);ctx.bezierCurveTo(40,4,44,0,50,3);ctx.lineTo(54,0);ctx.moveTo(50,3);ctx.lineTo(54,6);ctx.stroke(); // forked tongue
  ctx.restore();
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
window.CardArt={W,H,RANKS,SUITS,canvas};
})();
