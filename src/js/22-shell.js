/* ---------- build the house from its data ---------- */
// One wall, built in its own frame: u runs along the wall, the inside of the room is toward +z, the wall itself sits at z < 0.
// Holes (windows, doorways) are cut by building the wall in pieces around them.
function buildWall(R,side,def){
  const T=WALL_T,horiz=side==='north'||side==='south',L=horiz?R.w:R.d,W=R.walls;
  const rot={north:0,south:Math.PI,east:-Math.PI/2,west:Math.PI/2}[side],sign=(side==='north'||side==='east')?1:-1;
  const ox=R.cx+(side==='east'?R.w/2:side==='west'?-R.w/2:0),oz=R.cz+(side==='south'?R.d/2:side==='north'?-R.d/2:0);
  const F=makeFrame(ox,oz,rot),prev=cur;cur=F.g;
  // long walls cover the corners, but only where a side wall actually meets them
  const lo=side==='north'?'west':'east',hi=side==='north'?'east':'west';
  const u0=-L/2-(horiz&&W[lo]?T:0),u1=L/2+(horiz&&W[hi]?T:0),mat=M[def.mat];
  const piece=(a,b,y0,y1)=>{if(b-a<.01||y1-y0<.01)return;
    box(b-a,y1-y0,T,mat,(a+b)/2,(y0+y1)/2,-T/2);
    const s=F.span(a,b,-T,0);pboxes.push([s[0],s[1],y0,y1,s[2],s[3]]);
    if(y0<1){colliders.push(s);if(y0===0)box(b-a,.1,.02,M.trim,(a+b)/2,.05,.01);}};          // reaches the floor: you cannot walk through it
  const holes=(def.open||[]).map(o=>Object.assign({},o,{u:o.c*sign})).sort((a,b)=>a.u-b.u);
  let u=u0;
  for(const o of holes){const a=o.u-o.half,b=o.u+o.half,y0=o.y0||0,y1=o.y1;
    piece(u,a,0,RH);piece(a,b,0,y0);piece(a,b,y1,RH);u=b;
    if(o.kind==='window'){const WX=o.half,ym=(y0+y1)/2;
      box(2*WX+.1,.04,.3,M.trim,o.u,y0+.02,.02);                                              // sill
      [-WX+.03,-WX/3,WX/3,WX-.03].forEach(x=>box(.05,y1-y0,.06,M.black,o.u+x,ym,-T/2));        // mullions
      [y0+.03,y1-.03].forEach(y=>box(2*WX,.05,.06,M.black,o.u,y,-T/2));
      box(2*WX,y1-y0,.012,M.glass,o.u,ym,-T/2,{shadow:false}).receiveShadow=false;
      const s=F.span(a,b,-T/2-.01,-T/2+.01);pboxes.push([s[0],s[1],y0,y1,s[2],s[3]]);         // balls bounce off the glass
      [-1,1].forEach(k=>{for(let i=0;i<5;i++)box(.1,y1+.1-.05,.07,M.linen,o.u+k*(WX+.08+i*.085),(y1+.1+.05)/2,.1+(i%2)*.035,{r:.03});});   // curtains
      box(2*WX+1.1,.03,.03,M.brass,o.u,y1+.1,.1);
    }else{                                                                                    // doorway: a wooden frame around the hole
      [a-.03,b+.03].forEach(x=>box(.06,y1+.06,T+.04,M.walnut,x,(y1+.06)/2,-T/2));
      box(b-a+.12,.06,T+.04,M.walnut,o.u,y1+.03,-T/2);
    }}
  piece(u,u1,0,RH);
  cur=prev;
}
rooms.forEach(R=>{
  const T=WALL_T,W=R.walls,ex0=W.west?T:0,ex1=W.east?T:0,ez0=W.north?T:0,ez1=W.south?T:0;
  // floor and ceiling reach under this room's own walls, and stop where the neighbour's begin
  const fw=R.w+ex0+ex1,fd=R.d+ez0+ez1,fx=R.cx+(ex1-ex0)/2,fz=R.cz+(ez1-ez0)/2;
  box(fw,T,fd,M.floor,fx,-T/2,fz);
  box(fw,T,fd,M.ceil,fx,RH+T/2,fz);
  for(const side of['north','east','south','west'])if(W[side])buildWall(R,side,W[side]);
  R.furniture.forEach(it=>place(it,R));
});
