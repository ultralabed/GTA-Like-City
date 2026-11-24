/* ---------- physics: gravity, attraction, and pushes that always come in pairs ---------- */
const GMODES=[[9.8,'地球'],[1.62,'月球'],[0,'無重力']];let gIdx=0;
const BIG_G=.025,PH=1/240,PLAYER_M=70;
$('bGrav').onclick=()=>{gIdx=(gIdx+1)%3;$('bGrav').textContent='重力：'+GMODES[gIdx][1];
  say(['地球重力：每秒往下加快 9.8 公尺。','月球重力：只有地球的六分之一，球跳得又高又慢。','沒有重力：踢一下，球就一直飄。'][gIdx]);};
let sayAt=0;
function say(txt,soft){const now=performance.now();if(soft&&now-sayAt<400)return;sayAt=now;$('phys').textContent=txt;}
function ballTex(kind){const c=cv(256,128),g=c.getContext('2d');
  if(kind==='basket'){g.fillStyle='#c8591c';g.fillRect(0,0,256,128);g.strokeStyle='#1a0f0a';g.lineWidth=3;
    g.beginPath();g.moveTo(0,64);g.lineTo(256,64);for(const x of[1,128,255]){g.moveTo(x,0);g.lineTo(x,128);}g.stroke();
    for(const x of[64,192]){g.beginPath();g.ellipse(x,64,34,64,0,0,7);g.stroke();}}
  else if(kind==='beach'){['#ff4f6a','#fff6e8','#2aa7c9','#fff6e8','#ffc23d','#fff6e8'].forEach((col,i)=>{g.fillStyle=col;g.fillRect(i*256/6,0,256/6+1,128);});}
  else if(kind==='tennis'){g.fillStyle='#c9e03a';g.fillRect(0,0,256,128);g.strokeStyle='#f7f7ee';g.lineWidth=5;g.beginPath();
    for(let x=0;x<=256;x+=4){const y=64+Math.sin(x/256*Math.PI*4)*34;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
  else if(kind==='bowl'){g.fillStyle='#151a3a';g.fillRect(0,0,256,128);for(let i=0;i<60;i++){g.strokeStyle=`rgba(120,150,255,${rnd(.05,.25)})`;g.lineWidth=rnd(1,4);
    const x=rnd(0,256),y=rnd(0,128);g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+rnd(-60,60),y+rnd(-30,30),x+rnd(-60,60),y+rnd(-30,30),x+rnd(-80,80),y+rnd(-40,40));g.stroke();}}
  else{g.fillStyle='#2a0f4a';g.fillRect(0,0,256,128);for(let i=0;i<40;i++){g.fillStyle=`rgba(${Math.random()<.5?'255,120,220':'120,220,255'},${rnd(.1,.4)})`;
    g.beginPath();g.arc(rnd(0,256),rnd(0,128),rnd(3,14),0,7);g.fill();}}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
const bodies=[];
function addBall(name,r,m,e,drag,mat,x,y,z){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,28,18),mat);mesh.castShadow=true;mesh.receiveShadow=true;dyn.add(mesh);
  const b={name,r,m,e,drag,p:new THREE.Vector3(x,y,z),v:new THREE.Vector3(),mesh,ground:false,ax:new THREE.Vector3(1,0,0),w:0};
  mesh.position.copy(b.p);mesh.rotation.set(rnd(0,6),rnd(0,6),0);
  mesh.userData={tip:'點一下：踢'+name+'（'+m+' 公斤）',act:()=>kick(b)};interact.push(mesh);bodies.push(b);return b;}
const orbTex=ballTex('orb');
const orbMat=new THREE.MeshStandardMaterial({map:orbTex,emissiveMap:orbTex,emissive:0xffffff,emissiveIntensity:.15,roughness:.25,metalness:.3});
const std=(kind,o)=>new THREE.MeshStandardMaterial(Object.assign({map:ballTex(kind)},o));
const BALLS={                                            // name, radius (m), mass (kg), bounciness, air drag, material
  basket:['籃球',.12,.6,.78,.05,()=>std('basket',{roughness:.75})],
  beach:['海灘球',.18,.1,.7,1.1,()=>std('beach',{roughness:.35})],
  bowl:['保齡球',.11,6,.2,.01,()=>std('bowl',{roughness:.08,metalness:.2})],
  tennis:['網球',.033,.058,.74,.12,()=>std('tennis',{roughness:.95})],
  orb:['引力球',.14,30,.3,.02,()=>orbMat]
};
for(const H of houses)H.balls.forEach(q=>{const B=BALLS[q.kind],b=addBall(B[0],B[1],B[2],B[3],B[4],B[5](),q.x,q.y||B[1],q.z);b.kind=q.kind;if(q.kind==='basket')H.basket=b;});
const orbs=bodies.filter(b=>b.kind==='orb');
const fwd=new THREE.Vector3();
function kick(b){
  camera.getWorldDirection(fwd);
  if(Math.hypot(b.p.x-pos.x,b.p.z-pos.z)>2.6){say('太遠了，走近一點再踢。');return;}
  fwd.y+=.35;fwd.normalize();
  const J=Math.min(4,b.m*9);                              // the push, in newton-seconds
  b.v.addScaledVector(fwd,J/b.m);vel.x-=fwd.x*J/PLAYER_M;vel.z-=fwd.z*J/PLAYER_M;   // same push, opposite way, on you
  b.kickBy='你';b.kickAt=performance.now()/1000;
  say('你踢了'+b.name+'：球被往前推 '+J.toFixed(1)+' 牛頓·秒，你也被往後推一樣多。你比較重，所以幾乎沒動。');
}
// push a ball out of something it touches, bounce it, and return how hard the push was
function contact(b,nx,ny,nz,pen,svx,svz,M){
  b.p.x+=nx*pen;b.p.y+=ny*pen;b.p.z+=nz*pen;
  const rx=b.v.x-svx,ry=b.v.y,rz=b.v.z-svz,vn=rx*nx+ry*ny+rz*nz;
  if(ny>.6)b.ground=true;
  if(vn>=0)return 0;
  const bounce=vn<-.4,invM=1/b.m+(M?1/M:0),J=-(1+(bounce?b.e:0))*vn/invM;
  b.v.x+=nx*J/b.m;b.v.y+=ny*J/b.m;b.v.z+=nz*J/b.m;
  if(bounce){const tx=rx-vn*nx,ty=ry-vn*ny,tz=rz-vn*nz,tl=Math.hypot(tx,ty,tz);
    if(tl>1e-4){const Jt=Math.min(.25*J,tl/invM)/b.m/tl;b.v.x-=tx*Jt;b.v.y-=ty*Jt;b.v.z-=tz*Jt;}}
  return J;
}
function hitPerson(b,px,pz,rad,top,svx,svz,M,who){
  if(b.p.y-b.r>top)return 0;
  const dx=b.p.x-px,dz=b.p.z-pz,d=Math.hypot(dx,dz),min=b.r+rad;
  if(d>=min||d<1e-5)return 0;
  const J=contact(b,dx/d,0,dz/d,min-d,svx,svz,M);
  if(J/b.m>.6)say(who+' ⇄ '+b.name+'：兩邊各被推 '+J.toFixed(1)+' 牛頓·秒，方向相反。',true);
  return J?[J,dx/d,dz/d]:0;
}
function physStep(dt){
  const g=GMODES[gIdx][0];
  for(const b of bodies){b.v.y-=g*dt;b.v.multiplyScalar(Math.exp(-b.drag*dt));}
  if(G.orb)for(const orb of orbs)for(const b of bodies){if(b===orb)continue;            // attraction: F = G·m1·m2 / r², on both, opposite ways
    const dx=orb.p.x-b.p.x,dy=orb.p.y-b.p.y,dz=orb.p.z-b.p.z,min=orb.r+b.r,r2=Math.max(dx*dx+dy*dy+dz*dz,min*min),r=Math.sqrt(r2);
    const F=BIG_G*orb.m*b.m/r2,k=F*dt/r;
    b.v.x+=dx*k/b.m;b.v.y+=dy*k/b.m;b.v.z+=dz*k/b.m;orb.v.x-=dx*k/orb.m;orb.v.y-=dy*k/orb.m;orb.v.z-=dz*k/orb.m;}
  for(const b of bodies){b.p.addScaledVector(b.v,dt);b.ground=false;}
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){   // ball against ball
    const a=bodies[i],b=bodies[j],dx=b.p.x-a.p.x,dy=b.p.y-a.p.y,dz=b.p.z-a.p.z,min=a.r+b.r,d2=dx*dx+dy*dy+dz*dz;
    if(d2>=min*min||d2<1e-10)continue;
    const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,nz=dz/d,pen=min-d,im=1/a.m+1/b.m;
    a.p.x-=nx*pen/a.m/im;a.p.y-=ny*pen/a.m/im;a.p.z-=nz*pen/a.m/im;b.p.x+=nx*pen/b.m/im;b.p.y+=ny*pen/b.m/im;b.p.z+=nz*pen/b.m/im;
    const vn=(b.v.x-a.v.x)*nx+(b.v.y-a.v.y)*ny+(b.v.z-a.v.z)*nz;if(vn>=0)continue;
    const J=-(1+(vn<-.4?Math.min(a.e,b.e):0))*vn/im;                    // one push J ...
    a.v.x-=nx*J/a.m;a.v.y-=ny*J/a.m;a.v.z-=nz*J/a.m;                    // ... goes this way on one ball
    b.v.x+=nx*J/b.m;b.v.y+=ny*J/b.m;b.v.z+=nz*J/b.m;                    // ... and the other way on the other
    if(J/Math.min(a.m,b.m)>.8)say(a.name+' ⇄ '+b.name+'：兩顆球各被推 '+J.toFixed(2)+' 牛頓·秒，方向相反。輕的那顆跑比較快。',true);
  }
  for(const b of bodies){
    const r=b.r;
    if(b.p.y<r)contact(b,0,1,0,r-b.p.y,0,0,0);
    if(b.p.x<WB.x0+r)contact(b,1,0,0,WB.x0+r-b.p.x,0,0,0);            // the edge of the world
    if(b.p.x>WB.x1-r)contact(b,-1,0,0,b.p.x-(WB.x1-r),0,0,0);
    if(b.p.z<WB.z0+r)contact(b,0,0,1,WB.z0+r-b.p.z,0,0,0);
    if(b.p.z>WB.z1-r)contact(b,0,0,-1,b.p.z-(WB.z1-r),0,0,0);
    for(const q of pboxes){
      if(b.p.x<q[0]-r||b.p.x>q[1]+r||b.p.z<q[4]-r||b.p.z>q[5]+r)continue;
      const cx=Math.max(q[0],Math.min(q[1],b.p.x)),cy=Math.max(q[2],Math.min(q[3],b.p.y)),cz=Math.max(q[4],Math.min(q[5],b.p.z));
      const dx=b.p.x-cx,dy=b.p.y-cy,dz=b.p.z-cz,d2=dx*dx+dy*dy+dz*dz;
      if(d2>=r*r)continue;
      if(d2>1e-10){const d=Math.sqrt(d2);contact(b,dx/d,dy/d,dz/d,r-d,0,0,0);}
      else{const o=[b.p.x-q[0],q[1]-b.p.x,b.p.y-q[2],q[3]-b.p.y,b.p.z-q[4],q[5]-b.p.z];let m=0;for(let i=1;i<6;i++)if(o[i]<o[m])m=i;
        contact(b,m===0?-1:m===1?1:0,m===2?-1:m===3?1:0,m===4?-1:m===5?1:0,o[m]+r,0,0,0);}
    }
    for(const c of cars){if(!c.on||b.p.y-r>1.55)continue;                  // a car is a big moving box: it knocks balls away, and the ball pushes back on the car just as hard
      const q=c.box,cx=Math.max(q[0],Math.min(q[1],b.p.x)),cy=Math.max(.2,Math.min(1.55,b.p.y)),cz=Math.max(q[2],Math.min(q[3],b.p.z));
      const dx=b.p.x-cx,dy=b.p.y-cy,dz=b.p.z-cz,d2=dx*dx+dy*dy+dz*dz;if(d2>=r*r||d2<1e-10)continue;
      const d=Math.sqrt(d2),J=contact(b,dx/d,dy/d,dz/d,r-d,c.dir*c.v,0,1200);
      if(J/b.m>1)say('車子 ⇄ '+b.name+'：兩邊各被推 '+J.toFixed(1)+' 牛頓·秒。車子有 1200 公斤，所以幾乎沒變慢。',true);}
    const hp=hitPerson(b,pos.x,pos.z,.3,1.7,vel.x,vel.z,PLAYER_M,'你');
    if(hp){vel.x-=hp[1]*hp[0]/PLAYER_M;vel.z-=hp[2]*hp[0]/PLAYER_M;}       // the ball pushes back on you
    for(const n of people){if(n.hidden)continue;const spd=b.v.length();   // a fast ball that hits someone is an interruption
      if(hitPerson(b,n.pos.x,n.pos.z,n.lie?.45:.2,n.lie?.85:n.sit?1.2:n.o.h,n.vx,n.vz,0,n.o.name)&&spd>1.5)notify(n,'hit',b);}
    if(b.ground){const k=Math.exp(-.7*dt);b.v.x*=k;b.v.z*=k;}              // rolling slows down
  }
}
const qSpin=new THREE.Quaternion();
function syncBalls(dt){for(const b of bodies){
  const sp=Math.hypot(b.v.x,b.v.z);
  if(b.ground&&sp>.01){b.ax.set(b.v.z/sp,0,-b.v.x/sp);b.w=sp/b.r;}else b.w*=Math.exp(-.3*dt);
  if(b.w>.01){qSpin.setFromAxisAngle(b.ax,b.w*dt);b.mesh.quaternion.premultiply(qSpin);}
  b.mesh.position.copy(b.p);}}
