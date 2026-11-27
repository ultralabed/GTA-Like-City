/* ---------- main loop ---------- */
const prof={people:0,world:0,physics:0,steps:0,frames:0};
let last=performance.now(),frame=0,slow=0,tipObj=null,acc=0,bakeAt=0,bakeClock=clock,autoT=1;
function tick(now){
  requestAnimationFrame(tick);
  const dt=Math.max(.001,Math.min(.05,(now-last)/1000));last=now;frame++;const t=now/1000;
  // time passes
  if(!sliding){clock+=dt*SPEEDS[speedIdx][0];if(clock>=24){clock-=24;day++;say('新的一天：星期'+DOW[day%7]+(isWeekend()?'。今天放假，大家不用上班。':'。'));}}
  applyTime();
  if(frame%20===0&&!sliding)slider.value=clock;
  let dc=Math.abs(clock-bakeClock);dc=Math.min(dc,24-dc);
  if(dc>.2&&t-bakeAt>3.5)envDirty=true;
  // you
  const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+joy.y;
  const s=(keys.KeyD?1:0)-(keys.KeyA?1:0)+joy.x;
  if(keys.ArrowLeft)yaw+=1.9*dt;if(keys.ArrowRight)yaw-=1.9*dt;
  const sp=moveSpeed(dt,Math.abs(f)+Math.abs(s)),sn=Math.sin(yaw),cs=Math.cos(yaw);
  let tx=(-sn*f+cs*s),tz=(-cs*f-sn*s);const tl=Math.hypot(tx,tz);if(tl>1){tx/=tl;tz/=tl;}
  if(!playerStep(dt,f,s)){
  const e=1-Math.exp(-dt*10);vel.x+=(tx*sp-vel.x)*e;vel.z+=(tz*sp-vel.z)*e;
  const nx=pos.x+vel.x*dt;if(!blocked(nx,pos.z))pos.x=nx;else vel.x=0;
  const nz=pos.z+vel.z*dt;if(!blocked(pos.x,nz))pos.z=nz;else vel.z=0;
  const v=Math.hypot(vel.x,vel.z);bob+=v*dt*3.6;
  {const base=camera.aspect<1?82:68,want=base+(v>2.6?7:0);if(Math.abs(camera.fov-want)>.1){camera.fov+=(want-camera.fov)*Math.min(1,dt*6);camera.updateProjectionMatrix();}}   // the view widens a little when you run
  if(v>.6&&jumpY===0){const sn2=Math.floor(bob*2/Math.PI);if(sn2!==stepNo){stepNo=sn2;sfxStep();}}
  camera.position.set(pos.x,pos.y+(reduce?0:Math.sin(bob*2)*.018*Math.min(1,v)),pos.z);
  camera.rotation.set(pitch,yaw,0);camera.position.y+=jumpY-waterDepth()+(waterDepth()>1?Math.sin(t*2.2)*.05:0);}
  camera.updateMatrixWorld();carryHeld();thirdCam(dt,t);fishStep(dt,t);emoteStep(dt);findQuest();raceStep();starStep();if(frame%8===0)updateActs();if(use.phone&&frame%10===0)drawMap();$('radar').hidden=!radarOn||!!use.phone;if(radarOn&&!use.phone&&frame%3===0)drawMap(true);if(frame%15===0){hudStats();updateAudio();}
  // the people, then the physics in small fixed steps
  const p0=performance.now();
  for(const n of people)updNPC(n,dt,t);
  const p1=performance.now();
  updateDoors(dt);updateCars(dt);updateWeather(dt);updatePets(dt,t);updateCat(dt,t);updateVendors(t);updateGulls(dt,t);
  autoT+=dt;if(autoT>.5){autoT=0;autoHome();}
  const p2=performance.now();
  acc+=dt;let steps=0;while(acc>=PH&&steps<14){physStep(PH);acc-=PH;steps++;}if(steps===14)acc=0;
  syncBalls(dt);
  const p3=performance.now();prof.people+=p1-p0;prof.world+=p2-p1;prof.physics+=p3-p2;prof.steps+=steps;prof.frames++;   // where the time goes (read with __room.prof)
  // lights that live
  const AS=activeHouse.S,AD=activeHouse.dev,k=AS.neon?1:0;for(const d of AD.neons){d.l1.intensity=k*(.3+.2*dark);d.l2.intensity=k*(.18+.12*dark);}
  for(const d of AD.tvs){if(AS.tv){if(frame%3===0)drawTV(d,t);d.light.intensity=(.18+.12*dark)*(1+Math.sin(t*5.3)*.08+Math.sin(t*13.1)*.05);}else d.light.intensity=0;}
  if(dust.visible){const p=dGeo.attributes.position;for(let i=0;i<DN;i++){let y=p.getY(i)+Math.sin(t*.4+i)*.0006-.0004;if(y<.15)y=2.3;p.setY(i,y);p.setX(i,p.getX(i)+Math.cos(t*.3+i*1.7)*.0005);}p.needsUpdate=true;}
  exposure+=(exposureTarget-exposure)*(1-Math.exp(-dt*3));
  if(envDirty){envTimer+=dt;if(frame<3||envTimer>.12){bakeEnv();envDirty=false;bakeAt=t;bakeClock=clock;}}
  // what am I pointing at?
  if(frame%6===0){const o=isTouch?null:(locked?pick(0,0):pick(hoverNdc.x,hoverNdc.y));
    if(o!==tipObj){tipObj=o;const tip=$('tip');tip.hidden=!o;if(o)tip.textContent=o.userData.tip||('點一下：開關'+o.userData.label);canvas.style.cursor=o?'pointer':'grab';}
    $('cross').style.opacity=locked?1:0;}
  if(composer){finalPass.uniforms.exposure.value=exposure;finalPass.uniforms.time.value=t%10;composer.render();}
  else{renderer.toneMappingExposure=exposure;renderer.render(scene,camera);}
  // if the device struggles, draw fewer pixels so walking stays smooth
  if(frame>90){slow=dt>.034?slow+1:Math.max(0,slow-1);if(slow>45&&pr>.75){pr=Math.max(.75,pr-.25);slow=0;resize();}}
}
scene.traverse(o=>{if(o.material&&'envMapIntensity' in o.material)o.material.envMapIntensity=.45;});
// things that stand outside take much more of their light from the sky
[M.grass,M.asphalt,M.concrete,M.paint,M.sand,M.bark,M.crown,M.crown2,M.steel].concat(houses.flatMap(H=>[H.mats.ext,H.mats.roof,H.mats.doorLeaf])).forEach(m=>{m.envMapIntensity=2.2;});
M.water.envMapIntensity=1.2;dyn.traverse(o=>{if(o.material&&'envMapIntensity' in o.material)o.material.envMapIntensity=1;});
// photo mode: everything on screen goes away so you can take a clean picture
function photo(on){document.body.classList.toggle('photo',on);$('bPhotoEnd').hidden=!on;if(on){$('panel').hidden=true;$('bSet').setAttribute('aria-expanded',false);}}
$('bPhoto').onclick=()=>photo(true);$('bPhotoEnd').onclick=()=>photo(false);
addEventListener('keydown',e=>{if(e.code==='KeyP'&&!e.repeat)photo(!document.body.classList.contains('photo'));});
// picture quality: fewer pixels, a smaller shadow picture and no glow make slow devices run smoother
const QUAL=[['高',2,2048,true],['中',1.25,1024,true],['低',.8,512,false]];let qIdx=0;
$('bQual').onclick=()=>{qIdx=(qIdx+1)%3;const Q=QUAL[qIdx];$('bQual').textContent='畫質：'+Q[0];
  pr=Math.min(window.devicePixelRatio||1,Q[1]);sun.shadow.mapSize.set(Q[2],Q[2]);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
  if(composer)composer.passes[1].enabled=Q[3];resize();};
if(loadGame()){slider.value=clock;say('歡迎回來！已經接著上次的進度。');}
applySwitches();applyTime();houses.forEach(H=>H.dev.tvs.forEach(d=>drawTV(d,0)));
window.__room={get clock(){return clock;},set clock(v){clock=v;envDirty=true;},people,bodies,G,houses,notify,findPath,scene,M,cars,setRain,rides,marks,bag,use,addRep,offer,LOST_AT,stats,trackStats,showStats,finishQuest,refuel,atPump,PUMP,getIn,getOut,rideStep,fishing,fishStep,iceVan,buyIce,nearVan,showGuide,FISH,fishGot,onIsle,WORLD,vendors,carUp,applyTune,tuneMenu,SEA_RACE,SEA_START,startFare,rideQuest,updateDoors,chatLines,get market(){return marketOn;},set marketForce(v){marketForce=v;},marketBuy,busAt,treeTops,cat,updateCat,CAT_AT,askFavor,set favorAt(v){favorAt=v;},get daily(){return daily;},dailyStep,get day(){return day;},set day(v){day=v;},wave,dance,emoteStep,get emote(){return emote;},gulls,updateGulls,scareGulls,decorG,decorOwn,showDecor,buyHome,get homeOwned(){return homeOwned;},doors,rideHit,STARS,starGot,starStep,inWorld,startRace,raceStep,RACE,FLAG,storyQuest,drawMap,paperQuest,saveGame,repaint,waterQuest,setGoal,ACT,updNPC,moveSpeed,toggleItem,boarding,roomAt,taxi,hail,canHail,dogQuest,updatePets,blocked,findQuest,get quest(){return quest;},set quest(v){quest=v;},setWeather,strike,puddles,puddleMat,get wind(){return{x:windX,z:windZ,s:windS};},set windForce(v){windForce=v;},physStep,get fw(){return{on:fwOn,count:fwCount,live:FW.filter(f=>f.t<2.6).length};},set fwForce(v){fwForce=v;},bow,sunDir,splashStep,vel,get wx(){return{wet,wx,rain,mist,flash,storm,bolt:bolt.visible};},updateWeather,prof,renderer,get onBus(){return onBus;},boardBus,leaveBus,nearBus,updateCars,get cash(){return cash;},set cash(v){cash=v;},get pos(){return pos;},busAt,updateCars,ROUTES,neighbourChat,rideQuest,passingHello,shopMenu,pets,get heat(){return heat;},get music(){return{trk:trkName,step:stepNo16,ac:AC&&AC.state};},talk,get q(){return{ride:ride&&ride.kind,cash,rep,drinks,stam,heat,quest:quest&&quest.text,talk:talkN&&talkN.o.name};},buyDrink,setView,nextOutfit,waterDepth,get third(){return third;},me,get fish(){return{fish,fishBag,fishCount,baskets,day};},do:{fishing,horn,lieDown,jump,pickUp,putDown,throwHeld,sitDown,standUp,getIn,getOut,toggleItem},get st(){return{held:held&&held.name,seat:seat&&seat.k,jumpY,ride:ride&&ride.kind,bag:Object.keys(bag).join('+')};},rebake:()=>{envDirty=true;envTimer=1;},userTv,userLamp,kick,ACT,colliders,pboxes,rooms,doors,go:(x,z,y)=>{pos.x=x;pos.z=z;if(y!=null)yaw=y;}};
requestAnimationFrame(tick);
