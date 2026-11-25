/* ---------- people who live here ---------- */
// Finding a way: the whole world is cut into 10 cm squares. Each square is either blocked or has a cost
// (sidewalks and floors are cheap, grass costs a bit more, the road costs a lot, so people keep off it unless they must cross).
const NR=.2,GC=.1,GW=Math.round((WB.x1-WB.x0)/GC),GH=Math.round((WB.z1-WB.z0)/GC),NC=GW*GH,grid=new Uint8Array(NC),cost=new Float32Array(NC);
function nBlocked(x,z){if(!inWorld(x,z,NR))return true;
  for(const d of doors){const c=d.openC;if(x>c[0]-NR&&x<c[1]+NR&&z>c[2]-NR&&z<c[3]+NR)return true;}   // people plan around where an open door will be
  for(const c of colliders)if(x>c[0]-NR&&x<c[1]+NR&&z>c[2]-NR&&z<c[3]+NR)return true;return false;}
(function(){const S=WORLD.street;
  for(const c of colliders.concat(doors.map(d=>d.openC))){                    // mark blocked squares box by box (much faster than asking every square)
    const i0=Math.max(0,Math.floor((c[0]-NR-WB.x0)/GC)),i1=Math.min(GW-1,Math.ceil((c[1]+NR-WB.x0)/GC)),j0=Math.max(0,Math.floor((c[2]-NR-WB.z0)/GC)),j1=Math.min(GH-1,Math.ceil((c[3]+NR-WB.z0)/GC));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=WB.x0+(i+.5)*GC,z=WB.z0+(j+.5)*GC;if(x>c[0]-NR&&x<c[1]+NR&&z>c[2]-NR&&z<c[3]+NR)grid[j*GW+i]=1;}}
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=WB.x0+(i+.5)*GC,z=WB.z0+(j+.5)*GC,k=j*GW+i;
    if(!inWorld(x,z,NR)){grid[k]=1;continue;}
    cost[k]=z>S.z0&&z<S.z1?(Math.abs(x-1.9)<3.2?1.3:5):(z>S.z0-S.walk&&z<S.z1+S.walk)||roomAt(x,z)?1:1.5;}   // the zebra crossing is the cheap way over
})();
const cellX=x=>Math.max(0,Math.min(GW-1,Math.floor((x-WB.x0)/GC))),cellZ=z=>Math.max(0,Math.min(GH-1,Math.floor((z-WB.z0)/GC)));
function nearestFree(i,j){if(!grid[j*GW+i])return j*GW+i;
  for(let r=1;r<16;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;
    const a=i+di,b=j+dj;if(a<0||b<0||a>=GW||b>=GH)continue;if(!grid[b*GW+a])return b*GW+a;}
  return -1;}
function lineFree(x0,z0,x1,z1){const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/.06);
  for(let k=1;k<n;k++){const u=k/n,i=cellX(x0+(x1-x0)*u),j=cellZ(z0+(z1-z0)*u);if(grid[j*GW+i]||cost[j*GW+i]>2)return false;}return true;}
// A* with a heap. The score arrays are reused between searches; `mark` says which search wrote a square.
const gs=new Float32Array(NC),from=new Int32Array(NC),mark=new Uint32Array(NC),shut=new Uint32Array(NC),hf=[],hi=[];let searchNo=0;
function hpush(f,i){let k=hf.length;hf.push(f);hi.push(i);while(k>0){const p=(k-1)>>1;if(hf[p]<=f)break;hf[k]=hf[p];hi[k]=hi[p];k=p;}hf[k]=f;hi[k]=i;}
function hpop(){const top=hi[0],f=hf.pop(),i=hi.pop(),n=hf.length;
  if(n){let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&hf[c+1]<hf[c])c++;if(hf[c]>=f)break;hf[k]=hf[c];hi[k]=hi[c];k=c;}hf[k]=f;hi[k]=i;}
  return top;}
function findPath(x0,z0,x1,z1){
  const si=nearestFree(cellX(x0),cellZ(z0)),ei=nearestFree(cellX(x1),cellZ(z1));if(si<0||ei<0)return null;
  const ex=ei%GW,ez=ei/GW|0,no=++searchNo;hf.length=0;hi.length=0;
  gs[si]=0;mark[si]=no;from[si]=-1;hpush(0,si);let found=si===ei,guard=0;
  while(hf.length&&guard++<600000){const cur=hpop();if(cur===ei){found=true;break;}if(shut[cur]===no)continue;shut[cur]=no;
    const ci=cur%GW,cj=cur/GW|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=GW||nj>=GH)continue;
      const n=nj*GW+ni;if(grid[n]||shut[n]===no)continue;if(di&&dj&&(grid[cj*GW+ni]||grid[nj*GW+ci]))continue;
      const ng=gs[cur]+(di&&dj?1.414:1)*cost[n];
      if(mark[n]!==no||ng<gs[n]){gs[n]=ng;mark[n]=no;from[n]=cur;const a=Math.abs(ni-ex),b=Math.abs(nj-ez);hpush(ng+Math.max(a,b)+.41*Math.min(a,b),n);}}}
  if(!found)return null;
  const pts=[nBlocked(x1,z1)?[WB.x0+(ex+.5)*GC,WB.z0+(ez+.5)*GC]:[x1,z1]];
  for(let c=ei;c!==si&&c>=0;c=from[c])pts.push([WB.x0+(c%GW+.5)*GC,WB.z0+((c/GW|0)+.5)*GC]);pts.reverse();
  const out=[];let cx=x0,cz=z0,i=0;                                        // straighten: skip ahead while the straight line is clear and cheap
  while(i<pts.length){let k=i;while(k+1<pts.length&&k-i<90&&lineFree(cx,cz,pts[k+1][0],pts[k+1][1]))k++;out.push(pts[k]);cx=pts[k][0];cz=pts[k][1];i=k+1;}
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
  hit.userData={npc:n,tip:'點一下：跟'+o.name+'說話',act:()=>talk(n)};interact.push(hit);
  return n;
}
const up3=new THREE.Vector3(0,1,0);
const people=houses.flatMap(H=>H.lot.people.map(o=>{const n=makePerson(o);n.home=H.id;return n;}))
  .concat(WORLD.visitors.map((o,i)=>{const n=makePerson(o);n.home=-1;n.visitor=true;n.stay=0;
    n.o.shift=[(clock+23)%24,(clock+.15+i*.45)%24];return n;}))
  .concat([WORLD.guard].map(o=>{const n=makePerson(o);n.home=-1;n.guard=true;return n;}));   // the patrol officer              // for a visitor, 'shift' is the time spent away from this street
