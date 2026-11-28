/* ---------- cars ---------- */
// Cars drive along the road, one lane each way. Drivers are careful: they slow down and stop for anyone on the road ahead,
// and they stop at the zebra crossing when someone is waiting there. If you stand in the way they wait, then honk.
const ST=WORLD.street,ZEBRA=[1.9-3.3,1.9+3.3],CAR_SPEED=7;
const onRoad=z=>z>ST.z0&&z<ST.z1;
const cars=[];
// A wheel: a tyre lying on its side so its axle runs across the car, with a pale hub and a bar across it so you can see it turn.
// It sits in a little holder (w.hold) so front wheels can also turn left and right for steering.
// Spinning must go around the axle (the tyre's own middle line), which is its local y, not z. Turning z made the wheels tumble.
const hubMat=new THREE.MeshStandardMaterial({color:0xc9c9cf,roughness:.35,metalness:.8});
// fuse(): everything in a temporary group that shares a material becomes ONE mesh. A car made of forty little parts then costs only a handful of draw calls.
function fuse(tmp,into){const by=new Map();
  for(const m of tmp.children.slice()){if(!m.isMesh)continue;m.updateMatrix();const q=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();q.applyMatrix4(m.matrix);(by.get(m.material)||by.set(m.material,[]).get(m.material)).push(q);m.geometry.dispose();}
  by.forEach((list,mat)=>{let n=0;list.forEach(q=>n+=q.attributes.position.count);const P=new Float32Array(n*3),N=new Float32Array(n*3);let at=0;
    list.forEach(q=>{P.set(q.attributes.position.array,at*3);N.set(q.attributes.normal.array,at*3);at+=q.attributes.position.count;q.dispose();});
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));
    const me=new THREE.Mesh(geo,mat);me.castShadow=!mat.isMeshBasicMaterial;me.receiveShadow=true;into.add(me);});}
const carTrim=new THREE.MeshStandardMaterial({color:0x1b1c20,roughness:.75}),carChrome=new THREE.MeshStandardMaterial({color:0xd4d7dc,roughness:.22,metalness:.9}),carPlate=new THREE.MeshStandardMaterial({color:0xf2f0e6,roughness:.6});
function wheel(r,wide,x,z){
  const hold=new THREE.Group();hold.position.set(x,r,z);cur.add(hold);
  const w=new THREE.Group();w.rotation.x=Math.PI/2;hold.add(w);const tmp=new THREE.Group(),put=(geo,mat,y)=>{const m=new THREE.Mesh(geo,mat);m.position.y=y||0;tmp.add(m);return m;};
  if(wide<.08){const ty=new THREE.TorusGeometry(r-.022,.022,6,26);ty.rotateX(Math.PI/2);put(ty,carTyre);const rm=new THREE.TorusGeometry(r-.05,.008,4,26);rm.rotateX(Math.PI/2);put(rm,hubMat);   // a bicycle wheel: thin tyre, rim, wire spokes
    for(let k=0;k<8;k++){const sp=put(new THREE.BoxGeometry((r-.05)*2,.004,.004),hubMat);sp.rotation.y=k*Math.PI/8;}put(new THREE.CylinderGeometry(.025,.025,.07,8),hubMat);fuse(tmp,w);w.hold=hold;w.r=r;return w;}
  const pr=[[r*.62,-wide/2],[r*.9,-wide/2],[r,-wide*.32],[r,wide*.32],[r*.9,wide/2],[r*.62,wide/2]].map(q=>new THREE.Vector2(q[0],q[1]));
  put(new THREE.LatheGeometry(pr,20),carTyre);                                                    // a tyre with rounded shoulders
  put(new THREE.CylinderGeometry(r*.64,r*.64,wide*.86,18),hubMat);                              // the alloy rim
  for(let k=0;k<5;k++){const a=k*Math.PI*2/5,sp=put(new THREE.BoxGeometry(r*.34,wide*.9,r*.2),carTyre);sp.position.set(Math.cos(a)*r*.4,0,Math.sin(a)*r*.4);sp.rotation.y=-a;}   // five dark gaps between the spokes
  put(new THREE.CylinderGeometry(r*.16,r*.16,wide*.94,10),carChrome);
  fuse(tmp,w);w.hold=hold;w.r=r;return w;
}
function spinWheels(c,v,dt,steer){for(const w of c.wheels){w.rotation.y-=v*dt/w.r;if(w.front)w.hold.rotation.y+=((steer||0)*.45-w.hold.rotation.y)*Math.min(1,dt*10);}}
const carGlass=new THREE.MeshStandardMaterial({color:0x1a2230,roughness:.15,metalness:.6}),carWin=new THREE.MeshStandardMaterial({color:0x18222c,roughness:.06,metalness:.25,transparent:true,opacity:.6}),carSeat=new THREE.MeshStandardMaterial({color:0x34312f,roughness:.9}),
  drvSkin=[0xe8b996,0xc9966e,0xd2a27c].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.85})),drvTop=[0x2f6f8a,0xc4553b,0x4a6b3a,0x7a4fd0,0xd9a441,0x3a3f4a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.85})),drvHair=new THREE.MeshStandardMaterial({color:0x2a1c14,roughness:.9});let drvN=0,carTyre=new THREE.MeshStandardMaterial({color:0x111114,roughness:.9});
// Four body styles share one recipe. Each is described by where its cabin starts and ends and how tall it is.
const CAR_KIND={sedan:{f0:1.0,f1:.36,r1:-.98,r0:-1.56,roof:1.4},hatch:{f0:1.0,f1:.4,r1:-1.5,r0:-1.9,roof:1.42},pickup:{f0:1.0,f1:.4,r1:-.36,r0:-.5,roof:1.44,bed:true},van:{f0:1.72,f1:1.34,r1:-1.9,r0:-1.98,roof:1.86,van:true}};
function carMesh(col,kind){                                              // a car facing +x, built around its own middle
  const K=CAR_KIND[kind]||CAR_KIND.sedan,belt=K.van?.98:.93,sx=K.f1-.68;   // sx: where the front seats are
  const g=new THREE.Group();scene.add(g);const tmp=new THREE.Group();cur=tmp;
  const paint=new THREE.MeshStandardMaterial({color:col,roughness:.35,metalness:.4});
  const ext=(sh,depth,bv,mat)=>{const geo=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelThickness:bv,bevelSize:bv*.8,bevelSegments:2,curveSegments:8});geo.translate(0,0,-depth/2);const m=new THREE.Mesh(geo,mat);tmp.add(m);return m;};
  // the lower body: its side outline (bonnet, boot, rounded nose and tail, two wheel arches) pushed across the width of the car
  const b=new THREE.Shape();b.moveTo(-2.0,.36);b.lineTo(-1.81,.36);b.absarc(-1.35,.36,.46,Math.PI,0,true);b.lineTo(.89,.36);b.absarc(1.35,.36,.46,Math.PI,0,true);b.lineTo(1.96,.36);
  b.quadraticCurveTo(2.04,.38,2.04,.5);
  if(K.van){b.lineTo(2.03,.8);b.quadraticCurveTo(2.02,.95,1.88,.97);b.lineTo(K.f0-.05,belt);}else{b.lineTo(2.02,.72);b.quadraticCurveTo(2.0,.82,1.84,.84);b.lineTo(K.f0-.05,belt);}
  b.lineTo(-1.5,belt+.02);b.lineTo(-1.92,belt-.01);b.quadraticCurveTo(-2.04,belt-.03,-2.04,.78);b.lineTo(-2.04,.5);b.quadraticCurveTo(-2.04,.38,-2.0,.36);
  ext(b,1.6,.09,paint);
  // the cabin: glass all round, with a painted roof and pillars on top of it
  const c=new THREE.Shape();c.moveTo(K.f0,belt-.03);c.lineTo(K.f1,K.roof);c.lineTo(K.r1,K.roof);c.lineTo(K.r0,belt-.01);c.lineTo(K.f0,belt-.03);const win=ext(c,1.42,.04,carWin);tmp.remove(win);win.renderOrder=2;g.add(win);   // see-through, so it is drawn after what is inside
  // inside: seats with headrests, a dashboard and a steering wheel on the left
  for(const z of[-.36,.36]){box(.13,.5,.44,carSeat,sx,1.03,z,{r:.04,rz:-.12});box(.1,.14,.24,carSeat,sx-.04,1.32,z,{r:.03});}
  for(let bx=sx-.8;bx>K.r1+.1;bx-=.85)box(.13,.46,1.2,carSeat,bx,1.0,0,{r:.04,rz:-.15});                 // as many rows of back seats as fit
  box(.5,.08,1.36,carTrim,sx+1.04,belt,0,{r:.03});
  {const sw=new THREE.Mesh(new THREE.TorusGeometry(.15,.018,6,14),carTrim);sw.position.set(sx+.74,1.02,-.36);sw.rotation.y=Math.PI/2;sw.rotation.order='YXZ';sw.rotation.x=-.35;tmp.add(sw);}
  box(K.f1-K.r1+.08,.06,1.52,paint,(K.f1+K.r1)/2,K.roof+.035,0,{r:.025});
  const pil=(x0,y0,x1,y1,z)=>box(Math.hypot(x1-x0,y1-y0)+.04,.075,.06,paint,(x0+x1)/2,(y0+y1)/2,z,{rz:Math.atan2(y1-y0,x1-x0)});
  for(const z of[-.755,.755]){pil(K.f0,belt,K.f1,K.roof,z);pil(K.r0,belt,K.r1,K.roof,z);for(let px=sx+.04;px>K.r1+.5;px-=.95)box(.08,K.roof-belt,.05,paint,px,(K.roof+belt)/2,z);
    box(.11,.085,.17,paint,K.f0-.14,belt+.09,z*1.27,{r:.03});                                           // door mirror
    [K.f0-.07,sx+.04,Math.max(K.r0+.34,sx-.95)].forEach(x=>box(.014,.5,.012,carTrim,x,.66,z*1.181));    // the gaps round the doors
    [sx+.52,sx-.68].forEach(x=>{if(x>K.r0+.2)box(.15,.03,.02,carChrome,x,.84,z*1.183);});               // door handles
    if(K.bed){box(1.52,.13,.07,paint,-1.27,belt+.07,z*1.1,{r:.02});}}
  if(K.bed){box(1.46,.02,1.5,carTrim,-1.27,belt+.03,0);box(.07,.13,1.74,paint,-2.0,belt+.07,0,{r:.02});}    // a pickup's load bed: dark floor, low sides and a tailgate
  box(3.7,.22,1.5,carTrim,0,.3,0);                                                                    // the dark underside you glimpse through the arches
  box(.1,.15,1.72,carTrim,2.09,.42,0,{r:.04});box(.1,.15,1.72,carTrim,-2.09,.42,0,{r:.04});           // bumper strips
  box(.05,.15,.86,carTrim,2.115,.63,0,{r:.02});for(let k=0;k<3;k++)box(.012,.016,.8,carChrome,2.142,.59+k*.04,0);   // grille and its bright bars
  box(.02,.11,.44,carPlate,2.142,.47,0);box(.02,.11,.44,carPlate,-2.142,.56,0);
  const ex=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.14,8),carChrome);ex.rotation.z=Math.PI/2;ex.position.set(-2.1,.3,-.55);tmp.add(ex);
  const headMat=new THREE.MeshBasicMaterial({color:0x222222}),tailMat=new THREE.MeshBasicMaterial({color:0x330000});
  [-.62,.62].forEach(z=>{box(.09,.13,.36,headMat,2.07,.74,z,{r:.04});box(.07,.12,.42,tailMat,-2.105,.8,z,{r:.03});});
  cur=g;fuse(tmp,g);
  // the driver: head, shoulders and two arms on the wheel. Hidden until someone is actually driving.
  const rider=new THREE.Group();g.add(rider);{const t2=new THREE.Group();cur=t2;const k=drvN++,sk=drvSkin[k%3],tp=drvTop[k%6];
    box(.22,.42,.4,tp,sx+.15,1.02,-.36,{r:.07});const hd=new THREE.Mesh(new THREE.SphereGeometry(.1,12,10),sk);hd.position.set(sx+.19,1.285,-.36);hd.scale.set(.95,1.08,.95);t2.add(hd);
    const hr=new THREE.Mesh(new THREE.SphereGeometry(.105,12,8,0,Math.PI*2,0,1.5),drvHair);hr.position.set(sx+.18,1.292,-.36);hr.rotation.z=.35;hr.scale.set(1,1.06,1);t2.add(hr);
    for(const z of[-.5,-.22]){box(.4,.07,.07,tp,sx+.4,1.07,z,{r:.03,rz:-.12});box(.07,.06,.07,sk,sx+.62,1.05,z+(z<-.4?.04:-.04),{r:.025});}
    cur=g;fuse(t2,rider);}rider.visible=false;
  const wheels=[[-1.35,-.82],[-1.35,.82],[1.35,-.82],[1.35,.82]].map(p=>{const w=wheel(.33,.22,p[0],p[1]);w.front=p[0]>0;return w;});
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(9,5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowC),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0xffe2b0,opacity:0}));
  beam.rotation.x=-Math.PI/2;beam.position.set(5.6,.02,0);g.add(beam);                       // pool of light on the road at night
  cur=scene;return{g,wheels,headMat,tailMat,beam,paint,rider,roofY:K.roof+.065,roofX:(K.f1+K.r1)/2};
}
function carLights(c,braking){const k=Math.max(0,Math.min(1,(dark-.2)/.4));
  c.headMat.color.setRGB(.82+k*5.4,.84+k*4.8,.86+k*3.4);c.tailMat.color.setRGB(.35+k*3+(braking?3:0),.02,.02);c.beam.material.opacity=k*.55;}
[0xc4553b,0x1f6a6e,0xe9e2d6,0x3b4a7a,0x7a2c5a,0x2a2c32].forEach((col,i)=>{
  const m=carMesh(col,['sedan','hatch','sedan','pickup','van','hatch'][i]);m.g.visible=false;m.rider.visible=true;const dir=0;
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir,z:0,x:0,h:0,v:0,on:false,t:rnd(1,8)+i*3,wait:0,honk:0,tag,box:[0,0,0,0],hl:2.1,hw:.92}));
});
// two buses, one each way. People going to work wait at the stop and get on; people coming home get off.
// bus windows are little pictures: dark glass with the heads and shoulders of whoever is sitting by that window (or an empty seat)
let busN=0;const busWin=[0,1,2,1,0,2,1].map((n,v)=>{const c=document.createElement('canvas');c.width=128;c.height=100;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,100);gr.addColorStop(0,'#3d5263');gr.addColorStop(1,'#1c2630');g.fillStyle=gr;g.fillRect(0,0,128,100);
  g.fillStyle='#2a323b';g.fillRect(0,70,128,30);                                                                               // seat backs along the bottom
  const skin=['#d9a67e','#c08a62','#e6b894'],top=['#b5533a','#2f6f8a','#6a8f4a','#7a4fd0','#d9a441'],hair=['#2a1c14','#4a3524','#8a8a8a'];
  for(let k=0;k<n;k++){const x=n===1?64+(v%2?12:-14):36+k*56,sk=skin[(v+k)%3];g.fillStyle=top[(v*2+k)%5];g.beginPath();g.ellipse(x,96,26,30,0,0,7);g.fill();g.fillStyle=sk;g.beginPath();g.ellipse(x,48,13,16,0,0,7);g.fill();
    g.fillStyle=hair[(v+k*2)%3];g.beginPath();g.ellipse(x,40,14,12,0,Math.PI,0);g.fill();}
  g.fillStyle='rgba(255,255,255,.1)';g.beginPath();g.moveTo(0,0);g.lineTo(46,0);g.lineTo(8,100);g.lineTo(0,100);g.fill();     // a streak of reflection
  const t=new THREE.CanvasTexture(c);if('colorSpace' in t)t.colorSpace='srgb';else t.encoding=THREE.sRGBEncoding;return new THREE.MeshStandardMaterial({map:t,roughness:.25,metalness:.2});});
function busMesh(col){const g=new THREE.Group();scene.add(g);const tmp=new THREE.Group();cur=tmp;busN+=2;
  const paint=new THREE.MeshStandardMaterial({color:col,roughness:.4,metalness:.3}),white=new THREE.MeshStandardMaterial({color:0xf1eee6,roughness:.5,metalness:.2});
  box(7,1.15,2.3,paint,0,.98,0,{r:.1});box(7,1.2,2.3,white,0,2.0,0,{r:.14});box(6.7,.1,2.1,white,0,2.62,0,{r:.04});             // coloured skirt, pale upper half, roof hump
  for(const z of[-1.156,1.156]){for(let k=0;k<6;k++){const w=new THREE.Mesh(new THREE.PlaneGeometry(.92,.72),busWin[(k*3+(z>0?1:0)+busN)%busWin.length]);w.position.set(-2.75+k*1.06,1.98,z*1.004);w.rotation.y=z>0?0:Math.PI;g.add(w);}   // a row of side windows; through each you see who is sitting there
    [-2.3,2.3].forEach(x=>box(1.2,.5,.03,carTrim,x,.62,z*.998,{r:.01}));                                                       // dark wheel arches
    box(6.9,.05,.02,carTrim,0,1.52,z);}                                                                                          // a dark line under the windows
  box(.9,1.5,.02,carGlass,2.75,1.3,1.158,{r:.008});box(.03,1.5,.025,carTrim,2.75,1.3,1.162);                                     // the folding door on the kerb side
  box(.02,1.0,2.06,carGlass,3.505,1.95,0,{r:.008});box(.02,.8,1.9,carGlass,-3.505,2.0,0,{r:.008});                               // windscreen and rear window
  box(.03,.2,1.3,carTrim,3.51,2.52,0);box(.12,.2,2.26,carTrim,3.47,.5,0,{r:.04});box(.12,.2,2.26,carTrim,-3.47,.5,0,{r:.04});     // destination board and bumpers
  box(.02,.12,.46,carPlate,3.53,.72,0);box(.02,.12,.46,carPlate,-3.53,.72,0);
  [-1,1].forEach(z=>box(.1,.22,.08,carTrim,3.4,2.2,z*1.24));                                                                    // mirrors on stalks
  const headMat=new THREE.MeshBasicMaterial({color:0x222222}),tailMat=new THREE.MeshBasicMaterial({color:0x330000});
  [-.8,.8].forEach(z=>{box(.06,.16,.4,headMat,3.52,.95,z,{r:.03});box(.06,.14,.4,tailMat,-3.52,.98,z,{r:.03});});
  cur=g;fuse(tmp,g);
  const wheels=[[-2.3,-1.05],[-2.3,1.05],[2.3,-1.05],[2.3,1.05]].map(p=>{const w=wheel(.45,.28,p[0],p[1]);w.front=p[0]>0;return w;});
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(9,5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowC),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0xffe2b0,opacity:0}));
  beam.rotation.x=-Math.PI/2;beam.position.set(7,.02,0);g.add(beam);cur=scene;return{g,wheels,headMat,tailMat,beam};}
const BUS_STOP={'-1':-25.3,'1':18.5};   // where the front of each bus ends up, so its middle is level with the stop                                         // where each direction's bus stops (x along the street)
[-1,1].forEach((dir,i)=>{const m=busMesh(0xe8a23a);m.g.visible=false;
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir,busDir:dir,z:0,x:0,h:0,v:0,on:false,t:6+i*9,wait:0,honk:0,tag,box:[0,0,0,0],hl:3.5,hw:1.17,bus:true,home:dir,stopX:BUS_STOP[dir],dwell:0,served:false}));});
// cars that belong to neighbours: parked at home, gone while their owner is at work
const parked=marks.parking.map(m=>{const c=carMesh(0x5b86c9,'hatch');c.g.position.set(m.x,0,m.z);c.g.rotation.y=-Math.PI/2;const col=[m.x-1,m.x+1,m.z-2.2,m.z+2.2];colliders.push(col);
  return{m,c,col,home:col.slice(),away:false,t:9,owner:null};});
function updateParked(dt){for(const P of parked){if(!P.owner)P.owner=people.find(n=>n.o.name===P.m.owner);const n=P.owner;if(!n)continue;
    const away=n.hidden&&!!ACT[n.act]&&!!ACT[n.act].car;
    if(away&&!P.away){P.away=true;P.t=0;sfxDoor(P.m.x,P.m.z);if(Math.hypot(P.m.x-pos.x,P.m.z-pos.z)<30)say(n.o.name+'開車去上班了。他有自己的車，不用等公車。',true);}
    if(!away&&P.away){P.away=false;P.t=9;P.c.g.position.set(P.m.x,0,P.m.z);P.c.g.visible=true;for(let i=0;i<4;i++)P.col[i]=P.home[i];sfxDoor(P.m.x,P.m.z);if(Math.hypot(P.m.x-pos.x,P.m.z-pos.z)<30)say(n.o.name+'開車回來了，把車停回自己的車位。',true);}
    if(P.away&&P.t<3){P.t+=dt;const d=Math.min(6.5,P.t*P.t*1.6);P.c.g.position.z=P.m.z+d;spinWheels(P.c,P.t*3,dt,0);if(P.t>=2.1){P.c.g.visible=false;P.col[0]=P.col[1]=1e9;}}   // pulls out toward the road, then it is gone
    if(P.c.g.visible)carLights(P.c,false);}}
// one taxi: it only comes when you wave for it, stops beside you, and takes you along the main street
{const m=carMesh(0x2fb89a);m.g.visible=false;m.rider.visible=true;const sign=new THREE.Mesh(new THREE.BoxGeometry(.4,.3,.95),new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,.85,.05)}));sign.position.set(-.15,1.62,0);m.g.add(sign);
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir:0,z:0,x:0,h:0,v:0,on:false,t:1e9,wait:0,honk:0,tag,box:[0,0,0,0],hl:2.1,hw:.92,taxi:true,busDir:1,stopX:0,served:true,dwell:0,dest:null}));}
const taxi=cars[cars.length-1];
// the ice-cream van: by day, when it is dry, it comes along now and then, parks by the park for a bit and plays its tune
{const m=carMesh(0xffb7d5,'van');m.g.visible=false;m.rider.visible=true;const cone=new THREE.Mesh(new THREE.ConeGeometry(.22,.5,10),new THREE.MeshStandardMaterial({color:0xe2b06a,roughness:.8}));cone.rotation.x=Math.PI;cone.position.set(m.roofX,m.roofY+.25,0);m.g.add(cone);
  const sc=new THREE.Mesh(new THREE.SphereGeometry(.26,12,10),new THREE.MeshStandardMaterial({color:0xfff4f8,roughness:.6}));sc.position.set(m.roofX,m.roofY+.65,0);m.g.add(sc);
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir:0,z:0,x:0,h:0,v:0,on:false,t:70,wait:0,honk:0,tag,box:[0,0,0,0],hl:2.1,hw:.92,van:true,busDir:1,stopX:21.5+2.1,served:false,dwell:0,sold:0,jing:0}));}
const iceVan=cars[cars.length-1];
// the south line: a teal bus that stops by the park, then turns down the side street and stops there too
const SIDE_STOP=38.2;
{const m=busMesh(0x2f9fb0);m.g.visible=false;const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir:1,busDir:1,z:0,x:0,h:0,v:0,on:false,t:24,wait:0,honk:0,tag,box:[0,0,0,0],hl:3.5,hw:1.17,bus:true,line:'south',home:1,stopX:BUS_STOP[1],dwell:0,served:false,served2:false}));}
const kerbX=(x,dir)=>x>ZEBRA[0]-3&&x<ZEBRA[1]+3?(dir>0?ZEBRA[1]+3.5:ZEBRA[0]-3.5):x;      // never pull up on the zebra crossing: go just past it
const busAt=dir=>dir===2?cars.some(c=>c.line==='south'&&c.on&&c.dwell>0&&c.served2):cars.some(c=>c.bus&&c.busDir===dir&&c.on&&c.dwell>0&&!c.served2);
// --- the traffic light at the zebra crossing ---
// One clock runs it: cars get green, then yellow, then red while the walkers get their green figure.
let sigCars='g',sigWalk=false;const SIG={r:new THREE.MeshBasicMaterial(),y:new THREE.MeshBasicMaterial(),g:new THREE.MeshBasicMaterial(),walk:new THREE.MeshBasicMaterial(),stop:new THREE.MeshBasicMaterial()};
(function(){cur=scene;
  [[ZEBRA[0]-.5,ST.z0-.2],[ZEBRA[1]+.5,ST.z1+.2]].forEach(p=>{
    cyl(.06,.08,3.4,M.steel,p[0],1.7,p[1],10);box(.3,.95,.3,M.black,p[0],3.6,p[1]);
    [['r',3.9],['y',3.6],['g',3.3]].forEach(q=>[-1,1].forEach(k=>{const m=new THREE.Mesh(new THREE.CircleGeometry(.1,16),SIG[q[0]]);m.position.set(p[0]+k*.152,q[1],p[1]);m.rotation.y=k*Math.PI/2;scene.add(m);}));   // lamps for the cars, facing both ways
    box(.22,.5,.16,M.black,p[0],2.3,p[1]);
    [['stop',2.42],['walk',2.18]].forEach(q=>[-1,1].forEach(k=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.14,.18),SIG[q[0]]);m.position.set(p[0],q[1],p[1]+k*.082);m.rotation.y=k>0?0:Math.PI;scene.add(m);}));   // red and green figure for walkers
    colliders.push([p[0]-.1,p[0]+.1,p[1]-.1,p[1]+.1]);});
})();
function updateSignal(t){const u=t%36;
  sigCars=u<19?'g':u<22?'y':'r';sigWalk=u>22.6&&u<32.5;
  SIG.r.color.setRGB(sigCars==='r'?6:.12,.02,.02);SIG.y.color.setRGB(sigCars==='y'?5:.1,sigCars==='y'?3.6:.08,.02);SIG.g.color.setRGB(.02,sigCars==='g'?5:.1,sigCars==='g'?1.6:.04);
  const blink=u>30&&Math.floor(u*3)%2;SIG.walk.color.setRGB(.02,sigWalk&&!blink?4:.08,sigWalk&&!blink?1.4:.03);SIG.stop.color.setRGB(sigWalk?.1:5,.02,.02);}
// should this walker hold back at the kerb? At the zebra they obey the light; anywhere else they wait for a gap in the cars.
function carDanger(n,q){
  if(onAnyRoad(n.pos.x,n.pos.z))return false;                                             // already crossing
  const dx=q[0]-n.pos.x,dz=q[1]-n.pos.z,L=Math.hypot(dx,dz)||1,sx=n.pos.x+dx/L*.45,sz=n.pos.z+dz/L*.45;
  if(!onAnyRoad(sx,sz))return false;                                                      // the next half step is not onto a road
  if(onRoad(sz)&&n.pos.x>ZEBRA[0]&&n.pos.x<ZEBRA[1]){n.waitWhy='等紅綠燈';return!sigWalk;}
  n.waitWhy='等車子過';
  for(const c of cars){if(!c.on||c.v<1)continue;const fx=Math.cos(c.h),fz=-Math.sin(c.h),rx=n.pos.x-c.x,rz=n.pos.z-c.z,ahead=rx*fx+rz*fz;   // works for cars on either street
    if(ahead>-2.5&&ahead<c.v*4+4&&Math.abs(-rx*fz+rz*fx)<6)return true;}
  return false;
}
// --- routes: every car follows a list of points. Some go straight along the main street, some turn at the junction. ---
// The side street joins the main street from the south between x = JX0 and JX1 (a T-junction).
const LN={e:ST.z1-1.75,w:ST.z0+1.75,n:JX1-1.75,s:JX0+1.75};   // lane middles: east/west-bound (a z), north/south-bound (an x)
const ROUTES={
  east:[[-105,LN.e],[105,LN.e]],
  west:[[105,LN.w],[-105,LN.w]],
  northLeft:[[LN.n,110],[LN.n,16],[53.4,11.2],[50.6,8.7],[46,LN.w],[-105,LN.w]],      // up the side street, left onto the main street
  northRight:[[LN.n,110],[LN.n,15.6],[55.1,12.3],[58.8,LN.e],[105,LN.e]],
  eastSouth:[[-105,LN.e],[46.4,LN.e],[49.9,12.3],[LN.s,15.6],[LN.s,110]],            // along the main street, right into the side street
  westSouth:[[105,LN.w],[58.6,LN.w],[54.2,8.8],[51.7,11.6],[LN.s,16],[LN.s,110]]
};
// the junction lights. Four turns take the junction one after another, with everything red for a moment in between
// so the middle can empty: eastbound and westbound together, then westbound plus its left turn, then the side street.
let jE='g',jW='g',jWL='r',jS='r';
const JS={};for(const k of['e','w','s'])for(const c of['r','y','g'])JS[k+c]=new THREE.MeshBasicMaterial();
(function(){cur=scene;
  const head=(x,z,pre,ry)=>{cyl(.06,.08,3.4,M.steel,x,1.7,z,10);box(.3,.95,.3,M.black,x,3.6,z);
    [['r',3.9],['y',3.6],['g',3.3]].forEach(q=>[0,Math.PI].forEach(a=>{const m=new THREE.Mesh(new THREE.CircleGeometry(.1,16),JS[pre+q[0]]);m.rotation.y=ry+a;m.position.set(x+Math.sin(ry+a)*.152,q[1],z+Math.cos(ry+a)*.152);scene.add(m);}));
    colliders.push([x-.1,x+.1,z-.1,z+.1]);};
  head(JX0-1.2,ST.z1+.4,'e',Math.PI/2);head(JX1+1.2,ST.z0-.4,'w',Math.PI/2);head(JX1+.5,ST.z1+2.4,'s',0);
})();
function updateJunction(t){const u=(t+11)%52,ph=(a,g,y)=>u>=a&&u<g?'g':u>=g&&u<y?'y':'r';
  jE=ph(0,17,20);jW=ph(0,31,34);jWL=ph(22.5,31,34);jS=ph(36.5,47,50);                // gaps (20-22.5, 34-36.5, 50-52) are all-red
  const lamp=(m,on,r,g,b)=>m.color.setRGB(on?r:.1,on?g:.04,on?b:.03);
  for(const q of[['e',jE],['w',jW],['s',jS]]){lamp(JS[q[0]+'r'],q[1]==='r',6,.02,.02);lamp(JS[q[0]+'y'],q[1]==='y',5,3.6,.02);lamp(JS[q[0]+'g'],q[1]==='g',.02,5,1.6);}}
// where each route has to stop, and which light it watches
const zebraE={p:[ZEBRA[0]-.7,LN.e],st:()=>sigCars},zebraW={p:[ZEBRA[1]+.7,LN.w],st:()=>sigCars};
const STOPS={east:[zebraE,{p:[JX0-2.6,LN.e],st:()=>jE}],eastSouth:[zebraE,{p:[JX0-2.6,LN.e],st:()=>jE}],
  west:[{p:[JX1+2.6,LN.w],st:()=>jW},zebraW],westSouth:[{p:[JX1+2.6,LN.w],st:()=>jWL}],
  northLeft:[{p:[LN.n,ST.z1+2.6],st:()=>jS},zebraW],northRight:[{p:[LN.n,ST.z1+2.6],st:()=>jS}]};
const onAnyRoad=(x,z)=>onRoad(z)||(x>JX0&&x<JX1&&z>=ST.z1);
function startCar(c){
  if(c.van&&(dark>.45||rainOn))return false;                                          // no ice cream at night or in the rain
  const name=c.van?'east':c.line==='south'?'eastSouth':c.bus||c.taxi?(c.busDir>0?'east':'west'):['east','west','east','west','northLeft','northRight','eastSouth','westSouth'][Math.floor(Math.random()*8)];
  const R=ROUTES[name];if(cars.some(o=>o!==c&&o.on&&Math.hypot(o.x-R[0][0],o.z-R[0][1])<24))return false;
  c.route=R;c.stops=STOPS[name];c.wi=1;c.x=R[0][0];c.z=R[0][1];c.h=Math.atan2(-(R[1][1]-c.z),R[1][0]-c.x);c.v=CAR_SPEED;c.on=true;c.g.visible=true;c.served=!!c.taxi&&c.served;c.served2=false;c.dwell=0;return true;
}
// you are aboard: the bus goes round the block off the end of the street and comes back the other way
function busTurn(c){const nd=-c.busDir,R2=ROUTES[nd>0?'east':'west'],sx=-nd*76,sz=R2[0][1];
  if(cars.some(o=>o!==c&&o.on&&Math.abs(o.z-sz)<1.6&&Math.abs(o.x-sx)<16)){c.v=0;return;}          // wait for a gap in the other lane
  c.busDir=nd;if(c.bus)c.stopX=BUS_STOP[nd];c.served2=false;c.route=R2;c.stops=STOPS[nd>0?'east':'west'];c.wi=1;c.x=sx;c.z=sz;c.h=nd>0?0:Math.PI;c.v=CAR_SPEED;c.served=false;c.dwell=0;c.dir=nd;
  camera.position.set(c.x-nd*9,4.6,c.z);say(c.taxi?'計程車在街尾掉頭，往回開。':'公車在街尾繞了一圈，現在往回開，下一站是對面的公車站。');}
let carClock=0;
const cv3=new THREE.Vector3();
function updateCars(dt){
  carClock+=dt;const now=carClock;updateSignal(now);updateJunction(now);          // the lights run on game time, so they pause when the game does
  for(const c of cars){
    if(!c.on){c.t-=dt;if(c.t<=0&&!startCar(c))c.t=2;continue;}
    // steer toward the next point on the route
    if(c===onBus&&c.dir!==0&&c.x*c.busDir>76){busTurn(c);continue;}                    // with you aboard the bus turns back just outside town
    let tp=c.route[c.wi],dist=Math.hypot(tp[0]-c.x,tp[1]-c.z);
    if(dist<1.6+c.v*.12){c.wi++;if(c.wi>=c.route.length){
      if(c===onBus){busTurn(c);continue;}
      if(c.bus){c.busDir=c.home;c.stopX=BUS_STOP[c.home];}
      c.on=false;c.g.visible=false;c.tag.hidden=true;c.t=c.taxi?1e9:c.van?rnd(150,260):c.line?rnd(45,75):c.bus?rnd(14,26):rnd(4,14)*(1+dark*1.5);continue;}tp=c.route[c.wi];}
    const turn=angDiff(Math.atan2(-(tp[1]-c.z),tp[0]-c.x),c.h),maxT=(c.v/3.3+.05)*dt;c.h+=Math.max(-maxT,Math.min(maxT,turn));
    const fx=Math.cos(c.h),fz=-Math.sin(c.h),px0=c.x+fx*c.hl,pz0=c.z+fz*c.hl;c.dir=Math.abs(fx)>.9&&onRoad(c.z)?Math.sign(fx):0;   // dir: +1/-1 while running along the main street, 0 otherwise
    let gap=1e9;
    const see=(x,z,half)=>{const dx=x-px0,dz=z-pz0,d=dx*fx+dz*fz;if(d>-.6&&d<gap&&Math.abs(-dx*fz+dz*fx)<half)gap=d;};   // something ahead, within `half` metres either side of my line
    if(ride){const rx=Math.cos(ride.h),rz=-Math.sin(ride.h);for(const k of[-1,0,1])see(ride.x+rx*k*ride.S.len,ride.z+rz*k*ride.S.len,1.6);}
    else if(onAnyRoad(pos.x,pos.z))see(pos.x,pos.z,3.3);                              // you, on foot on the road
    for(const d of pets)if(onAnyRoad(d.x,d.z))see(d.x,d.z,3.3);                        // drivers stop for the dog too
    for(const n of people)if(!n.hidden&&onAnyRoad(n.pos.x,n.pos.z))see(n.pos.x,n.pos.z,3.3);
    c.still=c.v<.1?(c.still||0)+dt:0;const me=cars.indexOf(c);
    for(let k=0;k<cars.length;k++){const o=cars[k];if(o===c||!o.on)continue;
      if(c.still>4&&o.v<.3&&me<k)continue;                                          // two cars each waiting for the other: the first one goes
      const ox=Math.cos(o.h),oz=-Math.sin(o.h);for(const q of[-1,0,1])see(o.x+ox*o.hl*q,o.z+oz*o.hl*q,1.7);}
    for(const sp of c.stops){const st=sp.st();if(st==='g')continue;                     // red or yellow light: stop at the line (on yellow only if there is room to stop gently)
      const dx=sp.p[0]-px0,dz=sp.p[1]-pz0,d=dx*fx+dz*fz;if(d>(st==='y'?5:-.6)&&d<gap&&Math.abs(-dx*fz+dz*fx)<2)gap=d;}
    if(c.bus||c.taxi||c.van){const d=(c.stopX-px0)*c.busDir;                                          // a bus pulls up at its stop, waits with the doors open, then goes on
      if(c.dwell>0){c.dwell-=dt;gap=0;}
      else if(!c.served){if(d>-1&&d+1.3<gap)gap=d+1.3;if(c.v<.15&&Math.abs(d)<1.2){c.dwell=c.van?22:c.taxi?(onBus===c?3:25):6;c.served=true;sfxDoor(c.x,c.z);if(c.taxi)taxiStopped(c);if(c.van)vanArrived(c);}}
      if(c.van&&c.dwell>0){c.jing-=dt;if(c.jing<=0){c.jing=3.2;sfxJingle(c.x,c.z);}}}
    if(c.line==='south'&&c.served&&!c.served2&&!(c.dwell>0)&&fz>.9&&Math.abs(c.x-LN.s)<1.5){const d=SIDE_STOP+c.hl-pz0;      // its second stop, on the side street
      if(d>-1&&d+1.3<gap)gap=d+1.3;if(c.v<.15&&Math.abs(d)<1.4){c.dwell=7;c.served2=true;sfxDoor(c.x,c.z);if(c===onBus)say('第二條馬路站到了。要下車請按「下車」。');}}
    if(c===onBus&&busBell&&!(c.dwell>0)&&c.dir!==0&&(c.x<JX0-8||c.x>JX1+8)&&(c.x<ZEBRA[0]-6||c.x>ZEBRA[1]+6)){gap=0;   // you rang the bell: pull up at the next safe bit of kerb
      if(c.v<.15){c.dwell=4;busBell=false;sfxDoor(c.x,c.z);leaveBus();}}
    let want=gap<1.3?0:Math.min(CAR_SPEED,Math.sqrt(2*5*(gap-1.3)));                             // the fastest speed that can still stop in time
    if(Math.abs(turn)>.2)want=Math.min(want,3.6);                                      // slow down for corners
    c.v=Math.max(0,c.v+Math.max(-16*dt,Math.min(3*dt,want-c.v)));c.x+=fx*c.v*dt;c.z+=fz*c.v*dt;
    if(c.v<.2&&gap<4&&!(c.dwell>0)&&!c.stops.some(sp=>sp.st()!=='g')){c.wait+=dt;if(c.wait>3.5&&c.honk<=0){c.honk=1.4;sfxHonk(c.x,c.z);c.wait=1.2;if(Math.hypot(c.x-pos.x,c.z-pos.z)<32)say('叭叭！車子在等前面的人讓路。',true);}}else c.wait=0;
    c.honk-=dt;
    c.g.position.set(c.x,0,c.z);c.g.rotation.y=c.h;spinWheels(c,c.v,dt,Math.max(-1,Math.min(1,turn*2)));
    const hx=Math.abs(fx)*c.hl+Math.abs(fz)*c.hw+.05,hz=Math.abs(fz)*c.hl+Math.abs(fx)*c.hw;
    c.box[0]=c.x-hx;c.box[1]=c.x+hx;c.box[2]=c.z-hz;c.box[3]=c.z+hz;
    carLights(c,want<c.v-.5);
    const stopd=(c.bus||c.van)&&c.dwell>0&&Math.hypot(c.x-pos.x,c.z-pos.z)<28;                     // a bus at its stop shows which line it is
    c.tag.hidden=c.honk<=0&&!stopd;
    {const txt=c.honk>0?'叭叭！':c.van?'🍦 冰淇淋車 · 一支 $10':c.line?(c.served2?'南線 · 第二條馬路站':'南線 · 往第二條馬路 →'):c.busDir>0?'公車 · 往東 →':'公車 · ← 往西';if(!c.tag.hidden&&c.tag.textContent!==txt)c.tag.textContent=txt;}
    if(c.honk>0||stopd){cv3.set(c.x,2,c.z).project(camera);if(cv3.z<1){c.tag.style.left=((cv3.x+1)/2*canvas.clientWidth)+'px';c.tag.style.top=((1-cv3.y)/2*canvas.clientHeight)+'px';}else c.tag.hidden=true;}
  }
}
