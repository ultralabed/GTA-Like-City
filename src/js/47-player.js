/* ---------- things you can do: jump, carry and throw, sit, ride, use items ---------- */
// The buttons at the bottom right change with what is possible right now, so you never have to remember a key.
let jumpY=0,jumpV=0,held=null,seat=null,ride=null;
const camDir=new THREE.Vector3(),camGoal=new THREE.Vector3();

// --- jumping ---
function jump(){if(jumpY===0&&!ride&&!seat&&waterDepth()<.5)jumpV=4.2;}
// --- the sea ---
// The ground is really flat, so wading is faked: the further out you go, the lower your eyes sink, as if the seabed sloped away.
function waterDepth(){return ride||onPier(pos.x,pos.z)||onIsle(pos.x,pos.z,-1)?0:Math.max(0,Math.min(1.32,(WORLD.shore-pos.z)*.3));}

// --- things you keep in your bag and use ---
// flashlight and umbrella go in your hand (one at a time); the phone shows a map.
const ITEM={flashlight:{name:'手電筒',key:'1'},umbrella:{name:'雨傘',key:'2'},phone:{name:'手機地圖',key:'M'},board:{name:'滑板',key:'4'},kite:{name:'風箏',key:'5'}};
const bag={phone:true},use={flashlight:false,umbrella:false,phone:false,board:false,kite:false};
const boarding=()=>use.board&&!ride&&!onBus&&!seat&&!roomAt(pos.x,pos.z)&&waterDepth()<.05;   // actually rolling: outdoors, on dry ground
const hand=new THREE.Group();camera.add(hand);
const torch=new THREE.SpotLight(0xfff0d0,0,22,.5,.55,1.2);torch.position.set(.25,-.2,0);camera.add(torch);torch.target.position.set(0,-.08,-1);camera.add(torch.target);
const handTorch=new THREE.Group(),handBrolly=new THREE.Group();hand.add(handTorch,handBrolly);
(function(){
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.022,.028,.2,12),M.steel);body.rotation.x=Math.PI/2;
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.036,.03,.05,12),new THREE.MeshBasicMaterial({color:0xfff2cc}));lens.rotation.x=Math.PI/2;lens.position.z=-.12;
  handTorch.add(body,lens);handTorch.position.set(.3,-.27,-.5);
  const cloth=new THREE.MeshStandardMaterial({color:0x1f6a6e,roughness:.8,side:THREE.DoubleSide});
  const top=new THREE.Mesh(new THREE.ConeGeometry(1.15,.36,10,1,true),cloth);top.position.set(.1,.62,-.1);
  const stick=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.1,6),M.black);stick.position.set(.3,.1,-.42);stick.rotation.z=.18;
  handBrolly.add(top,stick);
})();
function showItems(){torch.intensity=use.flashlight&&!ride?1.7:0;handTorch.visible=use.flashlight&&!ride;handBrolly.visible=use.umbrella&&!ride;$('map').hidden=!use.phone;actKey='';}
function toggleItem(k){if(!bag[k])return;
  if(k==='phone')use.phone=!use.phone;
  else if(k==='kite'){use.kite=!use.kite;if(use.kite){if(roomAt(pos.x,pos.z)){use.kite=false;say('風箏要到外面才能放。');}else say(windS<2.6?'你拿出風箏，可是現在風太小，它飛不起來。等風大一點（下雨前後、暴風雨時風最大）。':'你把風箏放出去了！風推著它往上飛。風越大，飛得越高。');}else say('你把風箏收起來了。');}
  else if(k==='board'){use.board=!use.board;say(use.board?(roomAt(pos.x,pos.z)?'滑板準備好了。走到外面就會踩上去（在屋子裡不能溜）。':'你踩上滑板了！輪子會滾，所以比跑步快，也不太費力。'):'你把滑板收起來了。');}
  else{const on=!use[k];use.flashlight=use.umbrella=false;use[k]=on;if(on&&held)putDown();
    if(on)say(k==='umbrella'?'你撐開了雨傘：雨不會落在你身上。':'你打開了手電筒。');}
  showItems();}
const nearItem=()=>{let best=null,bd=1.7;const r=roomAt(pos.x,pos.z);
  for(const it of marks.item){if(it.taken||roomAt(it.x,it.z)!==r)continue;const d=Math.hypot(it.x-pos.x,it.z-pos.z);if(d<bd){bd=d;best=it;}}return best;};
function takeItem(it){it.taken=true;it.mesh.visible=false;
  if(bag[it.item]){say('你已經有'+ITEM[it.item].name+'了，這個就留著吧。');it.taken=false;it.mesh.visible=true;return;}
  bag[it.item]=true;say('你拿到了'+ITEM[it.item].name+'，放進背包了。按右下角的「'+ITEM[it.item].name+'」來用它。');actKey='';}
// the phone map: the whole street from above
let radarOn=true;
$('bRadar').onclick=()=>{radarOn=!radarOn;$('bRadar').textContent='小地圖：'+(radarOn?'開':'關');};
// The same drawing serves two maps: the phone map (the whole town, north up) and the little round radar
// (30 metres around you, turned so that the way you face is always up).
function drawMap(radar){
  if(!radar){const cp=$('mapcap'),tx='🌤 '+forecast();if(cp.textContent!==tx)cp.textContent=tx;}
  const c=$(radar?'radarc':'mapc');if(!radar){const hh=Math.round(c.width*(BB.z1-BB.z0)/(BB.x1-BB.x0));if(c.height!==hh)c.height=hh;}
  const g=c.getContext('2d'),k=radar?c.width/60:c.width/(BB.x1-BB.x0),X=radar?x=>x*k:x=>(x-BB.x0)*k,Y=radar?z=>z*k:z=>(z-BB.z0)*k,S=WORLD.street;
  const W0=radar?X(BB.x0-90):0,WW=radar?k*(BB.x1-BB.x0+180):c.width,T0=radar?Y(BB.z0-90):0,HH=radar?k*(BB.z1-BB.z0+180):c.height;
  g.setTransform(1,0,0,1,0,0);
  if(radar){g.clearRect(0,0,c.width,c.height);g.save();g.beginPath();g.arc(c.width/2,c.height/2,c.width/2,0,7);g.clip();g.translate(c.width/2,c.height/2);g.rotate(yaw);g.translate(-X(pos.x),-Y(pos.z));}
  g.fillStyle='#3d5a34';g.fillRect(W0,T0,WW,HH);
  g.fillStyle='#2a6f9a';g.fillRect(W0,T0,WW,Y(WORLD.shore)-T0);g.fillStyle='#cdbb92';g.fillRect(W0,Y(WORLD.shore),WW,k*6.5);
  {const I=WORLD.isle;g.fillStyle='#cdbb92';g.beginPath();g.arc(X(I.x),Y(I.z),k*(I.r+1.2),0,7);g.fill();g.fillStyle='#3d5a34';g.beginPath();g.arc(X(I.x),Y(I.z),k*(I.r-3),0,7);g.fill();g.fillStyle='#f2efe8';g.beginPath();g.arc(X(I.x),Y(I.z),k*1.4,0,7);g.fill();}
  {const P=WORLD.pier;g.fillStyle='#8a6a4a';g.fillRect(X(P.x0),Y(P.z0),k*(P.x1-P.x0),k*(P.z1-P.z0+.6));}
  g.fillStyle='#9b958c';g.fillRect(X(JX0-S.walk),Y(S.z1),k*(JX1-JX0+2*S.walk),HH);g.fillStyle='#34343a';g.fillRect(X(JX0),Y(S.z1),k*(JX1-JX0),HH);   // the side street
  g.fillStyle='#9b958c';g.fillRect(W0,Y(S.z0-S.walk),WW,k*(S.z1-S.z0+2*S.walk));g.fillStyle='#34343a';g.fillRect(W0,Y(S.z0),WW,k*(S.z1-S.z0));
  g.fillStyle='#e8e4d8';for(let i=0;i<7;i++)g.fillRect(X(-1.1+i)-k*.25,Y(S.z0)+2,k*.5,k*(S.z1-S.z0)-4);
  for(let x=JX0+.55;x<JX1-.2;x+=1)g.fillRect(X(x)-k*.25,Y(WORLD.zebra2-1.5),k*.5,k*3);
  g.font='bold '+Math.round(k*2.2)+'px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';
  for(const H of houses){for(const r of H.rooms){g.fillStyle='#'+H.mats.ext.color.getHexString();g.fillRect(X(r.x0),Y(r.z0),k*r.w,k*r.d);}
    if(!radar){g.fillStyle='#20242c';g.fillText(H.no,X((H.x0+H.x1)/2),Y((H.z0+H.z1)/2));}}
  const dot=(x,z,r,col)=>{g.fillStyle=col;g.beginPath();g.arc(X(x),Y(z),r,0,7);g.fill();};
  for(const c2 of cars)if(c2.on&&c2.x>BB.x0&&c2.x<BB.x1&&c2.z<BB.z1){const q=c2.box;g.fillStyle=c2.van?'#ffb7d5':c2.line?'#2f9fb0':c2.bus?'#e8a23a':'#d9d3c8';g.fillRect(X(q[0]),Y(q[2]),k*(q[1]-q[0]),k*(q[3]-q[2]));}
  for(const r of rides){g.fillStyle=r.kind==='car'?'#'+r.paint.color.getHexString():r.kind==='moto'?'#2a8fb0':r.kind==='boat'?'#f4efe4':'#ff7ac0';g.save();g.translate(X(r.x),Y(r.z));g.rotate(-r.h);g.fillRect(-k*r.S.len*.9,-k*r.S.R*.9,k*r.S.len*1.8,k*r.S.R*1.8);g.restore();}
  for(const d of pets)dot(d.x,d.z,k*.4,'#d9a441');dot(cat.x,cat.z,k*.3,'#e08a3c');
  for(const n of people)if(!n.hidden)dot(n.pos.x,n.pos.z,k*.55,'#'+n.o.top.toString(16).padStart(6,'0'));
  g.fillStyle='#35c9a0';g.fillRect(X(PUMP.x)-k*.7,Y(PUMP.z)-k*.7,k*1.4,k*1.4);                        // the petrol pump
  let qt=null;if(quest){const q=quest;qt=q.type==='ride'?(q.in?[q.dest[1],q.dest[2]]:[q.from.pos.x,q.from.pos.z]):q.type==='race'?q.gates[q.i]:q.type==='parcel'?[q.house.front.x,q.house.front.z]:q.type==='story'?(q.i<q.steps.length?q.steps[q.i].at:[q.who.pos.x,q.who.pos.z]):q.type==='papers'?(()=>{let b=q.left[0];for(const h of q.left)if(Math.hypot(h.front.x-pos.x,h.front.z-pos.z)<Math.hypot(b.front.x-pos.x,b.front.z-pos.z))b=h;return[b.front.x,b.front.z];})():(q.type==='find'||q.type==='dog')&&!q.got?[q.at[1],q.at[2]]:q.type==='water'?q.plants[q.done].ap:q.type==='letter'?[q.to.pos.x,q.to.pos.z]:[q.from.pos.x,q.from.pos.z];}
  if(quest&&quest.type==='ride'&&quest.in){g.strokeStyle='#ff9a4d';g.lineWidth=3;g.beginPath();g.arc(X(quest.dest[1]),Y(quest.dest[2]),k*2.2,0,7);g.stroke();}
  else if(quest&&quest.type==='parcel'){const f=quest.house.front;g.strokeStyle='#ff9a4d';g.lineWidth=3;g.beginPath();g.arc(X(f.x),Y(f.z),k*2,0,7);g.stroke();}
  else if(quest&&(quest.type==='find'||quest.type==='dog')&&!quest.got){g.strokeStyle='#ff9a4d';g.lineWidth=3;g.setLineDash([4,3]);g.beginPath();g.arc(X(quest.at[1]),Y(quest.at[2]),k*5,0,7);g.stroke();g.setLineDash([]);}   // roughly where the lost thing is
  else if(quest&&quest.type==='papers'){g.strokeStyle='#ff9a4d';g.lineWidth=3;for(const h of quest.left){g.beginPath();g.arc(X(h.front.x),Y(h.front.z),k*1.8,0,7);g.stroke();}}
  else if(quest&&quest.type==='water'){}
  else if(quest&&quest.type==='race'){g.strokeStyle='#ffd23d';g.lineWidth=3;const c=quest.gates[quest.i];g.beginPath();g.arc(X(c[0]),Y(c[1]),k*2.6,0,7);g.stroke();}
  else if(quest&&quest.type==='story'){const a2=quest.i<quest.steps.length?quest.steps[quest.i].at:[quest.who.pos.x,quest.who.pos.z];g.strokeStyle='#ff9a4d';g.lineWidth=3;g.beginPath();g.arc(X(a2[0]),Y(a2[1]),k*2,0,7);g.stroke();}
  else if(quest){const n=quest.type==='letter'?quest.to:quest.from;if(!n.hidden){g.strokeStyle='#ff9a4d';g.lineWidth=3;g.beginPath();g.arc(X(n.pos.x),Y(n.pos.z),k*1.6,0,7);g.stroke();}}   // where your job is
  g.save();g.translate(X(pos.x),Y(pos.z));g.rotate(-yaw);g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=2;      // you: an arrow showing which way you face
  g.beginPath();g.moveTo(0,-k*1.5);g.lineTo(k*.95,k*1.1);g.lineTo(0,k*.5);g.lineTo(-k*.95,k*1.1);g.closePath();g.fill();g.stroke();g.restore();
  if(radar){g.restore();g.setTransform(1,0,0,1,0,0);const R=c.width/2;                                              // the job marker sticks to the rim when it is further away than the radar shows
    if(qt){const dx=qt[0]-pos.x,dz=qt[1]-pos.z,L=Math.hypot(dx,dz);if(L*k>R-10){const cs=Math.cos(yaw),sn=Math.sin(yaw),ux=(dx*cs-dz*sn)/L,uy=(dx*sn+dz*cs)/L;
      g.fillStyle='#ff9a4d';g.strokeStyle='#111';g.lineWidth=2;g.beginPath();g.arc(R+ux*(R-9),R+uy*(R-9),7,0,7);g.fill();g.stroke();}}
    g.fillStyle='#fff';g.font='bold 20px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';const cs=Math.cos(yaw),sn=Math.sin(yaw);
    g.strokeStyle='#111';g.lineWidth=3;g.strokeText('北',R+sn*(R-14),R-cs*(R-14));g.fillText('北',R+sn*(R-14),R-cs*(R-14));}
}

// --- carrying and throwing ---
function nearBall(){let best=null,bd=1.7;for(const b of bodies){if(b.held)continue;const d=Math.hypot(b.p.x-pos.x,b.p.z-pos.z);if(d<bd&&b.p.y<2){bd=d;best=b;}}return best;}
function pickUp(){const it=nearItem();if(it){takeItem(it);return;}
  const b=nearBall();if(!b)return;
  if(b.m>8){say(b.name+'有 '+b.m+' 公斤，太重了，搬不動。');return;}
  use.flashlight=use.umbrella=false;showItems();                             // your hands are full now
  held=b;b.held=true;say('你撿起了'+b.name+'（'+b.m+' 公斤）。點一下畫面丟出去，或按「放下」。');}
function putDown(){if(!held)return;held.held=false;held.v.set(vel.x,0,vel.z);held=null;}
function throwHeld(){if(!held)return;const b=held;camera.getWorldDirection(camDir);camDir.y+=.18;camDir.normalize();
  const J=Math.min(6,b.m*12);                                             // the same push for every ball: light ones fly, heavy ones barely move
  b.held=false;held=null;b.v.set(vel.x,0,vel.z).addScaledVector(camDir,J/b.m);vel.x-=camDir.x*J/PLAYER_M;vel.z-=camDir.z*J/PLAYER_M;
  b.kickBy='你';b.kickAt=performance.now()/1000;
  say('你把'+b.name+'丟出去：球被推 '+J.toFixed(1)+' 牛頓·秒，速度每秒 '+(J/b.m).toFixed(1)+' 公尺；你也被往後推一樣多。');}
function carryHeld(){if(!held)return;camera.getWorldDirection(camDir);
  held.p.set(camera.position.x+camDir.x*.55,camera.position.y-.32+camDir.y*.4,camera.position.z+camDir.z*.55);held.v.set(vel.x,0,vel.z);held.mesh.position.copy(held.p);}

// --- sitting ---
function nearSpot(pose){let best=null,bd=1.6;
  for(const k in ACT){const A=ACT[k];if(A.pose!==pose&&!(pose==='sit'&&A.pose==='eat')||!A.an)continue;if(people.some(n=>n.want===k))continue;
    const d=Math.min(Math.hypot(A.ap[0]-pos.x,A.ap[1]-pos.z),Math.hypot(A.an[0]-pos.x,A.an[2]-pos.z));if(d<bd){bd=d;best=k;}}
  return best;}
const nearSeat=()=>nearSpot('sit'),nearBed=()=>nearSpot('lie');
function sitDown(){const k=nearSeat();if(!k)return;seat={k,A:ACT[k]};vel.x=vel.z=0;yaw=seat.A.yaw+Math.PI;pitch=-.05;}   // face the way the seat faces
// lying down: time runs fast until morning (or until you move), and you wake up rested
let napSpeed=-1;
let napFrom=0;
function lieDown(){const k=nearBed();if(!k)return;seat={k,A:ACT[k],lie:true};napFrom=clock;vel.x=vel.z=0;pitch=1.15;napSpeed=speedIdx;speedIdx=2;$('bSpeed').textContent='時間：'+SPEEDS[2][1];
  say('你躺下來睡覺了。時間會過得很快，早上 7 點會自己醒來；動一下也會醒。');}
function standUp(){if(!seat)return;if(seat.lie){speedIdx=napSpeed<0?1:napSpeed;$('bSpeed').textContent='時間：'+SPEEDS[speedIdx][1];stam=1;pitch=-.05;let extra='';
    {const H=houses.find(h=>h.lot.forSale),c=rides[0];                       // your own car parked outside your own home: it gets looked after while you sleep
      if(homeOwned&&H&&(clock-napFrom+24)%24>=3&&Math.hypot(pos.x-H.front.x,pos.z-H.front.z)<14&&Math.hypot(c.x-H.front.x,c.z-H.front.z)<11&&carDmg>.02){carDmg=0;stats.homeFix=(stats.homeFix||0)+1;extra='車子停在家門口，你睡前順手把它修好、擦亮了（免費）。';}}
    say('你睡醒了，體力全滿。現在是 '+$('clk').textContent+'。'+extra);}
  pos.x=seat.A.ap[0];pos.z=seat.A.ap[1];seat=null;}

// --- riding: a car and a bicycle ---
// For bumping into things, a vehicle is a row of circles (pts = where along its length, R = how big).
const SPEC={
  car:{name:'車',verb:'開車',tank:900,full:40,max:13,acc:5.5,rev:4,turn:1.5,pts:[1.15,-1.15],R:.95,back:6.4,up:3.2,mass:1200,len:2.4,exit:1.75},
  moto:{name:'機車',verb:'騎車',tank:1300,full:20,max:16,acc:7.5,rev:1.5,turn:2.1,pts:[.5,-.5],R:.4,back:5,up:2.5,mass:180,len:1,exit:.9},
  boat:{name:'小船',verb:'開船',water:true,max:9,acc:3.2,rev:2,turn:1.15,pts:[.9,-.9],R:.75,back:7.5,up:3.4,mass:350,len:1.7,exit:1.4},
  bike:{name:'腳踏車',verb:'騎車',max:6.5,acc:3.6,rev:1.5,turn:2.6,pts:[.42,-.42],R:.36,back:4.4,up:2.3,mass:95,len:.9,exit:.85}
};
const SEA={x0:-95,x1:125,z0:-95};                                          // how far out the boat may go
function boatMesh(){
  const g=new THREE.Group();scene.add(g);cur=g;
  const hull=new THREE.MeshStandardMaterial({color:0xf4efe4,roughness:.45}),trim=new THREE.MeshStandardMaterial({color:0xd9623f,roughness:.5});
  box(3.3,.42,1.3,hull,0,.12,0,{r:.16});box(.9,.36,1.05,hull,1.75,.16,0,{r:.16});box(3.36,.08,1.36,trim,0,.34,0,{r:.03});   // hull, bow, a coloured rail
  box(2.6,.06,.98,M.walnut,-.1,.2,0);box(.3,.1,1,M.walnut,-.5,.42,0);box(.3,.1,1,M.walnut,.6,.42,0);              // floor and two benches
  box(.26,.5,.3,M.black,-1.75,.38,0,{r:.05});cyl(.03,.03,.5,M.steel,-1.75,-.05,0,8);                                          // the little motor at the back
  const rider=new THREE.Group();g.add(rider);cur=rider;                                                                          // you, sitting on the back bench with a hand on the motor
  const skin=new THREE.MeshStandardMaterial({color:0xe8b996,roughness:.85}),top=new THREE.MeshStandardMaterial({color:0x2b3a67,roughness:.85}),leg=new THREE.MeshStandardMaterial({color:0x3a3a3a,roughness:.85});
  const cap=(r,l,m,x,y,z,rz)=>{const me=new THREE.Mesh(new THREE.CapsuleGeometry(r,l,4,10),m);me.position.set(x,y,z);me.rotation.z=rz||0;add(me);return me;};
  cap(.13,.3,top,-.55,.86,0,-.08);add(new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),skin)).position.set(-.5,1.27,0);
  [-.15,.15].forEach(z=>{cap(.06,.34,leg,-.3,.52,z*.7,-1.5);cap(.05,.3,leg,-.06,.34,z*.7,-.1);});
  cap(.04,.4,top,-.86,.88,-.2,.9);cap(.04,.36,top,-.42,.8,.2,-.6);
  rider.visible=false;cur=scene;return{g,wheels:[],rider};}
function bikeMesh(moto){
  const g=new THREE.Group();scene.add(g);cur=g;
  const paint=new THREE.MeshStandardMaterial({color:moto?0x2a8fb0:0xff5fa8,roughness:.4,metalness:.5});
  const wheels=[-.52,.52].map(x=>{const w=wheel(moto?.3:.34,moto?.14:.045,x*(moto?1.25:1),0);w.front=x>0;return w;});
  if(moto){box(.75,.3,.26,paint,-.05,.55,0,{r:.08});box(.5,.1,.28,M.black,-.3,.82,0,{r:.04});box(.3,.26,.2,M.steel,.05,.35,0,{r:.04});   // tank, seat, engine
    const lamp=new THREE.MeshBasicMaterial({color:0x222222});box(.05,.12,.16,lamp,.68,.86,0).castShadow=false;g.userData.lamp=lamp;}
  box(.95,.045,.045,paint,0,.66,0);box(.045,.5,.045,paint,-.25,.62,0);box(.6,.045,.045,paint,-.05,.42,0,{rz:.5});
  box(.045,.66,.045,paint,.5,.66,0,{rz:.18});box(.045,.045,.52,M.steel,.44,.98,0);box(.26,.05,.15,M.black,-.27,.9,0,{r:.02});
  // a simple rider, only shown while you ride
  const rider=new THREE.Group();g.add(rider);cur=rider;
  const skin=new THREE.MeshStandardMaterial({color:0xe8b996,roughness:.85}),top=new THREE.MeshStandardMaterial({color:0x2b3a67,roughness:.85}),leg=new THREE.MeshStandardMaterial({color:0x3a3a3a,roughness:.85});
  const cap=(r,l,m,x,y,z,rz)=>{const me=new THREE.Mesh(new THREE.CapsuleGeometry(r,l,4,10),m);me.position.set(x,y,z);me.rotation.z=rz||0;add(me);return me;};
  cap(.13,.3,top,-.12,1.28,0,-.35);add(new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),skin)).position.set(.06,1.68,0);
  [-.17,.17].forEach(z=>{cap(.04,.42,top,.18,1.22,z,-1.15);cap(.06,.36,leg,-.1,.78,z*.6,-.5);cap(.05,.34,leg,.02,.46,z*.6,.15);});
  rider.visible=false;cur=scene;g.rotation.order='YXZ';
  return{g,wheels,rider};
}
const rides=WORLD.rides.map(o=>{const m=o.kind==='car'?carMesh(0xf2c23d):o.kind==='boat'?boatMesh():bikeMesh(o.kind==='moto');          // your car is the yellow one
  m.g.rotation.order='YXZ';m.g.position.set(o.x,0,o.z);m.g.rotation.y=o.h;
  if(o.kind==='car'){cur=scene;const along=Math.abs(Math.cos(o.h))>.5;flat(along?5.6:2.8,along?2.8:5.6,M.concrete,o.x,-.011,o.z,1.4);}   // a parking pad under it
  return Object.assign(m,{kind:o.kind,S:SPEC[o.kind],x:o.x,z:o.z,h:o.h,v:0,bumped:0,fuel:o.kind==='car'?.5:.7});});
function rideHit(r,x,z,h){
  const fx=Math.cos(h),fz=-Math.sin(h),R=r.S.R;
  if(r.S.water){for(const k of r.S.pts){const cx=x+fx*k,cz=z+fz*k,P=WORLD.pier;if(cx>P.x0-R&&cx<P.x1+R&&cz>P.z0-R)return true;if(onIsle(cx,cz,-R-.6))return true;if(cz>WORLD.shore-1.1||cz<SEA.z0||cx<SEA.x0||cx>SEA.x1)return true;}return false;}   // a boat only minds the beach and the edge of the map
  for(const k of r.S.pts){const cx=x+fx*k,cz=z+fz*k;
    if(!inWorld(cx,cz,R)||cz<WORLD.shore+.4)return true;                   // no driving into the sea
    for(const c of colliders)if(cx>c[0]-R&&cx<c[1]+R&&cz>c[2]-R&&cz<c[3]+R)return true;
    for(const d of doors){const c=doorArea(d);if(cx>c[0]-R&&cx<c[1]+R&&cz>c[2]-R&&cz<c[3]+R)return true;}
    for(const c of cars)if(c.on&&cx>c.box[0]-R&&cx<c.box[1]+R&&cz>c.box[2]-R&&cz<c.box[3]+R)return true;
    for(const o of rides)if(o!==r)for(const j of o.S.pts)if(Math.hypot(o.x+Math.cos(o.h)*j-cx,o.z-Math.sin(o.h)*j-cz)<R+o.S.R)return true;
    for(const n of people)if(!n.hidden&&Math.hypot(n.pos.x-cx,n.pos.z-cz)<R+.3)return n;}
  return false;
}
function nearRide(){let best=null,bd=1e9;for(const r of rides){const d=Math.hypot(r.x-pos.x,r.z-pos.z)-r.S.R;if(d<2&&d<bd){bd=d;best=r;}}return best;}
function getIn(){const r=nearRide();if(!r||ride)return;putDown();standUp();ride=r;r.v=0;vel.x=vel.z=0;jumpY=jumpV=0;if(r.rider)r.rider.visible=true;showItems();
  say(r.kind==='car'?'你上車了。W 或往前推是油門，S 是煞車和倒車，A D 是方向盤。':r.kind==='moto'?'你騎上機車了。W 催油門，S 煞車，A D 轉彎。它比車子還快，小心騎。':r.kind==='boat'?'你坐上小船了。W 往前，S 煞車和倒退，A D 轉彎。船在水上會滑比較久才停。要下船請開回沙灘旁邊。':'你騎上腳踏車了。W 踩踏板，S 煞車，A D 轉彎。腳踏車可以騎上人行道。');}
function getOut(){const r=ride;if(!r)return;if(Math.abs(r.v)>1.5){say('先停下來再下車。');return;}
  if(r.S.water){const P=WORLD.pier,px=Math.max(P.x0+.5,Math.min(P.x1-.5,r.x)),pz=Math.max(P.z0+.6,Math.min(P.z1,r.z));
    if(Math.hypot(px-r.x,pz-r.z)<3.4){ride=null;r.v=0;pos.x=px;pos.z=pz;yaw=0;pitch=-.05;if(r.rider)r.rider.visible=false;r.g.rotation.x=0;showItems();say('你把船靠在碼頭邊，踏上碼頭了。');return;}
    {const I=WORLD.isle,d=Math.hypot(r.x-I.x,r.z-I.z);if(d<I.r+5){const k=(I.r-.6)/d,kb=(I.r+1.7)/d;ride=null;r.v=0;pos.x=I.x+(r.x-I.x)*k;pos.z=I.z+(r.z-I.z)*k;r.x=I.x+(r.x-I.x)*kb;r.z=I.z+(r.z-I.z)*kb;r.g.position.set(r.x,0,r.z);   // nose the boat up to the sand so you can step back inyaw=Math.atan2(r.x-I.x,r.z-I.z);pitch=-.05;if(r.rider)r.rider.visible=false;r.g.rotation.x=0;showItems();
      say('你把船停在燈塔島的沙灘邊，上島了。'+(isleSeen?'':'這座小島只有開船才到得了。晚上燈塔的光會一圈一圈地轉，提醒船不要撞上來。'));isleSeen=true;return;}}
    if(r.z<WORLD.shore-4.5){say('這裡水太深了。把船開回沙灘旁邊、靠到碼頭邊，或開到燈塔島旁邊再下船。');return;}ride=null;r.v=0;pos.x=r.x;pos.z=WORLD.shore+.7;yaw=0;pitch=-.05;if(r.rider)r.rider.visible=false;r.g.rotation.x=0;showItems();say('你下船了，船停在岸邊。');return;}
  const fx=Math.cos(r.h),fz=-Math.sin(r.h);ride=null;                                          // (blocked() treats the vehicle as parked from here on)
  for(const side of[1,-1]){const x=r.x+fz*r.S.exit*side,z=r.z-fx*r.S.exit*side;                 // try the left side, then the right
    if(!blocked(x,z)){r.v=0;pos.x=x;pos.z=z;yaw=Math.atan2(-fx,-fz);pitch=-.05;if(r.rider)r.rider.visible=false;r.g.rotation.x=0;showItems();return;}}
  ride=r;say('兩邊都被擋住了，往前一點再下車。');}
// the horn (a bell on the bicycle): people in front of you hear it, say something, and step aside if they can
let hornAt=0,redAt=-99;
function horn(){const r=ride;if(!r)return;const now=performance.now()/1000;if(now-hornAt<.6)return;hornAt=now;
  if(r.kind==='bike'){tone(1760,.25,.2,'triangle');setTimeout(()=>tone(1760,.3,.18,'triangle'),160);}else sfxHonk(r.x,r.z);
  const fx=Math.cos(r.h),fz=-Math.sin(r.h);
  for(const n of people){if(n.hidden||n.lie)continue;const dx=n.pos.x-r.x,dz=n.pos.z-r.z,d=Math.hypot(dx,dz);
    if(d<9&&d>.1&&(dx*fx+dz*fz)/d>.55&&!roomAt(n.pos.x,n.pos.z))notify(n,'honk',r);}
  for(const d of pets)if(Math.hypot(d.x-r.x,d.z-r.z)<10)bark(d);}
function rideStep(dt,f,s){
  const r=ride,S=r.S;let a=Math.max(-1,Math.min(1,f));
  if(S.tank){const was=r.fuel;r.fuel=Math.max(0,r.fuel-Math.abs(r.v)*dt/S.tank);                 // engines drink petrol as they go; the bicycle runs on you
    if(was>.15&&r.fuel<=.15)say('油快沒了！大馬路南邊、公園西邊有加油機（綠色的），把'+S.name+'停在旁邊加油。');
    if(r.fuel<=0){if(was>0)say('沒油了。'+S.name+'沒有油就沒有力氣，只能慢慢滑到停下來。可以下車用走的，或推到加油機旁邊。');if(a>0)a=Math.min(a,.12);}}
  const st=-Math.max(-1,Math.min(1,s));
  hbT=Math.max(0,hbT-dt);const hb=(keys.Space||hbT>0)&&r.kind!=='bike'&&!S.water&&Math.abs(r.v)>1.5;                 // handbrake: the back end lets go, so it turns much tighter while it scrubs off speed
  if(hb){skidT-=dt;if(skidT<=0){skidT=.16;noise(.18,1900+Math.random()*500,3,.1);}if(!toldHb){toldHb=true;say('手煞車！後輪抓不住地面，車尾會甩出去，所以轉彎變得很急，速度也掉得很快。掉頭的時候很好用。');}}
  r.v+=a*(a*r.v<0?14:a>0?S.acc:S.rev*.9)*dt;r.v*=Math.exp(-(S.water?.25:hb?1.5:.5)*dt);r.v=Math.max(-S.rev,Math.min(S.max,r.v));
  if(Math.abs(a)<.05&&Math.abs(r.v)<.2)r.v=0;
  const nh=r.h+st*Math.max(-1,Math.min(1,r.v/4))*S.turn*(hb?1.9:1)*dt,nx=r.x+Math.cos(nh)*r.v*dt,nz=r.z-Math.sin(nh)*r.v*dt;
  const hit=r.v?rideHit(r,nx,nz,nh):false;r.bumped-=dt;
  if(!hit){r.x=nx;r.z=nz;r.h=nh;}
  else{if(hit!==true){notify(hit,'car',r);r.v=0;}                                                // a person: stop dead, and they will tell you what they think
    else{if(Math.abs(r.v)>2.5&&r.bumped<=0){r.bumped=1;sfxBump();const hard=r.kind==='car'&&Math.abs(r.v)>5;if(hard){const d0=carDmg;carDmg=Math.min(1,carDmg+(Math.abs(r.v)-4)/40);applyTune();if(d0<.6&&carDmg>=.6)say('車子撞得太嚴重，引擎蓋開始冒煙了！車子會越來越跑不動。把它開到加油機旁邊按 U 修理。');else say('碰！撞得很大力，車子凹了（車況 '+Math.round((1-carDmg)*100)+'%）。撞得越快，壞得越多。可以到加油機旁邊按 U 修車。');}
      else say('碰！'+S.name+'撞到東西，東西也用一樣大的力把'+S.name+'推回來，所以彈了一下。');}r.v*=-.2;}}
  pos.x=r.x;pos.z=r.z;
  if(S.tank&&Math.abs(r.v)>11.4&&performance.now()/1000-fastAt>25&&!(quest&&quest.type==='race')){const g=people.find(n=>n.guard);   // over 40 km/h right past the patrolman
    if(g&&!g.hidden&&Math.hypot(g.pos.x-r.x,g.pos.z-r.z)<13){fastAt=performance.now()/1000;stats.fast=(stats.fast||0)+1;say('你在巡邏員旁邊開到 '+Math.round(Math.abs(r.v)*3.6)+' km/h！街上限速 40。');addRep(-1);}}
  if(sigCars==='r'&&onRoad(r.z)&&r.x>ZEBRA[0]&&r.x<ZEBRA[1]&&Math.abs(r.v)>2&&performance.now()/1000-redAt>20){redAt=performance.now()/1000;   // driving through on red
    const g=people.find(n=>n.guard);if(g&&!g.hidden&&Math.hypot(g.pos.x-r.x,g.pos.z-r.z)<32){say('你闖紅燈，被巡邏員看到了！');addRep(-1);}else say('你闖紅燈了。這次巡邏員沒看到。');}
  r.g.position.set(r.x,0,r.z);r.g.rotation.y=r.h;spinWheels(r,r.v,dt,st);
  if(S.water){const tt=performance.now()/1000;r.g.position.y=-.03+Math.sin(tt*1.7)*.04;r.g.rotation.z=Math.sin(tt*1.3)*.03+Math.min(.12,r.v*.012);}   // bobs on the waves, nose up when fast
  if(r.g.userData.lamp){const k=Math.max(0,Math.min(1,(dark-.2)/.4));r.g.userData.lamp.color.setRGB(.2+k*6,.2+k*5.4,.2+k*4);}
  if(r.kind!=='car')r.g.rotation.x+=(-st*Math.min(1,Math.abs(r.v)/S.max)*.38*Math.sign(r.v||1)-r.g.rotation.x)*(1-Math.exp(-dt*6));   // lean into the turn
  // the camera follows behind and above
  const fx=Math.cos(r.h),fz=-Math.sin(r.h);
  camGoal.set(r.x-fx*S.back,S.up,r.z-fz*S.back);camera.position.lerp(camGoal,1-Math.exp(-dt*5));
  camera.lookAt(r.x+fx*2.5,1.1,r.z+fz*2.5);
  yaw=Math.atan2(-fx,-fz);
}
// --- fishing: stand at the water's edge, cast, wait for a bite, then pull in time ---
let fish=null,fishBag=0,fishCount=0;const fishGot={};
// what bites depends on where you fish and whether it is night: [name, price, how common, places, night-only? (true/false/either)]
const FISH=[['一隻舊鞋子',0,10,['shore','pier']],['一條小魚',8,40,['shore','pier','deep','isle']],['一條鯛魚',15,26,['shore','pier','deep']],['一條大魚',30,12,['pier','deep','isle']],
  ['一隻章魚',35,10,['pier']],['一條超大的鮪魚',60,10,['deep']],['一條旗魚',90,4,['deep'],false],['一隻龍蝦',70,12,['isle']],['一隻會發光的烏賊',55,16,['pier','deep','isle'],true],['一隻螃蟹',20,14,['shore','isle'],true]];
const FISH_HINT={'一隻舊鞋子':'岸邊或碼頭','一條小魚':'到處都有','一條鯛魚':'岸邊、碼頭、海上','一條大魚':'碼頭外面、海上、燈塔島','一隻章魚':'只有碼頭','一條超大的鮪魚':'開船到很遠的海上','一條旗魚':'很遠的海上，白天，很少見','一隻龍蝦':'燈塔島旁邊','一隻會發光的烏賊':'晚上，碼頭或海上','一隻螃蟹':'晚上，岸邊或燈塔島'};
const bobber=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),new THREE.MeshBasicMaterial({color:0xff5533}));bobber.visible=false;scene.add(bobber);
const onBoat=()=>!!ride&&!!ride.S.water&&Math.abs(ride.v)<.8;
const atShore=()=>onBoat()||!ride&&!seat&&(onIsle(pos.x,pos.z,-1)&&!onIsle(pos.x,pos.z,3)||onPier(pos.x,pos.z)&&pos.z<WORLD.shore-1||pos.z<WORLD.shore+2.2&&pos.z>WORLD.shore-3&&inTown(pos.x,pos.z,0));
function fishing(){
  if(!fish&&onBoat()){const r=ride;fish={x:r.x+Math.sin(r.h)*3.2,z:r.z+Math.cos(r.h)*3.2,t:0,at:rnd(3,8)*(bag.rod?.5:1),bite:false,px:pos.x,pz:pos.z,deep:r.z<WORLD.shore-25};
    say('你從船上把釣線甩出去了。'+(fish.deep?'這裡離岸邊很遠，水很深，比較容易釣到大魚。':'')+'船一開走就會收線。');noise(.2,1200,.8,.15);actKey='';return;}
  if(!fish&&onIsle(pos.x,pos.z,-1)){const I=WORLD.isle,d=Math.hypot(pos.x-I.x,pos.z-I.z)||1,k=(I.r+4)/d;fish={x:I.x+(pos.x-I.x)*k,z:I.z+(pos.z-I.z)*k,t:0,at:rnd(3,9)*(bag.rod?.5:1),bite:false,px:pos.x,pz:pos.z,deep:true};say('你從島邊把釣線甩出去了。');noise(.2,1200,.8,.15);actKey='';return;}
  if(!fish){if(!atShore())return;camera.getWorldDirection(camDir);const fx=camDir.x,fz=Math.min(-.3,camDir.z),L=Math.hypot(fx,fz);
    fish={x:pos.x+fx/L*4.5,z:Math.min(WORLD.shore-1.5,pos.z+fz/L*4.5),t:0,at:rnd(4,11)*(bag.rod?.5:1),bite:false,px:pos.x,pz:pos.z,deep:pos.z<WORLD.shore-8};if(onPier(pos.x,pos.z)){const P=WORLD.pier;fish.x=pos.x+(fx<0?-1:1)*(Math.abs(fx)>.5?3.6:0);fish.z=Math.abs(fx)>.5?pos.z:pos.z-3.6;if(fish.x>P.x0-1&&fish.x<P.x1+1&&fish.z>P.z0-1)fish.z=P.z0-2.5;}say('你把釣線甩出去了。等浮標沉下去，再按「拉！」。走開就會收線。');noise(.2,1200,.8,.15);return;}
  if(fish.bite){const where=Math.hypot(fish.x-WORLD.isle.x,fish.z-WORLD.isle.z)<WORLD.isle.r+9?'isle':fish.deep&&ride?'deep':fish.deep?'pier':'shore',night=dark>.6;
    const pool=FISH.filter(F=>F[3].includes(where)&&(F[4]==null||F[4]===night));let tot=0;for(const F of pool)tot+=F[2];let r=Math.random()*tot,F=pool[0];for(const q of pool){r-=q[2];if(r<=0){F=q;break;}}
    const isNew=!fishGot[F[0]];fishGot[F[0]]=(fishGot[F[0]]||0)+1;fishBag+=F[1];fishCount++;fish=null;sfxCoin();const n=Object.keys(fishGot).length;
    if(isNew&&n===FISH.length){cash+=200;say('釣到'+F[0]+'了！圖鑑全部收集完成（'+n+'/'+FISH.length+'）！大獎 $200！');}
    else say('釣到'+F[0]+'了！'+(isNew?'【新的！圖鑑 '+n+'/'+FISH.length+'】':'')+(F[1]?'值 $'+F[1]+'，拿去夕陽商店可以賣掉（魚簍共值 $'+fishBag+'）。':'沒人要買這個。'));}
  else{fish=null;say('太早拉了，魚還沒咬。');}
  actKey='';}
function fishStep(dt,t){
  bobber.visible=!!fish;if(!fish)return;
  if(Math.hypot(pos.x-fish.px,pos.z-fish.pz)>1.2||(ride&&!ride.S.water)){fish=null;actKey='';say('你收線了。');return;}
  fish.t+=dt;const was=fish.bite;fish.bite=fish.t>fish.at&&fish.t<fish.at+1.7;
  if(fish.bite&&!was){actKey='';noise(.25,700,.7,.3);say('有魚咬了！快按「拉！」');}
  if(was&&!fish.bite){actKey='';fish.at=fish.t+rnd(4,10)*(bag.rod?.5:1);say('魚跑掉了。再等一下。');}
  bobber.position.set(fish.x,fish.bite?-.06:.04+Math.sin(t*3)*.02,fish.z);}
// --- the kite: it only flies when there is enough wind, and it sits downwind of you, higher the harder it blows ---
const kite=new THREE.Group();kite.visible=false;scene.add(kite);
{const sh=new THREE.Shape();sh.moveTo(0,.6);sh.lineTo(.4,0);sh.lineTo(0,-.75);sh.lineTo(-.4,0);sh.closePath();
  const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:0xff5a4a,side:THREE.DoubleSide}));kite.add(m);
  const t=new THREE.Mesh(new THREE.PlaneGeometry(.06,1.3),new THREE.MeshBasicMaterial({color:0xffd23d,side:THREE.DoubleSide}));t.position.y=-1.35;kite.add(t);kite.userData.tail=t;}
const kiteLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xdddddd,transparent:true,opacity:.6}));kiteLine.frustumCulled=false;kiteLine.visible=false;scene.add(kiteLine);
// two more kites for neighbours who come down to the beach on a windy day
const npcKites=[0x3aa0e0,0xffc93d].map(col=>{const g=new THREE.Group();g.visible=false;scene.add(g);const sh=new THREE.Shape();sh.moveTo(0,.6);sh.lineTo(.4,0);sh.lineTo(0,-.75);sh.lineTo(-.4,0);sh.closePath();
  g.add(new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide})));
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xdddddd,transparent:true,opacity:.6}));ln.frustumCulled=false;ln.visible=false;scene.add(ln);return{g,ln,h:0};});
function npcKiteStep(dt,t){const fl=people.filter(n=>!n.hidden&&n.goal&&n.goal.id==='kite'&&n.phase==='at');
  npcKites.forEach((K,i)=>{const n=fl[i],want=n&&windS>=2.6?Math.min(13,2.5+windS*1.3):0;K.h+=(want-K.h)*(1-Math.exp(-dt*.9));const on=!!n&&K.h>.4&&Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)<90;K.g.visible=K.ln.visible=on;if(!on){if(!n)K.h=0;return;}
    const dx=windX/(windS||1),dz=windZ/(windS||1),out=K.h*.9,x=n.pos.x+dx*out+Math.sin(t*1.1+i*2)*.6,y=1.4+K.h+Math.sin(t*1.7+i)*.4,z=n.pos.z+dz*out+Math.cos(t*1.1+i*2)*.6;
    K.g.position.set(x,y,z);K.g.lookAt(camera.position);K.g.rotation.z+=Math.sin(t*2+i)*.25;const A=K.ln.geometry.attributes.position;A.setXYZ(0,n.pos.x,1.25,n.pos.z);A.setXYZ(1,x,y,z);A.needsUpdate=true;});}
let kiteH=0,kiteTold=0,kiteTime=0;const kP=new THREE.Vector3();
function kiteStep(dt,t){const fly=use.kite&&!ride&&!onBus&&!roomAt(pos.x,pos.z)&&waterDepth()<.5;
  if(use.kite&&!fly&&(ride||onBus||roomAt(pos.x,pos.z))){use.kite=false;actKey='';}
  const want=fly&&windS>=2.6?Math.min(16,3+windS*1.5):0;kiteH+=(want-kiteH)*(1-Math.exp(-dt*.9));kite.visible=kiteLine.visible=fly&&kiteH>.4;if(!kite.visible)return;
  const dx=windX/(windS||1),dz=windZ/(windS||1),out=kiteH*.9+Math.sin(t*.7)*.6;kP.set(pos.x+dx*out+Math.sin(t*1.3)*.5*dz,1.4+kiteH+Math.sin(t*1.9)*.35,pos.z+dz*out-Math.sin(t*1.3)*.5*dx);
  kite.position.copy(kP);kite.lookAt(camera.position);kite.rotation.z+=Math.sin(t*2.3)*.25;kite.userData.tail.rotation.z=Math.sin(t*5)*.4;
  const A=kiteLine.geometry.attributes.position;A.setXYZ(0,pos.x,1.2,pos.z);A.setXYZ(1,kP.x,kP.y,kP.z);A.needsUpdate=true;
  kiteTime+=dt;kiteTold-=dt;if(kiteTold<=0&&kiteH>5){kiteTold=14;const n=people.find(m=>!m.hidden&&!m.react&&!m.lie&&!roomAt(m.pos.x,m.pos.z)&&Math.hypot(m.pos.x-pos.x,m.pos.z-pos.z)<14);
    if(n){react(n,n.o.playful>.5?'哇，風箏飛好高！':'今天風大，很適合放風箏。',2.2,n.o.playful>.5?'wave':null);n.mood=Math.min(1,n.mood+.04);}}}
// --- things you can do with your body: wave at people, or dance (some of them join in) ---
let emote='',emoteT=0,danceTick=0;
const nearFolk=r=>people.filter(n=>!n.hidden&&!n.lie&&Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)<r);
function wave(){if(ride||onBus||seat)return;emote='wave';emoteT=1.8;const now=performance.now()/1000;let k=0;
  for(const n of nearFolk(7)){if(k>=3||(n.wavedAt&&n.wavedAt>now-25)||n.react)continue;n.wavedAt=now;waves++;notify(n,'greet');n.like=Math.min(5,n.like+.05);k++;}
  if(!k)say(nearFolk(7).length?'你揮揮手。他們剛剛已經跟你打過招呼了。':'你揮揮手，可是附近沒有人。',true);}
// --- crouching: you go low and slow. Animals are not afraid of someone small and quiet ---
let crouch=false,crouchK=0;let fastAt=-99;
function toggleCrouch(){if(ride||onBus||seat||waterDepth()>.3)return;crouch=!crouch;actKey='';if(crouch){runLock=false;say('你蹲下來了，走得很慢、很安靜。小橘不會怕蹲著的人。再按 C 站起來。');}}
function crouchStep(dt){if(crouch&&(ride||onBus||seat||jumpY>0||waterDepth()>.3)){crouch=false;actKey='';}crouchK+=((crouch?1:0)-crouchK)*(1-Math.exp(-dt*9));}
function dance(){if(ride||onBus||seat)return;if(emote==='dance'){emote='';return;}emote='dance';emoteT=1e9;danceTick=0;say('你開始跳舞！動一下就會停。愛玩的人看到可能會跟你一起跳。');}
function emoteStep(dt){if(!emote)return;emoteT-=dt;if(emoteT<=0||ride||onBus||seat||(emote==='dance'&&Math.hypot(vel.x,vel.z)>.5)){emote='';return;}
  if(emote!=='dance')return;stam=Math.max(0,stam-.01*dt);danceTick-=dt;if(danceTick>0)return;danceTick=2.2;const now=performance.now()/1000;
  for(const n of nearFolk(5.5)){if(n.react||n.guard||(n.dancedAt&&n.dancedAt>now-18)||!n.goal||n.goal.id==='work'||n.goal.id==='sleep')continue;n.dancedAt=now;
    if(n.o.playful>.5&&n.mood>.4){react(n,'哈哈，一起跳！',3.2,'dance');n.need.fun=Math.min(1,n.need.fun+.08);n.like=Math.min(5,n.like+.15);n.mood=Math.min(1,n.mood+.05);}
    else react(n,n.mood>.5?'你在跳舞？跳得不錯嘛。':'…在路上跳舞？',1.8,n.mood>.5?'wave':null);}}
// --- taking the bus: get on while it waits at a stop, ring the bell (or wait for the next stop) to get off ---
let onBus=null,busBell=false,isleSeen=false,hbT=0,skidT=0,toldHb=false;
function nearBus(){if(ride||onBus)return null;for(const c of cars)if((c.bus||c.taxi)&&c.on&&c.dwell>0&&Math.hypot(c.x-pos.x,c.z-pos.z)<5.2)return c;return null;}
function boardBus(){const c=nearBus();if(!c)return;
  if(c.taxi){putDown();standUp();onBus=c;busBell=false;vel.x=vel.z=0;jumpY=jumpV=0;sfxDoor(c.x,c.z);taxiMenu();return;}
  if(cash<5){say('公車票要 $5，你的錢不夠。');return;}
  putDown();standUp();cash-=5;sfxCoin();onBus=c;busBell=false;c.dwell=Math.max(c.dwell,1.5);vel.x=vel.z=0;jumpY=jumpV=0;busTrips++;
  say(c.line==='south'?'你上了南線公車（藍綠色，車票 $5）。它會右轉進第二條馬路，在那邊的公車站停。':'你上公車了（車票 $5）。到下一站會停；想提早下車就按「下車鈴」。');}
let busTrips=0;
function leaveBus(){const c=onBus;if(!c)return;
  if(!(c.dwell>0)){if(!busBell){busBell=true;sfxBell();say('叮！司機聽到了，會在前面安全的路邊停車。');}return;}
  const fx=Math.cos(c.h),fz=-Math.sin(c.h);
  for(const q of[[2.6,0],[3.3,0],[2.6,2.4],[2.6,-2.4],[3.3,2.4],[3.3,-2.4],[2.6,4],[2.6,-4],[-2.6,0],[-3.3,0]]){const d=q[0],x=c.x-fz*d+fx*q[1],z=c.z+fx*d+fz*q[1];   // the kerb side first, a little forward or back if the shelter is in the way; the road side only as a last resort
    if(!blocked(x,z)){onBus=null;busBell=false;pos.x=x;pos.z=z;yaw=Math.atan2(fz*Math.sign(d),-fx*Math.sign(d));pitch=-.05;say('你下公車了。');return;}}
  say('車門外面被擋住了，等一下再下車。');}
function busStep(dt){const c=onBus;if(!c.on){onBus=null;return;}
  if(c.taxi&&!c.dest&&c.dwell>0&&!$('talk').hidden)c.dwell=Math.max(c.dwell,2);              // the driver waits while you choose
  pos.x=c.x;pos.z=c.z;const fx=Math.cos(c.h),fz=-Math.sin(c.h);
  camGoal.set(c.x-fx*9,4.6,c.z-fz*9);camera.position.lerp(camGoal,1-Math.exp(-dt*5));camera.lookAt(c.x+fx*3,1.6,c.z+fz*3);yaw=Math.atan2(-fx,-fz);}
// --- the ice-cream van ---
let iceCreams=0;
const nearVan=()=>!ride&&!onBus&&iceVan.on&&iceVan.dwell>0&&Math.hypot(iceVan.x-pos.x,iceVan.z-pos.z)<5.5;
function vanArrived(c){if(Math.hypot(c.x-pos.x,c.z-pos.z)<60)say('叮叮咚～冰淇淋車來了，停在公園旁邊！走過去可以買（$10）。它只停一下下。',true);
  for(const n of people){if(n.hidden||n.lie||n.react||n.guard||roomAt(n.pos.x,n.pos.z)||Math.hypot(n.pos.x-c.x,n.pos.z-c.z)>18)continue;
    react(n,n.o.playful>.5?'冰淇淋車！我要吃！':'喔，冰淇淋車來了。',2,n.o.playful>.5?'wave':null);n.need.food=Math.min(1,n.need.food+.12);n.mood=Math.min(1,n.mood+.06);}}
function buyIce(){if(!nearVan()){say('冰淇淋車停在旁邊的時候才能買。');return;}if(cash<10){say('冰淇淋一支 $10，你的錢不夠。');return;}
  cash-=10;iceCreams++;stam=Math.min(1,stam+.35);sfxCoin();actKey='';say('你買了一支冰淇淋（$10），冰冰甜甜的。體力恢復了一些。'+(dark<.3&&rain<.1?'天氣熱，要快點吃，不然會融化！':''));}
// --- the taxi: wave for it beside the main street, tell the driver where to, pay, and ride ---
const TAXI_TO=[['公園',19.5],['夕陽商店',36.5],['街的西邊',-30],['1 號門口',0],['西邊的公車站',-21.8],['第二條馬路口',42.5]];
function canHail(){const S=WORLD.street;return!ride&&!onBus&&!taxi.on&&taxi.t>1e8&&!roomAt(pos.x,pos.z)&&pos.z>S.z0-3.6&&pos.z<S.z1+3.6&&pos.x>-34&&pos.x<44;}
function hail(){if(!canHail()){if(taxi.on||taxi.t<1e8)say('計程車已經在路上了，在路邊等一下。');else say('要站在大馬路旁邊的人行道上，才招得到計程車。');return;}
  const S=WORLD.street,dir=pos.z>(S.z0+S.z1)/2?1:-1;taxi.busDir=dir;taxi.stopX=kerbX(pos.x,dir)+dir*taxi.hl;taxi.served=false;taxi.dest=null;taxi.t=0;actKey='';
  say('你舉手招計程車。綠色、車頂有亮燈的車會開過來，停在你旁邊。');}
function taxiStopped(c){
  if(onBus===c&&c.dest){const nm=c.dest;c.dest=null;leaveBus();if(!onBus)say('到'+nm+'了。司機說：「謝謝，慢走！」');}
  else if(onBus!==c)say('計程車停在你旁邊了。走過去按 F 上車（它會等你一下）。');}
function taxiMenu(line){const c=onBus,el=$('talk');el.hidden=false;el.textContent='';talkN=null;
  const h=document.createElement('strong');h.textContent='計程車司機';const p=document.createElement('p');p.textContent=line||'你好！要去哪裡？你有 $'+cash+'。';el.append(h,p);
  const add=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.onclick=()=>{fn();canvas.focus({preventScroll:true});};el.appendChild(b);};
  const H14=houses.find(h=>h.lot.forSale),dests=homeOwned&&H14?[['回家（'+H14.no+' 號）',H14.front.x]].concat(TAXI_TO):TAXI_TO;
  for(const D of dests){const far=Math.abs(D[1]-c.x);if(far<9)continue;const fare=10+Math.round(far*.4);
    add(D[0]+' $'+fare,()=>{if(cash<fare){taxiMenu('錢不夠喔，去'+D[0]+'要 $'+fare+'，你只有 $'+cash+'。');return;}
      cash-=fare;sfxCoin();const ahead=(D[1]-c.x)*c.busDir>6,fd=ahead?c.busDir:-c.busDir;c.dest=D[0];c.stopX=kerbX(D[1],fd)+fd*c.hl;c.served=false;c.dwell=.6;el.hidden=true;taxiTrips++;
      say('司機：「好，去'+D[0]+'。」車錢 $'+fare+(ahead?'':'。那個地方在後面，計程車會先開到街尾掉頭')+'。');});}
  add('不坐了',()=>{el.hidden=true;leaveBus();});}
let taxiTrips=0;
// --- petrol: stop beside the pump and fill up; you pay for what goes in ---
const PUMP=WORLD.outdoor.find(o=>o.type==='pump');
function atPump(){const r=ride;return!!r&&!!r.S.tank&&Math.abs(r.v)<.6&&Math.hypot(r.x-PUMP.x,r.z-PUMP.z)<5;}
function refuel(){const r=ride||rides.find(q=>q.S.tank&&Math.hypot(q.x-PUMP.x,q.z-PUMP.z)<5);
  if(!r||!r.S.tank||Math.hypot(r.x-PUMP.x,r.z-PUMP.z)>=5){say('要先把車子或機車停在加油機旁邊（5 公尺內）才能加油。');return;}
  if(Math.abs(r.v)>=.6){say('先停好再加油。');return;}
  const need=1-r.fuel,cost=Math.ceil(need*r.S.full);if(cost<1){say(r.S.name+'的油是滿的。');return;}
  if(cash<1){say('你沒有錢加油。先去做任務賺錢吧。');return;}
  const pay=Math.min(cost,cash);r.fuel=Math.min(1,r.fuel+pay/r.S.full);cash-=pay;sfxCoin();actKey='';
  say(pay<cost?'你的錢只夠加一部分：花了 $'+pay+'，'+r.S.name+'的油現在 '+Math.round(r.fuel*100)+'%。':'加滿了！花了 $'+pay+'。');}
// --- tuning your car at the pump: a stronger engine (two steps) and a thriftier one ---
const carUp={eng:0,eco:0};let carDmg=0;                                     // carDmg: 0 = as new, 1 = a wreck that barely moves
function applyTune(){const r=rides[0],B=SPEC.car,k=1-.45*carDmg;r.S=Object.assign({},B,{max:B.max*(1+.16*carUp.eng)*k,acc:B.acc*(1+.2*carUp.eng)*k,tank:B.tank*(1+.6*carUp.eco)});
  r.paint.roughness=.35+.5*carDmg;r.paint.metalness=.4*(1-carDmg);}
const smoke=[];for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),new THREE.MeshBasicMaterial({color:0x2a2a30}));m.visible=false;scene.add(m);smoke.push({m,t:9});}
let smokeT=0;
function smokeStep(dt){const r=rides[0];if(carDmg>=.6&&Math.hypot(r.x-pos.x,r.z-pos.z)<60){smokeT-=dt;if(smokeT<=0){smokeT=.45-.2*carDmg;const s=smoke.find(q=>q.t>1.6);if(s){s.t=0;s.m.position.set(r.x+Math.cos(r.h)*1.5+rnd(-.15,.15),.95,r.z-Math.sin(r.h)*1.5+rnd(-.15,.15));s.m.visible=true;}}}
  for(const s of smoke){if(s.t>1.6)continue;s.t+=dt;s.m.position.y+=dt*1.1;s.m.position.x+=windX*dt*.15;s.m.position.z+=windZ*dt*.15;{const k=s.t/1.6;s.m.scale.setScalar(Math.max(.02,(.5+k*1.6)*(1-k*k)));}if(s.t>1.6)s.m.visible=false;}}
function tuneMenu(line){const r=rides[0];if(Math.hypot(r.x-PUMP.x,r.z-PUMP.z)>=5){say('要把車子停在加油機旁邊才能改裝。');return;}
  const el=$('talk');el.hidden=false;el.textContent='';talkN=null;const h=document.createElement('strong');h.textContent='車子改裝';const p=document.createElement('p');
  p.textContent=line||'車況 '+Math.round((1-carDmg)*100)+'%。引擎：第 '+carUp.eng+' 級（最多 2 級）。省油裝置：'+(carUp.eco?'已安裝':'還沒裝')+'。你有 $'+cash+'。';el.append(h,p);
  const add=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.onclick=()=>{fn();canvas.focus({preventScroll:true});};el.appendChild(b);};
  const buy=(cost,fn,msg)=>{if(cash<cost){tuneMenu('錢不夠，這個要 $'+cost+'，你只有 $'+cash+'。');return;}cash-=cost;fn();applyTune();sfxCoin();noise(.5,300,.8,.2);tuneMenu(msg+' 你還有 $'+cash+'。');};
  if(carDmg>.02){const c=Math.max(5,Math.ceil(carDmg*90));add('修車（恢復到 100%）$'+c,()=>buy(c,()=>{carDmg=0;},'修好了！鈑金敲平、引擎也檢查過，跟新的一樣。'));}
  if(carUp.eng<2){const c=carUp.eng?260:160;add('升級引擎（第 '+(carUp.eng+1)+' 級）$'+c,()=>buy(c,()=>{carUp.eng++;},'引擎換好了！車子加速更快、最高速度更高（大約 '+Math.round(SPEC.car.max*(1+.16*(carUp.eng+1))*3.6)+' km/h）。'));}
  if(!carUp.eco)add('省油裝置 $120',()=>buy(120,()=>{carUp.eco=1;},'裝好了！同樣一箱油可以多開六成的路。'));
  add('關閉',()=>{el.hidden=true;});}
// --- the time trial: from the flag, through the glowing gates in order, as fast as you can ---
const FLAG=WORLD.outdoor.find(o=>o.type==='flag');
const RACE=[[-8,11.3],[20,11.3],[42,11.3],[52.6,24],[52.6,46],[52.6,24],[42,7.8],[10,7.8],[-28,7.8]];
const gate=new THREE.Mesh(new THREE.TorusGeometry(2.6,.14,8,28),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2,.4),transparent:true,opacity:.85,fog:false}));gate.visible=false;scene.add(gate);
const MEDAL=[[38,'金牌 🥇',80],[50,'銀牌 🥈',50],[70,'銅牌 🥉',25]];let raceBest=0,seaBest=0;
// a second course out on the water, for the boat: it starts by the buoy off the end of the pier
const SEA_START=[22.8,-27.5],SEA_RACE=[[38,-34],[58,-52],[40,-74],[5,-66],[-18,-42],[2,-27],[20,-29]],SEA_MEDAL=[[30,'金牌 🥇',90],[42,'銀牌 🥈',60],[60,'銅牌 🥉',30]];
{const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.45,.9,12),new THREE.MeshStandardMaterial({color:0xe2452f,roughness:.5}));b.position.set(SEA_START[0]+2.2,.3,SEA_START[1]);scene.add(b);
  const t=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),new THREE.MeshBasicMaterial({color:new THREE.Color(4,3,.6)}));t.position.set(SEA_START[0]+2.2,.95,SEA_START[1]);scene.add(t);}
const atSeaStart=()=>!!ride&&!!ride.S.water&&!quest&&Math.hypot(ride.x-SEA_START[0],ride.z-SEA_START[1])<9;
const atFlag=()=>atSeaStart()||(!!ride&&!ride.S.water&&!quest&&Math.hypot(ride.x-FLAG.x,ride.z-FLAG.z)<9);
function startRace(){if(quest){say('你現在有別的任務，先做完再來比賽。');return;}
  if(atSeaStart()){quest={type:'race',sea:true,gates:SEA_RACE,medal:SEA_MEDAL,i:0,t0:performance.now(),reward:0,text:''};actKey='';sfxBell();
    say('海上計時賽，開始！開船照順序穿過海面上發亮的圈圈，繞一大圈回到碼頭外面。金牌 30 秒、銀牌 42 秒、銅牌 60 秒內。'+(seaBest?'你的最佳紀錄 '+seaBest.toFixed(1)+' 秒。':''));return;}
  if(!ride||ride.S.water){say(ride?'海上計時賽的起點在碼頭盡頭外面的紅色浮標旁邊。':'計時賽要坐在車子、機車或腳踏車上才能開始。');return;}
  if(Math.hypot(ride.x-FLAG.x,ride.z-FLAG.z)>=9){say('把'+ride.S.name+'開到黑白格子旗旁邊再開始。');return;}
  quest={type:'race',gates:RACE,medal:MEDAL,i:0,t0:performance.now(),reward:0,text:''};actKey='';sfxBell();say('預備——開始！照順序穿過發亮的圈圈。金牌 38 秒、銀牌 50 秒、銅牌 70 秒內。'+(raceBest?'你的最佳紀錄 '+raceBest.toFixed(1)+' 秒。':''));}
function raceStep(){const q=quest,on=!!q&&q.type==='race';gate.visible=on;if(!on)return;
  const G2=q.gates,secs=(performance.now()-q.t0)/1000,c=G2[q.i],n=G2[q.i+1];
  gate.position.set(c[0],2.4,c[1]);if(n)gate.rotation.y=Math.atan2(n[0]-c[0],n[1]-c[1]);gate.material.opacity=.6+.3*Math.sin(performance.now()/150);gate.scale.setScalar(q.sea?1.6:1);
  q.text=(q.sea?'海上計時賽':'計時賽')+'：第 '+(q.i+1)+'/'+G2.length+' 個圈圈，'+secs.toFixed(1)+' 秒';
  if(!ride){quest=null;say('你下'+(q.sea?'船':'車')+'了，計時賽取消。');return;}
  if(secs>170){quest=null;say('超過時間了，計時賽結束。再試一次吧。');return;}
  if(!q.sea&&q.i===4&&!q.warn&&Math.hypot(pos.x-c[0],pos.z-c[1])<16){q.warn=1;say('前面那個圈圈之後要掉頭往回開：先煞車、慢慢轉。');}
  if(Math.hypot(pos.x-c[0],pos.z-c[1])>(q.sea?6:4.2))return;
  q.i++;tone(880+q.i*60,.12,.2,'triangle');if(q.i<G2.length)return;
  quest=null;const M3=q.medal,best=q.sea?seaBest:raceBest,m=M3.find(M2=>secs<=M2[0]),old=best?M3.findIndex(M2=>best<=M2[0]):-1,now=m?M3.indexOf(m):-1,better=!best||secs<best;
  const pay=m&&(old<0||now<old)?m[2]:0;if(better){if(q.sea)seaBest=secs;else raceBest=secs;}cash+=pay;sfxCoin();
  say('到終點！'+secs.toFixed(1)+' 秒'+(m?'，拿到'+m[1]:'，這次沒有獎牌')+(pay?'，獎金 $'+pay:'')+(better?'。新紀錄！':'。最佳紀錄還是 '+(q.sea?seaBest:raceBest).toFixed(1)+' 秒。'));}
// --- a new coat of paint for your car, at the pump ---
const PAINTS=[[0xf2c23d,'黃色'],[0xd9463b,'紅色'],[0x2f6fd0,'藍色'],[0x2a2c32,'黑色'],[0xf4f0e8,'白色'],[0xff7ac0,'粉紅色'],[0x7a4fd0,'紫色'],[0xf08a2e,'橘色']];let paintIdx=0;
function setPaint(i){paintIdx=((i%PAINTS.length)+PAINTS.length)%PAINTS.length;rides[0].paint.color.setHex(PAINTS[paintIdx][0]);}
function repaint(){const r=rides[0];if(Math.hypot(r.x-PUMP.x,r.z-PUMP.z)>=5){say('要把車子停在加油機旁邊才能噴漆。');return;}
  if(cash<30){say('噴漆要 $30，你的錢不夠。');return;}cash-=30;setPaint(paintIdx+1);sfxCoin();noise(.6,2600,.4,.12);actKey='';
  say('嘶——噴好了！你的車現在是'+PAINTS[paintIdx][1]+'（花了 $30）。再按一次換下一種顏色。');}
// --- one step of you. Returns true when it has already placed the camera (riding or sitting) ---
function playerStep(dt,f,s){
  const g=Math.max(1.4,GMODES[gIdx][0]);                                    // jumping uses the same gravity as the balls (never quite zero, or you would float away)
  if(jumpY>0||jumpV>0){jumpV-=g*dt;jumpY+=jumpV*dt;const top=roomAt(pos.x,pos.z)?RH-1.78:7;
    if(jumpY>top){jumpY=top;jumpV=Math.min(0,jumpV);}if(jumpY<=0){jumpY=0;jumpV=0;}}
  for(const r of rides)if(r.kind==='car')carLights(r,ride===r&&f<-.1);
  if(onBus){busStep(dt);if(onBus)return true;}
  if(ride){rideStep(dt,f,s);return true;}
  if(seat&&seat.lie&&clock>=7&&clock<7.3){standUp();return false;}        // morning: wake up
  if(seat&&seat.lie){const A=seat.A;pos.x=A.an[0];pos.z=A.an[2];camera.position.set(A.an[0],A.an[1]+.3,A.an[2]);camera.rotation.set(pitch,yaw,0);if(Math.abs(f)+Math.abs(s)>.4){standUp();return false;}return true;}
  if(seat){if(Math.abs(f)+Math.abs(s)>.4){standUp();return false;}
    const A=seat.A;pos.x=A.an[0];pos.z=A.an[2];camera.position.set(A.an[0],A.an[1]+.62,A.an[2]);camera.rotation.set(pitch,yaw,0);return true;}
  return false;
}
// --- the action buttons ---
const KEY={crouch:'C',fish:'G',horn:'H',run:'Shift',nap:'Z',radio:'R',jump:'空白',pick:'E',drop:'E',throw:'點畫面',sit:'Q',stand:'Q',in:'F',out:'F',bus:'F',off:'F',taxi:'T',ice:'F',fuel:'C',paint:'N',race:'B',fare:'K',tune:'U',hb:'空白',wave:'X',dance:'J'};
const RADIO=['drive','dusk','day','shop','beach',''];let radioIdx=0;                // the car radio: pick your own tune, or silence
function nextRadio(){radioIdx=(radioIdx+1)%RADIO.length;wantSince=-9;say('收音機：'+(RADIO[radioIdx]?TRACKS[RADIO[radioIdx]].name:'關掉'));}
let runLock=false;                                                          // the Run button: stays on until you press it again
function toggleRun(){runLock=!runLock;say(runLock?'跑步：開。體力用完會自動變回走路。':'跑步：關。');}
const ACTS={crouch:['蹲下',toggleCrouch],fish:['釣魚',fishing],horn:['喇叭',horn],run:['跑',toggleRun],nap:['躺下睡覺',lieDown],radio:['收音機',nextRadio],jump:['跳',jump],pick:['撿起',pickUp],drop:['放下',putDown],throw:['丟出去',throwHeld],sit:['坐下',sitDown],stand:['站起來',standUp],in:['',getIn],out:['下來',getOut],bus:['搭公車 $5',boardBus],taxi:['招計程車',hail],ice:['買冰淇淋 $10',buyIce],fuel:['加油',refuel],paint:['噴漆換顏色 $30',repaint],race:['開始計時賽',startRace],fare:['接載客工作',startFare],hb:['手煞車',()=>{hbT=.9;}],tune:['改裝車子',()=>tuneMenu()],wave:['揮手',wave],dance:['跳舞',dance],off:['',leaveBus]};
let actKey='x';
function mkBtn(text,key,fn,on){const b=document.createElement('button');b.type='button';b.textContent=text;if(on!=null)b.setAttribute('aria-pressed',on);
  if(!isTouch&&key){const k=document.createElement('kbd');k.textContent=key;b.appendChild(k);}
  b.onclick=()=>{fn();actKey='';updateActs();canvas.focus({preventScroll:true});};return b;}
function updateActs(){
  const list=[],it=ride?null:nearItem(),nb=ride||held||it?null:nearBall(),nr=ride?null:nearRide();
  const nbus=nearBus();
  if(onBus)list.push('off');
  else if(ride){list.push('out','horn');if(isTouch&&ride.kind!=='bike'&&!ride.S.water)list.push('hb');if(fish||onBoat())list.push('fish');if(atPump()&&ride.fuel<.98)list.push('fuel');if(atPump()&&ride.kind==='car')list.push('paint','tune');if(atFlag())list.push('race');if(ride.kind==='car'&&!quest)list.push('fare');if(ride.kind==='car')list.push('radio');}
  else{if(nearVan())list.push('ice');if(nbus)list.push('bus');else if(canHail())list.push('taxi');if(nr)list.push('in');
    if(seat)list.push('stand');else{if(nearSeat())list.push('sit');if(nearBed())list.push('nap');}
    if(held)list.push('throw','drop');else if(it||nb)list.push('pick');
    if(!seat&&waterDepth()<.5)list.push('jump');
    if(!seat)list.push('run','crouch');
    if(!seat&&nearFolk(4).length)list.push('wave','dance');
    if(fish||atShore())list.push('fish');}
  const what=it?ITEM[it.item].name:nb?nb.name:held?held.name:'';
  const key=list.join(',')+what+(nr?nr.kind:'')+Object.keys(bag).join('')+JSON.stringify(use)+drinks+radioIdx+runLock+crouch+emote+(quest?'q':'')+(onBus?'B'+(onBus.dwell>0)+busBell:'')+(nbus&&nbus.taxi?'tx':nbus&&nbus.line?'sl':'')+(fish?fish.bite:'');
  if(key===actKey)return;actKey=key;
  const el=$('acts');el.textContent='';
  for(const id of list)el.appendChild(mkBtn(id==='fish'?(fish?(fish.bite?'拉！':'收線（還沒咬）'):'釣魚'):id==='run'?(runLock?'跑步中':'跑'):id==='crouch'?(crouch?'站起來（蹲著）':'蹲下'):id==='dance'?(emote==='dance'?'停止跳舞':'跳舞'):id==='bus'&&nbus.taxi?'上計程車':id==='bus'&&nbus.line?'搭南線公車 $5':id==='off'?(onBus.dwell>0?'下車':busBell?'已按鈴，等停車':'下車鈴'):id==='in'?(nr.kind==='car'?'上車':nr.kind==='boat'?'上船':'騎'+nr.S.name):ACTS[id][0]+(id==='pick'||id==='throw'||id==='drop'?what:''),KEY[id],ACTS[id][1]));
  const bg=$('bag');bg.textContent='';
  for(const k in ITEM)if(bag[k])bg.appendChild(mkBtn(ITEM[k].name,ITEM[k].key,()=>toggleItem(k),use[k]));
  if(drinks)bg.appendChild(mkBtn('喝飲料 ×'+drinks,'3',drinkUp));
}
addEventListener('keydown',e=>{if(e.repeat)return;
  if(e.code==='Space')jump();
  else if(e.code==='KeyE'){if(held)putDown();else pickUp();}
  else if(e.code==='KeyF'){if(onBus)leaveBus();else if(ride)getOut();else if(nearVan())buyIce();else if(nearBus())boardBus();else getIn();}
  else if(e.code==='KeyQ'){if(seat)standUp();else sitDown();}
  else if(e.code==='KeyZ'){if(seat)standUp();else lieDown();}
  else if(e.code==='Digit1')toggleItem('flashlight');
  else if(e.code==='Digit2')toggleItem('umbrella');
  else if(e.code==='KeyM')toggleItem('phone');
  else if(e.code==='Digit3')drinkUp();
  else if(e.code==='Digit4')toggleItem('board');
  else if(e.code==='Digit5')toggleItem('kite');
  else if(e.code==='KeyH')horn();
  else if(e.code==='KeyX')wave();
  else if(e.code==='KeyJ')dance();
  else if(e.code==='KeyC'){if(atPump())refuel();else toggleCrouch();}
  else if(e.code==='KeyB'){if(atFlag())startRace();}
  else if(e.code==='KeyU'){if(atPump()&&ride.kind==='car')tuneMenu();}
  else if(e.code==='KeyK'){if(ride&&ride.kind==='car')startFare();}
  else if(e.code==='KeyN'){if(atPump()&&ride.kind==='car')repaint();}
  else if(e.code==='KeyT'){if(!ride&&!onBus)hail();}
  else if(e.code==='KeyG')fishing();
  else if(e.code==='KeyR'&&ride&&ride.kind==='car')nextRadio();
});
showItems();
