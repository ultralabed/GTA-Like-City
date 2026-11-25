/* ---------- build the houses from their data ---------- */
function hmat(H,name){return(H&&H.mats[name])||M[name];}
// One wall, built in its own frame: u runs along the wall, the inside of the room is toward +z, the wall itself sits at z < 0.
// Holes (windows, doors) are cut by building the wall in pieces around them.
function buildWall(R,side,def){
  const T=WALL_T,H=R.house,horiz=side==='north'||side==='south',L=horiz?R.w:R.d,W=R.walls;
  const rot={north:0,south:Math.PI,east:-Math.PI/2,west:Math.PI/2}[side],sign=(side==='north'||side==='east')?1:-1;
  const ox=R.cx+(side==='east'?R.w/2:side==='west'?-R.w/2:0),oz=R.cz+(side==='south'?R.d/2:side==='north'?-R.d/2:0);
  const F=makeFrame(ox,oz,rot),prev=cur;cur=F.g;
  // long walls cover the corners, but only where a side wall actually meets them
  const lo=side==='north'?'west':'east',hi=side==='north'?'east':'west';
  const u0=-L/2-(horiz&&W[lo]?T:0),u1=L/2+(horiz&&W[hi]?T:0),mat=hmat(H,def.mat),ext=hmat(H,'ext');
  const piece=(a,b,y0,y1)=>{if(b-a<.01||y1-y0<.01)return;
    box(b-a,y1-y0,T,mat,(a+b)/2,(y0+y1)/2,-T/2);
    if(!def.inner)box(b-a+(horiz?.06:0),y1-y0,.03,ext,(a+b)/2,(y0+y1)/2,-T-.015);              // outside skin in the house colour
    const s=F.span(a,b,-T,0);pboxes.push([s[0],s[1],y0,y1,s[2],s[3]]);
    if(y0<1){colliders.push(s);if(y0===0)box(b-a,.1,.02,M.trim,(a+b)/2,.05,.01);}};          // reaches the floor: you cannot walk through it
  if(!horiz&&!def.inner)[-1,1].forEach(k=>box(T+.03,RH,.03,ext,k*(L/2+(T+.03)/2),RH/2,-T-.015));   // skin around the corners
  const holes=(def.open||[]).map(o=>Object.assign({},o,{u:o.c*sign})).sort((a,b)=>a.u-b.u);
  let u=u0;
  for(const o of holes){const a=o.u-o.half,b=o.u+o.half,y0=o.y0||0,y1=o.y1;
    piece(u,a,0,RH);piece(a,b,0,y0);piece(a,b,y1,RH);u=b;
    if(o.kind==='window'){const WX=o.half,ym=(y0+y1)/2;
      box(2*WX+.1,.04,.3,M.trim,o.u,y0+.02,.02);                                              // sill
      [-WX+.03,-WX/3,WX/3,WX-.03].forEach(x=>box(.05,y1-y0,.06,M.black,o.u+x,ym,-T/2));        // mullions
      [y0+.03,y1-.03].forEach(y=>box(2*WX,.05,.06,M.black,o.u,y,-T/2));
      box(2*WX,y1-y0,.012,M.glass,o.u,ym,-T/2,{shadow:false}).receiveShadow=false;
      const s=F.span(a,b,-T/2-.01,-T/2+.01);pboxes.push([s[0],s[1],y0,y1,s[2],s[3]]);         // balls bounce off the glass
      [-1,1].forEach(k=>{for(let i=0;i<5;i++)box(.1,y1+.05,.07,M.linen,o.u+k*(WX+.08+i*.085),(y1+.15)/2,.1+(i%2)*.035,{r:.03});});   // curtains
      box(2*WX+1.1,.03,.03,M.brass,o.u,y1+.1,.1);
    }else{                                                                                    // door: a wooden frame, and a leaf on hinges
      [a-.03,b+.03].forEach(x=>box(.06,y1+.06,T+.1,M.walnut,x,(y1+.06)/2,-T/2));
      box(b-a+.12,.06,T+.1,M.walnut,o.u,y1+.03,-T/2);
      const w=b-a-.02,hinge=new THREE.Group();hinge.position.set(b-.01,0,-T/2);cur.add(hinge);   // hinges on the +u side; it swings away from this room
      const pv=cur;cur=hinge;
      const leaf=box(w,y1-.02,.04,o.front?hmat(H,'doorLeaf'):M.trim,-w/2,(y1-.02)/2+.01,0,{r:.008});
      [-1,1].forEach(k=>{box(.13,.022,.022,M.brass,-w+.11,1.0,k*.05);box(.022,.022,.05,M.brass,-w+.055,1.0,k*.035);});   // handles
      cur=pv;
      const shut=F.span(a,b,-T,0),open=F.span(b-.05,b,-T/2-w,-T/2),mid=F.pt(o.u,-T/2);
      const D={hinge,t:0,open:false,user:false,shut,openC:open,x:mid[0],z:mid[1],y1,pb:[shut[0],shut[1],0,y1,shut[2],shut[3]]};
      pboxes.push(D.pb);doors.push(D);
      leaf.userData={tip:'點一下：開門或關門',act:()=>{D.user=D.t<.5;}};interact.push(leaf);
      if(o.front){                                                                            // the front door: number plate, doorstep, and where the garden path starts
        const pl=new THREE.Mesh(new THREE.PlaneGeometry(.26,.26),new THREE.MeshBasicMaterial({map:plateTexture(H.no)}));
        pl.rotation.y=Math.PI;pl.position.set(a-.32,1.6,-T-.04);cur.add(pl);
        box(1.3,.05,.5,M.concrete,o.u,.025,-T-.25);
        const p0=F.pt(o.u,-T),p1=F.pt(o.u,-T-1);H.front={x:p0[0],z:p0[1],dx:p1[0]-p0[0],dz:p1[1]-p0[1]};
      }
    }}
  piece(u,u1,0,RH);
  cur=prev;
}
houses.forEach(H=>{
  const L=H.lot,T=WALL_T;
  H.mats={accent:M.accent.clone(),ext:new THREE.MeshStandardMaterial({color:L.ext,bumpMap:plaster,bumpScale:.004,roughness:.92}),
    roof:new THREE.MeshStandardMaterial({color:L.roof,roughness:.8}),doorLeaf:new THREE.MeshStandardMaterial({color:L.door,roughness:.45})};
  H.mats.accent.color.set(L.accent);
  H.shell=new THREE.Group();H.inner=new THREE.Group();scene.add(H.shell,H.inner);   // shell = floor, walls, roof; inner = furniture (hidden when far away)
  bH=H;dev=H.dev;
  H.rooms.forEach(R=>{
    root=H.shell;cur=H.shell;
    const W=R.walls,ex0=W.west?T:0,ex1=W.east?T:0,ez0=W.north?T:0,ez1=W.south?T:0;
    // floor and ceiling reach under this room's own walls, and stop where the neighbour's begin
    const fw=R.w+ex0+ex1,fd=R.d+ez0+ez1,fx=R.cx+(ex1-ex0)/2,fz=R.cz+(ez1-ez0)/2;
    box(fw,T,fd,M.floor,fx,-T/2,fz);
    box(fw,T,fd,M.ceil,fx,RH+T/2,fz);
    box(fw+.5,.14,fd+.5,H.mats.roof,fx,RH+T+.07,fz);                                // roof with a little overhang
    pboxes.push([fx-fw/2-.25,fx+fw/2+.25,RH,RH+T+.14,fz-fd/2-.25,fz+fd/2+.25]);    // balls bounce off the ceiling from inside and land on the roof from outside
    for(const side of['north','east','south','west'])if(W[side])buildWall(R,side,W[side]);
    root=H.inner;cur=H.inner;
    R.furniture.forEach(it=>place(it,R));
  });
});
bH=null;dev=null;root=scene;cur=scene;

// doors: you click them; people open them as they walk up and shut them behind themselves
function doorArea(d){return d.open?d.openC:d.shut;}
function updateDoors(dt){
  for(const d of doors){
    let walker=false,inWay=Math.hypot(pos.x-d.x,pos.z-d.z)<.85;                 // never shut a door on someone standing in it
    for(const n of people){if(n.hidden)continue;const dist=Math.hypot(n.pos.x-d.x,n.pos.z-d.z);
      if(dist<.85)inWay=true;if(dist<1.35&&n.phase==='go'&&n.path.length)walker=true;}
    const want=(d.user||walker||(inWay&&d.t>.5))?1:0;
    if(want===d.t)continue;
    d.t=Math.max(0,Math.min(1,d.t+Math.sign(want-d.t)*dt*2.6));
    const e=d.t*d.t*(3-2*d.t);d.hinge.rotation.y=-e*Math.PI/2;
    const nowOpen=d.t>.5;
    if(nowOpen!==d.open){d.open=nowOpen;sfxDoor(d.x,d.z);const c=doorArea(d);d.pb[0]=c[0];d.pb[1]=c[1];d.pb[4]=c[2];d.pb[5]=c[3];}   // balls hit the leaf where it is now
  }
}
