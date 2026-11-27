/* ---------- people who live here ---------- */
// Finding a way: the whole world is cut into 10 cm squares. Each square is either blocked or has a cost
// (sidewalks and floors are cheap, grass costs a bit more, the road costs a lot, so people keep off it unless they must cross).
const NR=.2,GC=.1,GW=Math.round((BB.x1-BB.x0)/GC),GH=Math.round((BB.z1-BB.z0)/GC),NC=GW*GH,grid=new Uint8Array(NC),cost=new Float32Array(NC);
function nBlocked(x,z){if(!inWorld(x,z,NR))return true;
  for(const d of doors){const c=d.openC;if(x>c[0]-NR&&x<c[1]+NR&&z>c[2]-NR&&z<c[3]+NR)return true;}   // people plan around where an open door will be
  for(const c of colliders)if(x>c[0]-NR&&x<c[1]+NR&&z>c[2]-NR&&z<c[3]+NR)return true;return false;}
(function(){const S=WORLD.street;
  for(const c of colliders.concat(doors.map(d=>d.openC))){                    // mark blocked squares box by box (much faster than asking every square)
    const i0=Math.max(0,Math.floor((c[0]-NR-BB.x0)/GC)),i1=Math.min(GW-1,Math.ceil((c[1]+NR-BB.x0)/GC)),j0=Math.max(0,Math.floor((c[2]-NR-BB.z0)/GC)),j1=Math.min(GH-1,Math.ceil((c[3]+NR-BB.z0)/GC));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=BB.x0+(i+.5)*GC,z=BB.z0+(j+.5)*GC;if(x>c[0]-NR&&x<c[1]+NR&&z>c[2]-NR&&z<c[3]+NR)grid[j*GW+i]=1;}}
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=BB.x0+(i+.5)*GC,z=BB.z0+(j+.5)*GC,k=j*GW+i;
    if(!inWorld(x,z,NR)||(z<WORLD.shore+.6&&!onPier(x,z,NR+.15))){grid[k]=1;continue;}             // nobody but you walks into the sea
    const side=x>JX0-S.walk&&x<JX1+S.walk&&z>=S.z1;                         // the side street and its sidewalks
    cost[k]=z>S.z0&&z<S.z1?(Math.abs(x-1.9)<3.2?1.3:5):side?(x>JX0&&x<JX1?(Math.abs(z-WORLD.zebra2)<1.6?1.3:5):1):(z>S.z0-S.walk&&z<S.z1+S.walk)||roomAt(x,z)?1:1.5;}   // the zebra crossing is the cheap way over
})();
const cellX=x=>Math.max(0,Math.min(GW-1,Math.floor((x-BB.x0)/GC))),cellZ=z=>Math.max(0,Math.min(GH-1,Math.floor((z-BB.z0)/GC)));
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
  const pts=[nBlocked(x1,z1)?[BB.x0+(ex+.5)*GC,BB.z0+(ez+.5)*GC]:[x1,z1]];
  for(let c=ei;c!==si&&c>=0;c=from[c])pts.push([BB.x0+(c%GW+.5)*GC,BB.z0+((c/GW|0)+.5)*GC]);pts.reverse();
  const out=[];let cx=x0,cz=z0,i=0;                                        // straighten: skip ahead while the straight line is clear and cheap
  while(i<pts.length){let k=i;while(k+1<pts.length&&k-i<90&&lineFree(cx,cz,pts[k+1][0],pts[k+1][1]))k++;out.push(pts[k]);cx=pts[k][0];cz=pts[k][1];i=k+1;}
  return out;
}
const JK=['sx','sz','nx','ny','alx','alz','arx','arz','elx','erx','hlx','hrx','klx','krx','yo'];
// A body is built from about 45 small shapes. Drawing each one separately is slow when there are many people,
// so the shapes that move together (everything on the head, a forearm and its hand, a shin and its shoe ...)
// are welded into one piece each, with the colours stored on the points. A person is then about 14 pieces.
const bodyMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});
function weld(g){const parts=g.userData.parts;if(!parts)return;let n=0;
  const geos=parts.map(m=>{m.updateMatrix();const q=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();q.applyMatrix4(m.matrix);n+=q.attributes.position.count;return q;});
  const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let at=0;
  geos.forEach((q,i)=>{const cnt=q.attributes.position.count,c=parts[i].material.color;P.set(q.attributes.position.array,at*3);N.set(q.attributes.normal.array,at*3);
    for(let k=0;k<cnt;k++){C[(at+k)*3]=c.r;C[(at+k)*3+1]=c.g;C[(at+k)*3+2]=c.b;}at+=cnt;q.dispose();});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('color',new THREE.BufferAttribute(C,3));
  const me=new THREE.Mesh(geo,bodyMat);me.castShadow=true;me.receiveShadow=true;g.add(me);delete g.userData.parts;}
function makePerson(o){
  const s=o.h/1.75,root=new THREE.Group(),body=new THREE.Group();body.scale.setScalar(s);root.add(body);dyn.add(root);
  const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.85});
  const skin=mat(o.skin),top=mat(o.top),bot=mat(o.bottom),shoe=mat(o.shoe),hair=mat(o.hair),eye=mat(0x1a1210);const mats={skin,top,bot,shoe,hair};
  // every person is a little different: the name decides build, hairstyle, sleeves and eye colour, so it is the same each time you play
  let hsh=7;for(const ch of o.name)hsh=(hsh*31+ch.charCodeAt(0))>>>0;const rv=k=>((hsh>>>(k*5))&31)/31;
  const fem=!!o.long,wide=(fem?.9:1.03)*(.95+rv(1)*.12),hipW=fem?1.1:.97,longSl=rv(3)>.55,hc0=new THREE.Color(o.hair),old=hc0.r+hc0.g+hc0.b>1.5;
  const eyeW=mat(0xf3efe8),iris=mat([0x3a2616,0x2a1c12,0x4a3524,0x35423a][Math.floor(rv(4)*3.99)]),sole=mat(0x1b1b1e),belt=mat(0x2a2320);
  const lip=mat(new THREE.Color(o.skin).lerp(new THREE.Color(fem?0xb03a48:0x8a4a44),fem?.7:.5).getHex()),brow=mat(new THREE.Color(o.hair).multiplyScalar(old?.6:.55).getHex());
  const mk=(geo,m,par,x,y,z)=>{const me=new THREE.Mesh(geo,m);me.position.set(x,y,z);me.castShadow=true;me.receiveShadow=true;
    if(o.sep)par.add(me);else(par.userData.parts=par.userData.parts||[]).push(me);return me;};   // sep: keep the shapes separate (your own character, so its clothes can change colour)
  const jt=(par,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);par.add(g);return g;};
  const cyl=(a,b,l,sg)=>new THREE.CylinderGeometry(a,b,l,sg||10,1),sph=(r,w,h)=>new THREE.SphereGeometry(r,w||12,h||8),bx=(w,h,d)=>new THREE.BoxGeometry(w,h,d),J={};
  // hips and a torso with a real outline: waist, chest, shoulders, turned on a lathe and then flattened front to back
  mk(sph(.13,14,10),bot,body,0,-.02,0).scale.set(1.2*hipW,.86,.9);
  J.spine=jt(body,0,0,0);
  const prof=fem?[[.119,0],[.124,.06],[.11,.16],[.127,.27],[.149,.36],[.141,.44],[.1,.5],[.05,.535]]:[[.125,0],[.128,.06],[.123,.16],[.142,.27],[.165,.37],[.158,.45],[.108,.505],[.052,.535]];
  mk(new THREE.LatheGeometry(prof.map(q=>new THREE.Vector2(q[0]*wide,q[1])),16),top,J.spine,0,0,0).scale.set(1.12,1,.72);
  mk(cyl(.127*wide,.129*wide,.034,16),belt,J.spine,0,.012,0).scale.set(1.13,1,.74);
  J.neck=jt(J.spine,0,.52,0);mk(cyl(.042,.05,.11,10),skin,J.neck,0,.035,0);
  // the head: skull and jaw, ears, a nose, eyes with whites and coloured irises, eyebrows, lips
  const head=jt(J.neck,0,.07,0);
  mk(sph(.1,16,12),skin,head,0,.108,-.005).scale.set(.93,1.08,1.02);
  mk(sph(.08,14,10),skin,head,0,.052,.012).scale.set(fem?.86:.96,.95,.98);
  [-1,1].forEach(k=>{mk(sph(.022,8,6),skin,head,k*.092,.098,-.008).scale.set(.45,1,.7);
    mk(sph(.0115,10,8),eyeW,head,k*.035,.113,.0855).scale.set(1.3,.72,.7);
    mk(sph(.0074,8,6),iris,head,k*.035,.113,.0922).scale.set(1,1,.5);
    mk(sph(.0032,6,4),eye,head,k*.035,.113,.0957).scale.set(1,1,.5);
});
  mk(sph(.013,8,6),skin,head,0,.094,.097).scale.set(.75,1.7,1);mk(sph(.0135,8,6),skin,head,0,.078,.106).scale.set(1.15,.9,1);
  // four faces, one shown at a time: neutral, happy (a smile), upset (a frown and lowered brows), and mouth open for talking
  const faces={};{const dark=mat(0x3a1a1c),arc=Math.PI*.62,bw=fem?.0028:.004;
    const brows=(g,tilt,dy)=>[-1,1].forEach(k=>{const b=mk(sph(1,8,5),brow,g,k*.036,.131+dy,.092);b.scale.set(.016,bw,.005);b.rotation.z=k*tilt;});
    const curve=(g,up)=>{const m=mk(new THREE.TorusGeometry(.021,.0042,5,10,arc),lip,g,0,up?.0605:.0275,.0855);m.rotation.z=(up?-Math.PI/2:Math.PI/2)-arc/2;m.scale.z=.6;};
    let g=faces.n=jt(head,0,0,0);brows(g,0,0);mk(sph(.021,10,6),lip,g,0,.0445,.082).scale.set(1,.3,.5);
    g=faces.h=jt(head,0,0,0);brows(g,-.06,.002);curve(g,true);
    g=faces.u=jt(head,0,0,0);brows(g,.3,-.003);curve(g,false);
    g=faces.o=jt(head,0,0,0);brows(g,-.05,.002);mk(sph(.021,10,6),lip,g,0,.044,.082).scale.set(.85,.5,.5);mk(sph(.015,8,6),dark,g,0,.044,.0875).scale.set(.85,.5,.3);
    for(const k in faces){if(!o.sep)weld(faces[k]);faces[k].visible=k==='n';}}
  // eyelids: a separate piece so the eyes can blink (and stay shut while asleep)
  const lids=jt(head,0,0,0);[-1,1].forEach(k=>mk(sph(.0128,10,8),skin,lids,k*.035,.1135,.086).scale.set(1.32,.78,.76));if(!o.sep)weld(lids);lids.visible=false;
  // hair: a cap over the skull plus a style
  const cap=(th,x)=>{const hc=mk(new THREE.SphereGeometry(.108,16,10,0,Math.PI*2,0,th),hair,head,0,.112,-.012);hc.rotation.x=x;hc.scale.set(.96,1.1,1.04);};
  const hs=rv(2);
  if(fem){cap(1.4,-.55);[-1,1].forEach(k=>mk(sph(1,8,8),hair,head,k*.086,.06,-.012).scale.set(.028,.105,.06));
    if(hs<.4){mk(sph(1,12,10),hair,head,0,.02,-.07).scale.set(.1,.2,.062);}                                         // long and straight
    else if(hs<.7){mk(sph(.045,10,8),hair,head,0,.15,-.112);mk(cyl(.03,.012,.2,8),hair,head,0,.04,-.135).rotation.x=.25;}       // ponytail
    else{mk(sph(1,12,10),hair,head,0,.075,-.04).scale.set(.108,.1,.09);mk(sph(.05,10,8),hair,head,0,.21,-.06);}}     // bob with a bun
  else if(old&&hs>.5){cap(.85,-.95);[-1,1].forEach(k=>mk(sph(1,8,8),hair,head,k*.088,.1,-.03).scale.set(.022,.055,.07));}   // thinning on top
  else{cap(hs<.3?1.25:1.38,-.42);if(hs>=.3)mk(sph(1,10,8),hair,head,hs>.75?.025:0,.196,.045).scale.set(.085,.03,.06);}       // short, with or without a fringe
  ['l','r'].forEach((n,i)=>{const k=i?-1:1;
    const sh=J['a'+n]=jt(J.spine,k*(.17*wide+.008),.455,0);mk(sph(.05,10,8),top,sh,0,-.004,0);
    if(longSl)mk(cyl(.049,.041,.27),top,sh,0,-.145,0);else{mk(cyl(.05,.048,.12),top,sh,0,-.07,0);mk(cyl(.044,.038,.27),skin,sh,0,-.145,0);}
    const el=J['e'+n]=jt(sh,0,-.28,0);mk(sph(.039,8,6),longSl?top:skin,el,0,0,0);mk(cyl(.038,.029,.24),longSl?top:skin,el,0,-.125,0);
    mk(sph(.034,8,6),skin,el,0,-.272,.002).scale.set(.55,1.15,1);mk(sph(.03,8,6),skin,el,0,-.318,.006).scale.set(.45,1.1,.9);mk(sph(.014,6,5),skin,el,k*-.008,-.283,.034).scale.set(.9,1.8,.9);
    const hip=J['h'+n]=jt(body,k*.09*hipW,-.04,0);mk(sph(.078,10,8),bot,hip,0,-.01,0);
    if(o.shorts){mk(cyl(.082,.07,.24,12),bot,hip,0,-.125,0);mk(cyl(.074,.056,.42,12),skin,hip,0,-.215,0);}else mk(cyl(.078,.058,.42,12),bot,hip,0,-.215,0);
    const kn=J['k'+n]=jt(hip,0,-.44,0);mk(sph(.057,10,8),o.shorts?skin:bot,kn,0,0,0);mk(cyl(.056,.038,.36),o.shorts?skin:bot,kn,0,-.185,0);
    mk(sph(.05,10,8),shoe,kn,0,-.393,.005).scale.set(.9,.78,1.1);mk(sph(.05,10,8),shoe,kn,0,-.408,.085).scale.set(.85,.56,1.5);mk(bx(.085,.02,.25),sole,kn,0,-.437,.055);});
  if(!o.sep)[body,J.spine,J.neck,head,J.al,J.ar,J.el,J.er,J.hl,J.hr,J.kl,J.kr].forEach(weld);
  const book=new THREE.Mesh(new THREE.BoxGeometry(.2,.03,.15),mat(o.top===0x1f6a6e?0xb5533a:0x1f5a5e));book.position.set(-.1,-.29,.02);book.castShadow=true;J.el.add(book);book.rotation.x=.4;book.visible=false;
  const hit=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,1.75,8),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=-.02;body.add(hit);
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;$('tags').appendChild(tag);
  const n={o,root,J,head,body,lids,faces,face:'n',blinkT:1+Math.random()*4,lookC:0,book,tag,stand:.92*s,pos:new THREE.Vector3(),y:.92*s,yaw:0,vx:0,vz:0,path:[],act:null,phase:'at',from:null,
    hidden:false,lie:false,sit:false,ph:0,wait:0,kickCd:0,repath:0,settle:9,cur:{},tagText:'',
    need:{energy:.6,fun:.3,fit:.5,calm:.55,care:.6,food:.6},cool:{},mood:.75,goal:null,resume:null,want:null,react:null,calmAt:0,
    poked:0,pokeAt:-99,hits:0,hitAt:-99,tvOffs:0,tvOffAt:-99,said:false};
  JK.forEach(k=>n.cur[k]=0);
  hit.userData={npc:n,tip:'點一下：跟'+o.name+'說話',act:()=>talk(n)};interact.push(hit);
  // some people carry an umbrella: it only shows when they are out in the rain
  n.brolly=Math.round(o.h*50)%2===0;n.like=0;n.mats=mats;                             // like: what this person thinks of you, from -5 to 5
  const um=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color:o.top,roughness:.8,side:THREE.DoubleSide});
  const canopy=new THREE.Mesh(new THREE.ConeGeometry(.62,.2,10,1,true),cloth);canopy.position.set(.12,1.2,.05);canopy.castShadow=true;
  const stick=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.8,6),eye);stick.position.set(.12,.8,.05);um.add(canopy,stick);um.visible=false;body.add(um);n.um=um;
  return n;
}
// --- the little things that make a body look alive: breathing, blinking, hips and shoulders turning as you walk, eyes following someone close by ---
function liveBody(n,t,dt,walk,look,asleep,face){const J=n.J,br=Math.sin(t*1.5+n.stand*7),kk=1-Math.exp(-dt*6);
  J.spine.scale.set(1,1+br*.006,1+br*.02);
  const tw=walk?Math.sin(n.ph)*.12:0,sw=walk?Math.cos(n.ph)*.035:0;J.spine.rotation.y+=(tw-J.spine.rotation.y)*kk;n.body.rotation.z+=(sw-n.body.rotation.z)*kk;
  n.lookC+=((look||0)-n.lookC)*(1-Math.exp(-dt*4));J.neck.rotation.y+=n.lookC*.75;
  n.blinkT-=dt;if(n.blinkT<-.12)n.blinkT=2.2+Math.random()*4;n.lids.visible=!!asleep||n.blinkT<0;
  face=asleep?'n':face||'n';if(face!==n.face){n.faces[n.face].visible=false;n.faces[face].visible=true;n.face=face;}}
const up3=new THREE.Vector3(0,1,0);
const people=houses.flatMap(H=>H.lot.people.map(o=>{const n=makePerson(o);n.home=H.id;return n;}))
  .concat(WORLD.visitors.map((o,i)=>{const n=makePerson(o);n.home=-1;n.visitor=true;n.stay=0;
    n.o.shift=[(clock+23)%24,(clock+.15+i*.45)%24];return n;}))
  .concat([WORLD.guard].map(o=>{const n=makePerson(o);n.home=-1;n.guard=true;return n;}));   // the patrol officer              // for a visitor, 'shift' is the time spent away from this street
