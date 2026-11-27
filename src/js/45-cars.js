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
  cur=scene;return{g,wheels,headMat,tailMat,beam,paint};
}
function carLights(c,braking){const k=Math.max(0,Math.min(1,(dark-.2)/.4));
  c.headMat.color.setRGB(.2+k*6,.2+k*5.4,.2+k*4);c.tailMat.color.setRGB(.35+k*3+(braking?3:0),.02,.02);c.beam.material.opacity=k*.55;}
[0xc4553b,0x1f6a6e,0xe9e2d6,0x3b4a7a,0x7a2c5a,0x2a2c32].forEach((col,i)=>{
  const m=carMesh(col);m.g.visible=false;const dir=0;
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir,z:0,x:0,h:0,v:0,on:false,t:rnd(1,8)+i*3,wait:0,honk:0,tag,box:[0,0,0,0],hl:2.1,hw:.92}));
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
[-1,1].forEach((dir,i)=>{const m=busMesh(0xe8a23a);m.g.visible=false;
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir,busDir:dir,z:0,x:0,h:0,v:0,on:false,t:6+i*9,wait:0,honk:0,tag,box:[0,0,0,0],hl:3.5,hw:1.17,bus:true,home:dir,stopX:BUS_STOP[dir],dwell:0,served:false}));});
// one taxi: it only comes when you wave for it, stops beside you, and takes you along the main street
{const m=carMesh(0x2fb89a);m.g.visible=false;const sign=new THREE.Mesh(new THREE.BoxGeometry(.4,.3,.95),new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,.85,.05)}));sign.position.set(-.15,1.69,0);m.g.add(sign);
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;tag.textContent='叭叭！';$('tags').appendChild(tag);
  cars.push(Object.assign(m,{dir:0,z:0,x:0,h:0,v:0,on:false,t:1e9,wait:0,honk:0,tag,box:[0,0,0,0],hl:2.1,hw:.92,taxi:true,busDir:1,stopX:0,served:true,dwell:0,dest:null}));}
const taxi=cars[cars.length-1];
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
  const name=c.line==='south'?'eastSouth':c.bus||c.taxi?(c.busDir>0?'east':'west'):['east','west','east','west','northLeft','northRight','eastSouth','westSouth'][Math.floor(Math.random()*8)];
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
      c.on=false;c.g.visible=false;c.tag.hidden=true;c.t=c.taxi?1e9:c.line?rnd(45,75):c.bus?rnd(14,26):rnd(4,14)*(1+dark*1.5);continue;}tp=c.route[c.wi];}
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
    if(c.bus||c.taxi){const d=(c.stopX-px0)*c.busDir;                                          // a bus pulls up at its stop, waits with the doors open, then goes on
      if(c.dwell>0){c.dwell-=dt;gap=0;}
      else if(!c.served){if(d>-1&&d+1.3<gap)gap=d+1.3;if(c.v<.15&&Math.abs(d)<1.2){c.dwell=c.taxi?(onBus===c?3:25):6;c.served=true;sfxDoor(c.x,c.z);if(c.taxi)taxiStopped(c);}}}
    if(c.line==='south'&&c.served&&!c.served2&&!(c.dwell>0)&&fz>.9&&Math.abs(c.x-LN.s)<1.5){const d=SIDE_STOP+c.hl-pz0;      // its second stop, on the side street
      if(d>-1&&d+1.3<gap)gap=d+1.3;if(c.v<.15&&Math.abs(d)<1.4){c.dwell=7;c.served2=true;sfxDoor(c.x,c.z);if(c===onBus)say('第二條馬路站到了。要下車請按「下車」。');}}
    if(c===onBus&&busBell&&!(c.dwell>0)&&c.dir!==0&&(c.x<JX0-8||c.x>JX1+8)&&(c.x<ZEBRA[0]-6||c.x>ZEBRA[1]+6)){gap=0;   // you rang the bell: pull up at the next safe bit of kerb
      if(c.v<.15){c.dwell=4;busBell=false;sfxDoor(c.x,c.z);leaveBus();}}
    let want=gap<1.3?0:Math.min(CAR_SPEED,Math.sqrt(2*5*(gap-1.3)));                             // the fastest speed that can still stop in time
    if(Math.abs(turn)>.2)want=Math.min(want,3.6);                                      // slow down for corners
    c.v=Math.max(0,c.v+Math.max(-16*dt,Math.min(3*dt,want-c.v)));c.x+=fx*c.v*dt;c.z+=fz*c.v*dt;
    if(c.v<.2&&gap<4&&!(c.dwell>0)&&!c.stops.some(sp=>sp.st()!=='g')){c.wait+=dt;if(c.wait>3.5&&c.honk<=0){c.honk=1.4;sfxHonk(c.x,c.z);c.wait=1.2;say('叭叭！車子在等前面的人讓路。',true);}}else c.wait=0;
    c.honk-=dt;
    c.g.position.set(c.x,0,c.z);c.g.rotation.y=c.h;spinWheels(c,c.v,dt,Math.max(-1,Math.min(1,turn*2)));
    const hx=Math.abs(fx)*c.hl+Math.abs(fz)*c.hw+.05,hz=Math.abs(fz)*c.hl+Math.abs(fx)*c.hw;
    c.box[0]=c.x-hx;c.box[1]=c.x+hx;c.box[2]=c.z-hz;c.box[3]=c.z+hz;
    carLights(c,want<c.v-.5);
    const stopd=c.bus&&c.dwell>0&&Math.hypot(c.x-pos.x,c.z-pos.z)<28;                     // a bus at its stop shows which line it is
    c.tag.hidden=c.honk<=0&&!stopd;
    {const txt=c.honk>0?'叭叭！':c.line?(c.served2?'南線 · 第二條馬路站':'南線 · 往第二條馬路 →'):c.busDir>0?'公車 · 往東 →':'公車 · ← 往西';if(!c.tag.hidden&&c.tag.textContent!==txt)c.tag.textContent=txt;}
    if(c.honk>0||stopd){cv3.set(c.x,2,c.z).project(camera);if(cv3.z<1){c.tag.style.left=((cv3.x+1)/2*canvas.clientWidth)+'px';c.tag.style.top=((1-cv3.y)/2*canvas.clientHeight)+'px';}else c.tag.hidden=true;}
  }
}
