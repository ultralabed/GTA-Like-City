/* ---------- you, seen from outside ---------- */
// Press V to step back and see your own character. The camera circles behind you and moves closer when a wall is in the way.
const me=makePerson({name:'你',h:1.72,skin:0xe8b996,hair:0x3a2a1c,top:0xf2c23d,bottom:0x2b3a67,shoe:0xffffff,long:false,sep:true});
interact.pop();me.tag.remove();me.root.visible=false;                       // not a neighbour: no name tag, nothing to click
let third=false,meYaw=0;
// the you that sits on the bicycle, the motorbike and the boat: the same body as on foot, in the same clothes, bent into a riding pose
const RIDE_POSE={bike:{x:-.25,y:1.07,sx:.5,a:-1.05,e:-.25,h:-1.0,k:1.3,nx:-.38},moto:{x:-.37,y:.99,sx:.3,a:-1.2,e:-.15,h:-1.3,k:1.25,nx:-.22},boat:{x:-.5,y:.64,sx:.02,a:-.35,e:-.6,h:-1.5,k:1.45,nx:0}};
for(const r of rides){const Q=RIDE_POSE[r.kind];if(!r.rider||!Q)continue;while(r.rider.children.length)r.rider.remove(r.rider.children[0]);
  const p=makePerson({name:'你',h:1.72,skin:0xe8b996,hair:0x3a2a1c,top:0xf2c23d,bottom:0x2b3a67,shoe:0xffffff,long:false,sep:true,mats:me.mats});interact.pop();p.tag.remove();
  r.rider.add(p.root);p.root.position.set(Q.x,Q.y,0);p.root.rotation.y=Math.PI/2;p.ph=0;r.rig=p;r.rigQ=Q;
  const J=p.J;J.spine.rotation.x=Q.sx;J.neck.rotation.x=Q.nx;J.al.rotation.set(Q.a,0,.1);J.ar.rotation.set(Q.a,0,-.1);J.el.rotation.x=J.er.rotation.x=Q.e;J.hl.rotation.x=J.hr.rotation.x=Q.h;J.kl.rotation.x=J.kr.rotation.x=Q.k;}
// the driver you see through your own car's windows is you: same skin, hair and whatever top you are wearing
function dressDriver(){const r=rides[0];if(!r.rider)return;for(const m of r.rider.children){if(!m.isMesh)continue;m.material=drvSkin.includes(m.material)||m.material===me.mats.skin?me.mats.skin:drvTop.includes(m.material)||m.material===me.mats.top?me.mats.top:me.mats.hair;}}
dressDriver();
// --- a neighbour out on her bicycle: she pedals up and down the main street by the kerb, waits at the red light, and rings her bell if you are in the way ---
const cyclist=(function(){const m=bikeMesh(false),Q=RIDE_POSE.bike;while(m.rider.children.length)m.rider.remove(m.rider.children[0]);
  const p=makePerson({name:'騎車的阿姨',h:1.62,skin:0xd9a67e,hair:0x2a1c14,top:0xe94f37,bottom:0x35508a,shoe:0xf2f2f2,long:true});interact.pop();p.tag.remove();
  m.rider.add(p.root);p.root.position.set(Q.x,Q.y-.05,0);p.root.rotation.y=Math.PI/2;m.rider.visible=true;
  const J=p.J;J.spine.rotation.x=Q.sx*.7;J.neck.rotation.x=Q.nx*.7;J.al.rotation.set(Q.a,0,.1);J.ar.rotation.set(Q.a,0,-.1);J.el.rotation.x=J.er.rotation.x=Q.e;
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;$('tags').appendChild(tag);
  return{m,p,tag,x:-60,dir:1,v:0,ph:0,bell:0,wait:0,ouch:0,why:''};})();
function updateCyclist(dt,t){const c=cyclist,S=WORLD.street,z=c.dir>0?S.z1-.5:S.z0+.5,show=dark<.75&&rain<.3;c.bell-=dt;
  if(!show&&Math.abs(c.x-pos.x)>60){c.m.g.visible=false;c.tag.hidden=true;return;}c.m.g.visible=Math.abs(c.x-pos.x)<95;
  c.ouch-=dt;c.why='';let want=c.ouch>0?0:4.2;const ahead=(x2,z2,r,lat)=>{const d=(x2-c.x)*c.dir;return d>0&&d<r&&Math.abs(z2-z)<(lat||1.25);};   // lat: how far to the side still counts as in her way (someone standing on the pavement is not)
  const stopX=c.dir>0?ZEBRA[0]-1.2:ZEBRA[1]+1.2,ds=(stopX-c.x)*c.dir;if((sigCars==='r'||sigCars==='y')&&ds>0&&ds<6){want=Math.min(want,Math.max(0,(ds-.5)*1.4));c.why='等紅燈';}                 // red light at the crossing
  for(const n of people)if(!n.hidden&&ahead(n.pos.x,n.pos.z,3,.8)){want=0;c.why='等前面的人過';}for(const k of cars)if(k.on&&ahead(k.x,k.z,5.5,1.0)){want=0;c.why='等前面的車';}   // only a car that has pulled right over to the kerb is in her way; one going by in its lane is not
  const me2=ride?[ride.x,ride.z]:[pos.x,pos.z];if(!onBus&&!aloft&&ahead(me2[0],me2[1],ride?5:3.2,ride?1.25:.8)){want=0;c.why='等你讓路';if(c.bell<=0){c.bell=3.5;tone(2093,.25,.12*hear(c.x,z,25),'sine');setTimeout(()=>tone(2093,.3,.1*hear(c.x,z,25),'sine'),170);say('叮鈴叮鈴！騎腳踏車的阿姨在等你讓路。',true);}}
  if(ride&&c.ouch<=-4&&Math.abs(ride.v)>2&&Math.hypot(ride.x-c.x,ride.z-z)<1.5){c.ouch=3;c.v=0;ride.v*=-.25;sfxBump();addRep(-1);say('你差點撞倒騎腳踏車的阿姨！她嚇了一大跳：「開車要看路啊！」'+'★'.repeat(heat));}   // you clipped her: she stops, shaken, and you are in trouble
  if(c.ouch>0)c.why='被你嚇到了';
  c.v+=Math.max(-9*dt,Math.min(2.2*dt,want-c.v));c.x+=c.v*c.dir*dt;if(Math.abs(c.x)>82&&Math.abs(c.x-pos.x)>50){c.dir=-c.dir;c.x=Math.sign(c.x)*82;}else if(Math.abs(c.x)>98){c.dir=-c.dir;}
  const g=c.m.g;g.position.set(c.x,0,c.dir>0?S.z1-.5:S.z0+.5);g.rotation.y=c.dir>0?0:Math.PI;spinWheels(c.m,c.v,dt,0);
  c.ph+=c.v*dt*2.4;const w=Math.sin(c.ph),cs=Math.cos(c.ph),Q=RIDE_POSE.bike,J=c.p.J,st=c.v<.3?1:0;                                        // pedalling; one foot down when stopped
  J.hl.rotation.x=Q.h+w*.32+st*.75;J.kl.rotation.x=Q.k-w*.3+cs*.12-st*1.0;J.hr.rotation.x=Q.h-w*.32;J.kr.rotation.x=Q.k+w*.3-cs*.12;g.rotation.x=0;g.rotation.z=st*-.06;
  c.p.blinkT-=dt;if(c.p.blinkT<-.12)c.p.blinkT=2.2+Math.random()*4;c.p.lids.visible=c.p.blinkT<0;
  const f=c.p.faces,fc=c.ouch>0?'u':c.why?'n':'h';if(fc!==c.p.face){f[c.p.face].visible=false;f[fc].visible=true;c.p.face=fc;}
  pv3.set(c.x,1.95,g.position.z).project(camera);const near=Math.hypot(c.x-pos.x,g.position.z-pos.z)<14&&pv3.z<1&&Math.abs(pv3.x)<1.1&&Math.abs(pv3.y)<1.1&&!roomAt(pos.x,pos.z);c.tag.hidden=!near;
  if(near){c.tag.style.left=((pv3.x+1)/2*canvas.clientWidth)+'px';c.tag.style.top=((1-pv3.y)/2*canvas.clientHeight)+'px';const s2='騎車的阿姨 · '+(c.why||'騎腳踏車兜風');if(c.tag.textContent!==s2)c.tag.textContent=s2;}}
function riderStep(dt,t){const r=ride;if(!r||!r.rig)return;const p=r.rig,Q=r.rigQ,J=p.J;
  if(r.kind==='bike'){p.ph+=r.v*dt*2.4;const w=Math.sin(p.ph),c=Math.cos(p.ph);J.hl.rotation.x=Q.h+w*.32;J.kl.rotation.x=Q.k-w*.3+c*.12;J.hr.rotation.x=Q.h-w*.32;J.kr.rotation.x=Q.k+w*.3-c*.12;}   // pedalling
  J.neck.rotation.set(Q.nx,0,0);const lean=r.kind==='boat'?0:(r.g.rotation.x||0);J.spine.rotation.set(Q.sx,0,0);
  p.blinkT-=dt;if(p.blinkT<-.12)p.blinkT=2.2+Math.random()*4;p.lids.visible=p.blinkT<0;}

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
  riderStep(dt,t);
  deck.visible=third&&boarding();if(deck.visible){deck.position.set(pos.x,jumpY,pos.z);deck.rotation.y=meYaw-Math.PI/2;}
  const on=third&&!ride&&!onBus&&!aloft;me.root.visible=on;hand.visible=!on;
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
  liveBody(me,t,dt,name==='walk',0,!!lieQ2,emote?'h':heat?'u':'n');
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
