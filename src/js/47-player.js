/* ---------- things you can do: jump, carry and throw, sit, drive ---------- */
// The buttons at the bottom right change with what is possible right now, so you never have to remember a key.
let jumpY=0,jumpV=0,held=null,seat=null;
const drive={on:false,x:WORLD.car.x,z:WORLD.car.z,h:WORLD.car.h,v:0,bumped:0};
const pcar=carMesh(0xf2c23d);                                               // your car: the yellow one
(function(){cur=scene;flat(2.8,5.6,M.concrete,drive.x,-.012,drive.z,1.4);pcar.g.position.set(drive.x,0,drive.z);pcar.g.rotation.y=drive.h;})();
const camDir=new THREE.Vector3(),camGoal=new THREE.Vector3();

// --- jumping ---
function jump(){if(jumpY===0&&!drive.on&&!seat)jumpV=4.2;}
// --- carrying and throwing ---
function nearBall(){let best=null,bd=1.7;for(const b of bodies){if(b.held)continue;const d=Math.hypot(b.p.x-pos.x,b.p.z-pos.z);if(d<bd&&b.p.y<2){bd=d;best=b;}}return best;}
function pickUp(){const b=nearBall();if(!b)return;
  if(b.m>8){say(b.name+'有 '+b.m+' 公斤，太重了，搬不動。');return;}
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
function nearSeat(){let best=null,bd=1.5;
  for(const k in ACT){const A=ACT[k];if(A.pose!=='sit'||!A.an)continue;if(people.some(n=>n.want===k))continue;
    const d=Math.min(Math.hypot(A.ap[0]-pos.x,A.ap[1]-pos.z),Math.hypot(A.an[0]-pos.x,A.an[2]-pos.z));if(d<bd){bd=d;best=k;}}
  return best;}
function sitDown(){const k=nearSeat();if(!k)return;seat={k,A:ACT[k]};vel.x=vel.z=0;yaw=seat.A.yaw+Math.PI;pitch=-.05;}   // face the way the seat faces
function standUp(){if(!seat)return;pos.x=seat.A.ap[0];pos.z=seat.A.ap[1];seat=null;}
// --- driving ---
// the car is two circles, front and back, for bumping into things
function carHit(x,z,h){
  const fx=Math.cos(h),fz=-Math.sin(h),R=.95;
  for(const k of[1.15,-1.15]){const cx=x+fx*k,cz=z+fz*k;
    if(!inWorld(cx,cz,R))return true;
    for(const c of colliders)if(cx>c[0]-R&&cx<c[1]+R&&cz>c[2]-R&&cz<c[3]+R)return true;
    for(const d of doors){const c=doorArea(d);if(cx>c[0]-R&&cx<c[1]+R&&cz>c[2]-R&&cz<c[3]+R)return true;}
    for(const c of cars)if(c.on&&cx>c.box[0]-R&&cx<c.box[1]+R&&cz>c.box[2]-R&&cz<c.box[3]+R)return true;
    for(const n of people)if(!n.hidden&&Math.hypot(n.pos.x-cx,n.pos.z-cz)<R+.3)return n;}
  return false;
}
const nearCar=()=>!drive.on&&Math.hypot(drive.x-pos.x,drive.z-pos.z)<3;
function getIn(){if(!nearCar())return;putDown();standUp();drive.on=true;drive.v=0;vel.x=vel.z=0;jumpY=jumpV=0;
  say('你上車了。W 或往前推是油門，S 是煞車和倒車，A D 是方向盤。');}
function getOut(){if(!drive.on||Math.abs(drive.v)>1.5){if(drive.on)say('先停車再下車。');return;}
  const fx=Math.cos(drive.h),fz=-Math.sin(drive.h);
  for(const side of[1,-1]){const x=drive.x+fz*1.75*side,z=drive.z-fx*1.75*side;                 // try the left side, then the right
    if(!blocked(x,z)){drive.on=false;drive.v=0;pos.x=x;pos.z=z;yaw=Math.atan2(-fx,-fz);pitch=-.05;return;}}
  say('兩邊都被擋住了，往前開一點再下車。');}
function driveStep(dt,f,s){
  const a=Math.max(-1,Math.min(1,f)),st=-Math.max(-1,Math.min(1,s));
  drive.v+=a*(a*drive.v<0?14:a>0?5.5:3.5)*dt;drive.v*=Math.exp(-.5*dt);drive.v=Math.max(-4,Math.min(13,drive.v));
  if(Math.abs(a)<.05&&Math.abs(drive.v)<.2)drive.v=0;
  const nh=drive.h+st*Math.max(-1,Math.min(1,drive.v/4))*1.5*dt,nx=drive.x+Math.cos(nh)*drive.v*dt,nz=drive.z-Math.sin(nh)*drive.v*dt;
  const hit=drive.v?carHit(nx,nz,nh):false;drive.bumped-=dt;
  if(!hit){drive.x=nx;drive.z=nz;drive.h=nh;}
  else{if(hit!==true){notify(hit,'car');drive.v=0;}                                              // a person: stop dead, and they will tell you what they think
    else{if(Math.abs(drive.v)>2.5&&drive.bumped<=0){drive.bumped=1;say('碰！車子撞到東西，東西也用一樣大的力把車子推回來，所以車子彈了一下。');}drive.v*=-.2;}}
  pos.x=drive.x;pos.z=drive.z;
  pcar.g.position.set(drive.x,0,drive.z);pcar.g.rotation.y=drive.h;for(const w of pcar.wheels)w.rotation.z-=drive.v*dt/.33;
  // the camera follows behind and above
  const fx=Math.cos(drive.h),fz=-Math.sin(drive.h);
  camGoal.set(drive.x-fx*6.4,3.2,drive.z-fz*6.4);camera.position.lerp(camGoal,1-Math.exp(-dt*5));
  camera.lookAt(drive.x+fx*2.5,1.1,drive.z+fz*2.5);
  yaw=Math.atan2(-fx,-fz);
}
// --- one step of you. Returns true when it has already placed the camera (driving or sitting) ---
function playerStep(dt,f,s){
  const g=Math.max(1.4,GMODES[gIdx][0]);                                    // jumping uses the same gravity as the balls (never quite zero, or you would float away)
  if(jumpY>0||jumpV>0){jumpV-=g*dt;jumpY+=jumpV*dt;const top=roomAt(pos.x,pos.z)?RH-1.78:7;
    if(jumpY>top){jumpY=top;jumpV=Math.min(0,jumpV);}if(jumpY<=0){jumpY=0;jumpV=0;}}
  carLights(pcar,drive.on&&f<-.1);
  if(drive.on){driveStep(dt,f,s);return true;}
  if(seat){if(Math.abs(f)+Math.abs(s)>.4){standUp();return false;}
    const A=seat.A;pos.x=A.an[0];pos.z=A.an[2];camera.position.set(A.an[0],A.an[1]+.62,A.an[2]);camera.rotation.set(pitch,yaw,0);return true;}
  return false;
}
// --- the action buttons ---
const KEY={jump:'空白',pick:'E',drop:'E',throw:'點畫面',sit:'Q',stand:'Q',car:'F'};
const ACTS={jump:['跳',jump],pick:['撿起',pickUp],drop:['放下',putDown],throw:['丟出去',throwHeld],sit:['坐下',sitDown],stand:['站起來',standUp],in:['上車',getIn],out:['下車',getOut]};
let actKey='';
function updateActs(){
  const list=[];
  if(drive.on)list.push('out');
  else{if(nearCar())list.push('in');
    if(seat)list.push('stand');else if(nearSeat())list.push('sit');
    if(held)list.push('throw','drop');else{const b=nearBall();if(b)list.push('pick');}
    if(!seat)list.push('jump');}
  const key=list.join(',')+(held?held.name:'')+((!held&&list.includes('pick'))?nearBall().name:'');
  if(key===actKey)return;actKey=key;
  const el=$('acts');el.textContent='';
  for(const id of list){const b=document.createElement('button');b.type='button';
    b.textContent=ACTS[id][0]+(id==='pick'?nearBall().name:id==='throw'||id==='drop'?held.name:'');
    if(!isTouch){const k=document.createElement('kbd');k.textContent=KEY[id==='in'||id==='out'?'car':id];b.appendChild(k);}
    b.onclick=()=>{ACTS[id][1]();actKey='';updateActs();canvas.focus({preventScroll:true});};el.appendChild(b);}
}
addEventListener('keydown',e=>{if(e.repeat)return;
  if(e.code==='Space')jump();
  else if(e.code==='KeyE'){if(held)putDown();else if(nearBall())pickUp();}
  else if(e.code==='KeyF'){if(drive.on)getOut();else getIn();}
  else if(e.code==='KeyQ'){if(seat)standUp();else sitDown();}
});
