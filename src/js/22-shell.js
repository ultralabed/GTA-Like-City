/* ---------- build the houses from their data ---------- */
function hmat(H,name){return(H&&H.mats[name])||M[name];}
// One wall, built in its own frame: u runs along the wall, the inside of the room is toward +z, the wall itself sits at z < 0.
// Holes (windows, doors) are cut by building the wall in pieces around them.
// --- pitched roofs: every room of a house gets its own tiled gable, so a house with a wing has a roof with a wing ---
const tileMap=(function(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#d8d8d8';g.fillRect(0,0,128,128);
  for(let r=0;r<4;r++){g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,r*32,128,3);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(0,r*32+3,128,3);
    for(let k=0;k<4;k++){g.fillStyle='rgba(0,0,0,.2)';g.fillRect(k*32+(r%2)*16,r*32,2,32);g.fillStyle='rgba(0,0,0,'+(.03+.08*Math.random())+')';g.fillRect(k*32+(r%2)*16,r*32,32,32);}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if('colorSpace' in t)t.colorSpace='srgb';else t.encoding=THREE.sRGBEncoding;return t;})();
const porchMat=new THREE.MeshBasicMaterial({color:0xffe9b8}),brickMat=new THREE.MeshStandardMaterial({color:0x9a5a48,roughness:.9});
function gableRoof(H,fx,fz,fw,fd,chimney){const alongX=fw>=fd,L=(alongX?fw:fd)+.8,s=(alongX?fd:fw)/2+.4,h=s*.56,y0=RH+WALL_T+.14,sl=Math.hypot(s,h);
  const mk=(P,N,U,mat)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(N),3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(U),2));
    const m=new THREE.Mesh(g,mat);m.position.set(fx,y0,fz);if(!alongX)m.rotation.y=Math.PI/2;m.castShadow=true;m.receiveShadow=true;cur.add(m);};
  const P=[],N=[],U=[],quad=(a,b,c,d,n,uv)=>{[a,b,c,a,c,d].forEach((v,i)=>{P.push(v[0],v[1],v[2]);N.push(n[0],n[1],n[2]);const q=uv[[0,1,2,0,2,3][i]];U.push(q[0],q[1]);});};
  const uu=L/1.3,vv=sl/1.3;
  quad([-L/2,0,-s],[-L/2,h,0],[L/2,h,0],[L/2,0,-s],[0,s/sl,-h/sl],[[0,0],[0,vv],[uu,vv],[uu,0]]);          // the two tiled slopes
  quad([L/2,0,s],[L/2,h,0],[-L/2,h,0],[-L/2,0,s],[0,s/sl,h/sl],[[0,0],[0,vv],[uu,vv],[uu,0]]);
  quad([-L/2,-.02,-s],[L/2,-.02,-s],[L/2,-.02,s],[-L/2,-.02,s],[0,-1,0],[[0,0],[uu,0],[uu,1],[0,1]]);     // the underside you see from the street
  mk(P,N,U,H.mats.roof);
  const P2=[],N2=[],U2=[];for(const k of[-1,1]){const x=k*(L/2-.4),t=[[x,0,-s],[x,0,s],[x,h,0]];if(k>0)t.reverse();t.forEach(v=>{P2.push(v[0],v[1],v[2]);N2.push(k,0,0);U2.push(v[2],v[1]);});}
  mk(P2,N2,U2,H.mats.ext);                                                                               // the triangular wall under each end of the roof
  const bb=(w,hh,d,mat,x,y,z)=>{const m=box(alongX?w:d,hh,alongX?d:w,mat,fx+(alongX?x:z),y0+y,fz+(alongX?z:-x));return m;};
  bb(L,.12,.05,M.trim,0,-.03,-s);bb(L,.12,.05,M.trim,0,-.03,s);bb(L+.02,.07,.16,H.mats.roof,0,h+.01,0);   // boards along the eaves, and the ridge
  if(chimney){bb(.5,h*.9+.5,.45,brickMat,-L*.28,(h*.9+.5)/2+.1,-s*.35);bb(.6,.07,.55,M.black,-L*.28,h*.9+.62,-s*.35);}}
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
      if(!def.inner){box(2*WX+.22,.06,.12,M.trim,o.u,y0-.03,-T-.05);box(2*WX+.2,.09,.05,M.trim,o.u,y1+.045,-T-.03);[-1,1].forEach(k=>box(.08,y1-y0,.05,M.trim,o.u+k*(WX+.04),ym,-T-.03));}   // outside: a ledge, a lintel and side trim
      [-WX+.03,-WX/3,WX/3,WX-.03].forEach(x=>box(.05,y1-y0,.06,M.black,o.u+x,ym,-T/2));        // mullions
      [y0+.03,y1-.03].forEach(y=>box(2*WX,.05,.06,M.black,o.u,y,-T/2));
      box(2*WX,y1-y0,.012,M.glass,o.u,ym,-T/2,{shadow:false}).receiveShadow=false;
      const s=F.span(a,b,-T/2-.01,-T/2+.01);pboxes.push([s[0],s[1],y0,y1,s[2],s[3]]);         // balls bounce off the glass
      [-1,1].forEach(k=>{for(let i=0;i<5;i++)box(.1,y1+.05,.07,M.linen,o.u+k*(WX+.08+i*.085),(y1+.15)/2,.1+(i%2)*.035,{r:.03});});   // curtains
      box(2*WX+1.1,.03,.03,M.brass,o.u,y1+.1,.1);
    }else{                                                                                    // door: a wooden frame, and a leaf on hinges
      [a-.03,b+.03].forEach(x=>box(.06,y1+.06,T+.1,M.walnut,x,(y1+.06)/2,-T/2));
      box(b-a+.12,.06,T+.1,M.walnut,o.u,y1+.03,-T/2);
      const w=b-a-.02,hinge=new THREE.Group();hinge.userData.dyn=true;hinge.position.set(b-.01,0,-T/2);cur.add(hinge);   // hinges on the +u side; it swings away from this room
      const pv=cur;cur=hinge;
      const leaf=box(w,y1-.02,.04,o.front?hmat(H,'doorLeaf'):M.trim,-w/2,(y1-.02)/2+.01,0,{r:.008});
      [-1,1].forEach(k=>{box(.13,.022,.022,M.brass,-w+.11,1.0,k*.05);box(.022,.022,.05,M.brass,-w+.055,1.0,k*.035);});   // handles
      cur=pv;
      const shut=F.span(a,b,-T,0),open=F.span(b-.05,b,-T/2-w,-T/2),mid=F.pt(o.u,-T/2);
      const D={hinge,t:0,open:false,user:false,shut,openC:open,x:mid[0],z:mid[1],y1,pb:[shut[0],shut[1],0,y1,shut[2],shut[3]]};
      pboxes.push(D.pb);doors.push(D);
      const sale=o.front&&H.lot.forSale;leaf.userData={get tip(){return sale&&!homeOwned?'點一下：這間房子在賣（$500），買了就是你的家':'點一下：開門或關門';},act:()=>{if(sale&&!homeOwned){buyHome(H);return;}D.user=D.t<.5;}};interact.push(leaf);
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
    roof:new THREE.MeshStandardMaterial({color:new THREE.Color(L.roof).multiplyScalar(1.5),map:tileMap,roughness:.8,side:THREE.DoubleSide}),doorLeaf:new THREE.MeshStandardMaterial({color:L.door,roughness:.45})};
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
    if(L.tpl!=='shop')gableRoof(H,fx,fz,fw,fd,R.id==='living');
    root=H.inner;cur=H.inner;
    R.furniture.forEach(it=>place(it,R));
  });
  if(H.front){root=H.shell;cur=H.shell;const f=H.front,shop=L.tpl==='shop',wd=shop?3.4:1.5,along=Math.abs(f.dx)>.5;           // by the front door: a canopy, a step and a lamp
    const bx2=(a,h,b,mat,off,y,side)=>box(along?b:a,h,along?a:b,mat,f.x+f.dx*off+(along?0:side||0),y,f.z+f.dz*off+(along?side||0:0));
    bx2(wd,.07,.85,shop?H.mats.accent:H.mats.roof,.42,2.34,0);[-1,1].forEach(k=>bx2(.05,.05,.8,M.black,.4,2.28,k*(wd/2-.08)));
    if(shop){const c=document.createElement('canvas');c.width=512;c.height=96;const g2=c.getContext('2d');g2.fillStyle='#'+new THREE.Color(L.accent).getHexString();g2.fillRect(0,0,512,96);g2.strokeStyle='#f6e7c8';g2.lineWidth=5;g2.strokeRect(7,7,498,82);
      g2.fillStyle='#fff3d6';g2.font='bold 58px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';g2.textAlign='center';g2.textBaseline='middle';g2.fillText('夕 陽 商 店',256,50);
      const t=new THREE.CanvasTexture(c);if('colorSpace' in t)t.colorSpace='srgb';else t.encoding=THREE.sRGBEncoding;
      const sg=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.68),new THREE.MeshStandardMaterial({map:t,roughness:.6}));const R0=H.rooms[0];
      sg.position.set(along?f.x+f.dx*.07:R0.cx,2.95,along?R0.cz:f.z+f.dz*.07);sg.rotation.y=Math.atan2(f.dx,f.dz);sg.userData.dyn=true;cur.add(sg);}
    bx2(1.3,.07,.55,M.concrete,.28,.035,0);bx2(.12,.2,.1,porchMat,.06,1.95,-.72);bx2(.16,.03,.14,M.black,.07,2.065,-.72);}
});
bH=null;dev=null;root=scene;cur=scene;
for(const H of houses){weldStatic(H.shell);weldStatic(H.inner);}

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
