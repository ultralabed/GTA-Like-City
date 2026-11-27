/* ---------- you, seen from outside ---------- */
// Press V to step back and see your own character. The camera circles behind you and moves closer when a wall is in the way.
const me=makePerson({name:'你',h:1.72,skin:0xe8b996,hair:0x3a2a1c,top:0xf2c23d,bottom:0x2b3a67,shoe:0xffffff,long:false,sep:true});
interact.pop();me.tag.remove();me.root.visible=false;                       // not a neighbour: no name tag, nothing to click
let third=false,meYaw=0;
const meQ=new THREE.Quaternion();
function camBlocked(x,z){if(!inWorld(x,z,.2))return true;
  for(const c of colliders)if(x>c[0]-.15&&x<c[1]+.15&&z>c[2]-.15&&z<c[3]+.15)return true;
  for(const d of doors){const c=doorArea(d);if(x>c[0]-.1&&x<c[1]+.1&&z>c[2]-.1&&z<c[3]+.1)return true;}
  return false;}
function setView(on){third=on;ray.far=on?8:4.5;$('bView').textContent='視角：'+(on?'第三人稱':'第一人稱');}
$('bView').onclick=()=>setView(!third);
addEventListener('keydown',e=>{if(e.code==='KeyV'&&!e.repeat)setView(!third);});
const deck=new THREE.Group();deck.visible=false;scene.add(deck);
{const d=new THREE.Mesh(new THREE.BoxGeometry(.8,.03,.22),new THREE.MeshStandardMaterial({color:0xd9623f,roughness:.6}));d.position.y=.09;d.castShadow=true;deck.add(d);
 for(const x of[-.27,.27])for(const z of[-.08,.08]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.04,10),M.black);w.rotation.x=Math.PI/2;w.position.set(x,.04,z);deck.add(w);}}
function thirdCam(dt,t){
  deck.visible=third&&boarding();if(deck.visible){deck.position.set(pos.x,jumpY,pos.z);deck.rotation.y=meYaw-Math.PI/2;}
  const on=third&&!ride&&!onBus;me.root.visible=on;hand.visible=!on;
  if(!on)return;
  const sp=Math.hypot(vel.x,vel.z),moving=sp>.3&&!seat;
  if(moving)meYaw+=angDiff(Math.atan2(vel.x,vel.z),meYaw)*(1-Math.exp(-dt*10));      // turn to face the way you walk
  const wd=waterDepth();
  let name='idle',y=me.stand+jumpY-wd,lieQ2=null,hy=1.55+jumpY-wd*.75;
  if(seat){const A=seat.A;name=A.pose;y=A.an[1];meYaw=A.yaw||0;hy=A.an[1]+.55;if(seat.lie)lieQ2=A.q;}
  else if(emote==='dance'&&!moving){name='dance';}
  else if(moving&&boarding()){name='idle';y+=.1;}                              // gliding: stand still on the deck
  else if(moving){name='walk';me.ph+=dt*sp*3.9;}
  pose(P,name,me,t);
  if(crouchK>.02&&!seat){const k=crouchK;P.hlx-=1.25*k;P.hrx-=1.25*k;P.klx+=2.0*k;P.krx+=2.0*k;P.sx=(P.sx||0)+.28*k;y-=.4*k;hy-=.55*k;}
  if(emote==='wave'){P.arx=-2.7;P.arz=-.25+Math.sin(t*11)*.35;P.erx=-.35;}
  if(held){P.alx=P.arx=-1.15;P.elx=P.erx=-.7;}else if(use.umbrella){P.arx=-1.5;P.erx=-1.1;}else if(use.flashlight){P.arx=-1.2;P.erx=-.3;}
  const kp=1-Math.exp(-dt*(name==='walk'?20:9));JK.forEach(k=>me.cur[k]+=(P[k]-me.cur[k])*kp);
  const c=me.cur,J=me.J;
  J.spine.rotation.set(c.sx,0,c.sz);J.neck.rotation.set(c.nx,c.ny,0);
  J.al.rotation.set(c.alx,0,c.alz);J.ar.rotation.set(c.arx,0,c.arz);J.el.rotation.x=c.elx;J.er.rotation.x=c.erx;
  J.hl.rotation.x=c.hlx;J.hr.rotation.x=c.hrx;J.kl.rotation.x=c.klx;J.kr.rotation.x=c.krx;
  liveBody(me,t,dt,name==='walk',0,!!lieQ2);
  me.root.position.set(pos.x,y+c.yo,pos.z);me.root.quaternion.slerp(lieQ2||meQ.setFromAxisAngle(up3,meYaw),1-Math.exp(-dt*8));
  me.um.visible=use.umbrella;
  // the camera sits behind and a little above, as far back as it can get without going through a wall
  const cp=Math.cos(pitch),bx=Math.sin(yaw)*cp,by=-Math.sin(pitch),bz=Math.cos(yaw)*cp,far=3.4,indoors=!!roomAt(pos.x,pos.z);
  let dist=far;
  for(let i=1;i<=10;i++){const d=far*i/10,yy=hy+by*d+.25;if(camBlocked(pos.x+bx*d,pos.z+bz*d)||yy<.3||(indoors&&yy>RH-.12)){dist=far*(i-1)/10;break;}}
  dist=Math.max(.45,dist-.12);const lift=seat?.55:.25;
  if(seat)dist=Math.max(dist,1.9);                                           // the seat itself would count as a wall: stay back and look over it
  camera.position.set(pos.x+bx*dist,Math.min(hy+by*dist+lift,indoors?RH-.15:99),pos.z+bz*dist);camera.rotation.set(pitch,yaw,0);camera.updateMatrixWorld();
  if(held){held.p.set(pos.x+Math.sin(meYaw)*.42,y+.18,pos.z+Math.cos(meYaw)*.42);held.v.set(vel.x,0,vel.z);held.mesh.position.copy(held.p);}   // the ball goes in your hands, not in front of the camera
}
// --- clothes: click any wardrobe to change ---
const OUTFITS=[['黃上衣、藍褲子',0xf2c23d,0x2b3a67,0xffffff],['紅外套、黑褲子',0xc4553b,0x1c1c22,0x202024],['綠 T 恤、卡其褲',0x3f8a5a,0xc9b48a,0x5a3a26],['白襯衫、灰褲子',0xf2efe8,0x6a6a72,0x2a2420],['紫色運動服',0x7a4ab0,0x7a4ab0,0xf4f0e8]];
let outfit=0;
function wear(i){outfit=i%OUTFITS.length;const O=OUTFITS[outfit];me.mats.top.color.set(O[1]);me.mats.bot.color.set(O[2]);me.mats.shoe.color.set(O[3]);}
function nextOutfit(){if(Math.hypot(camera.position.x-pos.x,camera.position.z-pos.z)>9)return;wear(outfit+1);say('你換上了：'+OUTFITS[outfit][0]+'。'+(third?'':'按 V 可以看看自己。'));}
