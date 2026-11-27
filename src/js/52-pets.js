/* ---------- pets ---------- */
// 小黃 is the dog from number 3. He decides for himself, a bit like the people do, but his list is short:
// a moving ball beats everything, then his owner out for a walk, then you (if you are close), then home. At night he sleeps.
const pets=[];
(function(){
  const H=houses.find(h=>h.no===3)||houses[0],f=H.front||{x:H.x0+5,z:H.z1,dx:0,dz:1};
  const g=new THREE.Group();dyn.add(g);cur=g;
  const fur=new THREE.MeshStandardMaterial({color:0xd9a441,roughness:.9}),dark2=new THREE.MeshStandardMaterial({color:0x3a2a1c,roughness:.9});
  box(.62,.26,.26,fur,0,.42,0,{r:.1});                                     // body, facing +x
  const head=new THREE.Group();head.position.set(.36,.56,0);g.add(head);cur=head;
  box(.24,.22,.22,fur,.02,.02,0,{r:.08});box(.14,.1,.12,fur,.17,-.03,0,{r:.04});box(.04,.04,.05,dark2,.245,-.01,0);
  [-.08,.08].forEach(z=>{box(.06,.12,.05,dark2,-.04,.14,z,{r:.02});box(.025,.025,.025,dark2,.14,.05,z*.7);});
  cur=g;const legs=[[.22,.1],[.22,-.1],[-.22,.1],[-.22,-.1]].map(q=>{const L=new THREE.Group();L.position.set(q[0],.32,q[1]);g.add(L);cur=L;box(.07,.32,.07,fur,0,-.16,0,{r:.03});cur=g;return L;});
  const tail=new THREE.Group();tail.position.set(-.31,.5,0);g.add(tail);cur=tail;box(.05,.22,.05,fur,-.03,.1,0,{r:.02}).rotation.z=.5;cur=scene;
  const hit=new THREE.Mesh(new THREE.BoxGeometry(.8,.7,.45),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=.4;g.add(hit);
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;$('tags').appendChild(tag);
  const d={name:'小黃',g,head,legs,tail,tag,x:f.x+f.dx*1.4+1.6,z:f.z+f.dz*1.4,h:0,vx:0,vz:0,home:[f.x+f.dx*1.4+1.6,f.z+f.dz*1.4],owner:people.find(n=>n.home===H.id),
    path:[],think:0,ph:0,mood:'',chase:0,rest:0,happy:0,tgt:null,lie:0};
  hit.userData={tip:'點一下：摸摸小黃',act:()=>{if(Math.hypot(d.x-pos.x,d.z-pos.z)>3){say('太遠了，走近一點才摸得到小黃。');return;}d.happy=2.5;bark(d);say('小黃搖尾巴：「汪！」');}};interact.push(hit);
  pets.push(d);
})();
function bark(d){const v=.25*hear(d.x,d.z,25);tone(520,.09,v,'square',.7);setTimeout(()=>tone(440,.11,v,'square',.6),120);}
// --- 小橘, the street cat. Her list: get out of the rain, keep away from the dog, then nap in the sun or wander to another favourite place ---
const CAT_AT=[[19.9,17.2,'在長椅旁邊曬太陽'],[-21,4.9,'窩在公車亭下面'],[14.3,14.1,'窩在公車亭下面'],[35.6,14.8,'在商店門口等魚'],[6,-8.2,'在沙灘上看海鷗'],[-6.3,3.6,'在販賣機旁邊打盹'],[24.6,15.4,'在小吃攤旁邊聞香味']];
const cat=(function(){
  const g=new THREE.Group();dyn.add(g);cur=g;const fur=new THREE.MeshStandardMaterial({color:0xe08a3c,roughness:.9}),wh=new THREE.MeshStandardMaterial({color:0xf4ece0,roughness:.9});
  box(.4,.17,.16,fur,0,.25,0,{r:.07});box(.17,.15,.15,fur,.24,.34,0,{r:.06});box(.07,.06,.09,wh,.33,.31,0,{r:.02});
  [-.05,.05].forEach(z=>{box(.04,.07,.04,fur,.22,.44,z,{r:.01});});
  const legs=[[.14,.06],[.14,-.06],[-.14,.06],[-.14,-.06]].map(q=>{const L=new THREE.Group();L.position.set(q[0],.18,q[1]);g.add(L);cur=L;box(.045,.18,.045,q[0]>0?wh:fur,0,-.09,0,{r:.015});cur=g;return L;});
  const tail=new THREE.Group();tail.position.set(-.2,.3,0);g.add(tail);cur=tail;box(.04,.3,.04,fur,-.02,.14,0,{r:.015}).rotation.z=.35;cur=scene;
  const hit=new THREE.Mesh(new THREE.BoxGeometry(.6,.5,.35),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=.28;g.add(hit);
  const tag=document.createElement('div');tag.className='tag';tag.hidden=true;$('tags').appendChild(tag);
  const c={name:'小橘',g,legs,tail,tag,x:CAT_AT[0][0],z:CAT_AT[0][1],h:0,path:[],at:0,stay:rnd(10,25),think:0,ph:0,mood:CAT_AT[0][2],run:false,trust:0,purr:0};
  hit.userData={tip:'點一下：摸摸小橘',act:()=>{if(Math.hypot(c.x-pos.x,c.z-pos.z)>2.6){say('太遠了，慢慢走近一點才摸得到小橘。');return;}
    if(c.run){say('小橘正在跑，現在摸不到。');return;}c.trust=Math.min(5,c.trust+1);c.purr=3;c.stay=Math.max(c.stay,6);tone(95,.9,.12,'sawtooth',1.02);
    say(c.trust<3?'小橘讓你摸了一下，尾巴豎起來。（再多摸幾次牠會更信任你）':'小橘呼嚕呼嚕地蹭你的腳。牠很喜歡你。');}};interact.push(hit);
  return c;})();
function catGo(c,i,run){c.at=i;c.run=!!run;c.path=findPath(c.x,c.z,CAT_AT[i][0],CAT_AT[i][1])||[];c.mood=run?c.mood:'要去別的地方';}
function updateCat(dt,t){const c=cat,d=pets[0];c.think-=dt;c.purr-=dt;
  if(c.think<=0){c.think=.5;const dd=d?Math.hypot(d.x-c.x,d.z-c.z):99,pd=Math.hypot(pos.x-c.x,pos.z-c.z);
    const scared=dd<4.5||(pd<2.2&&c.trust<1&&(ride||Math.hypot(vel.x,vel.z)>2.6))||(ride&&pd<5&&Math.abs(ride.v)>3);
    if(scared&&!c.run){let best=c.at,bd=-1;CAT_AT.forEach((q,i)=>{const far=Math.min(d?Math.hypot(q[0]-d.x,q[1]-d.z):99,Math.hypot(q[0]-pos.x,q[1]-pos.z));if(i!==c.at&&far>bd&&Math.hypot(q[0]-c.x,q[1]-c.z)<45){bd=far;best=i;}});
      c.mood=dd<4.5?'被小黃嚇到，快跑！':'被嚇到，跑走了';catGo(c,best,true);}
    else if(!c.path.length&&c.purr<=0&&Math.random()<.06){                                  // someone walking by stops to say hello to her
      const n=people.find(m=>!m.hidden&&!m.react&&!m.lie&&m.phase==='go'&&m.mood>.45&&Math.hypot(m.pos.x-c.x,m.pos.z-c.z)<2.4);
      if(n){react(n,n.o.playful>.5?'小橘～來，摸摸！':'喔，是小橘啊。',2.2,null);n.mood=Math.min(1,n.mood+.04);n.need.calm=Math.min(1,n.need.calm+.05);c.purr=2.2;}}
    else if(!c.path.length){c.run=false;if(c.mood.includes('跑')||c.mood==='要去別的地方')c.mood=CAT_AT[c.at][2];c.stay-=.5;
      if(rain>.4&&!CAT_AT[c.at][2].includes('公車亭')){catGo(c,Math.hypot(c.x+21,c.z-4.9)<Math.hypot(c.x-14.3,c.z-14.1)?1:2,true);c.mood='下雨了，去躲雨';}
      else if(c.stay<=0&&rain<.4&&c.purr<=0){c.stay=rnd(14,40);let i=Math.floor(Math.random()*CAT_AT.length);if(i===c.at)i=(i+1)%CAT_AT.length;if(dark>.8)i=5;catGo(c,i,false);}}}
  const sp=c.run?4.2:1.1;let moving=false;
  if(c.path.length){const q=c.path[0],dx=q[0]-c.x,dz=q[1]-c.z,L=Math.hypot(dx,dz),st=sp*dt;const S=WORLD.street,cross=z=>z>S.z0&&z<S.z1;
    if(!c.run&&!cross(c.z)&&cross(q[1])&&cars.some(k=>k.on&&k.dir&&k.v>1&&(c.x-k.x)*k.dir>-2&&(c.x-k.x)*k.dir<k.v*3+4)){c.mood='等車子過';}
    else{if(L<=st){c.x=q[0];c.z=q[1];c.path.shift();}else{c.x+=dx/L*st;c.z+=dz/L*st;c.h+=angDiff(Math.atan2(-dz,dx),c.h)*(1-Math.exp(-dt*10));}moving=true;c.ph+=dt*sp*7;}}
  const sit=moving?0:1;c.g.position.set(c.x,-.07*sit,c.z);c.g.rotation.y=c.h;c.g.rotation.z=0;
  c.legs.forEach((L,i)=>{L.rotation.z=moving?Math.sin(c.ph+(i%3?Math.PI:0))*.7:(i<2?-.2:1.1);});c.tail.rotation.y=Math.sin(t*(c.purr>0?9:1.6))*.5;c.tail.rotation.z=c.purr>0?-.5:0;
  const pd=Math.hypot(c.x-pos.x,c.z-pos.z);c.g.visible=pd<60;
  pv3.set(c.x,.75,c.z).project(camera);const show=pd<12&&pv3.z<1&&Math.abs(pv3.x)<1.1&&Math.abs(pv3.y)<1.1&&!roomAt(pos.x,pos.z);c.tag.hidden=!show;
  if(show){c.tag.style.left=((pv3.x+1)/2*canvas.clientWidth)+'px';c.tag.style.top=((1-pv3.y)/2*canvas.clientHeight)+'px';const s=c.name+' · '+(c.purr>0?'呼嚕呼嚕 ♥':c.mood);if(c.tag.textContent!==s)c.tag.textContent=s;}}
// --- the two people who run the night-market stalls: they are only there while it is open ---
const vendors=[['玉米伯',1.72,0xc9966e,0x555555,0xd9623f,0x3a3a3a,0x202020,false,25.2,'烤玉米！熱的喔！'],['奶茶姐',1.6,0xe8b996,0x2a1a16,0x2f9fb0,0x27304a,0x202024,true,29.4,'珍珠奶茶，半糖少冰？']].map(v=>{
  const n=makePerson(person(v[0],v[1],v[2],v[3],v[4],v[5],v[6],v[7],null,null,.8,.5,{}));n.root.position.set(v[8],n.stand,-9.05);n.root.visible=false;n.tag.hidden=true;n.line=v[9];n.vx=v[8];
  n.J.al.rotation.x=-1.0;n.J.el.rotation.x=-.9;n.J.ar.rotation.x=-1.0;n.J.er.rotation.x=-.9;return n;});
function updateVendors(t){for(const n of vendors){const near=Math.hypot(n.vx-pos.x,-9.05-pos.z)<50;n.root.visible=marketOn&&near;if(!n.root.visible){n.tag.hidden=true;continue;}
    n.J.spine.rotation.z=Math.sin(t*1.3+n.vx)*.04;n.J.neck.rotation.y=Math.sin(t*.6+n.vx)*.5;n.J.ar.rotation.x=-1.0+Math.sin(t*3+n.vx)*.25;
    pv3.set(n.vx,2,-9.05).project(camera);const show=Math.hypot(n.vx-pos.x,-9.05-pos.z)<9&&pv3.z<1&&Math.abs(pv3.x)<1.1&&Math.abs(pv3.y)<1.1;n.tag.hidden=!show;
    if(show){n.tag.style.left=((pv3.x+1)/2*canvas.clientWidth)+'px';n.tag.style.top=((1-pv3.y)/2*canvas.clientHeight)+'px';const s=n.o.name+' · '+n.line;if(n.tag.textContent!==s)n.tag.textContent=s;}}}
// --- seagulls: a few of them wheel over the beach by day; a loud bang (thunder, fireworks) sends them off for a while ---
const gulls=[];let gullAway=0,gullCry=6;
{const wm=new THREE.MeshBasicMaterial({color:0xf2f2ee,side:THREE.DoubleSide}),wg=new THREE.PlaneGeometry(.55,.16);wg.translate(.275,0,0);
  for(let i=0;i<7;i++){const g=new THREE.Group(),L=new THREE.Mesh(wg,wm),R=new THREE.Mesh(wg,wm);L.rotation.x=R.rotation.x=-Math.PI/2;R.scale.x=-1;const lp=new THREE.Group(),rp=new THREE.Group();lp.add(L);rp.add(R);g.add(lp,rp);
    const b=new THREE.Mesh(new THREE.BoxGeometry(.1,.07,.3),wm);g.add(b);scene.add(g);
    gulls.push({g,lp,rp,cx:rnd(-25,30),cz:WORLD.shore-rnd(2,18),r:rnd(5,11),y:rnd(7,13),a:rnd(0,6.28),w:rnd(.25,.45)*(i%2?1:-1),ph:rnd(0,6)});}}
function updateGulls(dt,t){
  gullAway=Math.max(0,gullAway-dt);const show=dark<.6&&rain<.4&&gullAway<=0;
  for(const q of gulls){q.g.visible=show&&Math.hypot(q.cx-pos.x,q.cz-pos.z)<120;if(!q.g.visible)continue;
    q.a+=q.w*dt;const x=q.cx+Math.cos(q.a)*q.r,z=q.cz+Math.sin(q.a)*q.r;q.g.position.set(x,q.y+Math.sin(t*.5+q.ph)*.8,z);q.g.rotation.y=-q.a-(q.w>0?Math.PI:0);
    const f=Math.sin(t*5+q.ph)*.55;q.lp.rotation.z=f;q.rp.rotation.z=-f;}
  if(show){gullCry-=dt;if(gullCry<=0){gullCry=rnd(7,18);const q=gulls[Math.floor(Math.random()*gulls.length)],v=.12*hear(q.g.position.x,q.g.position.z,45);tone(1500,.16,v,'sawtooth',.7);setTimeout(()=>tone(1350,.22,v,'sawtooth',.75),190);}}}
function scareGulls(){if(gullAway<=0&&dark<.6)say('海鷗被嚇到，全部飛走了。過一會兒才會回來。',true);gullAway=40;}
const pv3=new THREE.Vector3();
function updatePets(dt,t){
  for(const d of pets){
    const night=dark>.8,S=WORLD.street;d.think-=dt;d.rest-=dt;d.happy-=dt;
    if(d.carry){const b=d.carry;b.p.set(d.x+Math.cos(d.h)*.45,.5,d.z-Math.sin(d.h)*.45);b.v.set(0,0,0);b.mesh.position.copy(b.p);
      if(Math.hypot(pos.x-d.x,pos.z-d.z)<1.7||ride||b===held){b.held=b===held;b.kickBy=d.name;d.carry=null;d.happy=2;d.rest=3;bark(d);say('小黃把'+b.name+'撿回來給你了！');}}
    if(d.think<=0){d.think=.6;let tx=d.home[0],tz=d.home[1],near=.4;d.mood=night?'睡覺 💤':'在門口等';d.tgt=null;
      if(d.lost){tx=d.lost[0];tz=d.lost[1];near=.5;d.mood='迷路了，嗚…';}                    // ran off and cannot find the way home (a job for you)
      else if(d.lead){tx=pos.x;tz=pos.z;near=1.5;d.mood='跟著你回家';}
      else if(d.carry){tx=pos.x;tz=pos.z;near=1.4;d.mood='把球撿回來給你';d.near=near;d.path=findPath(d.x,d.z,tx,tz)||[];}
      else
      if(!night){
        let ball=null,bd=9;if(d.rest<=0)for(const b of bodies){if(b.held||roomAt(b.p.x,b.p.z)||b.m>3)continue;const q=Math.hypot(b.p.x-d.x,b.p.z-d.z),sp=Math.hypot(b.v.x,b.v.z);if(q<bd&&(sp>.5||q<3.5)){bd=q;ball=b;}}
        const o=d.owner,pd=Math.hypot(pos.x-d.x,pos.z-d.z);
        if(ball){tx=ball.p.x;tz=ball.p.z;near=.45;d.mood='追'+ball.name+'！';d.tgt=ball;d.chase+=.6;if(d.chase>14){d.chase=0;d.rest=9;}}       // gets tired of it after a while
        else{d.chase=Math.max(0,d.chase-.3);
          if(o&&!o.hidden&&!roomAt(o.pos.x,o.pos.z)){tx=o.pos.x;tz=o.pos.z;near=1.5;d.mood='跟著'+o.o.name;}
          else if(pd<6&&!ride&&!roomAt(pos.x,pos.z)){tx=pos.x;tz=pos.z;near=1.4;d.mood=heat?'對你叫：汪汪！':'想跟你玩';if(heat&&Math.random()<.4)bark(d);}}
      }
      d.near=near;const dist=Math.hypot(tx-d.x,tz-d.z);
      d.path=dist>near?(findPath(d.x,d.z,tx,tz)||[]):[];}
    const run=d.tgt?3.4:1.7;let moving=false;
    if(d.path.length){const q=d.path[0],dx=q[0]-d.x,dz=q[1]-d.z,L=Math.hypot(dx,dz),st=run*dt;
      const crossing=z=>z>S.z0&&z<S.z1;                                   // he waits at the kerb for cars, like the people do
      if(!crossing(d.z)&&crossing(q[1])&&cars.some(c=>c.on&&c.dir&&c.v>1&&(d.x-c.x)*c.dir>-2&&(d.x-c.x)*c.dir<c.v*3+4)){d.mood='等車子過';}
      else{if(L<=st){d.x=q[0];d.z=q[1];d.path.shift();}else{d.vx=dx/L*run;d.vz=dz/L*run;d.x+=dx/L*st;d.z+=dz/L*st;d.h+=angDiff(Math.atan2(-dz,dx),d.h)*(1-Math.exp(-dt*10));}
        moving=true;d.ph+=dt*run*5;}}
    if(!moving){d.vx=d.vz=0;}
    if(d.tgt){const b=d.tgt,q=Math.hypot(b.p.x-d.x,b.p.z-d.z);
      if(q<.55&&b.p.y<.6&&b.kickBy==='你'&&performance.now()/1000-b.kickAt<40&&!ride){d.carry=b;b.held=true;d.tgt=null;d.think=0;bark(d);}   // you threw it: he brings it back
      else if(q<.55&&b.p.y<.6){const kx=Math.cos(d.h),kz=-Math.sin(d.h);b.v.x+=kx*3;b.v.z+=kz*3;b.v.y+=1.5;b.kickBy=d.name;d.tgt=null;d.think=.9;if(Math.random()<.5)bark(d);}}   // nose-bumps the ball onward
    const lie=night&&!moving?1:0;d.lie+=(lie-d.lie)*(1-Math.exp(-dt*4));
    d.g.position.set(d.x,-.2*d.lie+(moving?Math.abs(Math.sin(d.ph))*.03:0)+(d.happy>0?Math.abs(Math.sin(t*10))*.08:0),d.z);d.g.rotation.y=d.h;
    d.legs.forEach((L,i)=>{L.rotation.z=moving?Math.sin(d.ph+(i%3?Math.PI:0))*.6:d.lie*1.2*(i<2?-1:1);});
    d.tail.rotation.y=Math.sin(t*(d.happy>0||d.mood==='想跟你玩'?14:3))*(d.happy>0?.9:.35);d.head.rotation.z=d.lie*-.4;
    const dp=Math.hypot(d.x-pos.x,d.z-pos.z);d.g.visible=dp<60;
    pv3.set(d.x,.95,d.z).project(camera);const show=dp<14&&pv3.z<1&&Math.abs(pv3.x)<1.1&&Math.abs(pv3.y)<1.1&&!roomAt(pos.x,pos.z);d.tag.hidden=!show;
    if(show){d.tag.style.left=((pv3.x+1)/2*canvas.clientWidth)+'px';d.tag.style.top=((1-pv3.y)/2*canvas.clientHeight)+'px';const s=d.name+' · '+d.mood;if(d.tag.textContent!==s)d.tag.textContent=s;}
  }
}
