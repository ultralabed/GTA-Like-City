/* ---------- house data ---------- */
// Everything that makes THIS house this house. Change the numbers and the house changes;
// nothing below this file knows where the sofa is. Units are metres; x is left-right, z is front-back.
//
// A room:  x,z = where its middle is in the house.  w,d = how wide and deep it is inside.
// walls:   one entry per side. mat = material name. open = holes in that wall:
//            {kind:'window', c, half, y0, y1}   c = where along the wall (in the room's own x or z)
//            {kind:'door',   c, half, y1}       an open doorway you can walk through
//          a side set to null has no wall of its own: the room next door already built it.
// furniture: positions are measured from the middle of the room. rot = quarter turns (0, 1, 2, 3).
const HOUSE={
  h:2.8,                                                       // ceiling height, same in every room
  start:{x:1.9,z:1.3,yaw:.62,pitch:-.06},                         // where you stand when the page opens
  clock:18.67,
  rooms:[
    {id:'living',name:'客廳',x:0,z:0,w:6,d:5,
      walls:{
        north:{mat:'wall',open:[{kind:'window',c:0,half:1.7,y0:.45,y1:2.45}]},
        east:{mat:'accent',open:[{kind:'door',c:.2,half:.45,y1:2.1}]},
        south:{mat:'wall'},west:{mat:'wall'}},
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
        {type:'door',x:1.9,z:2.5},
        // places on the open floor where people do things
        {type:'spot',kind:'window',x:-.5,z:-1.95,yaw:Math.PI,pose:'window',label:'看海'},
        {type:'spot',kind:'window',x:.6,z:-1.95,yaw:Math.PI,pose:'window',label:'看海'},
        {type:'spot',kind:'stretch',x:1.75,z:1.4,yaw:Math.PI,pose:'stretch',label:'伸展'},
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
  balls:[
    {kind:'basket',x:1.7,z:-1.9},{kind:'beach',x:-1.6,z:1.3},{kind:'bowl',x:2.3,z:.4},
    {kind:'tennis',x:-1.9,z:-.6},{kind:'tennis',x:-1.7,z:-.95},{kind:'tennis',x:-.85,y:.445,z:.75},
    {kind:'orb',x:2.4,z:1.9},{kind:'tennis',x:4.2,z:.6}
  ],
  people:[
    {name:'小美',h:1.64,skin:0xe8b996,hair:0x2a1a16,top:0xd9623f,bottom:0xe9dfcf,shoe:0xf4f0e8,long:true,
      shift:[9,17],bed:[22,8],patience:.8,playful:.4,w:{energy:1,fun:.9,fit:.7,calm:1.2,care:1.2}},
    {name:'阿傑',h:1.78,skin:0xc98f68,hair:0x15110f,top:0x1f6a6e,bottom:0x27304a,shoe:0x202024,
      shift:[22,6],bed:[8,16],patience:.35,playful:.9,w:{energy:1,fun:1.2,fit:1.2,calm:.7,care:.6}}
  ]
};
const RH=HOUSE.h,WALL_T=.16;
// each room's inside edges, and the box that holds the whole house
const rooms=HOUSE.rooms.map(R=>Object.assign({},R,{cx:R.x,cz:R.z,x0:R.x-R.w/2,x1:R.x+R.w/2,z0:R.z-R.d/2,z1:R.z+R.d/2}));
const HB={x0:Math.min(...rooms.map(r=>r.x0)),x1:Math.max(...rooms.map(r=>r.x1)),z0:Math.min(...rooms.map(r=>r.z0)),z1:Math.max(...rooms.map(r=>r.z1))};
const HC={x:(HB.x0+HB.x1)/2,z:(HB.z0+HB.z1)/2};
function roomAt(x,z){return rooms.find(r=>x>=r.x0-WALL_T&&x<=r.x1+WALL_T&&z>=r.z0-WALL_T&&z<=r.z1+WALL_T)||null;}   // doorways count as inside
