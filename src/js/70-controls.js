/* ---------- walking + looking ---------- */
const pos=new THREE.Vector3(WORLD.start.x,1.6,WORLD.start.z);let yaw=WORLD.start.yaw,pitch=WORLD.start.pitch;
const vel={x:0,z:0},keys={},joy={x:0,y:0,id:null,ox:0,oy:0},look={id:null,x:0,y:0};
let down=null,bob=0,locked=false;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const PR=.3;
function blocked(x,z){
  if(aloft){const d=Math.hypot(x-WORLD.isle.x,z-WORLD.isle.z);return d<.97||d>1.36;}                 // on the lighthouse walkway: a ring round the lamp, with a rail
  if(!inWorld(x,z,PR)&&!onIsle(x,z,PR+.3))return true;
  for(const d of doors){const c=doorArea(d),hit=(a,b)=>a>c[0]-PR&&a<c[1]+PR&&b>c[2]-PR&&b<c[3]+PR;
    if(hit(x,z)&&!hit(pos.x,pos.z))return true;}                              // a door stops you, but never traps you if it moved onto you
  for(const c of colliders)if(x>c[0]-PR&&x<c[1]+PR&&z>c[2]-PR&&z<c[3]+PR)return true;
  for(const rd of rides){if(rd===ride)continue;const fx=Math.cos(rd.h),fz=-Math.sin(rd.h);        // parked vehicles are solid
    for(const k of rd.S.pts){const cx=rd.x+fx*k,cz=rd.z+fz*k,d=Math.hypot(x-cx,z-cz);if(d<rd.S.R+PR&&Math.hypot(pos.x-cx,pos.z-cz)>=d)return true;}}
  for(const c of cars){if(!c.on)continue;const q=c.box,hit=(a,b)=>a>q[0]-PR&&a<q[1]+PR&&b>q[2]-PR&&b<q[3]+PR;if(hit(x,z)&&!hit(pos.x,pos.z))return true;}   // cars are solid too
  for(const n of people){if(n.hidden||n.lie)continue; // people are solid, but you can always step away from them
    const d=Math.hypot(x-n.pos.x,z-n.pos.z);if(d<.5&&d<Math.hypot(pos.x-n.pos.x,pos.z-n.pos.z))return true;}
  return false;
}
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;});
const lookK=()=>scope&&aloft?.3:1;                                     // looking through the telescope: turn slowly, or you could never aim it
document.addEventListener('mousemove',e=>{if(locked){const q=.0022*lookK();yaw-=e.movementX*q;pitch-=e.movementY*q;clampPitch();}});
function clampPitch(){pitch=Math.max(-1.35,Math.min(1.35,pitch));}
const ray=new THREE.Raycaster();ray.far=4.5;const ndc=new THREE.Vector2();let hoverNdc={x:0,y:0};
function pick(x,y){ndc.set(x,y);ray.setFromCamera(ndc,camera);const h=ray.intersectObjects(interact,false);for(const i of h){const n=i.object.userData.npc;if(!n||!n.hidden)return i.object;}return null;}
function tryInteract(x,y){const o=pick(x,y);if(o){o.userData.act();return true;}return false;}
function toNdc(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*2-1,y:-((e.clientY-r.top)/r.height*2-1)};}
canvas.addEventListener('pointerdown',e=>{
  canvas.focus({preventScroll:true});
  if(e.pointerType==='touch'){
    try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    if(e.clientX<innerWidth*.45&&joy.id===null){joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;
      const j=$('joy');j.hidden=false;j.style.left=e.clientX+'px';j.style.top=e.clientY+'px';}
    else if(look.id===null){look.id=e.pointerId;look.x=e.clientX;look.y=e.clientY;}
  }else if(!locked){look.id=e.pointerId;look.x=e.clientX;look.y=e.clientY;try{canvas.setPointerCapture(e.pointerId);}catch(_){}}
  down={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerType!=='touch'&&!locked)hoverNdc=toNdc(e);
  if(e.pointerId===joy.id){let dx=(e.clientX-joy.ox)/48,dy=(e.clientY-joy.oy)/48;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}
    joy.x=dx;joy.y=-dy;$('joy').firstElementChild.style.transform=`translate(${dx*34}px,${dy*34}px)`;}
  else if(e.pointerId===look.id){const k=e.pointerType==='touch'?.005:.004;
    yaw-=(e.clientX-look.x)*k*lookK();pitch-=(e.clientY-look.y)*k*lookK();clampPitch();look.x=e.clientX;look.y=e.clientY;}
});
function up(e){
  if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;$('joy').hidden=true;$('joy').firstElementChild.style.transform='';}
  if(e.pointerId===look.id)look.id=null;
  if(down&&down.id===e.pointerId&&e.type==='pointerup'){
    const tap=performance.now()-down.t<300&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8;
    if(tap){
      if(held)throwHeld();
      else if(locked)tryInteract(0,0);
      else{const p=toNdc(e);
        if(!tryInteract(p.x,p.y)&&e.pointerType!=='touch'&&canvas.requestPointerLock){
          try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(_){}}}
    }
  }
  if(down&&down.id===e.pointerId)down=null;
}
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
