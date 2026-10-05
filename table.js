/* The 3D card table shared by every page: renderer, camera, felt, the 52 card models and the animation helpers.
   It is a plain script (so the pages still open straight from disk); each page calls
   CardTable(THREE, {OrbitControls, RoomEnvironment}) from its own module once three.js has loaded. */
"use strict";
window.CardTable=function(THREE,{OrbitControls,RoomEnvironment}){

/* ---------- the stage: renderer, camera, lights ---------- */
const view=document.getElementById("view");
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.NeutralToneMapping; // keeps white card stock white
view.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x18261d);
scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture; // soft reflections: the glossy sheen on cards
scene.environmentIntensity=.35;
scene.add(new THREE.HemisphereLight(0xfff4e0,0x203020,.8));
const lamp=new THREE.DirectionalLight(0xfff2dc,2.4);lamp.position.set(4,14,6);lamp.castShadow=true;
lamp.shadow.mapSize.set(2048,2048);lamp.shadow.bias=-.0002;lamp.shadow.normalBias=.01;
Object.assign(lamp.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:40});
scene.add(lamp);

const camera=new THREE.PerspectiveCamera(40,1,.1,200);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=false;controls.maxPolarAngle=1.25;controls.minDistance=4;controls.maxDistance=70;

/* ---------- the table: green felt with a wooden rim ---------- */
function canvasTexture(size,draw){const c=document.createElement("canvas");c.width=c.height=size;draw(c.getContext("2d"),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
const feltTex=canvasTexture(256,(g,s)=>{g.fillStyle="#2c6a3f";g.fillRect(0,0,s,s);const d=g.getImageData(0,0,s,s);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-.5)*22;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n}g.putImageData(d,0,0)});
feltTex.repeat.set(10,10);
const felt=new THREE.Mesh(new THREE.CircleGeometry(24,96),new THREE.MeshStandardMaterial({map:feltTex,roughness:1}));
felt.rotation.x=-Math.PI/2;felt.receiveShadow=true;scene.add(felt);
const rim=new THREE.Mesh(new THREE.TorusGeometry(24.6,.9,16,120),new THREE.MeshStandardMaterial({color:0x5a3218,roughness:.45}));
rim.rotation.x=-Math.PI/2;rim.position.y=.1;rim.receiveShadow=true;scene.add(rim);

/* ---------- one card = a thin rounded slab with a picture on each side ----------
   Real cards are 63 x 88 mm; here 1 unit = 25 mm, so a card is 2.5 x 3.5 units and 0.012 thick. */
const CW=2.5,CH=3.5,CR=.14,CT=.012;
const outline=new THREE.Shape();{
  const x=-CW/2,y=-CH/2;
  outline.moveTo(x+CR,y);outline.lineTo(x+CW-CR,y);outline.quadraticCurveTo(x+CW,y,x+CW,y+CR);
  outline.lineTo(x+CW,y+CH-CR);outline.quadraticCurveTo(x+CW,y+CH,x+CW-CR,y+CH);
  outline.lineTo(x+CR,y+CH);outline.quadraticCurveTo(x,y+CH,x,y+CH-CR);
  outline.lineTo(x,y+CR);outline.quadraticCurveTo(x,y,x+CR,y);
}
// the flat picture surface: stretch the image so its corners meet the card's corners
const faceGeo=new THREE.ShapeGeometry(outline,6);{
  const p=faceGeo.attributes.position,uv=faceGeo.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/CW+.5,p.getY(i)/CH+.5);
}
faceGeo.translate(0,0,CT/2);
const backGeo=faceGeo.clone().rotateY(Math.PI);                                  // same surface, turned to face the other way
const edgeGeo=new THREE.ExtrudeGeometry(outline,{depth:CT,bevelEnabled:false,curveSegments:6}).translate(0,0,-CT/2);
const edgeMat=[new THREE.MeshBasicMaterial({visible:false}),new THREE.MeshStandardMaterial({color:0xefeadd,roughness:.6})];

const maxAniso=renderer.capabilities.getMaxAnisotropy();
const picture=canvas=>{const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=maxAniso;return t};
const backMat=new THREE.MeshStandardMaterial({map:picture(CardArt.canvas(null,null,512)),roughness:.35});

const cards=[];
for(const suit of CardArt.SUITS)for(const rank of CardArt.RANKS){
  const card=new THREE.Group();
  const face=new THREE.Mesh(faceGeo,new THREE.MeshStandardMaterial({map:picture(CardArt.canvas(rank,suit,360)),roughness:.35}));
  const back=new THREE.Mesh(backGeo,backMat),edge=new THREE.Mesh(edgeGeo,edgeMat);
  for(const m of[face,back,edge]){m.castShadow=m.receiveShadow=true;m.userData.card=card;card.add(m)}
  card.userData={rank,suit,faceUp:false,name:rank+suit,face};
  scene.add(card);cards.push(card);
}

/* ---------- placing a card: where it sits, which way it points, and whether it is face up ---------- */
const flat=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2); // lie down on the table, picture up
const flip=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);   // turn over along the long side
const UP=new THREE.Vector3(0,1,0);
function pose(turn,faceUp){
  const q=new THREE.Quaternion().setFromAxisAngle(UP,turn).multiply(flat);
  return faceUp?q:q.multiply(flip);
}
// put a card somewhere at once, without animating
function place(card,x,y,z,turn,faceUp){card.position.set(x,y,z);card.quaternion.copy(pose(turn,faceUp));card.userData.faceUp=faceUp}

/* ---------- animation: a tiny "tween" helper that changes values a little every frame ---------- */
const tweens=[];
const tween=(dur,delay,step)=>new Promise(done=>tweens.push({t:-delay,dur,step,done}));
const smooth=p=>p*p*(3-2*p);
// glide a card to a spot; it hops up on the way (higher when it turns over, so it clears the table)
function move(card,x,y,z,turn,faceUp,{dur=.45,delay=0,hop=.25}={}){
  const fromP=card.position.clone(),toP=new THREE.Vector3(x,y,z),fromQ=card.quaternion.clone(),toQ=pose(turn,faceUp);
  if(faceUp!==card.userData.faceUp)hop=Math.max(hop,1.5);
  card.userData.faceUp=faceUp;
  return tween(dur,delay,p=>{const k=smooth(p);card.position.lerpVectors(fromP,toP,k).y+=Math.sin(p*Math.PI)*hop;card.quaternion.slerpQuaternions(fromQ,toQ,k)});
}
const wait=s=>tween(0,s,()=>{});

/* ---------- camera framing: back off until a width x depth area fits the screen ---------- */
let view3d={w:9,d:8,z:0};
function frame(w,d,z=0,dur=.8){
  view3d={w,d,z};
  const vt=Math.tan(camera.fov*Math.PI/360),dist=Math.max(w/2/(vt*camera.aspect),d/2/vt)*1.05+3;
  const fromP=camera.position.clone(),fromT=controls.target.clone(),toT=new THREE.Vector3(0,0,z);
  const toP=new THREE.Vector3().setFromSphericalCoords(dist,.6,0).add(toT);
  if(!dur){camera.position.copy(toP);controls.target.copy(toT);return}
  tween(dur,0,p=>{const k=smooth(p);camera.position.lerpVectors(fromP,toP,k);controls.target.lerpVectors(fromT,toT,k)});
}

/* ---------- tapping a card: find what is under the finger with a "ray" shot from the camera ---------- */
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;const tapHandlers=[];
const onTap=f=>tapHandlers.push(f); // f(card) is called with the card tapped, or null for empty table
renderer.domElement.addEventListener("pointerdown",e=>down={x:e.clientX,y:e.clientY});
renderer.domElement.addEventListener("pointerup",e=>{
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)return down=null;
  down=null;
  const r=renderer.domElement.getBoundingClientRect();
  pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(pointer,camera);
  const hit=ray.intersectObjects(cards,true)[0];
  for(const f of tapHandlers)f(hit?hit.object.userData.card:null);
});

/* ---------- keep the picture sized to the window, and draw every frame ---------- */
function resize(){const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();frame(view3d.w,view3d.d,view3d.z,0)}
addEventListener("resize",resize);resize();

const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05);
  for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];w.t+=dt;if(w.t<0)continue;const p=w.dur?Math.min(1,w.t/w.dur):1;w.step(p);if(p>=1){tweens.splice(i,1);w.done()}}
  controls.update();renderer.render(scene,camera);
});

return{scene,camera,controls,renderer,cards,CW,CH,CT,pose,place,move,tween,wait,smooth,frame,onTap};
};
