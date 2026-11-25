/* ---------- cars ---------- */
// Cars drive along the road, one lane each way. Drivers are careful: they slow down and stop for anyone on the road ahead,
// and they stop at the zebra crossing when someone is waiting there. If you stand in the way they wait, then honk.
const ST=WORLD.street,ZEBRA=[1.9-3.3,1.9+3.3],CAR_SPEED=7;
const onRoad=z=>z>ST.z0&&z<ST.z1;
const cars=[];
const carGlass=new THREE.MeshStandardMaterial({color:0x1a2230,roughness:.15,metalness:.6}),carTyre=new THREE.MeshStandardMaterial({color:0x111114,roughness:.9});
function carMesh(col){                                                   // a car facing +x, built around its own middle
  const g=new THREE.Group();scene.add(g);cur=g;
  const paint=new THREE.MeshStandardMaterial({color:col,roughness:.35,metalness:.4});
  box(4.2,.62,1.78,paint,0,.66,0,{r:.12});box(2.3,.56,1.6,carGlass,-.15,1.22,0,{r:.14});box(2.1,.05,1.5,paint,-.15,1.5,0,{r:.02});
  const wheels=[[-1.35,-.82],[-1.35,.82],[1.35,-.82],[1.35,.82]].map(p=>{const w=cyl(.33,.33,.22,carTyre,p[0],.33,p[1],16);w.rotation.x=Math.PI/2;return w;});
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
  cars.push(Object.assign(m,{dir,z:lane?ST.z1-1.75:ST.z0+1.75,x:0,v:0,on:false,t:rnd(1,8)+i*3,wait:0,honk:0,tag,box:[0,0,0,0]}));
});
// should this walker hold back at the kerb? yes if a moving car will get here within a few seconds
function carDanger(n,q){
  if(onRoad(n.pos.z)||!(onRoad(q[1])||(q[1]-ST.z0)*(n.pos.z-ST.z0)<0))return false;       // already crossing, or not heading for the road
  if(Math.min(Math.abs(n.pos.z-ST.z0),Math.abs(n.pos.z-ST.z1))>.4)return false;           // not at the kerb yet
  for(const c of cars){if(!c.on||c.v<1)continue;const ahead=(n.pos.x-c.x)*c.dir;if(ahead>-2.5&&ahead<c.v*4+4)return true;}
  return false;
}
const cv3=new THREE.Vector3();
function updateCars(dt){
  for(const c of cars){
    if(!c.on){c.t-=dt;
      if(c.t<=0){const sx=-c.dir*85;if(cars.some(o=>o!==c&&o.on&&o.dir===c.dir&&Math.abs(o.x-sx)<14)){c.t=2;continue;}
        c.on=true;c.x=sx;c.v=CAR_SPEED;c.g.visible=true;}
      continue;}
    const front=c.x+c.dir*2.1;let gap=1e9;
    const see=(px,pz)=>{if(!onRoad(pz))return;const d=(px-front)*c.dir;if(d>-.6&&d<gap)gap=d;};        // anyone on the road ahead, in either lane
    see(pos.x-(ride?c.dir*ride.S.len:0),pos.z);                                   // you, or the back of the car you are driving
    for(const n of people){if(n.hidden)continue;see(n.pos.x,n.pos.z);
      if(n.atCurb&&n.pos.x>ZEBRA[0]&&n.pos.x<ZEBRA[1]){const d=((c.dir>0?ZEBRA[0]-.7:ZEBRA[1]+.7)-front)*c.dir;if(d>-.6&&d<gap)gap=d;}}   // someone waiting at the zebra: stop before it
    for(const o of cars){if(o===c||!o.on||o.dir!==c.dir)continue;const d=(o.x-o.dir*2.1-front)*c.dir;if(d>-.6&&d<gap)gap=d;}
    const want=gap<1.3?0:Math.min(CAR_SPEED,Math.sqrt(2*5*(gap-1.3)));                             // the fastest speed that can still stop in time
    c.v=Math.max(0,c.v+Math.max(-16*dt,Math.min(3*dt,want-c.v)));c.x+=c.dir*c.v*dt;
    if(c.v<.2&&gap<4){c.wait+=dt;if(c.wait>3.5&&c.honk<=0){c.honk=1.4;sfxHonk(c.x,c.z);c.wait=1.2;say('叭叭！車子在等前面的人讓路。',true);}}else c.wait=0;
    c.honk-=dt;
    if(c.x*c.dir>85){c.on=false;c.g.visible=false;c.tag.hidden=true;c.t=rnd(5,16)*(1+dark*1.5);continue;}
    c.g.position.set(c.x,0,c.z);for(const w of c.wheels)w.rotation.z-=c.v*dt/.33;
    c.box[0]=c.x-2.15;c.box[1]=c.x+2.15;c.box[2]=c.z-.92;c.box[3]=c.z+.92;
    carLights(c,want<c.v-.5);
    c.tag.hidden=c.honk<=0;
    if(c.honk>0){cv3.set(c.x,2,c.z).project(camera);if(cv3.z<1){c.tag.style.left=((cv3.x+1)/2*canvas.clientWidth)+'px';c.tag.style.top=((1-cv3.y)/2*canvas.clientHeight)+'px';}else c.tag.hidden=true;}
  }
}
