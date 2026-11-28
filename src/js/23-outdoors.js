/* ---------- the street outside ---------- */
(function(){
  const S=WORLD.street,LEN=400,mid=(S.z0+S.z1)/2;
  const g=new THREE.Mesh(new THREE.CircleGeometry(320,48),M.grass);g.rotation.x=-Math.PI/2;g.position.y=-.03;g.receiveShadow=true;scene.add(g);
  M.grass.map.repeat.set(160,160);
  flat(LEN,S.z1-S.z0,M.asphalt,0,-.02,mid,4);                                                  // the road
  flat(LEN,S.walk,M.concrete,0,-.012,S.z0-S.walk/2,1.5);flat(LEN,S.walk,M.concrete,0,-.012,S.z1+S.walk/2,1.5);   // sidewalks
  for(let x=-110;x<=110;x+=4)flat(1.7,.14,M.paint,x,-.008,mid);                                  // centre dashes
  [S.z0+.25,S.z1-.25].forEach(z=>flat(LEN,.1,M.paint,0,-.008,z));                              // edge lines
  for(let i=0;i<7;i++)flat(.5,S.z1-S.z0-.9,M.paint,1.9-3+i,-.008,mid);
  for(let x=JX0+.55;x<JX1-.2;x+=1)flat(.5,3,M.paint,x,-.006,WORLD.zebra2);                      // and one across the side street                         // zebra crossing in front of number 1
  for(const H of houses)if(H.front&&Math.abs(H.front.dx)>.5){const f=H.front,edge=f.dx>0?JX0-S.walk:JX1+S.walk;flat(Math.abs(edge-f.x),1.2,M.concrete,(f.x+edge)/2,-.012,f.z,1.2);}   // houses on the side street
  for(const H of houses)if(H.front&&Math.abs(H.front.dx)<=.5){const f=H.front,edge=f.dz>0?S.z0-S.walk:S.z1+S.walk,len=Math.abs(edge-f.z);   // garden path from each front door
    flat(1.2,len,M.concrete,f.x,-.012,(f.z+edge)/2,1.2);}
  // the beach behind the north houses, and the sea beyond it
  flat(LEN,7,M.sand,0,-.018,-9.5,3);
  flat(900,400,M.water,0,-.014,WORLD.shore-200);
  {const I=WORLD.isle,ig=new THREE.Group(),pv=cur,pr=root;ig.position.set(I.x,0,I.z);scene.add(ig);cur=ig;        // the lighthouse island
    const disc=(r,mat,y)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(r,28),mat);m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;ig.add(m);};
    disc(I.r+1.2,M.sand,.02);disc(I.r-3,M.grass,.035);
    const white=new THREE.MeshStandardMaterial({color:0xf2efe8,roughness:.7}),red=new THREE.MeshStandardMaterial({color:0xc8402f,roughness:.6});
    cyl(1.05,1.5,8,white,0,4,0,16);cyl(1.25,1.32,1.1,red,0,2.6,0,16);cyl(1.12,1.18,1.1,red,0,6,0,16);cyl(1.5,1.5,.14,M.steel,0,8.05,0,16);
    cyl(.75,.75,1.2,M.glass,0,8.7,0,12);cyl(.05,.95,.9,red,0,9.75,0,12);box(.7,1.5,.08,M.walnut,0,.75,1.5);
    box(1.6,.07,.45,M.walnut,3.4,.45,3.2);[2.7,4.1].forEach(x=>box(.07,.45,.4,M.steel,x,.225,3.2));                  // a bench facing the town
    for(const y of[8.62,9.08]){const m=new THREE.Mesh(new THREE.TorusGeometry(1.47,.022,6,28),M.steel);m.rotation.x=Math.PI/2;m.position.y=y;add(m);}          // a rail round the walkway at the top
    for(let k=0;k<10;k++)cyl(.02,.02,.98,M.steel,Math.cos(k*.628)*1.47,8.6,Math.sin(k*.628)*1.47,6);box(.5,.9,.06,M.walnut,0,8.57,.78);
    cyl(.03,.04,1.1,M.steel,0,8.65,1.42,8);{const t=cyl(.06,.075,.42,M.brass,0,9.25,1.42,10);t.rotation.x=Math.PI/2-.12;}                        // a coin telescope on the rail, pointing at the town
    cur=pv;weldStatic(ig);colliders.push([I.x-1.5,I.x+1.5,I.z-1.5,I.z+1.5],[I.x+2.6,I.x+4.2,I.z+3,I.z+3.45]);
    isleLamp=new THREE.Mesh(new THREE.SphereGeometry(.42,12,10),new THREE.MeshBasicMaterial({color:0x554a30}));isleLamp.position.set(I.x,8.7,I.z);scene.add(isleLamp);
    isleBeam=new THREE.Group();isleBeam.position.copy(isleLamp.position);scene.add(isleBeam);
    {const bc=document.createElement('canvas');bc.width=256;bc.height=32;const bg=bc.getContext('2d'),im=bg.createImageData(256,32);                 // a soft beam: bright by the lamp, fading along its length and toward its edges
      for(let y=0;y<32;y++)for(let x=0;x<256;x++){const a=Math.pow(1-x/255,1.6)*Math.exp(-Math.pow((y-15.5)/(3+x*.035),2)),k=(y*256+x)*4;im.data[k]=255;im.data[k+1]=240;im.data[k+2]=200;im.data[k+3]=Math.round(255*a);}
      bg.putImageData(im,0,0);const bt=new THREE.CanvasTexture(bc),bm=new THREE.MeshBasicMaterial({map:bt,color:0x3a3524,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
      for(const s2 of[1,-1])for(const flat2 of[0,1]){const geo=new THREE.PlaneGeometry(40,5);geo.translate(20,0,0);const b=new THREE.Mesh(geo,bm);b.rotation.y=s2>0?0:Math.PI;if(flat2)b.rotation.x=Math.PI/2;isleBeam.add(b);}}
    root=scene;place({type:'tree',x:I.x-4.5,z:I.z+1.5,s:.9},null);place({type:'tree',x:I.x+3,z:I.z-4.5,s:1.1},null);root=pr;}
  {const P=WORLD.pier,cx=(P.x0+P.x1)/2,pg=new THREE.Group(),pv=cur;scene.add(pg);cur=pg;                // the pier: planks on posts
    for(let z=P.z0+.3;z<P.z1+.6;z+=.62)box(P.x1-P.x0,.07,.56,M.walnut,cx,.05,z);
    for(let z=P.z0+.5;z<P.z1;z+=3){cyl(.11,.11,1.5,M.bark,P.x0+.12,-.5,z,8);cyl(.11,.11,1.5,M.bark,P.x1-.12,-.5,z,8);}
    [P.x0+.1,P.x1-.1].forEach(x=>{cyl(.09,.09,.9,M.bark,x,.5,P.z0+.15,8);});box(P.x1-P.x0,.08,.1,M.bark,cx,.9,P.z0+.15);cur=pv;weldStatic(pg);}
  // the side street: runs south from the main street
  const SZ=S.z1,SL=130;flat(JX1-JX0,SL,M.asphalt,(JX0+JX1)/2,-.02,SZ+SL/2,4);
  flat(JX1-JX0,S.walk+.3,M.asphalt,(JX0+JX1)/2,-.006,SZ+S.walk/2,4);                               // the mouth of the junction, over the sidewalk
  flat(S.walk,SL-S.walk,M.concrete,JX0-S.walk/2,-.012,SZ+S.walk+(SL-S.walk)/2,1.5);flat(S.walk,SL-S.walk,M.concrete,JX1+S.walk/2,-.012,SZ+S.walk+(SL-S.walk)/2,1.5);
  for(let z=SZ+5;z<SZ+SL;z+=4)flat(.14,1.7,M.paint,(JX0+JX1)/2,-.004,z);
  flat(3,.3,M.paint,JX1-1.75,-.004,SZ+2.3);flat(.3,3,M.paint,JX0-2.3,-.008,S.z1-1.75);flat(.3,3,M.paint,JX1+2.3,-.008,S.z0+1.75);   // stop lines
  const outG=new THREE.Group();scene.add(outG);root=outG;WORLD.outdoor.forEach(it=>place(it,null));root=scene;weldStatic(outG);   // trees, lamps, benches, big buildings: welded too
})();
// three real lights that jump to whichever street lamps are nearest to you, so the street can have any number of lamps
const streetGlow=[0,1,2].map(()=>{const l=new THREE.PointLight(0xffc88a,0,15,2);scene.add(l);return l;});
function updateStreetLamps(){
  const k=Math.max(0,Math.min(1,(dark-.25)/.5));
  const near=marks.streetLamp.map(m=>[Math.hypot(m.x-pos.x,m.z-pos.z),m]).sort((a,b)=>a[0]-b[0]);
  for(const m of marks.streetLamp)m.mat.color.setRGB(.07+k*5,.07+k*3.6,.07+k*2);
  streetGlow.forEach((l,i)=>{const m=near[i]&&near[i][1];if(m){l.position.set(m.x,m.y-.15,m.z);l.intensity=k*1.1;}else l.intensity=0;});
}

/* ---------- the sea moves: ripples drift across it and a line of foam washes up and down the sand ---------- */
const seaFx=(function(){const N=128,c=cv(N,N),g=c.getContext('2d'),img=g.createImageData(N,N),h=(x,y)=>{const u=x/N*6.2832,v=y/N*6.2832;return Math.sin(u*3+v*2)*.5+Math.sin(u*5-v*4+1.3)*.3+Math.sin(u*9+v*7+.6)*.2+Math.sin(u*2-v*11+2.1)*.15;};
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=h(x+1,y)-h(x-1,y),dy=h(x,y+1)-h(x,y-1),i=(y*N+x)*4;img.data[i]=128-dx*260;img.data[i+1]=128-dy*260;img.data[i+2]=255;img.data[i+3]=255;}
  g.putImageData(img,0,0);const nm=new THREE.CanvasTexture(c);nm.wrapS=nm.wrapT=THREE.RepeatWrapping;nm.repeat.set(210,93);M.water.normalMap=nm;M.water.normalScale=new THREE.Vector2(.32,.32);M.water.needsUpdate=true;
  const fc=cv(256,64),fg=fc.getContext('2d');for(let x=0;x<256;x++){const e=30+Math.sin(x/256*6.2832*3)*7+Math.sin(x/256*6.2832*7+1)*4;const gr=fg.createLinearGradient(0,0,0,64);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(Math.max(.05,(e-16)/64),'rgba(255,255,255,.25)');gr.addColorStop(e/64,'rgba(255,255,255,.95)');gr.addColorStop(Math.min(1,(e+5)/64),'rgba(255,255,255,0)');fg.fillStyle=gr;fg.fillRect(x,0,1,64);}
  const ft=new THREE.CanvasTexture(fc);ft.wrapS=THREE.RepeatWrapping;ft.repeat.set(60,1);
  const foam=new THREE.Mesh(new THREE.PlaneGeometry(400,2.2),new THREE.MeshBasicMaterial({map:ft,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}));
  foam.rotation.x=-Math.PI/2;foam.position.set(0,-.004,WORLD.shore);foam.renderOrder=1;scene.add(foam);return{nm,foam,ft};})();
function seaStep(dt,t){seaFx.nm.offset.x+=dt*.035;seaFx.nm.offset.y+=dt*.022;const w=Math.sin(t*.7);seaFx.foam.position.z=WORLD.shore+.55+w*.45;seaFx.foam.material.opacity=.55+.4*Math.sin(t*.7+1.2);seaFx.ft.offset.x=Math.sin(t*.23)*.02;}

/* ---------- the small things that make ground look like ground ---------- */
let groundFx=null;
// Tufts of grass and little flowers on the lawns (drawn in two batches, however many there are), a kerb line, manhole covers, drain grates and a few stains on the road.
(function(){
  const S=WORLD.street,SD=WORLD.side;let seed=12345;const rr=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},r2=(a,b)=>a+(b-a)*rr();
  const onLawn=(x,z)=>{
    if(z>S.z0-S.walk-.3&&z<S.z1+S.walk+.3)return false;                                    // road and sidewalks
    if(z>S.z1&&x>SD.x0-S.walk-.3&&x<SD.x1+S.walk+.3)return false;                         // the side street
    if(z<-5.6||!inWorld(x,z,.6)||roomAt(x,z))return false;                                 // sand, the edge of the map, indoors
    for(const H of houses){const f=H.front;if(!f)continue;                                 // the paved path from each front door
      if(Math.abs(f.dz)>.5){if(Math.abs(x-f.x)<.85&&(z-f.z)*f.dz>-.3&&Math.abs(z-f.z)<4)return false;}else if(Math.abs(z-f.z)<.85&&(x-f.x)*f.dx>-.3&&Math.abs(x-f.x)<7)return false;}
    for(const c of colliders)if(x>c[0]-.25&&x<c[1]+.25&&z>c[2]-.25&&z<c[3]+.25)return false;
    for(const o of WORLD.outdoor)if((o.type==='blanket'&&Math.hypot(x-o.x,z-o.z)<1.7)||(o.type==='spot'&&o.x!=null&&Math.hypot(x-o.x,z-o.z)<.5))return false;   // picnic blankets and the places people stand
    for(const b of[[16.6,22.6],[26.3,19.9],[17.5,17.5]])if(Math.hypot(x-b[0],z-b[1])<1)return false;                                              // the flower beds
    return true;};
  // one tuft = five thin blades fanned out
  const P=[],N=[];for(let k=0;k<5;k++){const a=k*1.26,h=.07+.07*((k*7)%5)/5,w=.02,lean=.05,cx=Math.cos(a),cz=Math.sin(a);
    P.push(-cz*w,0,cx*w, cz*w,0,-cx*w, cx*lean,h,cz*lean);for(let q=0;q<3;q++)N.push(0,1,0);}
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));tg.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(N),3));
  const pts=[],fl=[];for(let i=0;i<22000&&pts.length<6500;i++){const east=rr()<.22,x=east?r2(40.5,67):r2(-38,45),z=east?r2(15.2,74):(rr()<.5?r2(-5.5,3.8):r2(15.2,26));if(onLawn(x,z)){pts.push([x,z]);if(rr()<.05)fl.push([x+r2(-.2,.2),z+r2(-.2,.2)]);}}
  const tufts=new THREE.InstancedMesh(tg,new THREE.MeshStandardMaterial({roughness:1,side:THREE.DoubleSide}),pts.length),d=new THREE.Object3D(),col=new THREE.Color();
  pts.forEach((q,i)=>{d.position.set(q[0],-.03,q[1]);d.rotation.y=rr()*6.28;const s=r2(.8,1.5);d.scale.set(s,s*r2(.8,1.5),s);d.updateMatrix();tufts.setMatrixAt(i,d.matrix);col.setHSL(r2(.25,.32),r2(.42,.6),r2(.42,.58));tufts.setColorAt(i,col);});
  tufts.receiveShadow=true;tufts.frustumCulled=false;scene.add(tufts);
  const fg=new THREE.SphereGeometry(.035,6,4),flowers=new THREE.InstancedMesh(fg,new THREE.MeshStandardMaterial({roughness:.7}),fl.length),FC=[0xffffff,0xffe066,0xff9ec4,0xb7a3ff];
  fl.forEach((q,i)=>{d.position.set(q[0],r2(.06,.12),q[1]);d.rotation.set(0,0,0);d.scale.set(1,.6,1);d.updateMatrix();flowers.setMatrixAt(i,d.matrix);col.setHex(FC[Math.floor(rr()*4)]);flowers.setColorAt(i,col);});
  flowers.frustumCulled=false;scene.add(flowers);groundFx={tufts,flowers,nT:pts.length,nF:fl.length};
  // the road: a kerb line each side, manhole covers, drain grates, darker patches where it was mended
  const prev=cur;cur=scene;
  const kerb=new THREE.MeshStandardMaterial({color:0x8d8a84,roughness:.9,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
  flat(400,.16,kerb,0,-.006,S.z0-.08);flat(SD.x0+200,.16,kerb,(SD.x0-200)/2,-.006,S.z1+.08);flat(200-SD.x1,.16,kerb,(SD.x1+200)/2,-.006,S.z1+.08);
  const cover=cardMat(1,1,(g,W,H)=>{g.fillStyle='#3a3c40';g.beginPath();g.arc(W/2,H/2,W/2-2,0,7);g.fill();g.strokeStyle='#23252a';g.lineWidth=7;g.beginPath();g.arc(W/2,H/2,W/2-12,0,7);g.stroke();g.lineWidth=5;
    for(let k=-3;k<=3;k++){g.beginPath();g.moveTo(W/2+k*26,34);g.lineTo(W/2+k*26,H-34);g.stroke();g.beginPath();g.moveTo(34,H/2+k*26);g.lineTo(W-34,H/2+k*26);g.stroke();}},{px:128});
  cover.alphaTest=.5;cover.polygonOffset=true;cover.polygonOffsetFactor=-5;cover.polygonOffsetUnits=-5;cover.roughness=.6;cover.metalness=.5;
  [[-28,8],[-9,11],[12,7.8],[31,11.2],[52.5,24],[52.5,47]].forEach(q=>flat(.75,.75,cover,q[0],-.004,q[1]));
  const grate=cardMat(.6,.36,(g,W,H)=>{g.fillStyle='#2b2d31';g.fillRect(0,0,W,H);g.fillStyle='#0c0c0e';for(let k=0;k<7;k++)g.fillRect(14+k*34,10,16,H-20);},{px:256});grate.polygonOffset=true;grate.polygonOffsetFactor=-5;grate.polygonOffsetUnits=-5;
  for(let x=-34;x<=40;x+=18.5){flat(.6,.36,grate,x,-.004,S.z0+.36);flat(.6,.36,grate,x+7,-.004,S.z1-.36);}
  const patch=new THREE.MeshStandardMaterial({color:0x2a2a2e,roughness:.95,transparent:true,opacity:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
  [[-22,8.2,3.2,1.4],[-3,11.3,2.2,1.8],[16.5,8.8,4.5,1.1],[35,10.6,2.6,2.2],[52.4,34,2,3.6]].forEach(q=>flat(q[2],q[3],patch,q[0],-.005,q[1]));
  cur=prev;
})();
