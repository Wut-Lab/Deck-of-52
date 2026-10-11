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
   Modelled on the classic printed court cards: the figure fills its frame edge to edge, robes are covered in
   "braided" bands (black-edged strips filled with dots, blocks and crosses), faces are fine line drawings,
   and the colours are only red, yellow, blue, black and white.
   The top half is drawn once; then the canvas is turned 180 degrees and the same drawing fills the bottom half.
   Dragon touches are worked into the traditional props and cloth (see COURT below). */
const CK={red:"#d8261c",yellow:"#f5d215",blue:"#2a4c9e",black:"#141414",white:"#fffdf6",grey:"#c9ced8"};
// colours and props for each card: a = main robe colour, b = side panels, item = what they hold
const COURT={
  KS:{a:"red",b:"black",item:"sword"},        // sword with a dragon-wing guard and dragon-head pommel
  KH:{a:"red",b:"blue",item:"swordBehind"},   // the sword behind the head, dragon-head pommel
  KC:{a:"black",b:"red",item:"egg"},          // a dragon egg instead of the orb
  KD:{a:"red",b:"blue",item:"axe"},           // an axe with a dragon-wing blade
  QS:{a:"red",b:"blue",item:"sceptre"},       // a sceptre topped with a dragon's head
  QH:{a:"blue",b:"black",item:"flower"},
  QC:{a:"red",b:"blue",item:"flower"},
  QD:{a:"black",b:"red",item:"flower"},
  JS:{a:"blue",b:"red",item:"feather"},       // a dragon-scale feather
  JH:{a:"red",b:"blue",item:"leaf"},
  JC:{a:"red",b:"blue",item:"arrow"},         // an arrow fletched with dragon fins
  JD:{a:"red",b:"black",item:"halberd"},      // a halberd with a dragon-wing blade
};
// small repeating cloth patterns, drawn once at double resolution and reused
const patterns={};
function pattern(ctx,kind,a,b){
  const key=kind+a+b;
  if(!patterns[key]){
    const size={checker:[10,10],scales:[12,10],ermine:[14,14],trefoil:[16,16],bars:[8,8]}[kind];
    const c=document.createElement("canvas");c.width=size[0]*2;c.height=size[1]*2;
    const g=c.getContext("2d");g.scale(2,2);g.fillStyle=a;g.fillRect(0,0,size[0],size[1]);g.fillStyle=b;g.strokeStyle=b;
    if(kind==="checker"){g.fillRect(0,0,5,5);g.fillRect(5,5,5,5)}
    if(kind==="scales"){g.strokeStyle=CK.black;g.lineWidth=.8;for(const[x,y]of[[0,0],[12,0],[6,5],[0,10],[12,10]]){g.beginPath();g.arc(x,y,5.6,0,Math.PI);g.fill();g.stroke()}}
    if(kind==="ermine")for(const[x,y]of[[3.5,3.5],[10.5,10.5]]){g.beginPath();g.moveTo(x,y-2);g.lineTo(x+1.6,y+2.5);g.lineTo(x-1.6,y+2.5);g.fill();g.fillRect(x-.4,y-3.4,.8,1.2)}
    if(kind==="trefoil")for(const[x,y]of[[4,4],[12,12]]){for(const[dx,dy]of[[0,-1.8],[-1.7,.8],[1.7,.8]]){g.beginPath();g.arc(x+dx,y+dy,1.5,0,7);g.fill()}g.fillRect(x-.35,y,.7,3)}
    if(kind==="bars")g.fillRect(0,0,8,3);
    patterns[key]=c;
  }
  const p=ctx.createPattern(patterns[key],"repeat");p.setTransform(new DOMMatrix().scale(.5));return p;
}

function court(ctx,rank,s){
  const fx=52,fy=62,fw=196,fh=296,o=COURT[rank+s];
  ctx.fillStyle=CK.white;ctx.fillRect(fx,fy,fw,fh);
  for(const turn of[0,Math.PI]){
    ctx.save();ctx.translate(W/2,H/2);ctx.rotate(turn);
    ctx.beginPath();ctx.moveTo(-fw/2,-fh/2);ctx.lineTo(fw/2,-fh/2);ctx.lineTo(fw/2,-20);ctx.lineTo(-fw/2,20);ctx.clip(); // the diagonal half
    ctx.save();courtFigure(ctx,rank,o);ctx.restore();
    suit(ctx,s,-66,-118,38);
    ctx.restore();
  }
  ctx.strokeStyle=CK.blue;ctx.lineWidth=1.5;ctx.strokeRect(fx,fy,fw,fh);
}

// one half-figure: frame centre at (0,0), head toward -y, frame edges at x = +-98 and y = -148
function courtFigure(ctx,rank,o){
  const C=k=>CK[k]||k,A=C(o.a),B=C(o.b);
  const ink=(lw,col=CK.black)=>{ctx.lineWidth=lw;ctx.strokeStyle=col;ctx.lineJoin="round";ctx.lineCap="round"};
  const fill=(d,f,lw=1.6)=>{const p=new Path2D(d);ctx.fillStyle=f;ctx.fill(p);if(lw){ink(lw);ctx.stroke(p)}};
  const line=(d,lw=1,col=CK.black)=>{ink(lw,col);ctx.stroke(new Path2D(d))};
  const pat=(kind,a,b)=>pattern(ctx,kind,C(a),C(b));
  // a braided band: black edges, a coloured strip, and a repeating motif along its middle
  const band=(d,w,base,motif)=>{
    const p=new Path2D(d);ctx.lineJoin="round";ctx.lineCap="butt";
    ctx.lineWidth=w+2.6;ctx.strokeStyle=CK.black;ctx.stroke(p);ctx.lineWidth=w;ctx.strokeStyle=C(base);ctx.stroke(p);
    if(!motif)return;
    ctx.save();
    if(motif==="dots"){ctx.setLineDash([0,w*.95]);ctx.lineCap="round";ctx.lineWidth=w*.42;ctx.strokeStyle=CK.black}
    if(motif==="blocks"){ctx.setLineDash([w*.55,w*.55]);ctx.lineWidth=w*.62;ctx.strokeStyle=CK.red}
    if(motif==="bluedots"){ctx.setLineDash([0,w*.95]);ctx.lineCap="round";ctx.lineWidth=w*.42;ctx.strokeStyle=CK.blue}
    if(motif==="line"){ctx.lineWidth=1;ctx.strokeStyle=CK.black}
    if(motif==="stitch"){ctx.setLineDash([w*.3,w*.3]);ctx.lineWidth=w*.8;ctx.strokeStyle=CK.black}
    ctx.stroke(p);ctx.restore();
  };
  // a white fist gripping something at (x,y)
  const fist=(x,y,flip=1)=>{ctx.save();ctx.translate(x,y);ctx.scale(flip,1);
    fill("M-8 -6C-8 -10 6 -10 8 -6V5C8 9 -6 9 -8 5Z",CK.white,1.4);
    line("M-8 -2H4M-8 1.5H4M-8 5H3",.8,CK.blue);fill("M2 -7C8 -8 10 -4 7 -1C5 -3 3 -4 2 -7Z",CK.white,1);
    ctx.restore()};
  const pommelDragon=(x,y,r=0)=>{ctx.save();ctx.translate(x,y);ctx.rotate(r);   // a little dragon head on a hilt
    fill("M0 0C-6 0 -9 -4 -8 -8C-6 -11 0 -11 4 -8L9 -7L5 -4L8 -3L3 -1Z",CK.yellow,1.1);
    fill("M-4 -10L-8 -15L-1 -11Z",CK.yellow,.8);ctx.fillStyle=CK.black;ctx.beginPath();ctx.arc(0,-7,1,0,7);ctx.fill();ctx.restore()};
  const badge=(x,y,r)=>{ // a round gold badge with a red dragon curled inside
    fill(`M${x+r} ${y}A${r} ${r} 0 1 1 ${x-r} ${y}A${r} ${r} 0 1 1 ${x+r} ${y}Z`,CK.yellow,1.4);
    ctx.save();ctx.translate(x,y);ctx.scale(r/14,r/14);
    fill("M-8 7C-12 2 -8 -3 -2 -1C3 1 7 -1 6 -6L10 -9L9 -4L12 -3L8 -1C8 5 1 6 -3 4C-6 3 -7 5 -5 8Z",CK.red,.9);
    fill("M-1 -1L-5 -9L1 -5L3 -10L4 -2Z",CK.red,.9);ctx.restore()};

  const headSpace=()=>{ctx.save();ctx.translate(7,-57);ctx.scale(1.25,1.25);ctx.translate(-7,72)}; // heads drawn larger, as on real cards

  /* ---- props carried behind the body ---- */
  if(o.item==="swordBehind"){fill("M64 -96L-60 -150L-56 -156L68 -102Z",CK.white,1.4);line("M66 -99L-58 -153",.8,CK.blue)}
  if(o.item==="axe"||o.item==="sceptre"||o.item==="halberd"||o.item==="arrow")
    fill(`M${o.item==="halberd"?-90:80} 20V-142H${o.item==="halberd"?-85:85}V20Z`,o.item==="sceptre"?CK.yellow:"#8a5a26",1.2);
  if(o.item==="axe"){fill("M85 -138C98 -146 104 -126 98 -108C93 -114 90 -114 85 -110Z",CK.white,1.4);line("M88 -134L97 -128M88 -126L96 -118",.7,CK.blue)}
  if(o.item==="halberd"){fill("M-90 -136C-104 -144 -110 -124 -104 -106C-99 -112 -95 -112 -90 -108Z",CK.white,1.4);fill("M-90 -142L-87.5 -154L-85 -142Z",CK.white,1)}

  headSpace();
  /* ---- hair, hood and veil behind the head ---- */
  if(rank==="K"){fill("M-12 -108C-20 -96 -20 -80 -14 -68H34C40 -80 38 -98 30 -110Z",CK.grey,1.4);
    line("M-12 -100C-16 -90 -14 -80 -10 -72M-6 -98C-10 -88 -8 -78 -4 -70M26 -102C32 -92 32 -80 28 -70M30 -96C34 -88 34 -78 32 -70",.7,CK.blue)}
  if(rank==="Q"){
    fill("M-20 -64C-24 -96 -14 -132 8 -134C32 -134 40 -100 36 -64Z",B,1.5);                         // hood
    fill("M-14 -66C-18 -94 -10 -124 8 -126C28 -126 32 -96 30 -66Z",CK.yellow,1.2);                  // hood lining
    line("M-10 -70C-12 -94 -6 -116 8 -120M26 -70C28 -94 24 -116 8 -120",.7,CK.black);
  }
  if(rank==="J"){for(const s of[-1,1]){const x=s<0?-12:30;
    fill(`M${x} -112C${x+s*12} -100 ${x+s*12} -82 ${x+s*4} -66C${x-s*4} -76 ${x-s*4} -96 ${x-s*2} -110Z`,CK.yellow,1.3);
    line(`M${x+s*2} -104C${x+s*8} -100 ${x+s*8} -94 ${x+s*3} -92M${x+s*4} -90C${x+s*10} -86 ${x+s*9} -80 ${x+s*4} -78`,.8)}}
  ctx.restore();

  /* ---- the body fills the frame edge to edge ---- */
  fill("M-100 30V-58C-82 -66 -52 -72 -22 -74H36C64 -72 84 -66 100 -58V30Z",A,1.6);
  // side panels in the second colour, patterned
  fill("M-100 30V-58C-82 -66 -56 -70 -34 -72C-50 -48 -58 -14 -54 30Z",B,1.4);
  fill("M100 30V-58C84 -66 66 -70 48 -72C62 -48 70 -14 66 30Z",B,1.4);
  fill("M-100 30V-58C-82 -66 -56 -70 -34 -72C-50 -48 -58 -14 -54 30Z",pat(rank==="Q"?"scales":"trefoil",o.b,rank==="Q"?"yellow":"yellow"),0);
  fill("M100 30V-58C84 -66 66 -70 48 -72C62 -48 70 -14 66 30Z",pat(rank==="J"?"checker":"trefoil",o.b,"yellow"),0);
  // the robe's opening edges: big curved braided bands, like the C-shaped trims on real court cards
  band("M-34 -72C-50 -48 -58 -14 -54 30",10,"yellow","dots");
  band("M48 -72C62 -48 70 -14 66 30",10,"yellow","dots");

  if(rank==="K"){
    // front placket: stacked red and yellow bars, with a dragon badge on the chest
    fill("M-8 30V-62H20V30Z",pat("bars","yellow","red"),1.4);
    band("M-8 -62V30",3,"black");band("M20 -62V30",3,"black");
    badge(6,-40,12);
    band("M-34 -10C-10 -2 20 -2 48 -10",8,"yellow","dots");                                           // belt
    // ermine cape across the shoulders
    fill("M-44 -72C-30 -56 44 -56 58 -72C52 -80 30 -78 6 -78C-18 -78 -38 -80 -44 -72Z",pat("ermine","white","black"),1.5);
  }
  if(rank==="Q"){
    // square-necked bodice with a checked border, and the long veil band sweeping across
    fill("M-24 -72L-16 -50H30L38 -72Z",A,1.4);
    band("M-24 -72L-16 -50H30L38 -72",6,"yellow","stitch");
    fill("M-6 30V-50H20V30Z",pat("checker","yellow","black"),1.3);
    band("M90 -120C66 -84 0 -40 -100 -2",13,"black","blocks");
    band("M96 -112C72 -78 8 -34 -100 8",5,"yellow");
  }
  if(rank==="J"){
    // tunic: crossed straps over a dark centre panel
    fill("M-14 30V-62H26V30Z",B,1.4);
    band("M-34 -66L48 20",9,"yellow","blocks");band("M48 -66L-34 20",9,"yellow","dots");
    fill("M6 -30L12 -24L6 -18L0 -24Z",CK.white,1);
    fill("M-30 -72C-16 -62 30 -62 44 -72C40 -78 -26 -78 -30 -72Z",CK.yellow,1.4);                    // collar
    band("M-30 -72C-16 -62 30 -62 44 -72",3,"black");
  }

  headSpace();
  /* ---- neck and face: a fine line drawing, three-quarter view looking left ---- */
  fill("M0 -78V-68H14V-78Z",CK.white,1.2);
  fill("M6 -118C21 -118 28 -108 28 -95C28 -83 22 -75 10 -73C0 -73 -8 -79 -11 -89L-15 -93L-11 -96C-12 -108 -6 -118 6 -118Z",CK.white,1.5);
  line("M-7 -99Q-3 -102 1 -99M9 -99Q14 -102 19 -99",1);                                                   // upper lids
  line("M-6 -97Q-3 -96 0 -97M10 -97Q14 -96 18 -97",.6,CK.blue);                                          // lower lids
  ctx.fillStyle=CK.blue;for(const x of[-3,14]){ctx.beginPath();ctx.arc(x,-98.5,1.5,0,7);ctx.fill()}
  line("M-8 -104Q-3 -107 2 -104M9 -104Q14 -107 20 -104",.9);                                              // brows
  line("M4 -101C3 -95 0 -91 -2 -88C0 -86 3 -86 6 -87",.9);                                               // nose
  fill("M-1 -82Q4 -84 9 -82Q4 -79 -1 -82Z",CK.red,0);                                                    // lips
  line("M25 -97C29 -96 29 -89 25 -87",.8);                                                               // ear
  if(rank==="K"){
    fill("M-8 -83C-6 -71 0 -64 7 -62C14 -64 20 -71 22 -83C16 -79 11 -78 7 -80C3 -78 -2 -79 -8 -83Z",CK.grey,1.2);  // beard
    line("M-2 -78C0 -72 3 -68 6 -64M7 -76V-63M16 -78C14 -72 11 -68 8 -64",.6,CK.blue);
    fill("M-6 -84C-2 -88 4 -88 7 -85C10 -88 16 -88 20 -84C17 -82 12 -82 7 -84C2 -82 -3 -82 -6 -84Z",CK.grey,1); // moustache
    line("M-6 -84C-9 -84 -10 -87 -8 -88M20 -84C23 -84 24 -87 22 -88",.9);
  }
  if(rank==="J")line("M-4 -76C0 -74 4 -74 8 -76",.6,CK.blue);

  /* ---- headwear ---- */
  if(rank==="K"){
    fill("M-16 -112C-16 -132 30 -132 30 -112Z",CK.red,1.3);                                               // cap inside the crown
    fill("M-18 -112L-20 -128L-12 -122L-7 -134L1 -124L7 -139L13 -124L21 -134L26 -122L34 -128L32 -112Z",CK.yellow,1.4);
    fill("M-18 -118H32V-111H-18Z",CK.yellow,1.3);
    ctx.fillStyle=CK.red;for(const x of[-12,-2,8,18,26])ctx.fillRect(x,-117,4,4.5);
    ctx.fillStyle=CK.black;for(const x of[-7,3,13,22]){ctx.beginPath();ctx.arc(x+1,-114.7,1.2,0,7);ctx.fill()}
    for(const[x,y]of[[-7,-134],[7,-139],[21,-134]]){ctx.fillStyle=CK.yellow;ctx.beginPath();ctx.arc(x,y-2,2.2,0,7);ctx.fill();ink(.9);ctx.stroke()}
  }
  if(rank==="Q"){
    fill("M-10 -120L-12 -132L-5 -127L1 -137L7 -127L13 -137L19 -127L26 -132L24 -120Z",CK.yellow,1.3);
    fill("M-10 -122H24V-117H-10Z",pat("checker","red","black"),1);
  }
  if(rank==="J"){
    fill("M-16 -112L-18 -138H30L28 -112Z",CK.red,1.4);                                                    // flat-topped cap
    fill("M-20 -118H32V-110H-20Z",CK.yellow,1.3);band("M-20 -114H32",2.5,"yellow","stitch");
    // dragon-wing plume
    fill("M26 -132C36 -148 56 -150 70 -144C64 -140 64 -136 66 -130C60 -133 54 -132 52 -126C48 -129 42 -128 36 -122Z",A===CK.red?CK.yellow:CK.red,1.3);
    line("M30 -126L68 -142M30 -126L64 -132M30 -126L52 -126",.7);
  }
  ctx.restore();

  /* ---- props held in front, with the arms and hands that grip them ---- */
  const arm=(x1,y1,x2,y2)=>{ // a sleeve from the shoulder to the wrist, ending in a braided cuff
    const d=`M${x1} ${y1}Q${(x1+x2)/2} ${Math.max(y1,y2)+10} ${x2} ${y2+8}`;
    band(d,16,o.b,null);band(d,16,o.b,"line");
    const a=Math.atan2(y2+8-(Math.max(y1,y2)+10),x2-(x1+x2)/2),cx=x2-Math.cos(a)*6,cy=y2+8-Math.sin(a)*6;
    band(`M${cx-Math.sin(a)*9} ${cy+Math.cos(a)*9}L${cx+Math.sin(a)*9} ${cy-Math.cos(a)*9}`,6,"yellow","dots");
  };
  const right=["sword","axe","sceptre","arrow","feather","egg"].includes(o.item),left=["flower","leaf","halberd","egg"].includes(o.item);
  if(right)arm(46,-62,o.item==="egg"?72:o.item==="feather"?80:82.5,o.item==="egg"?-42:-36);
  if(o.item==="swordBehind")arm(46,-62,70,-90);
  if(left)arm(-30,-62,o.item==="halberd"?-87.5:o.item==="egg"?-82:-57,o.item==="egg"?-32:-44);
  if(o.item==="sword"){   // upright on the right, dragon-wing guard
    fill("M78 -50V-142L82.5 -150L87 -142V-50Z",CK.white,1.4);line("M82.5 -52V-142",.7,CK.blue);
    fill("M68 -46C74 -54 79 -52 82.5 -50C86 -52 91 -54 97 -46C91 -44 87 -43 82.5 -43C78 -43 74 -44 68 -46Z",CK.yellow,1.2);
    fill("M80 -42H85V-26H80Z",CK.black,1);fist(82.5,-34);pommelDragon(82.5,-20,Math.PI)}
  if(o.item==="swordBehind"){fill("M60 -104L72 -96L66 -88L54 -96Z",CK.yellow,1.2);fist(70,-86,-1);pommelDragon(74,-74,2.4)}
  if(o.item==="egg"){     // a scaly dragon egg, held up like a king's orb
    fill("M72 -84C82 -84 86 -70 86 -62C86 -52 80 -46 72 -46C64 -46 58 -52 58 -62C58 -70 62 -84 72 -84Z",pat("scales","red","yellow"),1.4);
    band("M58 -62H86",3,"yellow");fist(72,-40);
    fill("M-86 20V-90L-82 -98L-78 -90V20Z",CK.white,1.3);fill("M-92 -42H-72V-37H-92Z",CK.yellow,1);fist(-82,-30)}
  if(o.item==="axe"||o.item==="sceptre"||o.item==="arrow")fist(82.5,-40);
  if(o.item==="sceptre"){ctx.save();ctx.translate(82.5,-140);ctx.scale(1.6,1.6);pommelDragon(0,0,0);ctx.restore()}
  if(o.item==="arrow"){fill("M78 -140L82.5 -152L87 -140Z",CK.white,1.2);fill("M76 -18L82.5 -30L89 -18L82.5 -22Z",CK.red,1)}
  if(o.item==="halberd")fist(-87.5,-40);
  if(o.item==="flower"||o.item==="leaf"){ // held up on the left, just under the suit symbol
    line("M-58 -46C-62 -60 -64 -72 -62 -84",1.5,"#2f6b2f");
    if(o.item==="flower"){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;fill(`M${-62+Math.cos(a)*4.5} ${-89+Math.sin(a)*4.5}A4.6 4.6 0 1 1 ${-62+Math.cos(a)*4.5-.01} ${-89+Math.sin(a)*4.5}Z`,CK.red,.9)}
      ctx.fillStyle=CK.yellow;ctx.beginPath();ctx.arc(-62,-89,2.6,0,7);ctx.fill()}
    else fill("M-62 -84C-74 -94 -72 -110 -62 -118C-54 -108 -52 -94 -62 -84Z",CK.yellow,1.1);
    fill("M-60 -66C-68 -70 -72 -64 -70 -60C-66 -62 -62 -62 -60 -66Z","#3c8c3c",.8);fist(-57,-42,-1)}
  if(o.item==="feather"){fill("M80 -36C64 -70 62 -110 72 -146C88 -112 90 -72 80 -36Z",pat("scales","yellow","red"),1.3);line("M80 -36C72 -72 70 -110 72 -146",.9);fist(80,-34)}
  if(rank==="Q"&&o.item!=="sceptre"){ // a little dragon perched on the queen's shoulder, looking at her
    ctx.save();ctx.translate(70,-62);ctx.scale(-1,1);
    fill("M-8 -18C-14 -30 -10 -42 0 -46C-2 -38 2 -34 8 -34C4 -30 0 -24 -4 -18Z",CK.red,1.1);
    fill("M-12 0C-16 -8 -12 -16 -4 -18C2 -19 6 -22 8 -28C12 -31 17 -29 18 -25L22 -22L16 -20C14 -16 12 -12 8 -8C6 -3 2 0 -12 0Z",CK.yellow,1.2);
    fill("M10 -29L6 -36L13 -31Z",CK.yellow,.9);line("M-12 0C-20 2 -24 -4 -20 -8",1.4);
    ctx.fillStyle=CK.black;ctx.beginPath();ctx.arc(14,-26,1.1,0,7);ctx.fill();ctx.restore();
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
