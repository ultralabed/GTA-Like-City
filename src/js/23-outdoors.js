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
    cur=pv;weldStatic(ig);colliders.push([I.x-1.5,I.x+1.5,I.z-1.5,I.z+1.5],[I.x+2.6,I.x+4.2,I.z+3,I.z+3.45]);
    isleLamp=new THREE.Mesh(new THREE.SphereGeometry(.42,12,10),new THREE.MeshBasicMaterial({color:0x554a30}));isleLamp.position.set(I.x,8.7,I.z);scene.add(isleLamp);
    isleBeam=new THREE.Group();isleBeam.position.copy(isleLamp.position);scene.add(isleBeam);
    for(const s2 of[1,-1]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.2,1.5,44,12,1,true),new THREE.MeshBasicMaterial({color:0x2a2616,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
      b.rotation.z=s2*Math.PI/2;b.position.x=-s2*22;isleBeam.add(b);}
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
