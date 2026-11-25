/* ---------- things you can do: jump, carry and throw, sit, ride, use items ---------- */
// The buttons at the bottom right change with what is possible right now, so you never have to remember a key.
let jumpY=0,jumpV=0,held=null,seat=null,ride=null;
const camDir=new THREE.Vector3(),camGoal=new THREE.Vector3();

// --- jumping ---
function jump(){if(jumpY===0&&!ride&&!seat)jumpV=4.2;}

// --- things you keep in your bag and use ---
// flashlight and umbrella go in your hand (one at a time); the phone shows a map.
const ITEM={flashlight:{name:'手電筒',key:'1'},umbrella:{name:'雨傘',key:'2'},phone:{name:'手機地圖',key:'M'}};
const bag={phone:true},use={flashlight:false,umbrella:false,phone:false};
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
  else{const on=!use[k];use.flashlight=use.umbrella=false;use[k]=on;if(on&&held)putDown();
    if(on)say(k==='umbrella'?'你撐開了雨傘：雨不會落在你身上。':'你打開了手電筒。');}
  showItems();}
const nearItem=()=>{let best=null,bd=1.7;const r=roomAt(pos.x,pos.z);
  for(const it of marks.item){if(it.taken||roomAt(it.x,it.z)!==r)continue;const d=Math.hypot(it.x-pos.x,it.z-pos.z);if(d<bd){bd=d;best=it;}}return best;};
function takeItem(it){it.taken=true;it.mesh.visible=false;
  if(bag[it.item]){say('你已經有'+ITEM[it.item].name+'了，這個就留著吧。');it.taken=false;it.mesh.visible=true;return;}
  bag[it.item]=true;say('你拿到了'+ITEM[it.item].name+'，放進背包了。按右下角的「'+ITEM[it.item].name+'」來用它。');actKey='';}
// the phone map: the whole street from above
function drawMap(){
  const c=$('mapc'),hh=Math.round(c.width*(WB.z1-WB.z0)/(WB.x1-WB.x0));if(c.height!==hh)c.height=hh;
  const g=c.getContext('2d'),k=c.width/(WB.x1-WB.x0),X=x=>(x-WB.x0)*k,Y=z=>(z-WB.z0)*k,S=WORLD.street;
  g.fillStyle='#3d5a34';g.fillRect(0,0,c.width,c.height);
  g.fillStyle='#2a6f9a';g.fillRect(0,0,c.width,Y(WB.z0+1.2));g.fillStyle='#cdbb92';g.fillRect(0,Y(WB.z0+1.2),c.width,k*1.2);
  g.fillStyle='#9b958c';g.fillRect(0,Y(S.z0-S.walk),c.width,k*(S.z1-S.z0+2*S.walk));g.fillStyle='#34343a';g.fillRect(0,Y(S.z0),c.width,k*(S.z1-S.z0));
  g.fillStyle='#e8e4d8';for(let i=0;i<7;i++)g.fillRect(X(-1.1+i)-k*.25,Y(S.z0)+2,k*.5,k*(S.z1-S.z0)-4);
  g.font='bold '+Math.round(k*2.2)+'px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';
  for(const H of houses){for(const r of H.rooms){g.fillStyle='#'+H.mats.ext.color.getHexString();g.fillRect(X(r.x0),Y(r.z0),k*r.w,k*r.d);}
    g.fillStyle='#20242c';g.fillText(H.no,X((H.x0+H.x1)/2),Y((H.z0+H.z1)/2));}
  const dot=(x,z,r,col)=>{g.fillStyle=col;g.beginPath();g.arc(X(x),Y(z),r,0,7);g.fill();};
  for(const c2 of cars)if(c2.on&&c2.x>WB.x0&&c2.x<WB.x1){g.fillStyle='#d9d3c8';g.fillRect(X(c2.x)-k*2.1,Y(c2.z)-k*.9,k*4.2,k*1.8);}
  for(const r of rides){g.fillStyle=r.kind==='car'?'#f2c23d':'#ff7ac0';g.save();g.translate(X(r.x),Y(r.z));g.rotate(-r.h);g.fillRect(-k*r.S.len*.9,-k*r.S.R*.9,k*r.S.len*1.8,k*r.S.R*1.8);g.restore();}
  for(const n of people)if(!n.hidden)dot(n.pos.x,n.pos.z,k*.55,'#'+n.o.top.toString(16).padStart(6,'0'));
  if(quest){const n=quest.type==='letter'?quest.to:quest.from;if(!n.hidden){g.strokeStyle='#ff9a4d';g.lineWidth=3;g.beginPath();g.arc(X(n.pos.x),Y(n.pos.z),k*1.6,0,7);g.stroke();}}   // where your job is
  g.save();g.translate(X(pos.x),Y(pos.z));g.rotate(-yaw);g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=2;      // you: an arrow showing which way you face
  g.beginPath();g.moveTo(0,-k*1.5);g.lineTo(k*.95,k*1.1);g.lineTo(0,k*.5);g.lineTo(-k*.95,k*1.1);g.closePath();g.fill();g.stroke();g.restore();
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
function nearSeat(){let best=null,bd=1.5;
  for(const k in ACT){const A=ACT[k];if(A.pose!=='sit'||!A.an)continue;if(people.some(n=>n.want===k))continue;
    const d=Math.min(Math.hypot(A.ap[0]-pos.x,A.ap[1]-pos.z),Math.hypot(A.an[0]-pos.x,A.an[2]-pos.z));if(d<bd){bd=d;best=k;}}
  return best;}
function sitDown(){const k=nearSeat();if(!k)return;seat={k,A:ACT[k]};vel.x=vel.z=0;yaw=seat.A.yaw+Math.PI;pitch=-.05;}   // face the way the seat faces
function standUp(){if(!seat)return;pos.x=seat.A.ap[0];pos.z=seat.A.ap[1];seat=null;}

// --- riding: a car and a bicycle ---
// For bumping into things, a vehicle is a row of circles (pts = where along its length, R = how big).
const SPEC={
  car:{name:'車',verb:'開車',max:13,acc:5.5,rev:4,turn:1.5,pts:[1.15,-1.15],R:.95,back:6.4,up:3.2,mass:1200,len:2.4,exit:1.75},
  bike:{name:'腳踏車',verb:'騎車',max:6.5,acc:3.6,rev:1.5,turn:2.6,pts:[.42,-.42],R:.36,back:4.4,up:2.3,mass:95,len:.9,exit:.85}
};
function bikeMesh(){
  const g=new THREE.Group();scene.add(g);cur=g;
  const paint=new THREE.MeshStandardMaterial({color:0xff5fa8,roughness:.4,metalness:.5});
  const wheels=[-.52,.52].map(x=>{const w=cyl(.34,.34,.045,carTyre,x,.34,0,20);w.rotation.x=Math.PI/2;return w;});
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
const rides=WORLD.rides.map(o=>{const m=o.kind==='car'?carMesh(0xf2c23d):bikeMesh();          // your car is the yellow one
  m.g.rotation.order='YXZ';m.g.position.set(o.x,0,o.z);m.g.rotation.y=o.h;
  if(o.kind==='car'){cur=scene;flat(2.8,5.6,M.concrete,o.x,-.012,o.z,1.4);}
  return Object.assign(m,{kind:o.kind,S:SPEC[o.kind],x:o.x,z:o.z,h:o.h,v:0,bumped:0});});
function rideHit(r,x,z,h){
  const fx=Math.cos(h),fz=-Math.sin(h),R=r.S.R;
  for(const k of r.S.pts){const cx=x+fx*k,cz=z+fz*k;
    if(!inWorld(cx,cz,R))return true;
    for(const c of colliders)if(cx>c[0]-R&&cx<c[1]+R&&cz>c[2]-R&&cz<c[3]+R)return true;
    for(const d of doors){const c=doorArea(d);if(cx>c[0]-R&&cx<c[1]+R&&cz>c[2]-R&&cz<c[3]+R)return true;}
    for(const c of cars)if(c.on&&cx>c.box[0]-R&&cx<c.box[1]+R&&cz>c.box[2]-R&&cz<c.box[3]+R)return true;
    for(const o of rides)if(o!==r)for(const j of o.S.pts)if(Math.hypot(o.x+Math.cos(o.h)*j-cx,o.z-Math.sin(o.h)*j-cz)<R+o.S.R)return true;
    for(const n of people)if(!n.hidden&&Math.hypot(n.pos.x-cx,n.pos.z-cz)<R+.3)return n;}
  return false;
}
function nearRide(){let best=null,bd=1e9;for(const r of rides){const d=Math.hypot(r.x-pos.x,r.z-pos.z)-r.S.R;if(d<2&&d<bd){bd=d;best=r;}}return best;}
function getIn(){const r=nearRide();if(!r||ride)return;putDown();standUp();ride=r;r.v=0;vel.x=vel.z=0;jumpY=jumpV=0;if(r.rider)r.rider.visible=true;showItems();
  say(r.kind==='car'?'你上車了。W 或往前推是油門，S 是煞車和倒車，A D 是方向盤。':'你騎上腳踏車了。W 踩踏板，S 煞車，A D 轉彎。腳踏車可以騎上人行道。');}
function getOut(){const r=ride;if(!r)return;if(Math.abs(r.v)>1.5){say('先停下來再下車。');return;}
  const fx=Math.cos(r.h),fz=-Math.sin(r.h);ride=null;                                          // (blocked() treats the vehicle as parked from here on)
  for(const side of[1,-1]){const x=r.x+fz*r.S.exit*side,z=r.z-fx*r.S.exit*side;                 // try the left side, then the right
    if(!blocked(x,z)){r.v=0;pos.x=x;pos.z=z;yaw=Math.atan2(-fx,-fz);pitch=-.05;if(r.rider)r.rider.visible=false;r.g.rotation.x=0;showItems();return;}}
  ride=r;say('兩邊都被擋住了，往前一點再下車。');}
function rideStep(dt,f,s){
  const r=ride,S=r.S,a=Math.max(-1,Math.min(1,f)),st=-Math.max(-1,Math.min(1,s));
  r.v+=a*(a*r.v<0?14:a>0?S.acc:S.rev*.9)*dt;r.v*=Math.exp(-.5*dt);r.v=Math.max(-S.rev,Math.min(S.max,r.v));
  if(Math.abs(a)<.05&&Math.abs(r.v)<.2)r.v=0;
  const nh=r.h+st*Math.max(-1,Math.min(1,r.v/4))*S.turn*dt,nx=r.x+Math.cos(nh)*r.v*dt,nz=r.z-Math.sin(nh)*r.v*dt;
  const hit=r.v?rideHit(r,nx,nz,nh):false;r.bumped-=dt;
  if(!hit){r.x=nx;r.z=nz;r.h=nh;}
  else{if(hit!==true){notify(hit,'car',r);r.v=0;}                                                // a person: stop dead, and they will tell you what they think
    else{if(Math.abs(r.v)>2.5&&r.bumped<=0){r.bumped=1;sfxBump();say('碰！'+S.name+'撞到東西，東西也用一樣大的力把'+S.name+'推回來，所以彈了一下。');}r.v*=-.2;}}
  pos.x=r.x;pos.z=r.z;
  r.g.position.set(r.x,0,r.z);r.g.rotation.y=r.h;for(const w of r.wheels)w.rotation.z-=r.v*dt/.33;
  if(r.kind==='bike')r.g.rotation.x+=(-st*Math.min(1,Math.abs(r.v)/S.max)*.38*Math.sign(r.v||1)-r.g.rotation.x)*(1-Math.exp(-dt*6));   // lean into the turn
  // the camera follows behind and above
  const fx=Math.cos(r.h),fz=-Math.sin(r.h);
  camGoal.set(r.x-fx*S.back,S.up,r.z-fz*S.back);camera.position.lerp(camGoal,1-Math.exp(-dt*5));
  camera.lookAt(r.x+fx*2.5,1.1,r.z+fz*2.5);
  yaw=Math.atan2(-fx,-fz);
}
// --- one step of you. Returns true when it has already placed the camera (riding or sitting) ---
function playerStep(dt,f,s){
  const g=Math.max(1.4,GMODES[gIdx][0]);                                    // jumping uses the same gravity as the balls (never quite zero, or you would float away)
  if(jumpY>0||jumpV>0){jumpV-=g*dt;jumpY+=jumpV*dt;const top=roomAt(pos.x,pos.z)?RH-1.78:7;
    if(jumpY>top){jumpY=top;jumpV=Math.min(0,jumpV);}if(jumpY<=0){jumpY=0;jumpV=0;}}
  for(const r of rides)if(r.kind==='car')carLights(r,ride===r&&f<-.1);
  if(ride){rideStep(dt,f,s);return true;}
  if(seat){if(Math.abs(f)+Math.abs(s)>.4){standUp();return false;}
    const A=seat.A;pos.x=A.an[0];pos.z=A.an[2];camera.position.set(A.an[0],A.an[1]+.62,A.an[2]);camera.rotation.set(pitch,yaw,0);return true;}
  return false;
}
// --- the action buttons ---
const KEY={jump:'空白',pick:'E',drop:'E',throw:'點畫面',sit:'Q',stand:'Q',in:'F',out:'F'};
const ACTS={jump:['跳',jump],pick:['撿起',pickUp],drop:['放下',putDown],throw:['丟出去',throwHeld],sit:['坐下',sitDown],stand:['站起來',standUp],in:['',getIn],out:['下來',getOut]};
let actKey='x';
function mkBtn(text,key,fn,on){const b=document.createElement('button');b.type='button';b.textContent=text;if(on!=null)b.setAttribute('aria-pressed',on);
  if(!isTouch&&key){const k=document.createElement('kbd');k.textContent=key;b.appendChild(k);}
  b.onclick=()=>{fn();actKey='';updateActs();canvas.focus({preventScroll:true});};return b;}
function updateActs(){
  const list=[],it=ride?null:nearItem(),nb=ride||held||it?null:nearBall(),nr=ride?null:nearRide();
  if(ride)list.push('out');
  else{if(nr)list.push('in');
    if(seat)list.push('stand');else if(nearSeat())list.push('sit');
    if(held)list.push('throw','drop');else if(it||nb)list.push('pick');
    if(!seat)list.push('jump');}
  const what=it?ITEM[it.item].name:nb?nb.name:held?held.name:'';
  const key=list.join(',')+what+(nr?nr.kind:'')+Object.keys(bag).join('')+JSON.stringify(use)+drinks;
  if(key===actKey)return;actKey=key;
  const el=$('acts');el.textContent='';
  for(const id of list)el.appendChild(mkBtn(id==='in'?(nr.kind==='car'?'上車':'騎腳踏車'):ACTS[id][0]+(id==='pick'||id==='throw'||id==='drop'?what:''),KEY[id],ACTS[id][1]));
  const bg=$('bag');bg.textContent='';
  for(const k in ITEM)if(bag[k])bg.appendChild(mkBtn(ITEM[k].name,ITEM[k].key,()=>toggleItem(k),use[k]));
  if(drinks)bg.appendChild(mkBtn('喝飲料 ×'+drinks,'3',drinkUp));
}
addEventListener('keydown',e=>{if(e.repeat)return;
  if(e.code==='Space')jump();
  else if(e.code==='KeyE'){if(held)putDown();else pickUp();}
  else if(e.code==='KeyF'){if(ride)getOut();else getIn();}
  else if(e.code==='KeyQ'){if(seat)standUp();else sitDown();}
  else if(e.code==='Digit1')toggleItem('flashlight');
  else if(e.code==='Digit2')toggleItem('umbrella');
  else if(e.code==='KeyM')toggleItem('phone');
  else if(e.code==='Digit3')drinkUp();
});
showItems();
