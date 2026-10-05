/* Card artwork: paints any of the 52 faces, or the dragon back, onto a 2D canvas.
   The 3D page turns these canvases into textures ("stickers") for the card models.
   Everything is drawn on a 300 x 420 grid (the 63 x 88 mm shape of a real card) and scaled to the canvas size. */
(function(){
"use strict";
const W=300,H=420;
const INK={red:"#c8102e",black:"#151515",paper:"#fdfcf9",back:"#9b1b27",cream:"#f5ead2"};
const RANKS=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const SUITS="SHDC"; // spades, hearts, diamonds, clubs
const suitColor=s=>s==="H"||s==="D"?INK.red:INK.black;

/* ---------- suit symbols, each drawn in a 100 x 100 box, in the shapes used on printed decks ---------- */
const SYM={
  H:new Path2D("M50 95C45 84 33 72 20 59C8 47 2 38 2 27C2 13 13 3 27 3C38 3 46 10 50 20C54 10 62 3 73 3C87 3 98 13 98 27C98 38 92 47 80 59C67 72 55 84 50 95Z"),
  D:new Path2D("M50 1C58 18 70 35 85 50C70 65 58 82 50 99C42 82 30 65 15 50C30 35 42 18 50 1Z"),
  S:new Path2D("M50 2C56 14 68 25 81 36C93 46 98 55 98 65C98 79 88 87 76 87C66 87 58 82 53 74C54 86 59 93 69 98H31C41 93 46 86 47 74C42 82 34 87 24 87C12 87 2 79 2 65C2 55 7 46 19 36C32 25 44 14 50 2Z"),
  C:(()=>{const p=new Path2D();for(const[x,y,r]of[[50,25,22],[25,59,22],[75,59,22]]){p.moveTo(x+r,y);p.arc(x,y,r,0,Math.PI*2)}
    p.addPath(new Path2D("M40 40L60 40L62 62L38 62Z"));
    p.addPath(new Path2D("M47 58C47 80 42 91 30 98H70C58 91 53 80 53 58Z"));return p})(),
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
    ctx.font=`bold 36px "Times New Roman",Times,Georgia,serif`;
    ctx.save();ctx.translate(23,47);ctx.scale(rank==="10"?.62:.86,1);ctx.fillText(rank,0,0);ctx.restore();
    suit(ctx,s,23,66,21);
    ctx.restore();
  }
}
// pip positions on number cards: [x, row] with row 0 at the top and 1 at the bottom, laid out like a printed deck
const L=94,C=150,R=206;
const PIPS={
  2:[[C,0],[C,1]],3:[[C,0],[C,.5],[C,1]],4:[[L,0],[R,0],[L,1],[R,1]],
  5:[[L,0],[R,0],[C,.5],[L,1],[R,1]],6:[[L,0],[R,0],[L,.5],[R,.5],[L,1],[R,1]],
  7:[[L,0],[R,0],[C,.25],[L,.5],[R,.5],[L,1],[R,1]],8:[[L,0],[R,0],[C,.25],[L,.5],[R,.5],[C,.75],[L,1],[R,1]],
  9:[[L,0],[R,0],[L,1/3],[R,1/3],[C,.5],[L,2/3],[R,2/3],[L,1],[R,1]],
  10:[[L,0],[R,0],[C,1/6],[L,1/3],[R,1/3],[L,2/3],[R,2/3],[C,5/6],[L,1],[R,1]],
};
function pips(ctx,n,s){
  const size=(n>8?.86:1)*(s==="D"?50:46);
  for(const[x,row]of PIPS[n])suit(ctx,s,x,84+row*252,size,row>.5);
}
function ace(ctx,s){
  if(s!=="S")return suit(ctx,s,W/2,H/2,s==="D"?84:78);
  // the ace of spades is traditionally the fancy one: a large spade with an engraved inner line and scrollwork, and the deck's name
  const cx=W/2,cy=H/2-8;
  ctx.save();ctx.strokeStyle=INK.black;ctx.fillStyle=INK.black;ctx.lineCap="round";
  for(const m of[1,-1]){ // scrolls either side
    ctx.save();ctx.translate(cx,cy+40);ctx.scale(m,1);ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(18,46);ctx.bezierCurveTo(60,56,98,40,96,6);ctx.bezierCurveTo(95,-14,76,-20,68,-8);ctx.bezierCurveTo(62,2,72,12,80,6);ctx.stroke();
    ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(22,52);ctx.bezierCurveTo(66,64,108,44,104,0);ctx.stroke();
    for(const[x,y,a]of[[40,52,.2],[58,52,-.05],[76,46,-.35],[90,32,-.8]]){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,-6,2.2,6,0,0,7);ctx.fill();ctx.restore()}
    ctx.restore();
  }
  ctx.restore();
  suit(ctx,"S",cx,cy,150);
  // engraved inner outline and a little crown of leaves inside the spade
  ctx.save();ctx.translate(cx,cy);ctx.scale(1.18,1.18);ctx.translate(-50,-50);
  ctx.strokeStyle=INK.paper;ctx.lineWidth=1.3;ctx.stroke(SYM.S);ctx.restore();
  ctx.save();ctx.translate(cx,cy+6);ctx.fillStyle=INK.paper;ctx.strokeStyle=INK.paper;
  for(const a of[-.9,-.45,0,.45,.9]){ctx.save();ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,-22,3.2,10,0,0,7);ctx.fill();ctx.restore()}
  ctx.beginPath();ctx.arc(0,0,6,0,7);ctx.fill();ctx.restore();
  ctx.fillStyle=INK.black;ctx.font=`600 13px "Times New Roman",Times,serif`;ctx.textAlign="center";
  ctx.save();ctx.translate(cx,H/2+128);ctx.fillText("DECK  OF  52",0,0);ctx.restore();
}

/* ---------- court cards (J, Q, K) ----------
   Drawn in the traditional "English pattern" manner: a double-ended figure inside a thin frame,
   fine black linework over flat red, blue and yellow, with the faces and hands left the colour of the card. */
const COURT={red:"#c8102e",blue:"#24479a",yellow:"#f3c225",black:"#141414",white:"#fffefb"};
// who holds what, which way they face, and whether they are shown in profile (the "one-eyed" cards)
const POSE={
  KS:{item:"sword"},KH:{item:"sword-behind"},KD:{item:"axe",profile:true,mirror:true},KC:{item:"sword",orb:true,mirror:true},
  QS:{item:"sceptre"},QH:{mirror:true},QD:{},QC:{mirror:true},
  JS:{item:"staff",profile:true,mirror:true},JH:{item:"leaf",profile:true},JD:{item:"halberd"},JC:{item:"arrow",mirror:true},
};
function court(ctx,rank,s){
  const fx=50,fy=46,fw=200,fh=328;
  ctx.save();ctx.beginPath();ctx.rect(fx,fy,fw,fh);ctx.clip();
  for(const flip of[false,true]){
    ctx.save();ctx.translate(W/2,H/2);if(flip)ctx.rotate(Math.PI);
    ctx.beginPath();ctx.rect(-fw/2-2,-fh/2-2,fw+4,fh/2+2);ctx.clip();
    figure(ctx,rank,s,POSE[rank+s]);
    ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle=COURT.black;ctx.lineWidth=1.2;ctx.strokeRect(fx,fy,fw,fh);
  ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(fx,H/2);ctx.lineTo(fx+fw,H/2);ctx.stroke();
  // the suit sits in the frame's corner beside each head, on the side away from anything held up
  const pose=POSE[rank+s],dx=pose.item&&!pose.mirror?fw-34:0;
  suit(ctx,s,fx+17+dx,fy+20,24);suit(ctx,s,fx+fw-17-dx,fy+fh-20,24,true);
}

// small drawing helpers for the figures
function pen(ctx){
  const P=d=>typeof d==="string"?new Path2D(d):d;
  const api={
    shape(d,fill,lw=1.1){const p=P(d);if(fill){ctx.fillStyle=fill;ctx.fill(p)}ctx.lineWidth=lw;ctx.strokeStyle=COURT.black;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke(p);return p},
    line(d,lw=1){ctx.lineWidth=lw;ctx.strokeStyle=COURT.black;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke(P(d))},
    // fill a region with an engraved pattern, clipped to it
    pattern(d,kind,color=COURT.black,gap=5){
      ctx.save();ctx.clip(P(d));ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=.8;
      if(kind==="hatch")for(let i=-260;i<260;i+=gap){ctx.beginPath();ctx.moveTo(i,-200);ctx.lineTo(i+200,0);ctx.stroke()}
      if(kind==="vlines")for(let x=-110;x<110;x+=gap){ctx.beginPath();ctx.moveTo(x,-200);ctx.lineTo(x,10);ctx.stroke()}
      if(kind==="dots")for(let y=-200;y<10;y+=gap)for(let x=-110+((y/gap)&1)*gap/2;x<110;x+=gap){ctx.beginPath();ctx.arc(x,y,.95,0,7);ctx.fill()}
      if(kind==="lattice"){for(let i=-300;i<300;i+=gap){ctx.beginPath();ctx.moveTo(i,-200);ctx.lineTo(i+200,0);ctx.moveTo(i,-200);ctx.lineTo(i-200,0);ctx.stroke()}}
      if(kind==="scales")for(let y=-200;y<10;y+=gap)for(let x=-110+((y/gap)&1)*gap;x<110;x+=gap*2){ctx.beginPath();ctx.arc(x,y,gap,0,Math.PI);ctx.stroke()}
      ctx.restore();
    },
    dot(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=.8;ctx.strokeStyle=COURT.black;ctx.stroke()},
  };
  return api;
}

// one half-figure, drawn with the waist at (0,0) and the head toward -y; the half box is x -100..100, y -164..0
function figure(ctx,rank,s,pose){
  const red=s==="H"||s==="D",c1=red?COURT.red:COURT.blue,c2=red?COURT.blue:COURT.red,Y=COURT.yellow,Wt=COURT.white;
  const p=pen(ctx);
  ctx.save();if(pose.mirror)ctx.scale(-1,1);
  ctx.translate(0,-160);ctx.scale(1.25,1.25);ctx.translate(0,160); // enlarge about the crown so the figure fills the frame, as on real cards

  /* --- what they hold, behind the body --- */
  const it=pose.item;
  if(it==="sword"){ // upright sword held at the left
    p.shape("M-60 -4L-62 -150L-58 -162L-54 -150L-56 -4Z","#e9ecef");p.line("M-58 -150V-10",.6);
  }
  if(it==="sword-behind"){ // the king of hearts' sword, raised behind his head
    ctx.save();ctx.translate(-50,-30);ctx.rotate(.62);p.shape("M-2 0L-3 -150L0 -160L3 -150L2 0Z","#e9ecef");p.line("M0 -150V-6",.6);ctx.restore();
  }
  if(it==="axe"){
    p.shape("M-62 0L-60 -146L-56 -146L-58 0Z",Y);p.pattern("M-62 0L-60 -146L-56 -146L-58 0Z","hatch",COURT.black,3);
    p.shape("M-58 -146C-70 -150 -84 -144 -90 -128C-82 -126 -76 -124 -72 -118C-66 -128 -62 -130 -58 -130Z","#e9ecef");
    p.shape("M-58 -146C-52 -146 -48 -142 -46 -136L-58 -132Z","#e9ecef");
  }
  if(it==="halberd"){
    p.shape("M-64 0L-62 -132L-58 -132L-60 0Z",Y);
    p.shape("M-60 -164L-56 -132H-64Z","#e9ecef");
    p.shape("M-60 -128C-72 -132 -84 -126 -88 -112C-78 -112 -70 -114 -62 -116Z","#e9ecef");
    p.shape("M-60 -128C-54 -128 -48 -124 -46 -118L-60 -116Z","#e9ecef");
  }
  if(it==="staff"){p.shape("M-64 0L-62 -150L-58 -150L-60 0Z",Y);p.shape("M-60 -164C-52 -158 -52 -150 -60 -146C-68 -150 -68 -158 -60 -164Z",c2)}
  if(it==="arrow"){
    p.shape("M-61 -4L-60 -140L-58 -140L-59 -4Z",Y);
    p.shape("M-59 -162L-53 -140H-65Z","#e9ecef");
    for(const y of[-14,-22,-30]){p.line(`M-60 ${y}L-68 ${y+8}M-60 ${y}L-52 ${y+8}`,1)}
  }
  if(it==="sceptre"){p.shape("M-60 -4L-59 -138L-55 -138L-56 -4Z",Y);p.shape("M-57 -150C-50 -150 -48 -142 -50 -138H-64C-66 -142 -64 -150 -57 -150Z",Y);p.dot(-57,-154,3,c1)}

  /* --- hair falling behind the shoulders --- */
  const hairBack=rank==="K"?"M-24 -118C-32 -104 -34 -86 -26 -72H26C34 -86 32 -104 24 -118Z"
    :rank==="Q"?"M-24 -120C-36 -104 -38 -84 -30 -70H30C38 -84 36 -104 24 -120Z"
    :"M-22 -122C-32 -108 -34 -92 -30 -78C-24 -74 -18 -76 -14 -80H14C18 -76 24 -74 30 -78C34 -92 32 -108 22 -122Z";
  p.shape(hairBack,Y);
  for(const m of[-1,1])for(const o of[0,6]){p.line(`M${m*(18+o/2)} -114C${m*(26+o)} -104 ${m*(26+o)} -90 ${m*(20+o)} -76`,.7)}

  /* --- the robe --- */
  const robe="M-98 0C-98 -30 -90 -56 -68 -68C-50 -78 -30 -82 -14 -84H14C30 -82 50 -78 68 -68C90 -56 98 -30 98 0Z";
  p.shape(robe,c1,1.2);
  p.pattern(robe,"dots",COURT.black,5);
  // a centre panel down the front, edged with yellow bands
  const panel="M-26 0L-20 -82H20L26 0Z";
  p.shape(panel,Y);
  if(rank==="K")p.pattern(panel,"lattice",COURT.red,7);
  if(rank==="Q")p.pattern(panel,"scales",COURT.black,5);
  if(rank==="J")p.pattern(panel,"vlines",COURT.black,4);
  for(const m of[-1,1]){
    const band=`M${m*26} 0L${m*20} -82L${m*14} -82L${m*20} 0Z`;p.shape(band,c2);p.pattern(band,"hatch",COURT.black,3);
  }
  // sleeves, in the second colour, with yellow cuffs
  for(const m of[-1,1]){
    const sleeve=`M${m*68} -68C${m*86} -58 ${m*96} -36 ${m*98} 0H${m*66}C${m*64} -20 ${m*60} -36 ${m*54} -46Z`;
    p.shape(sleeve,m<0?c2:c1);p.pattern(sleeve,m<0?"hatch":"dots",COURT.black,m<0?4:6);
  }
  // a belt across the waist
  p.shape("M-98 -10H98V0H-98Z",Y);for(let x=-90;x<=90;x+=10)p.dot(x,-5,1.8,x%20?c1:c2);

  /* --- collar: ermine for the king, a jewelled neckline for the queen, a plain ruff for the jack --- */
  if(rank==="K"){
    const cape="M-74 -66C-56 -84 -24 -88 0 -88C24 -88 56 -84 74 -66C54 -64 24 -66 0 -66C-24 -66 -54 -64 -74 -66Z";
    p.shape(cape,Wt,1.2);
    ctx.fillStyle=COURT.black;
    for(const[x,y]of[[-56,-71],[-38,-72],[-20,-74],[0,-74],[20,-74],[38,-72],[56,-71],[-30,-82],[30,-82],[-10,-83],[10,-83]]){
      ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x-1.6,y+2);ctx.lineTo(x+1.6,y+2);ctx.fill();
      for(const dx of[-2.4,0,2.4]){ctx.beginPath();ctx.arc(x+dx,y-5.5+(dx?1:0),.9,0,7);ctx.fill()}
    }
    p.line("M-28 -64C-18 -54 18 -54 28 -64",1.6);for(let i=-3;i<=3;i++)p.dot(i*8,-57.5+i*i*.5,1.8,Y);
  }
  if(rank==="Q"){
    const neck="M-34 -82C-26 -66 26 -66 34 -82C28 -86 -28 -86 -34 -82Z";
    p.shape(neck,Wt);p.shape("M-36 -84C-28 -64 28 -64 36 -84L40 -78C30 -58 -30 -58 -40 -78Z",Y);
    for(let i=-3;i<=3;i++)p.dot(i*7.5,-66+i*i*.55,1.9,i&1?c1:c2);
    p.line("M-16 -64C-10 -50 10 -50 16 -64",1.2);p.dot(0,-52,3.2,c2);
  }
  if(rank==="J"){
    const ruff="M-30 -82C-24 -70 24 -70 30 -82C24 -88 -24 -88 -30 -82Z";
    p.shape(ruff,Wt);for(let x=-24;x<=24;x+=6)p.line(`M${x} -85C${x+2} -80 ${x+2} -76 ${x} -74`,.6);
  }

  /* --- hands --- */
  const hand=(x,y,a)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a||0); // a fist, fingers wrapped round whatever it holds
    p.shape("M-7 -7C-3 -9 4 -9 7 -7C8 -3 8 3 7 7C3 9 -4 9 -7 7C-8 3 -8 -3 -7 -7Z",Wt,1);
    p.line("M-7 -3.5C-2 -2.5 3 -2.5 7 -3.5M-7 0C-2 1 3 1 7 0M-7 3.5C-2 4.5 3 4.5 7 3.5M-7 -7C-10 -5 -10 -1 -7 0",.6);ctx.restore()};
  if(it==="sword"||it==="axe"||it==="halberd"||it==="staff"||it==="arrow"||it==="sceptre")hand(-58,-58);
  if(it==="sword-behind")hand(-38,-62,.6);
  if(pose.orb){p.shape("M28 -62C28 -72 44 -72 44 -62C44 -52 28 -52 28 -62Z",Y);p.line("M28 -62H44M36 -72V-52",.8);p.shape("M34 -72V-78H38V-72Z",Y);hand(36,-50)}
  if(rank==="Q"){ // the queen holds a flower to her chest
    p.line("M30 -52C34 -70 40 -94 44 -110",1.4);
    for(const[x,y,a]of[[38,-72,-.9],[42,-90,.8]]){ctx.save();ctx.translate(x,y);ctx.rotate(a);p.shape("M0 0C4 -6 12 -8 16 -6C12 -1 6 2 0 0Z","#3d7a3a",.8);ctx.restore()}
    ctx.save();ctx.translate(44,-116);
    p.shape("M-9 6C-12 -2 -10 -10 -4 -12C-2 -6 2 -6 4 -12C10 -10 12 -2 9 6C4 10 -4 10 -9 6Z",c1);
    p.line("M-4 -12C-4 -2 4 -2 4 -12M0 -6V8",.6);ctx.restore();
    hand(32,-54,-.4);
  }
  if(it==="leaf"){p.line("M24 -50C30 -70 34 -94 30 -120",1.2);ctx.save();ctx.translate(30,-120);p.shape("M0 0C-12 -12 -10 -32 0 -42C10 -32 12 -12 0 0Z","#3d7a3a",.9);p.line("M0 -2V-38M0 -12L-6 -18M0 -20L6 -26M0 -28L-5 -33",.6);ctx.restore();hand(26,-54,-.3)}
  if(rank==="K"&&!pose.orb&&it!=="axe")hand(30,-56,.3);
  if(rank==="J"&&it!=="leaf")hand(30,-56,.3);

  /* --- neck and face --- */
  p.shape("M-8 -92V-80C-4 -78 4 -78 8 -80V-92Z",Wt,1);
  if(pose.profile)profileFace(ctx,p,rank,c1,c2);else frontFace(ctx,p,rank,c1,c2);

  ctx.restore();
}

function frontFace(ctx,p,rank,c1,c2){
  const Y=COURT.yellow,Wt=COURT.white;
  p.shape("M0 -136C13 -136 19 -126 19 -113C19 -100 12 -89 0 -89C-12 -89 -19 -100 -19 -113C-19 -126 -13 -136 0 -136Z",Wt,1.1);
  // eyes: almond lids, a dark iris, and a fine lash line
  for(const m of[-1,1]){
    p.shape(`M${m*3} -114C${m*5} -117 ${m*11} -117 ${m*14} -113.5C${m*10} -112 ${m*5} -112 ${m*3} -114Z`,Wt,.8);
    ctx.fillStyle=COURT.black;ctx.beginPath();ctx.arc(m*7.5,-114.4,1.5,0,7);ctx.fill();
    p.line(`M${m*2.5} -120C${m*6} -122.5 ${m*11} -122.5 ${m*15} -119`,1);
    p.line(`M${m*4} -110.5C${m*7} -109.5 ${m*10} -109.8 ${m*12} -111`,.4);
  }
  p.line("M-1.5 -117C-2 -110 -4 -105 -3.5 -101C-1.5 -99.5 1.5 -99.5 3.5 -101",.8);
  ctx.fillStyle=COURT.red;ctx.fill(new Path2D("M-5 -94.5C-2 -96 2 -96 5 -94.5C2 -92.5 -2 -92.5 -5 -94.5Z"));p.line("M-5 -94.5C-2 -95 2 -95 5 -94.5",.6);
  p.line("M-14 -104C-12 -100 -10 -98 -8 -97M14 -104C12 -100 10 -98 8 -97",.4);
  if(rank==="K"){ // moustache and a curled beard
    p.shape("M0 -98C-5 -100 -11 -98 -15 -93C-10 -95 -5 -95 0 -96C5 -95 10 -95 15 -93C11 -98 5 -100 0 -98Z",Y,.8);
    const beard="M-18 -103C-19 -88 -11 -76 0 -72C11 -76 19 -88 18 -103C15 -94 10 -90 6 -91C3 -92 -3 -92 -6 -91C-10 -90 -15 -94 -18 -103Z";
    p.shape(beard,Y,.9);for(const x of[-10,-5,0,5,10])p.line(`M${x} -90C${x+2} -84 ${x-2} -80 ${x*.6} -75`,.5);
  }
  if(rank==="J"){p.line("M-6 -97.5C-3 -99 3 -99 6 -97.5",.7)}
  // hair over the forehead
  if(rank==="K")p.shape("M-19 -116C-20 -130 -12 -137 0 -137C12 -137 20 -130 19 -116C14 -124 8 -128 0 -128C-8 -128 -14 -124 -19 -116Z",Y,.9);
  if(rank==="Q")p.shape("M-19 -112C-21 -128 -12 -137 0 -137C12 -137 21 -128 19 -112C16 -122 8 -128 0 -127C-8 -128 -16 -122 -19 -112Z",Y,.9);
  if(rank==="J")p.shape("M-20 -112C-22 -130 -12 -138 0 -138C12 -138 22 -130 20 -112C16 -120 10 -125 2 -126C-6 -124 -14 -120 -20 -112Z",Y,.9);
  headwear(ctx,p,rank,c1,c2,0);
}

// the face seen from the side, looking toward +x
function profileFace(ctx,p,rank,c1,c2){
  const Y=COURT.yellow,Wt=COURT.white;
  p.shape("M-15 -112C-15 -128 -5 -137 5 -137C14 -137 19 -129 19 -120C19 -117 20 -116 23 -110C24 -108 22 -107 20 -107C21 -104 21 -103 19.5 -102C21 -100 20 -98 18.5 -97.5C19 -94 18 -91 14 -89C8 -87 -2 -88 -8 -92C-13 -96 -15 -104 -15 -112Z",Wt,1.1);
  p.shape("M8 -114.5C10 -117 14 -117.5 16.5 -115C14 -113 11 -112.5 8 -114.5Z",Wt,.8);
  ctx.fillStyle=COURT.black;ctx.beginPath();ctx.arc(13.5,-115,1.4,0,7);ctx.fill();
  p.line("M6 -120C10 -122.5 15 -122.5 18 -120",1);
  ctx.fillStyle=COURT.red;ctx.fill(new Path2D("M14 -99.5C16.5 -100 18.5 -99.5 19.5 -99C18.5 -97.5 16 -97 14 -98.5Z"));
  p.line("M12 -99C14.5 -99.5 17 -99 19.5 -99",.6);p.line("M14 -104C16 -103 18 -103 20 -104",.4);
  // hair, curling round the ear
  if(rank==="K"){
    p.shape("M-16 -114C-18 -128 -8 -138 6 -138C14 -138 18 -132 19 -126C12 -128 4 -128 -2 -124C-6 -118 -6 -110 -4 -102C-10 -100 -14 -106 -16 -114Z",Y,.9);
    p.shape("M2 -104C1 -92 6 -84 14 -82C18 -86 20 -92 18.5 -97.5C14 -96 8 -98 6 -102Z",Y,.9);
    p.shape("M10 -101C14 -103 18 -102 21 -100C18 -99 14 -99 10 -101Z",Y,.7);
  }else{
    p.shape("M-18 -110C-20 -128 -8 -139 6 -139C14 -139 19 -133 20 -127C12 -129 4 -129 -2 -125C-5 -118 -5 -112 -2 -104C-4 -96 -10 -92 -16 -94C-20 -98 -19 -104 -18 -110Z",Y,.9);
  }
  p.shape("M-6 -112C-10 -112 -10 -104 -6 -103C-4 -105 -4 -110 -6 -112Z",Wt,.7);
  for(const o of[0,5,10])p.line(`M${-14+o*.3} -${126-o}C-12 -${116-o} -14 -${104-o} -16 -${96-o/2}`,.5);
  headwear(ctx,p,rank,c1,c2,2);
}

function headwear(ctx,p,rank,c1,c2,dx){
  const Y=COURT.yellow;
  ctx.save();ctx.translate(dx,0);
  if(rank==="K"){
    p.shape("M-20 -134C-20 -156 20 -156 20 -134Z",c1); // velvet cap inside the crown
    p.shape("M-22 -132L-24 -148L-14 -142L-8 -156L0 -146L8 -156L14 -142L24 -148L22 -132Z",Y);
    p.shape("M-22 -136H22V-130H-22Z",Y);for(const x of[-16,-8,0,8,16])p.dot(x,-133,1.7,x%16?c2:c1);
    for(const x of[-24,-8,8,24])p.dot(x,x%16?-157:-149,2,Y);
    p.shape("M-1.5 -156V-164H1.5V-156ZM-4 -161H4V-159H-4Z",Y,.7);
  }
  if(rank==="Q"){
    p.shape("M-21 -132C-26 -110 -32 -90 -30 -74L-26 -74C-26 -92 -18 -112 -15 -130Z",c2); // veil falling either side
    p.shape("M21 -132C26 -110 32 -90 30 -74L26 -74C26 -92 18 -112 15 -130Z",c2);
    p.shape("M-20 -132L-18 -146L-11 -140L-5 -152L0 -144L5 -152L11 -140L18 -146L20 -132Z",Y);
    p.shape("M-20 -135H20V-130H-20Z",Y);for(const x of[-12,0,12])p.dot(x,-132.5,1.6,c1);
    for(const x of[-18,-5,5,18])p.dot(x,x%18?-153:-147,1.7,Y);
  }
  if(rank==="J"){
    p.shape("M-24 -130C-26 -146 -12 -156 2 -156C16 -156 26 -146 24 -130Z",c1);p.pattern("M-24 -130C-26 -146 -12 -156 2 -156C16 -156 26 -146 24 -130Z","hatch",COURT.black,4);
    p.shape("M-26 -134H26V-126H-26Z",Y);for(let x=-22;x<=22;x+=6)p.line(`M${x} -134V-126`,.5);
    p.shape("M14 -150C22 -164 40 -166 48 -160C38 -158 28 -154 20 -144Z",c2);p.line("M18 -148C28 -156 38 -160 46 -160",.5);
  }
  ctx.restore();
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
