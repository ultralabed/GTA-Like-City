/* ---------- people who live here ---------- */
const NR=.2,GC=.1,GW=Math.round(2*RW/GC),GH=Math.round(2*RD/GC),grid=new Uint8Array(GW*GH);
function nBlocked(x,z){if(x<-RW+NR||x>RW-NR||z<-RD+NR||z>RD-NR)return true;
  for(const c of colliders)if(x>c[0]-NR&&x<c[1]+NR&&z>c[2]-NR&&z<c[3]+NR)return true;return false;}
for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)grid[j*GW+i]=nBlocked(-RW+(i+.5)*GC,-RD+(j+.5)*GC)?1:0;
const cellX=x=>Math.max(0,Math.min(GW-1,Math.floor((x+RW)/GC))),cellZ=z=>Math.max(0,Math.min(GH-1,Math.floor((z+RD)/GC)));
function nearestFree(i,j){if(!grid[j*GW+i])return j*GW+i;
  for(let r=1;r<14;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;
    const a=i+di,b=j+dj;if(a<0||b<0||a>=GW||b>=GH)continue;if(!grid[b*GW+a])return b*GW+a;}
  return -1;}
function lineFree(x0,z0,x1,z1){const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/.05);
  for(let k=1;k<n;k++){const u=k/n;if(nBlocked(x0+(x1-x0)*u,z0+(z1-z0)*u))return false;}return true;}
function findPath(x0,z0,x1,z1){                         // A* over a 10 cm grid, then straighten the corners
  const si=nearestFree(cellX(x0),cellZ(z0)),ei=nearestFree(cellX(x1),cellZ(z1));if(si<0||ei<0)return null;
  const N=GW*GH,gs=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N),open=[si],ex=ei%GW,ez=ei/GW|0;
  gs[si]=0;
  while(open.length){let bi=0,bf=1e9;for(let k=0;k<open.length;k++){const c=open[k],a=Math.abs(c%GW-ex),b=Math.abs((c/GW|0)-ez),f=gs[c]+Math.max(a,b)+.41*Math.min(a,b);if(f<bf){bf=f;bi=k;}}
    const cur=open[bi];open[bi]=open[open.length-1];open.pop();if(cur===ei)break;if(closed[cur])continue;closed[cur]=1;
    const ci=cur%GW,cj=cur/GW|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;
      const n=nj*GW+ni;if(grid[n]||closed[n])continue;if(di&&dj&&(grid[cj*GW+ni]||grid[nj*GW+ci]))continue;
      const ng=gs[cur]+(di&&dj?1.414:1);if(ng<gs[n]){gs[n]=ng;from[n]=cur;open.push(n);}}}
  if(ei!==si&&from[ei]<0)return null;
  const pts=[nBlocked(x1,z1)?[-RW+(ex+.5)*GC,-RD+(ez+.5)*GC]:[x1,z1]];
  for(let c=ei;c!==si&&c>=0;c=from[c])pts.push([-RW+(c%GW+.5)*GC,-RD+((c/GW|0)+.5)*GC]);pts.reverse();
  const out=[];let cx=x0,cz=z0,i=0;
  while(i<pts.length){let k=pts.length-1;while(k>i&&!lineFree(cx,cz,pts[k][0],pts[k][1]))k--;out.push(pts[k]);cx=pts[k][0];cz=pts[k][1];i=k+1;}
  return out;
}
const JK=['sx','sz','nx','ny','alx','alz','arx','arz','elx','erx','hlx','hrx','klx','krx','yo'];
function makePerson(o){
  const s=o.h/1.75,root=new THREE.Group(),body=new THREE.Group();body.scale.setScalar(s);root.add(body);dyn.add(root);
  const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.85});
  const skin=mat(o.skin),top=mat(o.top),bot=mat(o.bottom),shoe=mat(o.shoe),hair=mat(o.hair),eye=mat(0x1a1210);
  const mk=(geo,m,par,x,y,z)=>{const me=new THREE.Mesh(geo,m);me.position.set(x,y,z);me.castShadow=true;me.receiveShadow=true;par.add(me);return me;};
  const jt=(par,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);par.add(g);return g;};
  const cap=(r,l)=>new THREE.CapsuleGeometry(r,l,4,12),sph=r=>new THREE.SphereGeometry(r,18,12),J={};
  mk(sph(.13),bot,body,0,0,0).scale.set(1.25,.8,.9);
  J.spine=jt(body,0,0,0);mk(cap(.125,.26),top,J.spine,0,.27,0).scale.set(1.15,1,.8);
  J.neck=jt(J.spine,0,.52,0);mk(new THREE.CylinderGeometry(.045,.05,.09,12),skin,J.neck,0,.03,0);
  const head=jt(J.neck,0,.07,0);mk(sph(.105),skin,head,0,.1,0).scale.set(.95,1.1,1);
  const hc=mk(new THREE.SphereGeometry(.113,18,10,0,Math.PI*2,0,1.35),hair,head,0,.115,-.012);hc.rotation.x=-.42;hc.scale.set(.97,1.1,1.02);
  if(o.long){mk(sph(1),hair,head,0,.02,-.07).scale.set(.105,.19,.065);mk(sph(.05),hair,head,0,.2,-.07);}
  [-1,1].forEach(k=>{mk(sph(.012),eye,head,k*.038,.11,.096);});
  mk(sph(.014),skin,head,0,.085,.105);
  ['l','r'].forEach((n,i)=>{const k=i?-1:1;
    const sh=J['a'+n]=jt(J.spine,k*.19,.46,0);mk(cap(.045,.2),top,sh,0,-.14,0);
    const el=J['e'+n]=jt(sh,0,-.28,0);mk(cap(.038,.19),skin,el,0,-.133,0);mk(sph(.045),skin,el,0,-.28,0);
    const hip=J['h'+n]=jt(body,k*.09,-.04,0);mk(cap(.07,.3),bot,hip,0,-.22,0);
    const kn=J['k'+n]=jt(hip,0,-.44,0);mk(cap(.055,.3),o.shorts?skin:bot,kn,0,-.205,0);mk(new THREE.BoxGeometry(.09,.06,.24),shoe,kn,0,-.41,.06);});
  const book=mk(new THREE.BoxGeometry(.2,.03,.15),mat(o.top===0x1f6a6e?0xb5533a:0x1f5a5e),J.el,-.1,-.29,.02);book.rotation.x=.4;book.visible=false;
  const hit=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,1.75,8),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=-.02;body.add(hit);
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;$('tags').appendChild(tag);
  const n={o,root,J,head,book,tag,stand:.92*s,pos:new THREE.Vector3(),y:.92*s,yaw:0,vx:0,vz:0,path:[],act:null,phase:'at',from:null,
    hidden:false,lie:false,sit:false,ph:0,wait:0,kickCd:0,repath:0,settle:9,cur:{},tagText:'',
    need:{energy:.6,fun:.3,fit:.5,calm:.55,care:.6},cool:{},mood:.75,goal:null,resume:null,want:null,react:null,calmAt:0,
    poked:0,pokeAt:-99,hits:0,hitAt:-99,tvOffs:0,tvOffAt:-99,said:false};
  JK.forEach(k=>n.cur[k]=0);
  hit.userData={npc:n,tip:'點一下：跟'+o.name+'打招呼',act:()=>notify(n,'greet')};interact.push(hit);
  return n;
}
const up3=new THREE.Vector3(0,1,0);
const people=ROOM.people.map(makePerson);
