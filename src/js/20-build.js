/* ---------- builders ---------- */
// Lists the rest of the game reads. Furniture fills them in when it is placed.
const colliders=[];          // floor areas you cannot walk through   [x0,x1,z0,z1]
const pboxes=[];             // shapes balls bounce off               [x0,x1,y0,y1,z0,z1]
const interact=[];           // things you can click
const ACT={};                // places a person can do something, by name (tv1, tv2, sleep1, read1 ...)
let dev=null;                // the lamps, TVs and neon signs of the house being built
let bH=null;                 // the house being built (null while building the street)
const decorG={};
let root=scene;              // where new furniture groups go
const marks={streetLamp:[],item:[],hoop:[]}; // special points furniture reports back, by kind
const doors=[];              // doors that swing: each knows where it blocks when shut and when open
let cur=scene;               // where new meshes go: the scene, or the piece of furniture being built
function scaleUV(g,w,h,d){const uv=g.attributes.uv,dm=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let i=0;i<uv.count;i++){const f=dm[Math.floor(i/4)];uv.setXY(i,uv.getX(i)*f[0],uv.getY(i)*f[1]);}}
function add(m,shadow){m.castShadow=shadow!==false;m.receiveShadow=true;cur.add(m);return m;}
function box(w,h,d,mat,x,y,z,o){o=o||{};
  let g;if(o.r&&THREE.RoundedBoxGeometry)g=new THREE.RoundedBoxGeometry(w,h,d,o.r<.06?1:2,o.r);else{g=new THREE.BoxGeometry(w,h,d);scaleUV(g,w,h,d);}
  const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);if(o.ry)m.rotation.y=o.ry;if(o.rz)m.rotation.z=o.rz;return add(m,o.shadow);}
// Many small boxes drawn as ONE thing (books on a shelf, goods on a rack). Each entry: [w,h,d, x,y,z, colour, lean].
// Drawing a hundred separate books costs a hundred times more than drawing them as one batch.
const unitBox=new THREE.BoxGeometry(1,1,1),batchMat=new THREE.MeshStandardMaterial({roughness:.7});
function boxBatch(list){const im=new THREE.InstancedMesh(unitBox,batchMat,list.length),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),sc=new THREE.Vector3(),col=new THREE.Color();
  list.forEach((b,i)=>{e.set(0,0,b[7]||0);q.setFromEuler(e);m4.compose(p.set(b[3],b[4],b[5]),q,sc.set(b[0],b[1],b[2]));im.setMatrixAt(i,m4);im.setColorAt(i,col.set(b[6]));});
  im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;cur.add(im);return im;}
// Weld everything in a group that never moves and shares a material into one piece per material.
// A house shell is about 110 separate boxes; after this it is about a dozen pieces, which is far quicker to draw.
// Left alone: anything you can click, anything inside a part marked dyn (door leaves, things you can pick up), and batches.
function weldStatic(group){
  group.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(group.matrixWorld).invert(),m4=new THREE.Matrix4(),by=new Map(),list=[];
  const moving=o=>{for(let p=o;p&&p!==group;p=p.parent)if(p.userData.dyn)return true;return false;};
  group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!o.userData.act&&o.visible&&o.material.visible!==false&&o.geometry.attributes.uv&&o.geometry.attributes.normal&&!moving(o))list.push(o);});
  for(const o of list){const k=o.material.uuid+(o.castShadow?'c':'')+(o.receiveShadow?'r':'');if(!by.has(k))by.set(k,[]);by.get(k).push(o);}
  for(const arr of by.values()){if(arr.length<2)continue;let n=0;
    const gs=arr.map(o=>{const q=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();q.applyMatrix4(m4.multiplyMatrices(inv,o.matrixWorld));n+=q.attributes.position.count;return q;});
    const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let at=0;
    for(const q of gs){const c=q.attributes.position.count;P.set(q.attributes.position.array,at*3);N.set(q.attributes.normal.array,at*3);U.set(q.attributes.uv.array,at*2);at+=c;q.dispose();}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));
    const me=new THREE.Mesh(geo,arr[0].material);me.castShadow=arr[0].castShadow;me.receiveShadow=arr[0].receiveShadow;group.add(me);
    for(const o of arr)o.parent.remove(o);}
}
// a flat sheet on the ground; tile = how many metres one copy of the texture covers
function flat(w,d,mat,x,y,z,tile){const g=new THREE.PlaneGeometry(w,d);
  if(tile){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/tile,uv.getY(i)*d/tile);}
  const m=new THREE.Mesh(g,mat);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;cur.add(m);return m;}
function cyl(rt,rb,h,mat,x,y,z,seg,open){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||16,1,!!open),mat);m.position.set(x,y,z);return add(m);}

// A prefab builds one piece of furniture around its own middle and returns a description of itself:
//   solid: [x0,x1,z0,z1]         where you cannot walk
//   boxes: [x0,x1,y0,y1,z0,z1]   what balls hit
//   spots: {type, ap:[x,z], an:[x,y,z], yaw, pose, label ...}   how a person uses it
// place() puts it in the room, turns it, and moves all of those numbers along with it.
const PREFAB={},spotCount={};let furnSeq=0;
const lieQ=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0)));   // lying on your back, head toward +z
// makeFrame(): a group sitting at (ox,oz), turned by rot, plus the maths to carry points and areas along with it
function makeFrame(ox,oz,rot){
  const g=new THREE.Group(),c=Math.round(Math.cos(rot)),s=Math.round(Math.sin(rot));
  g.position.set(ox,0,oz);g.rotation.y=rot;root.add(g);
  const pt=(x,z)=>[ox+x*c+z*s,oz-x*s+z*c];
  const span=(x0,x1,z0,z1)=>{const a=pt(x0,z0),b=pt(x1,z1);return[Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1])];};
  return{g,pt,span};
}
function place(item,R){
  const rot=(item.rot||0)*Math.PI/2,F=makeFrame((R?R.cx:0)+(item.x||0),(R?R.cz:0)+(item.z||0),rot),g=F.g,pt=F.pt,span=F.span;
  const prev=cur;cur=g;const d=PREFAB[item.type](item)||{};cur=prev;
  if(item.decor){g.userData.dyn=true;g.visible=false;decorG[item.decor]=g;}                // bought later: kept out of the welded mesh, hidden for now
  (d.solid||[]).forEach(q=>colliders.push(span(q[0],q[1],q[2],q[3])));
  (d.boxes||[]).forEach(q=>{const r=span(q[0],q[1],q[4],q[5]);pboxes.push([r[0],r[1],q[2],q[3],r[2],r[3]]);});
  const id=++furnSeq;
  (d.spots||[]).forEach(sp=>{const n=spotCount[sp.type]=(spotCount[sp.type]||0)+1,o=Object.assign({},sp,{owner:id,room:R?R.id:null,house:R?R.house.id:null});
    o.ap=pt(sp.ap[0],sp.ap[1]);
    if(sp.an){const a=pt(sp.an[0],sp.an[2]);o.an=[a[0],sp.an[1],a[1]];}
    if(sp.yaw!=null)o.yaw=sp.yaw+rot;
    if(sp.lie)o.q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rot).multiply(lieQ);
    ACT[sp.type+n]=o;});
  (d.marks||[]).forEach(m=>{const a=pt(m.x,m.z);marks[m.kind].push(Object.assign({},m,{x:a[0],z:a[1]}));});
  return g;
}
