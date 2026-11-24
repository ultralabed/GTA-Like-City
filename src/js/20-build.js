/* ---------- builders ---------- */
// Lists the rest of the game reads. Furniture fills them in when it is placed.
const colliders=[];          // floor areas you cannot walk through   [x0,x1,z0,z1]
const pboxes=[];             // shapes balls bounce off               [x0,x1,y0,y1,z0,z1]
const interact=[];           // things you can click
const ACT={};                // places a person can do something, by name (tv1, tv2, sleep1, read1 ...)
const dev={lamps:[],tvs:[],neons:[]};   // things the switches control
let cur=scene;               // where new meshes go: the scene, or the piece of furniture being built
function scaleUV(g,w,h,d){const uv=g.attributes.uv,dm=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let i=0;i<uv.count;i++){const f=dm[Math.floor(i/4)];uv.setXY(i,uv.getX(i)*f[0],uv.getY(i)*f[1]);}}
function add(m,shadow){m.castShadow=shadow!==false;m.receiveShadow=true;cur.add(m);return m;}
function box(w,h,d,mat,x,y,z,o){o=o||{};
  let g;if(o.r&&THREE.RoundedBoxGeometry)g=new THREE.RoundedBoxGeometry(w,h,d,4,o.r);else{g=new THREE.BoxGeometry(w,h,d);scaleUV(g,w,h,d);}
  const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);if(o.ry)m.rotation.y=o.ry;if(o.rz)m.rotation.z=o.rz;return add(m,o.shadow);}
function cyl(rt,rb,h,mat,x,y,z,seg,open){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||28,1,!!open),mat);m.position.set(x,y,z);return add(m);}

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
  g.position.set(ox,0,oz);g.rotation.y=rot;scene.add(g);
  const pt=(x,z)=>[ox+x*c+z*s,oz-x*s+z*c];
  const span=(x0,x1,z0,z1)=>{const a=pt(x0,z0),b=pt(x1,z1);return[Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1])];};
  return{g,pt,span};
}
function place(item,R){
  const rot=(item.rot||0)*Math.PI/2,F=makeFrame((R?R.cx:0)+(item.x||0),(R?R.cz:0)+(item.z||0),rot),g=F.g,pt=F.pt,span=F.span;
  const prev=cur;cur=g;const d=PREFAB[item.type](item)||{};cur=prev;
  (d.solid||[]).forEach(q=>colliders.push(span(q[0],q[1],q[2],q[3])));
  (d.boxes||[]).forEach(q=>{const r=span(q[0],q[1],q[4],q[5]);pboxes.push([r[0],r[1],q[2],q[3],r[2],r[3]]);});
  const id=++furnSeq;
  (d.spots||[]).forEach(sp=>{const n=spotCount[sp.type]=(spotCount[sp.type]||0)+1,o=Object.assign({},sp,{owner:id,room:R?R.id:null});
    o.ap=pt(sp.ap[0],sp.ap[1]);
    if(sp.an){const a=pt(sp.an[0],sp.an[2]);o.an=[a[0],sp.an[1],a[1]];}
    if(sp.yaw!=null)o.yaw=sp.yaw+rot;
    if(sp.lie)o.q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rot).multiply(lieQ);
    ACT[sp.type+n]=o;});
  return g;
}
