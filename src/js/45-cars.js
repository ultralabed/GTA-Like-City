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
function wheel(r,wide,x,z){
  const hold=new THREE.Group();hold.position.set(x,r,z);cur.add(hold);
  const w=new THREE.Mesh(new THREE.CylinderGeometry(r,r,wide,20),carTyre);w.rotation.x=Math.PI/2;w.castShadow=true;w.receiveShadow=true;hold.add(w);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.55,r*.55,wide+.02,14),hubMat);w.add(hub);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(r*1.5,wide+.03,r*.2),carTyre);w.add(bar);
  w.hold=hold;w.r=r;return w;
}
function spinWheels(c,v,dt,steer){for(const w of c.wheels){w.rotation.y-=v*dt/w.r;if(w.front)w.hold.rotation.y+=((steer||0)*.45-w.hold.rotation.y)*Math.min(1,dt*10);}}
const carGlass=new THREE.MeshStandardMaterial({color:0x1a2230,roughness:.15,metalness:.6}),carTyre=new THREE.MeshStandardMaterial({color:0x111114,roughness:.9});
function carMesh(col){                                                   // a car facing +x, built around its own middle
  const g=new THREE.Group();scene.add(g);cur=g;
  const paint=new THREE.MeshStandardMaterial({color:col,roughness:.35,metalness:.4});
  box(4.2,.62,1.78,paint,0,.66,0,{r:.12});box(2.3,.56,1.6,carGlass,-.15,1.22,0,{r:.14});box(2.1,.05,1.5,paint,-.15,1.5,0,{r:.02});
  const wheels=[[-1.35,-.82],[-1.35,.82],[1.35,-.82],[1.35,.82]].map(p=>{const w=wheel(.33,.22,p[0],p[1]);w.front=p[0]>0;return w;});
  const headMat=new THREE.MeshBasicMaterial({color:0x222222}),tailMat=new THREE.MeshBasicMaterial({color:0x330000});
  [-.6,.6].forEach(z=>{box(.06,.14,.34,headMat,2.1,.72,z).castShadow=false;box(.06,.12,.34,tailMat,-2.1,.74,z).castShadow=false;});
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(9,5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowC),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0xffe2b0,opacity:0}));
  beam.rotation.x=-Math.PI/2;beam.position.set(5.6,.02,0);g.add(beam);                       // pool of light on the road at night
  cur=scene;return{g,wheels,headMat,tailMat,beam};
}
function carLights(c,braking){const k=Math.max(0,Math.min(1,(dark-.2)/.4));
  c.headMat.color.setRGB(.2+k*6,.2+k*5.4,.2+k*4);c.tailMat.color.setRGB(.35+k*3+(braking?3:0),.02,.02);c.beam.material.opacity=k*.55;}
[0xc4553b,0x1f6a6e,0xe9e2d6,0x3b4a7a].forEach((col,i)=>{
  const lane=i%2,dir=lane?1:-1,m=carMesh(col);m.g.rotation.y=dir>0?0:Math.PI;m.g.visible=false;
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir,z:lane?ST.z1-1.75:ST.z0+1.75,x:0,v:0,on:false,t:rnd(1,8)+i*3,wait:0,honk:0,tag,box:[0,0,0,0],hl:2.1,hw:.92}));
});
// two buses, one each way. People going to work wait at the stop and get on; people coming home get off.
function busMesh(col){const g=new THREE.Group();scene.add(g);cur=g;
  const paint=new THREE.MeshStandardMaterial({color:col,roughness:.4,metalness:.3});
  box(7,2.1,2.3,paint,0,1.45,0,{r:.14});box(7.02,.75,2.32,carGlass,0,1.9,0,{r:.1});box(7.04,.16,2.34,paint,0,2.45,0,{r:.05});
  const wheels=[[-2.3,-1.05],[-2.3,1.05],[2.3,-1.05],[2.3,1.05]].map(p=>{const w=wheel(.45,.28,p[0],p[1]);w.front=p[0]>0;return w;});
  const headMat=new THREE.MeshBasicMaterial({color:0x222222}),tailMat=new THREE.MeshBasicMaterial({color:0x330000});
  [-.8,.8].forEach(z=>{box(.06,.16,.4,headMat,3.52,.8,z).castShadow=false;box(.06,.14,.4,tailMat,-3.52,.85,z).castShadow=false;});
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(9,5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowC),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0xffe2b0,opacity:0}));
  beam.rotation.x=-Math.PI/2;beam.position.set(7,.02,0);g.add(beam);cur=scene;return{g,wheels,headMat,tailMat,beam};}
const BUS_STOP={'-1':-25.3,'1':18.5};   // where the front of each bus ends up, so its middle is level with the stop                                         // where each direction's bus stops (x along the street)
[-1,1].forEach((dir,i)=>{const m=busMesh(0xe8a23a);m.g.rotation.y=dir>0?0:Math.PI;m.g.visible=false;
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir,z:dir>0?ST.z1-1.75:ST.z0+1.75,x:0,v:0,on:false,t:6+i*9,wait:0,honk:0,tag,box:[0,0,0,0],hl:3.5,hw:1.17,bus:true,stopX:BUS_STOP[dir],dwell:0,served:false}));});
const busAt=dir=>cars.some(c=>c.bus&&c.dir===dir&&c.on&&c.dwell>0);
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
  if(onRoad(n.pos.z)||!(onRoad(q[1])||(q[1]-ST.z0)*(n.pos.z-ST.z0)<0))return false;       // already crossing, or not heading for the road
  if(Math.min(Math.abs(n.pos.z-ST.z0),Math.abs(n.pos.z-ST.z1))>.4)return false;           // not at the kerb yet
  if(n.pos.x>ZEBRA[0]&&n.pos.x<ZEBRA[1]){n.waitWhy='等紅綠燈';return!sigWalk;}
  n.waitWhy='等車子過';
  for(const c of cars){if(!c.on||c.v<1)continue;const ahead=(n.pos.x-c.x)*c.dir;if(ahead>-2.5&&ahead<c.v*4+4)return true;}
  return false;
}
const cv3=new THREE.Vector3();
function updateCars(dt){
  updateSignal(performance.now()/1000);
  for(const c of cars){
    if(!c.on){c.t-=dt;
      if(c.t<=0){const sx=-c.dir*105;if(cars.some(o=>o!==c&&o.on&&o.dir===c.dir&&Math.abs(o.x-sx)<20)){c.t=2;continue;}
        c.on=true;c.x=sx;c.v=CAR_SPEED;c.g.visible=true;c.served=false;c.dwell=0;}
      continue;}
    const front=c.x+c.dir*c.hl;let gap=1e9;
    const see=(px,pz)=>{if(!onRoad(pz))return;const d=(px-front)*c.dir;if(d>-.6&&d<gap)gap=d;};        // anyone on the road ahead, in either lane
    see(pos.x-(ride?c.dir*ride.S.len:0),pos.z);                                   // you, or the back of the car you are driving
    for(const d of pets)see(d.x,d.z);                                              // drivers stop for the dog too
    for(const n of people){if(n.hidden)continue;see(n.pos.x,n.pos.z);    }
    if(sigCars!=='g'){const d=((c.dir>0?ZEBRA[0]-.7:ZEBRA[1]+.7)-front)*c.dir;                    // red or yellow light: stop at the line (on yellow only if there is room to stop gently)
      if(d>(sigCars==='y'?5:-.6)&&d<gap)gap=d;}
    for(const o of cars){if(o===c||!o.on||o.dir!==c.dir)continue;const d=(o.x-o.dir*o.hl-front)*c.dir;if(d>-.6&&d<gap)gap=d;}
    if(c.bus){const d=(c.stopX-front)*c.dir;                                          // a bus pulls up at its stop, waits with the doors open, then goes on
      if(c.dwell>0){c.dwell-=dt;gap=0;}
      else if(!c.served){if(d>-1&&d+1.3<gap)gap=d+1.3;if(c.v<.15&&Math.abs(d)<1.2){c.dwell=6;c.served=true;sfxDoor(c.x,c.z);}}}
    const want=gap<1.3?0:Math.min(CAR_SPEED,Math.sqrt(2*5*(gap-1.3)));                             // the fastest speed that can still stop in time
    c.v=Math.max(0,c.v+Math.max(-16*dt,Math.min(3*dt,want-c.v)));c.x+=c.dir*c.v*dt;
    if(c.v<.2&&gap<4&&!(c.dwell>0)){c.wait+=dt;if(c.wait>3.5&&c.honk<=0){c.honk=1.4;sfxHonk(c.x,c.z);c.wait=1.2;say('叭叭！車子在等前面的人讓路。',true);}}else c.wait=0;
    c.honk-=dt;
    if(c.x*c.dir>105){c.on=false;c.g.visible=false;c.tag.hidden=true;c.t=c.bus?rnd(14,26):rnd(5,16)*(1+dark*1.5);continue;}
    c.g.position.set(c.x,0,c.z);spinWheels(c,c.v,dt,0);
    c.box[0]=c.x-c.hl-.05;c.box[1]=c.x+c.hl+.05;c.box[2]=c.z-c.hw;c.box[3]=c.z+c.hw;
    carLights(c,want<c.v-.5);
    c.tag.hidden=c.honk<=0;
    if(c.honk>0){cv3.set(c.x,2,c.z).project(camera);if(cv3.z<1){c.tag.style.left=((cv3.x+1)/2*canvas.clientWidth)+'px';c.tag.style.top=((1-cv3.y)/2*canvas.clientHeight)+'px';}else c.tag.hidden=true;}
  }
}
