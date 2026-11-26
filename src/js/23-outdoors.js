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
