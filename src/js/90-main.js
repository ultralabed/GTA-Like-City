/* ---------- main loop ---------- */
let last=performance.now(),frame=0,slow=0,tipObj=null,acc=0,bakeAt=0,bakeClock=clock,autoT=1;
function tick(now){
  requestAnimationFrame(tick);
  const dt=Math.max(.001,Math.min(.05,(now-last)/1000));last=now;frame++;const t=now/1000;
  // time passes
  if(!sliding)clock=(clock+dt*SPEEDS[speedIdx][0])%24;
  applyTime();
  if(frame%20===0&&!sliding)slider.value=clock;
  let dc=Math.abs(clock-bakeClock);dc=Math.min(dc,24-dc);
  if(dc>.2&&t-bakeAt>2.5)envDirty=true;
  // you
  const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+joy.y;
  const s=(keys.KeyD?1:0)-(keys.KeyA?1:0)+joy.x;
  if(keys.ArrowLeft)yaw+=1.9*dt;if(keys.ArrowRight)yaw-=1.9*dt;
  const sp=(keys.ShiftLeft||keys.ShiftRight)?3.3:1.9,sn=Math.sin(yaw),cs=Math.cos(yaw);
  let tx=(-sn*f+cs*s),tz=(-cs*f-sn*s);const tl=Math.hypot(tx,tz);if(tl>1){tx/=tl;tz/=tl;}
  const e=1-Math.exp(-dt*10);vel.x+=(tx*sp-vel.x)*e;vel.z+=(tz*sp-vel.z)*e;
  const nx=pos.x+vel.x*dt;if(!blocked(nx,pos.z))pos.x=nx;else vel.x=0;
  const nz=pos.z+vel.z*dt;if(!blocked(pos.x,nz))pos.z=nz;else vel.z=0;
  const v=Math.hypot(vel.x,vel.z);bob+=v*dt*3.6;
  camera.position.set(pos.x,pos.y+(reduce?0:Math.sin(bob*2)*.018*Math.min(1,v)),pos.z);
  camera.rotation.set(pitch,yaw,0);camera.updateMatrixWorld();
  // the people, then the physics in small fixed steps
  for(const n of people)updNPC(n,dt,t);
  autoT+=dt;if(autoT>.5){autoT=0;autoHome();}
  acc+=dt;let steps=0;while(acc>=PH&&steps<14){physStep(PH);acc-=PH;steps++;}if(steps===14)acc=0;
  syncBalls(dt);
  // lights that live
  const k=S.neon?1:0;for(const d of dev.neons){d.l1.intensity=k*(.3+.2*dark);d.l2.intensity=k*(.18+.12*dark);}
  for(const d of dev.tvs){if(S.tv){if(frame%3===0)drawTV(d,t);d.light.intensity=(.18+.12*dark)*(1+Math.sin(t*5.3)*.08+Math.sin(t*13.1)*.05);}else d.light.intensity=0;}
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
applySwitches();applyTime();dev.tvs.forEach(d=>drawTV(d,0));
window.__room={get clock(){return clock;},set clock(v){clock=v;envDirty=true;},people,bodies,S,notify,userTv,userLamp,kick,ACT,colliders,pboxes};
requestAnimationFrame(tick);
