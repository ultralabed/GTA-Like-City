/* ---------- minds: needs -> goals -> actions, and what happens when someone gets interrupted ---------- */
// Each person has needs that slowly run down. They pick the goal that helps the emptiest need the most,
// walk to it, and stay until the goal is finished. Nobody follows a timetable except for going to work.
const NEED_ZH={energy:'體力',food:'吃飽',fun:'好玩',fit:'運動',calm:'平靜',care:'照顧'};
const DECAY={energy:.05,food:.085,fun:.11,fit:.07,calm:.09,care:.045};           // lost per game hour
const GOALS={                                                           // type = which kind of spot it needs; gain is per game hour, dur is game hours
  work:{label:'上班',type:'exit'},
  sleep:{label:'睡覺',type:'sleep',need:'energy',gain:.13},
  tv:{label:'看電視',type:'tv',need:'fun',gain:.45,dur:1.6},
  dance:{label:'跳舞',type:'dance',need:'fun',gain:.8,dur:.6,also:'fit'},
  ball:{label:'踢籃球',type:'ball',need:'fit',gain:.7,dur:.8,kicks:3},
  stretch:{label:'伸展',type:'stretch',need:'fit',gain:1.1,dur:.4},
  read:{label:'看書',type:'read',need:'calm',gain:.6,dur:1.2},
  window:{label:'看海',type:'window',need:'calm',gain:.7,dur:.6},
  plant:{label:'照顧盆栽',type:'plant',need:'care',gain:3.5,dur:.25},
  bench:{label:'去公園坐坐',type:'bench',need:'calm',gain:.9,dur:.5,outside:true},
  stroll:{label:'出門散步',type:'stroll',need:'fit',gain:1.6,dur:.3,outside:true},
  snack:{label:'吃點心',type:'snack',need:'food',gain:2.4,dur:.3},
  eatout:{label:'去小吃攤吃東西',type:'eat',need:'food',gain:3,dur:.3,outside:true},
  shop:{label:'逛商店',type:'browse',need:'fun',gain:1,dur:.3,outside:true},
  fish:{label:'去海邊釣魚',type:'fishing',need:'calm',gain:.8,dur:.7,outside:true,also:'food'},
  hoops:{label:'去公園投籃',type:'hoops',need:'fit',gain:1.2,dur:.4,outside:true,also:'fun'},
  watch:{label:'去海邊看煙火',type:'watch',need:'fun',gain:.8,dur:.9,outside:true,also:'calm'},
  patrol:{label:'巡邏',type:'patrol',need:'calm',gain:0,dur:.06},
  catch:{label:'找你談談',type:'catch'},
  lift:{label:'等你開車載他',type:'lift'}
};
const inSpan=(sp,h)=>!!sp&&(sp[0]<sp[1]?(h>=sp[0]&&h<sp[1]):(h>=sp[0]||h<sp[1]));
// at work right now? Weekends are free, except for people with a job on the street (the shop stays open) and visitors (their 'shift' is just time away)
const onShift=n=>inSpan(n.o.shift,clock)&&(n.visitor||n.o.job||!isWeekend());
const mates=n=>people.filter(m=>m!==n&&m.home===n.home&&!m.hidden);
function freeAct(n,id){                                                 // find a spot of the right kind that nobody else is using
  const type=id==='work'&&n.o.job?'serve':GOALS[id].type;let best=null,bs=-1e9;   // someone with a job on the street works there instead of leaving
  for(const k in ACT){const A=ACT[k];if(A.type!==type)continue;
    if(A.house!=null&&A.house!==n.home&&!A.pub&&type!=='serve')continue;                         // other people's houses are off limits
    if(!A.shared){let taken=!!seat&&seat.k===k;                           // you might be sitting there
      for(const m of people){if(m===n||!m.want)continue;const O=ACT[m.want];
        if(O.shared)continue;
        if(m.want===k||(O.owner===A.owner&&(A.solo||O.solo))){taken=true;break;}}   // someone lying on a sofa takes the whole sofa
      if(taken)continue;}
    const dist=type==='patrol'?rnd(0,40):Math.hypot(A.ap[0]-n.pos.x,A.ap[1]-n.pos.z);   // patrol points are picked at random
    const s=(A.pref||0)*100+(n.visitor&&type==='exit'?dist:-dist);        // a bed beats a sofa; otherwise the nearest one. Visitors leave by the far end, so they walk the whole street
    if(s>bs){bs=s;best=k;}}
  return best;
}
function utility(n,id){
  const g=GOALS[id];
  if(n.guard)return id==='patrol'?1:-1;                                   // the patrol officer only patrols (and comes after you: see brain)
  if(id==='patrol'||id==='catch'||id==='lift')return -1;
  if(id==='work')return onShift(n)?5:-1;
  if(id==='watch'&&(!fwOn||rainOn))return -1;
  if(n.cool[id]>0||!freeAct(n,id))return -1;
  const nd=n.need[g.need];let u=(1-nd)*(n.o.w[g.need]||1);
  if(g.need==='food')u=nd<.3?1.6-nd:(1-nd)*.8;                            // hunger gets loud when it is bad
  if(id==='sleep'){if(nd>(inSpan(n.o.bed,clock)?.55:.2))return -1;u=(1-nd)*1.2+(nd<.2?1.5:0);}
  else if(n.need.energy<.25)u*=(id==='dance'||id==='ball'||id==='stretch')?.2:.7;   // too tired for sport
  if(g.outside){if(rainOn)return -1;if(id==='watch')return fwOn?2.4+Math.random()*.3:-1;u*=dark>.6?.2:isWeekend()?1.25:.85;}   // fireworks tonight: nearly everyone wants to go and look       // more people are out and about at the weekend
  if(id==='shop'&&!shopOpen())return -1;                                  // nobody behind the counter: closed                                        // few people go out after dark
  if((id==='tv'||id==='dance')&&mates(n).some(m=>m.goal&&m.goal.id===id))u+=.15;   // more fun together
  return u+rnd(0,.08);
}
function setGoal(n,id){let w=freeAct(n,id);
  if(!w){id=n.visitor?'work':'window';w=freeAct(n,id)||Object.keys(ACT).find(k=>ACT[k].type===GOALS[id].type&&(ACT[k].house==null||ACT[k].house===n.home));}   // nowhere to do it: fall back to something that always exists
  n.goal={id,elapsed:0,kicks:0};n.want=w;}
function choose(n){
  if(n.resume){const r=n.resume;n.resume=null;                          // go back to what you were doing before
    if(utility(n,r.id)>0){n.goal=r;n.want=freeAct(n,r.id);return;}}
  let best='window',bu=-1;for(const id in GOALS){const u=utility(n,id);if(u>bu){bu=u;best=id;}}
  if(bu<0){best=n.visitor?'work':freeAct(n,'window')?'window':'stretch';}
  setGoal(n,best);
}
function endGoal(n,ok){if(n.visitor&&n.goal.id==='work'){n.stay=rnd(1,2.2);for(const k in n.need)n.need[k]=rnd(.25,.6);n.need.energy=1;}   // a visitor arriving: fresh, with things they feel like doing
  const was=n.goal.id;if(ok){n.mood=Math.min(1,n.mood+.08);n.cool[n.goal.id]=.6;}n.goal=null;choose(n);
  if(ok&&was==='fish')react(n,Math.random()<.7?'釣到一條魚了！':'今天魚都不咬…',1.8,null);else if(ok&&was==='hoops')react(n,'呼，投得真過癮。',1.5,null);}
function brain(n,dt){
  const dh=dt*SPEEDS[speedIdx][0],g=n.goal,G=GOALS[g.id],atWork=(g.id==='work'&&n.hidden)||n.lie;   // needs run down slower at work and asleep
  for(const k in DECAY)n.need[k]=Math.max(0,n.need[k]-DECAY[k]*dh*(atWork&&k!=='energy'?.35:1));
  for(const k in n.cool)n.cool[k]-=dh;
  n.mood+=(.75-n.mood)*dt*.01;
  const doing=n.act===n.want&&(n.phase==='at'||(ACT[n.act].chase&&n.phase==='go'));
  if(doing&&G.need){g.elapsed+=dh;n.need[G.need]=Math.min(1,n.need[G.need]+G.gain*dh);
    if(G.also)n.need[G.also]=Math.min(1,n.need[G.also]+G.gain*.5*dh);}
  if(n.react)return;                                                    // finish reacting before deciding anything
  if(quest&&quest.type==='ride'&&quest.from===n&&!quest.in){if(g.id!=='lift'){n.resume=null;setGoal(n,'lift');}return;}   // asked you for a lift: walk to your car and wait
  if(g.id==='lift'){endGoal(n,false);return;}
  if(n.guard){for(const k in n.need)n.need[k]=.8;n.cool.patrol=0;           // never tired, never bored
    if(heat>0&&g.id!=='catch'){setGoal(n,'catch');return;}if(heat===0&&g.id==='catch'){endGoal(n,false);return;}if(g.id==='catch')return;}
  if(n.visitor&&g.id!=='work'){n.stay-=dh;                                // visitors go home after a while, or when night falls, or when it rains
    if(n.stay<=0||dark>.75||rainOn){n.o.shift=[(clock+23.9)%24,(clock+rnd(.8,2.5)+dark*6)%24];n.resume=null;setGoal(n,'work');return;}}
  if(g.id!=='work'&&onShift(n)){n.resume=null;setGoal(n,'work');return;}     // work cuts in on anything
  if(g.id!=='sleep'&&g.id!=='work'&&n.need.energy<.06&&utility(n,'sleep')>0){setGoal(n,'sleep');return;}   // so does being worn out
  const done=g.id==='work'?!onShift(n):g.id==='sleep'?n.need.energy>=.97:(g.elapsed>=G.dur||(G.kicks&&g.kicks>=G.kicks));
  if(done)endGoal(n,true);
}
function progress(n){const g=n.goal,G=GOALS[g.id];
  return g.id==='work'?-1:g.id==='sleep'?n.need.energy:Math.max(g.elapsed/G.dur,G.kicks?g.kicks/G.kicks:0);}
// interruptions. The reaction depends on what happened, who they are, their mood, and how many times it has happened.
function react(n,say,t,pose,after){n.react={say,t,pose,after};}
function notify(n,type,b){
  if(n.hidden||!n.goal)return;
  if(talkN===n&&type!=='greet')closeTalk();
  if(n.guard&&(type==='hit'||type==='car')){react(n,'嘿！不可以這樣！',1.5,'glare');if(type==='car'||(b&&b.kickBy==='你'))addRep(-1);return;}
  const now=performance.now()/1000,g=n.goal;
  if(type!=='greet'&&(n.react||now<n.calmAt))return;
  n.calmAt=now+1.2;
  if(n.lie){                                              // asleep: ignore, then grumble, then give up on sleeping
    if(type!=='greet'&&type!=='hit')return;
    n.poked=(now-n.pokeAt<40?n.poked:0)+1;n.pokeAt=now;
    if(n.poked===1)react(n,'💤 …嗯？',1.6);
    else if(n.poked===2){n.mood-=.15;n.need.energy=Math.max(0,n.need.energy-.03);react(n,'讓我睡啦…',2);}
    else{n.mood-=.25;n.poked=0;react(n,'睡不著了！',1.6,null,()=>{n.cool.sleep=1;endGoal(n,false);});}
    return;
  }
  if(type==='greet'){
    if(n.mood>.35){n.mood=Math.min(1,n.mood+.04);react(n,n.phase==='at'?'嗨！我在'+GOALS[g.id].label:'嗨！',2.4,'wave');}
    else react(n,'…現在不想講話',2,'glare');
  }else if(type==='hit'){
    if(g.id==='ball')return;                              // playing ball already: getting bumped is part of the game
    if(!(b.kickBy==='你'&&now-b.kickAt<4)){react(n,'哇！',1,'startle');return;}       // nobody to blame
    addRep(-1);n.like=Math.max(-5,n.like-2);              // word gets around, and this person will not forget
    n.hits=(now-n.hitAt<60?n.hits:0)+1;n.hitAt=now;
    if(n.o.playful>.6&&n.mood>.4&&g.id!=='work'&&freeAct(n,'ball'))react(n,'來啊！看我的',1.3,'startle',()=>{n.resume=n.goal;setGoal(n,'ball');});   // joins in, comes back later
    else if(n.hits>=3){n.mood-=.3;n.hits=0;react(n,'夠了喔！我要離你遠一點',2,'glare',()=>{n.cool[g.id]=.5;n.resume=null;setGoal(n,g.id==='window'?'read':'window');});}
    else{n.mood-=.12;react(n,n.hits===1?'小心一點啦':'欸！又來',1.8,'glare');}                // warns, then carries on
  }else if(type==='blocked')react(n,n.o.patience>.6?'不好意思，借過一下':'借過！',1.3);
  else if(type==='car'){n.cars=(now-(n.carAt||-99)<60?n.cars||0:0)+1;n.carAt=now;n.mood-=.1;      // nearly run over: a fright the first times, then real anger
    const vb=b&&b.S?b.S.verb:'開車';addRep(-1);n.like=Math.max(-5,n.like-2);
    react(n,n.cars<3?'哇！小心'+vb+'！':'你到底會不會'+vb+'！',n.cars<3?1.6:2.2,n.cars<3?'startle':'glare');}
  else if(type==='honk'){                                                   // a horn behind them: a word, and a step to the side
    react(n,n.mood>.5?'好啦好啦，我讓一下。':'按什麼按啦！',1.3,n.mood>.5?null:'glare');n.mood-=.02;
    if(n.phase==='go'&&b){const fx=Math.cos(b.h),fz=-Math.sin(b.h),side=((n.pos.x-b.x)*fz-(n.pos.z-b.z)*fx)>0?1:-1,tx=n.pos.x+fz*side*1.4,tz=n.pos.z-fx*side*1.4;
      if(!nBlocked(tx,tz))n.path.unshift([tx,tz]);}}
  else if(type==='splash'){n.wets=(now-(n.wetAt||-99)<90?n.wets||0:0)+1;n.wetAt=now;n.mood-=.12;n.like=Math.max(-5,n.like-(b?1:.5));     // soaked by a puddle you went through
    if(n.brolly&&!b){react(n,'還好我有撐傘，沒濺到。',1.5,null);n.like+=.5;n.mood+=.12;return;}
    react(n,n.wets<2?(b?'啊！水都濺到我身上了！':'欸！水濺到我了啦！'):'又來！你是故意的吧！',n.wets<2?1.8:2.2,n.wets<2?'startle':'glare',()=>{if(n.wets>=2&&GOALS[g.id].outside){n.cool[g.id]=.6;n.resume=null;endGoal(n,false);}});}   // twice: gives up and goes home to change
  else if(type==='whoosh'){if(n.mood>.6&&n.o.playful>.6)react(n,'哇，好快！帥喔！',1.4,'wave');else{n.mood-=.04;react(n,'哇！嚇我一跳，慢一點啦。',1.5,'startle');}}
  else if(type==='rain'){const out=GOALS[g.id].outside;                    // caught in the rain: drop outdoor plans and head for shelter
    if(n.brolly){react(n,'下雨了，還好我有帶傘。',1.6,null);return;}        // people with an umbrella just open it and carry on
    react(n,out?'下雨了！快回家':'下雨了！',1.3,'startle',()=>{if(out){n.cool[g.id]=1;n.resume=null;endGoal(n,false);}});}
  else if(type==='tvOff'&&g.id==='tv'&&n.phase==='at'){
    n.tvOffs=(now-n.tvOffAt<90?n.tvOffs:0)+1;n.tvOffAt=now;
    if(n.tvOffs<2)react(n,'欸，我在看耶',1.8,'glare',()=>{const S=houses[n.home].S;if(!S.tv){S.tv=true;applySwitches();}});          // turns it back on
    else{n.mood-=.2;react(n,'好吧，不看了…',1.8,null,()=>{n.cool.tv=1;endGoal(n,false);});}                 // gives up, finds something else
  }else if(type==='lampOff'&&dark>.5)react(n,'好暗！',1.5,'startle',()=>{const S=houses[n.home].S;if(!S.lamp){S.lamp=true;applySwitches();}});
}
const moodFace=n=>n.mood>.62?'😊':n.mood>.38?'😐':'😠';
function sched(n){return n.want;}
function begin(n){const A=ACT[n.act];n.phase='go';n.repath=0;n.wait=0;
  n.path=A.chase?[]:(findPath(n.pos.x,n.pos.z,A.ap[0],A.ap[1])||[[A.ap[0],A.ap[1]]]);}
people.forEach((n,i)=>{const H=houses[n.home];if(n.guard){setGoal(n,'patrol');const A=ACT[n.want];n.act=n.want;n.pos.set(A.ap[0],0,A.ap[1]);n.phase='at';n.root.position.set(A.ap[0],n.stand,A.ap[1]);return;}
  if(H)n.pos.set((H.x0+H.x1)/2,0,(H.z0+H.z1)/2);else n.pos.set(i%2?WB.x1:WB.x0,0,i%3?5:14);       // start from home so 'nearest spot' means something
  setGoal(n,onShift(n)?'work':'tv');
  n.act=sched(n);const A=ACT[n.act];                       // start the day already in place
  if(A.chase){n.pos.set(1.5,0,-1.2);n.phase='go';}
  else{const q=A.an||[A.ap[0],n.stand,A.ap[1]];n.pos.set(q[0],0,q[2]);n.y=q[1];n.yaw=A.yaw||0;n.phase='at';
    if(A.hide){n.hidden=true;n.root.visible=false;}}
  n.root.position.set(n.pos.x,n.y,n.pos.z);n.root.quaternion.copy(A.lie?A.q:qSpin.setFromAxisAngle(up3,n.yaw));});
function pose(P,name,n,t){
  JK.forEach(k=>P[k]=0);P.alz=.07;P.arz=-.07;P.sx=Math.sin(t*1.4+n.stand*9)*.012;
  if(name==='walk'){const w=Math.sin(n.ph);P.hlx=-w*.55;P.hrx=w*.55;P.klx=Math.max(0,Math.sin(n.ph+.9))*.9;P.krx=Math.max(0,Math.sin(n.ph+.9+Math.PI))*.9;
    P.alx=w*.45;P.arx=-w*.45;P.elx=P.erx=-.3;P.sx=.05;P.yo=Math.abs(Math.cos(n.ph))*.02-.02;}
  else if(name==='eat'){P.hlx=P.hrx=-1.5;P.klx=P.krx=1.45;P.sx=.06;P.alx=-.45;P.elx=-.7;P.arx=-1.2+Math.sin(t*3)*.25;P.erx=-1.9+Math.sin(t*3)*.3;P.nx=.12;}   // sitting, one hand going to the mouth
  else if(name==='sit'){P.hlx=P.hrx=-1.5;P.klx=P.krx=1.45;P.sx=-.14;P.alx=P.arx=-.45;P.elx=P.erx=-.7;P.nx=.08;}
  else if(name==='lie'){P.alz=.14;P.arz=-.14;P.sx=0;P.yo=Math.sin(t*1.1)*.006;}
  else if(name==='dance'){const b=t*6+n.stand*5;P.yo=Math.abs(Math.sin(b))*.04-.03;P.sz=Math.sin(b*.5)*.13;P.alx=-2.4+Math.sin(b)*.4;P.arx=-2.4+Math.sin(b+1.5)*.4;
    P.alz=.4;P.arz=-.4;P.elx=P.erx=-.7;P.hlx=Math.sin(b)*.25;P.hrx=-Math.sin(b)*.25;P.klx=P.krx=.3;P.ny=Math.sin(b*.25)*.4;}
  else if(name==='stretch'){P.alx=P.arx=-3;P.alz=.15;P.arz=-.15;P.sz=Math.sin(t*.8)*.28;}
  else if(name==='read'){P.alx=P.arx=-.4;P.elx=P.erx=-1.6;P.alz=-.12;P.arz=.12;P.nx=.38;}
  else if(name==='water'){P.arx=-1.15;P.erx=-.4;P.sx=.16;P.nx=.22;P.arz=-.1+Math.sin(t*2)*.08;}
  else if(name==='fish'){P.alx=P.arx=-1.05;P.elx=P.erx=-.5;P.alz=.12;P.arz=-.12;P.sx=.06+Math.sin(t*.8+n.stand*5)*.03;}                 // both hands out in front, holding the rod
  else if(name==='shoot'){const k=Math.max(0,Math.sin(t*1.6+n.stand*3));P.alx=P.arx=-1.2-k*1.5;P.elx=P.erx=-1.2+k*1.1;P.klx=P.krx=(1-k)*.5;P.hlx=P.hrx=-(1-k)*.25;P.yo=k*.06-.04;}   // crouch, then push the ball up
  else if(name==='window'){P.alz=.45;P.arz=-.45;P.elx=P.erx=-1.1;P.ny=Math.sin(t*.3+n.stand*7)*.35;}
}
const qT=new THREE.Quaternion(),P={},hv=new THREE.Vector3();
const angDiff=(a,b)=>{let d=(a-b)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d;};
function updNPC(n,dt,t){
  if(n.riding){n.pos.x=pos.x;n.pos.z=pos.z;n.tag.hidden=true;return;}       // sitting in your car
  brain(n,dt);
  const want=sched(n);
  if(want!==n.act){
    if(n.hidden){if(!ACT[n.act].bus||busAt(ACT[n.act].bus)){n.hidden=false;n.root.visible=true;n.act=want;begin(n);}}   // people who left by bus come back when a bus pulls in
    else if(n.phase==='go'){n.act=want;begin(n);}
    else if(n.phase!=='exit'){n.phase='exit';n.from=ACT[n.act];}
  }
  if(n.hidden){n.tag.hidden=true;return;}
  const A=ACT[n.act],k4=1-Math.exp(-dt*4),ox=n.pos.x,oz=n.pos.z;
  let name='idle',ty=n.stand,lie=false,tyaw=n.yaw,label=A.label;
  const dpx=pos.x-n.pos.x,dpz=pos.z-n.pos.z,dP=Math.hypot(dpx,dpz);
  n.kickCd-=dt;
  const R=n.react;if(R){R.t-=dt;if(R.t<=0){n.react=null;if(R.after)R.after();}}
  if(n.phase==='exit'){                                   // get up and step clear of the furniture
    const F=n.from,ap=F.ap||[n.pos.x,n.pos.z];
    n.pos.x+=(ap[0]-n.pos.x)*k4;n.pos.z+=(ap[1]-n.pos.z)*k4;label='';
    if(Math.hypot(ap[0]-n.pos.x,ap[1]-n.pos.z)<.06&&Math.abs(n.y-n.stand)<.05){n.act=want;begin(n);}
  }else if(n.phase==='go'){
    label='要去'+A.label;n.atCurb=false;
    if(A.lift){label='走去你的車旁邊';n.repath-=dt;const c=rides[0],cd=Math.hypot(c.x-n.pos.x,c.z-n.pos.z);
      if(cd<2.8){n.path=[];label='在車旁邊等你';}else if(n.repath<=0){n.repath=1;n.path=findPath(n.pos.x,n.pos.z,c.x,c.z)||[];}}
    else if(A.catch){label='來找你';n.repath-=dt;                               // the patrol officer walking up to you
      if(dP<1.5){n.path=[];if(heat>0)fine(n);}else if(n.repath<=0){n.repath=.7;n.path=findPath(n.pos.x,n.pos.z,pos.x,pos.z)||[];}}
    else if(A.chase){label=A.label;n.repath-=dt;const basket=houses[n.home].basket;
      const bx=basket.p.x-n.pos.x,bz=basket.p.z-n.pos.z,bd=Math.hypot(bx,bz);
      if(bd<.45&&basket.p.y<.5&&n.kickCd<=0){const J=2.2;                     // foot pushes ball; ball pushes foot
        const rc=roomAt(basket.p.x,basket.p.z)||rooms[0],cxr=basket.p.x-rc.cx,czr=basket.p.z-rc.cz,cl=Math.hypot(cxr,czr)||1,kx=bx/bd*.4-cxr/cl*.6+rnd(-.3,.3),kz=bz/bd*.4-czr/cl*.6+rnd(-.3,.3),kl=Math.hypot(kx,kz)||1; // aim back toward the middle of the room
        basket.v.x+=kx/kl*J/basket.m;basket.v.z+=kz/kl*J/basket.m;basket.v.y+=1.8;n.kickCd=2.5;n.path=[];n.repath=1.2;n.goal.kicks++;basket.kickBy=n.o.name;
        say(n.o.name+'踢了籃球：球被推 '+J.toFixed(1)+' 牛頓·秒，'+n.o.name+'的腳也被球往回推一樣多。');}
      else if(n.repath<=0){n.repath=.8;n.path=bd>.4?(findPath(n.pos.x,n.pos.z,basket.p.x,basket.p.z)||[]):[];}
    }
    if(n.path.length){
      if(R){tyaw=R.at?Math.atan2(R.at.pos.x-n.pos.x,R.at.pos.z-n.pos.z):Math.atan2(dpx,dpz);}   // face whoever this is about                                        // reacting: stand still and face you
      else if(dP<.65&&n.wait<1+n.o.patience*3){n.wait+=dt;tyaw=Math.atan2(dpx,dpz);  // you are in the way: patient people wait longer
        if(n.wait>.5&&!n.said){n.said=true;notify(n,'blocked');}}
      else{if(dP>.9){n.wait=0;n.said=false;}
        const q=n.path[0],dx=q[0]-n.pos.x,dz=q[1]-n.pos.z,d=Math.hypot(dx,dz),hurry=(rainOn&&!n.brolly&&!roomAt(n.pos.x,n.pos.z)?1.7:1)*(n.o.jog&&!roomAt(n.pos.x,n.pos.z)?2.1:1),stp=1.15*hurry*(n.guard&&heat?1.25+.3*heat:1)*dt;
        n.atCurb=carDanger(n,q);
        if(n.atCurb){label=n.waitWhy;tyaw=Math.atan2(dx,dz);}                  // a car is coming: wait at the kerb
        else{if(d<=stp){n.pos.x=q[0];n.pos.z=q[1];n.path.shift();}else{n.pos.x+=dx/d*stp;n.pos.z+=dz/d*stp;tyaw=Math.atan2(dx,dz);}
          name='walk';n.ph+=dt*7.2*hurry;}}
    }else if(!A.chase){n.phase='in';n.settle=0;}
  }else{                                                  // settle in, then stay
    const q=A.an||[A.ap[0]+(A.bus?((people.indexOf(n)%5)-2)*.55:0),n.stand,A.ap[1]];             // people at a bus stop spread out along the kerb
    n.pos.x+=(q[0]-n.pos.x)*k4;n.pos.z+=(q[2]-n.pos.z)*k4;ty=q[1];tyaw=A.yaw||0;name=A.pose;lie=!!A.lie;n.settle+=dt;
    if(n.phase==='in'&&n.settle>1)n.phase='at';
    if(A.bus)label='等公車';
    if(n.phase==='at'&&A.hide&&(!A.bus||busAt(A.bus))){n.hidden=true;n.root.visible=false;n.tag.hidden=true;return;}   // gets on when the bus has stopped
  }
  n.lie=lie;n.sit=name==='sit'||name==='eat';
  n.vx=(n.pos.x-ox)/dt;n.vz=(n.pos.z-oz)/dt;
  n.yaw+=angDiff(tyaw,n.yaw)*(1-Math.exp(-dt*8));
  n.y+=(ty-n.y)*(1-Math.exp(-dt*6));
  pose(P,name,n,t);
  if(!lie){
    if(R||(dP<2.3&&name!=='dance'))P.ny=Math.max(-1.1,Math.min(1.1,angDiff(R&&R.at?Math.atan2(R.at.pos.x-n.pos.x,R.at.pos.z-n.pos.z):Math.atan2(dpx,dpz),n.yaw)));
    if(R){if(R.pose==='wave'){P.arx=-2.7;P.arz=-.25+Math.sin(t*11)*.35;P.erx=-.35;}
      else if(R.pose==='startle'){P.alx=P.arx=-1.9;P.alz=.9;P.arz=-.9;P.elx=P.erx=-1.2;P.yo+=.03;P.sx=-.1;}
      else if(R.pose==='glare'){P.alz=.5;P.arz=-.5;P.elx=P.erx=-1.3;P.sx=.06;}}
  }
  const kp=1-Math.exp(-dt*(name==='walk'?20:9));JK.forEach(k=>n.cur[k]+=(P[k]-n.cur[k])*kp);
  const c=n.cur,J=n.J;
  J.spine.rotation.set(c.sx,0,c.sz);J.neck.rotation.set(c.nx,c.ny,0);
  J.al.rotation.set(c.alx,0,c.alz);J.ar.rotation.set(c.arx,0,c.arz);J.el.rotation.x=c.elx;J.er.rotation.x=c.erx;
  J.hl.rotation.x=c.hlx;J.hr.rotation.x=c.hrx;J.kl.rotation.x=c.klx;J.kr.rotation.x=c.krx;
  n.book.visible=name==='read';n.um.visible=n.brolly&&rain>.25&&!lie&&!roomAt(n.pos.x,n.pos.z);
  n.root.position.set(n.pos.x,n.y+c.yo,n.pos.z);
  n.root.quaternion.slerp(lie?A.q:qT.setFromAxisAngle(up3,n.yaw),1-Math.exp(-dt*5));
  // name tag above the head
  n.head.getWorldPosition(hv);hv.y+=.3;hv.project(camera);
  const pr0=roomAt(pos.x,pos.z),nr0=roomAt(n.pos.x,n.pos.z);               // no name tags through walls: indoors people only show to someone in the same house
  const show=dP<16&&(!nr0||(pr0&&pr0.house===nr0.house))&&hv.z<1&&Math.abs(hv.x)<1.1&&Math.abs(hv.y)<1.1;n.tag.hidden=!show;
  if(show){n.tag.style.left=((hv.x+1)/2*canvas.clientWidth)+'px';n.tag.style.top=((1-hv.y)/2*canvas.clientHeight)+'px';
    if(R)label=R.say;else if(n.phase==='at'&&n.act===n.want){const pr=progress(n);if(pr>=0)label+=' '+Math.min(99,Math.round(pr*100))+'%';}
    const txt=n.o.name+' '+moodFace(n)+(label?' · '+label:'');if(txt!==n.tagText){n.tagText=txt;n.tag.textContent=txt;}}
}
// the people run the house: lamp on when it is dark and someone is up, TV on only while someone watches
let subText='';
function autoHome(){
  const ah=curHouse();if(ah!==activeHouse){activeHouse=ah;applySwitches();}        // moved next to a different house: its lights become the real ones
  const home=[];let out=0;
  for(const n of people){const r=roomAt(n.pos.x,n.pos.z);n.root.visible=!n.hidden&&Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)<48;
    if(!n.hidden&&!r)out++;if(!n.hidden&&r&&r.house===ah)home.push(n.o.name);}
  for(const H of houses){let awake=false,watching=false;                           // each house looks after its own lamp and TV
    H.inner.visible=houseDist(H,pos.x,pos.z)<6.5;                                  // furniture is only drawn for the house you are in or right next to (you cannot see it from further away anyway)
    for(const n of people){if(!inHouse(n,H))continue;if(!n.lie)awake=true;if(ACT[n.act].tv&&n.phase==='at')watching=true;}
    const wl=dark>.5&&awake;
    if(wl!==H.wantLamp){H.wantLamp=wl;if(H.S.lamp!==wl){H.S.lamp=wl;applySwitches();}}
    if(watching!==H.wantTv){H.wantTv=watching;if(H.S.tv!==watching){H.S.tv=watching;applySwitches();}}}
  updateStreetLamps();neighbourChat();passingHello();for(const m of blockMats)m.emissiveIntensity=dark*1.6;
  const here=roomAt(pos.x,pos.z);if(bakeKey()!==bakedKey){envDirty=true;envTimer=0;}                // walked somewhere new: redo the reflections
  const txt=here?'你在 '+here.house.no+' 號的'+here.name+' · '+(here.house.lot.forSale?(homeOwned?'這是你的家':'這間在賣'):home.length?'在家：'+home.join('、'):'沒有人在家'):'你在街上 · 外面有 '+out+' 個人';
  if(txt!==subText){subText=txt;$('sub').textContent=txt;}
  if(!$('minds').hidden)$('minds').textContent=people.filter(n=>!n.hidden).sort((a,b)=>Math.hypot(a.pos.x-pos.x,a.pos.z-pos.z)-Math.hypot(b.pos.x-pos.x,b.pos.z-pos.z)).slice(0,3).map(n=>{const pr=progress(n);
    return n.o.name+' '+moodFace(n)+'　目標：'+GOALS[n.goal.id].label+(pr>=0?' '+Math.round(pr*100)+'%':'')+(n.resume?'（之後回去'+GOALS[n.resume.id].label+'）':'')+
      '\n　'+Object.keys(NEED_ZH).map(k=>NEED_ZH[k]+' '+String(Math.round(n.need[k]*100)).padStart(2,' ')).join('　');}).join('\n');
}

// neighbours stop for a word when they meet. What they say depends on the weather, the hour and who they are.
function chatLines(a,b){
  if(rainOn)return['雨好大！','對啊，快回家吧。'];
  if(a.guard||b.guard){const g=a.guard?0:1;const L=['今天街上還平靜嗎？','很平靜，辛苦了！'];return g?[L[1],L[0]]:L;}
  if(dark>.7)return['這麼晚還在外面？','睡不著，出來走走。'];
  const sets=[['早安！要去哪？','去'+GOALS[b.goal.id].label+'。'],['今天天氣真好。','是啊，適合散步。'],['吃飽了嗎？','吃飽了，謝謝！'],
    ['你家的盆栽長得真好。','有空來看看！'],['最近工作忙嗎？',b.o.shift?'還好，就是有點累。':'我退休啦，天天放假。'],['那個開黃色車的人你認識嗎？',rep>2?'認識，人很好。':rep<-2?'小心點，他很愛亂來。':'不太熟。']];
  return sets[Math.floor(Math.random()*sets.length)];
}
function neighbourChat(){
  const now=performance.now()/1000;
  for(let i=0;i<people.length;i++){const a=people[i];if(a.hidden||a.lie||a.react||a.riding||(a.chatAt||0)>now||talkN===a)continue;
    for(let j=i+1;j<people.length;j++){const b=people[j];if(b.hidden||b.lie||b.react||b.riding||(b.chatAt||0)>now||talkN===b)continue;
      if(a.phase!=='go'&&b.phase!=='go')continue;                           // at least one of them is passing by
      if(Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z)>1.9)continue;
      const ra=roomAt(a.pos.x,a.pos.z),rb=roomAt(b.pos.x,b.pos.z);if((ra&&ra.house)!==(rb&&rb.house))continue;   // not through a wall
      if(Math.min(a.mood,b.mood)<.35)continue;                              // nobody chats with a grump
      const L=chatLines(a,b);a.chatAt=now+rnd(70,140);b.chatAt=now+rnd(70,140);
      a.react={say:L[0],t:3.4,pose:'wave',at:b};b.react={say:L[1],t:3.6,pose:null,at:a};
      a.mood=Math.min(1,a.mood+.04);b.mood=Math.min(1,b.mood+.04);a.need.fun=Math.min(1,a.need.fun+.05);b.need.fun=Math.min(1,b.need.fun+.05);
      break;}}
}

// people who know you say something when you walk past: friends wave, people you have upset turn away
function passingHello(){
  if(ride||talkN)return;const now=performance.now()/1000;
  for(const n of people){if(n.hidden||n.lie||n.react||n.riding||Math.abs(n.like)<2||(n.helloAt||0)>now)continue;
    if(Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)>2.4)continue;
    const a=roomAt(n.pos.x,n.pos.z),b=roomAt(pos.x,pos.z);if((a&&a.house)!==(b&&b.house))continue;
    n.helloAt=now+90;
    if(n.like>0)react(n,n.like>=4?'嗨，老朋友！':'嗨！又見面了。',1.8,'wave');else react(n,n.like<=-4?'離我遠一點。':'哼。',1.6,'glare');
    return;}
}
