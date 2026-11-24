/* ---------- build the room from its data ---------- */
(function(){
  const T=.16,W=ROOM.w,D=ROOM.d,wm=ROOM.walls,win=ROOM.window,WX=win.half,WY0=win.y0,WY1=win.y1,zw=-RD-T/2;
  box(W+2*T,T,D+2*T,M.floor,0,-T/2,0);
  box(W+2*T,T,D+2*T,M.ceil,0,RH+T/2,0);
  box(T,RH,D,M[wm.west],-RW-T/2,RH/2,0);
  box(T,RH,D,M[wm.east],RW+T/2,RH/2,0);
  box(W+2*T,RH,T,M[wm.south],0,RH/2,RD+T/2);
  // north wall with the window cut out of it
  const side=RW-WX;
  box(side+T,RH,T,M[wm.north],-(RW+WX+T)/2,RH/2,zw);
  box(side+T,RH,T,M[wm.north],(RW+WX+T)/2,RH/2,zw);
  box(2*WX,WY0,T,M[wm.north],0,WY0/2,zw);
  box(2*WX,RH-WY1,T,M[wm.north],0,(RH+WY1)/2,zw);
  box(2*WX+.1,.04,.3,M.trim,0,WY0+.02,-RD+.02);                                              // sill
  [-WX+.03,-WX/3,WX/3,WX-.03].forEach(x=>box(.05,WY1-WY0,.06,M.black,x,(WY0+WY1)/2,zw));       // mullions
  [WY0+.03,WY1-.03].forEach(y=>box(2*WX,.05,.06,M.black,0,y,zw));
  box(2*WX,WY1-WY0,.012,M.glass,0,(WY0+WY1)/2,zw,{shadow:false}).receiveShadow=false;
  // baseboards
  [[W,.1,.02,0,.05,RD-.01],[.02,.1,D,-RW+.01,.05,0],[.02,.1,D,RW-.01,.05,0],[side,.1,.02,-(RW+WX)/2,.05,-RD+.01],[side,.1,.02,(RW+WX)/2,.05,-RD+.01]]
    .forEach(a=>box(a[0],a[1],a[2],M.trim,a[3],a[4],a[5]));
  // curtains
  [-1,1].forEach(s=>{for(let i=0;i<5;i++)box(.1,2.45,.07,M.linen,s*(WX+.08+i*.085),1.27,-RD+.1+(i%2)*.035,{r:.03});});
  box(2*WX+1.1,.03,.03,M.brass,0,2.55,-RD+.1);
  ROOM.furniture.forEach(place);
})();
