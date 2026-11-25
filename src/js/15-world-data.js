/* ---------- world data ---------- */
// Everything that makes THIS street this street. Change the numbers and the world changes;
// nothing below this file knows where a sofa or a house is. Units are metres; x is along the street, z is across it.
//
// TEMPLATES: a house design, drawn once. A room:  x,z = its middle, measured from the middle of the house.  w,d = inside size.
//   walls: one entry per side. mat = material name. inner:true = the other side of this wall is another room.
//          open = holes:  {kind:'window', c, half, y0, y1}   c = where along the wall (the room's own x or z)
//                         {kind:'door',   c, half, y1}       a real door. front:true = the front door of the house
//          a side set to null has no wall of its own: the room next door already built it.
//   furniture: measured from the middle of the room. rot = quarter turns (0, 1, 2, 3).
// WORLD.lots: where copies of a template stand. flip:true turns the whole house around to face the other way.
const TEMPLATES={
  cottage:{
    rooms:[
      {id:'living',name:'客廳',x:0,z:0,w:6,d:5,
        walls:{
          north:{mat:'wall',open:[{kind:'window',c:0,half:1.7,y0:.45,y1:2.45}]},
          east:{mat:'accent',inner:true,open:[{kind:'door',c:.2,half:.45,y1:2.1}]},
          south:{mat:'wall',open:[{kind:'door',c:1.9,half:.45,y1:2.1,front:true}]},
          west:{mat:'wall'}},
        furniture:[
          {type:'rug',x:-.95,z:.3},
          {type:'tvConsole',x:-3,z:.3},
          {type:'sofa',x:.45,z:.3},
          {type:'coffeeTable',x:-1,z:.3},
          {type:'bookshelf',x:3,z:-1.05},
          {type:'art',x:-1.3,z:2.5,seed:0},
          {type:'art',x:-.2,z:2.5,seed:1},
          {type:'plant',x:-2.4,z:-1.9},
          {type:'lampCorner',x:-2.45,z:1.95},
          {type:'neon',x:3,z:1.3},
          {type:'item',kind:'flashlight',x:-2.72,y:.545,z:.15},        // things you can take and use
          {type:'item',kind:'umbrella',x:2.78,z:2.28},
          // places on the open floor where people do things
          {type:'spot',kind:'window',x:-.5,z:-1.95,yaw:Math.PI,pose:'window',label:'看海'},
          {type:'spot',kind:'window',x:.6,z:-1.95,yaw:Math.PI,pose:'window',label:'看海'},
          {type:'spot',kind:'stretch',x:1.75,z:1.3,yaw:Math.PI,pose:'stretch',label:'伸展'},
          {type:'spot',kind:'dance',x:-1.85,z:-.95,yaw:Math.PI/2,pose:'dance',label:'跳舞'},
          {type:'spot',kind:'dance',x:-.9,z:-1.25,yaw:-2.2,pose:'dance',label:'跳舞'},
          {type:'spot',kind:'ball',chase:true,pose:'idle',label:'踢籃球'}
        ]},
      {id:'bedroom',name:'臥室',x:5.16,z:-.5,w:4,d:4,
        walls:{
          north:{mat:'wall',open:[{kind:'window',c:0,half:1.1,y0:.75,y1:2.3}]},
          east:{mat:'sage'},south:{mat:'wall'},
          west:null},                                               // the living room's east wall is this room's west wall
        furniture:[
          {type:'rug',x:-.6,z:.3,w:1.6,d:2.2},
          {type:'bed',x:.88,z:-.3,rot:1},
          {type:'wardrobe',x:-.9,z:2},
          {type:'lampCorner',x:1.3,z:1.35},
          {type:'plant',x:-1.55,z:-1.55},
          {type:'art',x:.9,z:2,seed:1},
          {type:'spot',kind:'window',x:-.4,z:-1.5,yaw:Math.PI,pose:'window',label:'看海'}
        ]}
    ],
    balls:[                                                         // 'all' houses get every ball, 'few' get the first two
      {kind:'basket',x:1.7,z:-1.9},{kind:'tennis',x:4.2,z:.6},
      {kind:'beach',x:-1.6,z:1.3},{kind:'bowl',x:2.3,z:.4},
      {kind:'tennis',x:-1.9,z:-.6},{kind:'tennis',x:-1.7,z:-.95},{kind:'tennis',x:-.85,y:.445,z:.75},
      {kind:'orb',x:2.55,z:1.3}
    ]}
};
// a person: looks, working hours (shift, or null for none), bedtime, and character
const person=(name,h,skin,hair,top,bottom,shoe,long,shift,bed,patience,playful,w)=>({name,h,skin,hair,top,bottom,shoe,long,shift,bed,patience,playful,w});
const WORLD={
  name:'夕陽街',
  h:2.8,                                                           // ceiling height, same in every room
  clock:17.4,
  bounds:{x0:-24,x1:28,z0:-9,z1:26},                               // as far as anyone can walk
  street:{z0:6,z1:13,walk:2},                                      // the road runs along x between z0 and z1, with a sidewalk on each side
  start:{x:-5.5,z:5.1,yaw:-1.2,pitch:-.03},
  rides:[{kind:'car',x:-20,z:2.4,h:-Math.PI/2},{kind:'bike',x:.2,z:3.3,h:-Math.PI/2}],   // things you can ride. h = which way it points (0 is along +x)                                       // your car, parked by the kerb. h = which way it points (0 is along +x)                        // where you stand when the page opens
  lots:[
    {no:1,tpl:'cottage',x:0,z:0,ext:0xe9dccb,accent:0x1c4a50,roof:0x3a3140,door:0xd9623f,balls:'all',people:[
      person('小美',1.64,0xe8b996,0x2a1a16,0xd9623f,0xe9dfcf,0xf4f0e8,true,[9,17],[22,8],.8,.4,{energy:1,fun:.9,fit:.7,calm:1.2,care:1.2}),
      person('阿傑',1.78,0xc98f68,0x15110f,0x1f6a6e,0x27304a,0x202024,false,[22,6],[8,16],.35,.9,{energy:1,fun:1.2,fit:1.2,calm:.7,care:.6})]},
    {no:3,tpl:'cottage',x:13.5,z:0,ext:0xcfdfd9,accent:0x7a3b4a,roof:0x2f3b3a,door:0x1f6a6e,balls:'few',people:[
      person('老陳',1.68,0xd9a57e,0xc9c5be,0x6b7a4a,0x4a4038,0x3a2a20,false,null,[21,6],.95,.2,{energy:1,fun:.7,fit:.6,calm:1.5,care:1.4}),
      person('秀蘭',1.56,0xe6b594,0xd8d2cc,0x8a4a6a,0x3b3550,0x2a2030,true,null,[21,6],.9,.3,{energy:1,fun:.9,fit:.8,calm:1.3,care:1.5})]},
    {no:5,tpl:'cottage',x:-13.5,z:0,ext:0xe8cfc0,accent:0x3b4a7a,roof:0x40302c,door:0xe0a45c,balls:'few',people:[
      person('小安',1.6,0xf0c8a8,0x3a2418,0xf2c23d,0x2b3a67,0xffffff,true,[8,15],[22,7],.5,.85,{energy:1,fun:1.3,fit:1.1,calm:.7,care:.7})]},
    {no:2,tpl:'cottage',x:-4,z:19,flip:true,ext:0xd9d3e6,accent:0x4a3b5a,roof:0x33303d,door:0x2b3a67,balls:'few',people:[
      person('大衛',1.82,0xb87f5a,0x1a1412,0xb5533a,0x3a3a3a,0x151515,false,[7,16],[22,6],.6,.6,{energy:1,fun:1,fit:1.3,calm:.8,care:.8}),
      person('莉莉',1.66,0xf2d0b4,0x7a4a22,0x7fb8a6,0xf0e8dc,0xd9623f,true,[13,21],[0,9],.7,.5,{energy:1,fun:1.1,fit:.9,calm:1,care:1.1})]},
    {no:4,tpl:'cottage',x:10,z:19,flip:true,ext:0xe6dfc8,accent:0x5a4a2a,roof:0x3d3630,door:0x7a3b4a,balls:'few',people:[
      person('阿明',1.74,0xcf9a72,0x241a14,0x3b4a7a,0x6a5a48,0x2a2420,false,[10,19],[23,8],.45,.7,{energy:1,fun:1.1,fit:1,calm:.9,care:.9})]}
  ],
  // people who do not live here: they walk in from one end of the street, do something, and walk out the other end
  visitors:[
    person('阿寬',1.8,0xb98a62,0x101010,0xf25c3d,0x1c1c22,0xf4f4f4,false,null,[23,6],.5,.8,{energy:1,fun:1,fit:1.6,calm:.8,care:.5}),
    person('婷婷',1.62,0xf0cfb2,0x5a3418,0x9ad0c2,0x34405a,0xe8e0d0,true,null,[23,6],.75,.5,{energy:1,fun:1,fit:.9,calm:1.4,care:.5}),
    person('老王',1.7,0xd2a078,0x8a8a8a,0x5a4a6a,0x2a2a2a,0x1a1a1a,false,null,[23,6],.9,.2,{energy:1,fun:1,fit:.8,calm:1.5,care:.5})
  ],
  outdoor:[
    // trees
    {type:'tree',x:-15.6,z:3.4},{type:'tree',x:-8.4,z:3.5,s:.85},{type:'tree',x:4.6,z:3.4,s:.9},{type:'tree',x:18.6,z:3.4},{type:'tree',x:24.5,z:2.5,s:1.15},
    {type:'tree',x:-13.5,z:15.8,s:.9},{type:'tree',x:-18.5,z:18.5,s:1.2},{type:'tree',x:4.4,z:15.7,s:.85},
    {type:'tree',x:17,z:19.5,s:1.1},{type:'tree',x:21.5,z:23},{type:'tree',x:25.5,z:17.5,s:.9},{type:'tree',x:25,z:22,s:1.2},
    // street lamps: their arm reaches over the road
    {type:'streetLamp',x:-18,z:5.8},{type:'streetLamp',x:-6,z:5.8},{type:'streetLamp',x:6,z:5.8},{type:'streetLamp',x:18,z:5.8},
    {type:'streetLamp',x:-12,z:13.2,rot:2},{type:'streetLamp',x:0,z:13.2,rot:2},{type:'streetLamp',x:12,z:13.2,rot:2},{type:'streetLamp',x:24,z:13.2,rot:2},
    // the little park
    {type:'vending',x:16.2,z:15.75,rot:2},{type:'vending',x:-7.4,z:3.45},
    {type:'bench',x:19.5,z:16.4},{type:'bench',x:22.6,z:19.6,rot:3},
    // where people leave for work and come back
    {type:'spot',kind:'exit',x:-23.2,z:5,yaw:-Math.PI/2,pose:'idle',hide:true,shared:true,label:'上班'},
    {type:'spot',kind:'exit',x:27.2,z:5,yaw:Math.PI/2,pose:'idle',hide:true,shared:true,label:'上班'},
    {type:'spot',kind:'exit',x:-23.2,z:14,yaw:-Math.PI/2,pose:'idle',hide:true,shared:true,label:'上班'},
    {type:'spot',kind:'exit',x:27.2,z:14,yaw:Math.PI/2,pose:'idle',hide:true,shared:true,label:'上班'},
    // places to walk to
    {type:'spot',kind:'stroll',x:8.8,z:-7.6,yaw:Math.PI,pose:'window',shared:true,label:'在海邊看海'},
    {type:'spot',kind:'stroll',x:-4.7,z:-7.6,yaw:Math.PI,pose:'window',shared:true,label:'在海邊看海'},
    {type:'spot',kind:'stroll',x:21.5,z:17.6,yaw:.6,pose:'stretch',shared:true,label:'在公園伸展'}
  ]
};
const RH=WORLD.h,WALL_T=.16,WB=WORLD.bounds;
// make the real houses: one copy of the template per lot, moved (and turned around if flip is set)
const FLIP={north:'south',south:'north',east:'west',west:'east'};
const houses=WORLD.lots.map((L,i)=>{
  const T=TEMPLATES[L.tpl],f=L.flip?-1:1;
  const H={id:i,no:L.no,lot:L,S:{lamp:false,tv:false,neon:true},dev:{lamps:[],tvs:[],neons:[]},basket:null,mats:{}};
  H.rooms=T.rooms.map(R=>{const W={};
    for(const s of['north','east','south','west']){const src=R.walls[L.flip?FLIP[s]:s];
      W[s]=src?Object.assign({},src,{open:(src.open||[]).map(o=>Object.assign({},o,{c:o.c*f}))}):null;}
    const cx=L.x+R.x*f,cz=L.z+R.z*f;
    return{id:R.id,name:R.name,house:H,w:R.w,d:R.d,walls:W,cx,cz,x0:cx-R.w/2,x1:cx+R.w/2,z0:cz-R.d/2,z1:cz+R.d/2,
      furniture:R.furniture.map(it=>Object.assign({},it,{x:(it.x||0)*f,z:(it.z||0)*f,rot:(it.rot||0)+(L.flip?2:0)}))};});
  H.balls=(L.balls==='all'?T.balls:T.balls.slice(0,2)).map(b=>Object.assign({},b,{x:L.x+b.x*f,z:L.z+b.z*f}));
  H.x0=Math.min(...H.rooms.map(r=>r.x0))-WALL_T;H.x1=Math.max(...H.rooms.map(r=>r.x1))+WALL_T;
  H.z0=Math.min(...H.rooms.map(r=>r.z0))-WALL_T;H.z1=Math.max(...H.rooms.map(r=>r.z1))+WALL_T;
  return H;
});
const rooms=houses.flatMap(H=>H.rooms);
function roomAt(x,z){for(const r of rooms)if(x>=r.x0-WALL_T&&x<=r.x1+WALL_T&&z>=r.z0-WALL_T&&z<=r.z1+WALL_T)return r;return null;}   // doorways count as inside
function inWorld(x,z,m){return x>WB.x0+m&&x<WB.x1-m&&z>WB.z0+m&&z<WB.z1-m;}
function houseDist(H,x,z){return Math.hypot(Math.max(H.x0-x,0,x-H.x1),Math.max(H.z0-z,0,z-H.z1));}
