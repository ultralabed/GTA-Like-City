/* ---------- room data ---------- */
// Everything that makes THIS room this room. Change the numbers and the room changes;
// nothing below this file knows where the sofa is. Units are metres; x is left-right, z is front-back.
// rot turns a piece of furniture in quarter turns (0, 1, 2, 3).
const ROOM={
  name:'夕陽小房間',
  w:6,d:5,h:2.8,
  walls:{west:'wall',east:'accent',south:'wall',north:'wall'},     // material names from the materials file
  window:{half:1.7,y0:.45,y1:2.45},                               // always on the north wall (-z), where the sun is
  start:{x:1.9,z:1.3,yaw:.62,pitch:-.06},                         // where you stand when the page opens
  clock:18.67,
  furniture:[
    {type:'rug',x:-.95,z:.3},
    {type:'tvConsole',x:-3,z:.3},
    {type:'sofa',x:.45,z:.3},
    {type:'coffeeTable',x:-1,z:.3},
    {type:'bookshelf',x:3,z:-1},
    {type:'art',x:-1.3,z:2.5,seed:0},
    {type:'art',x:-.2,z:2.5,seed:1},
    {type:'plant',x:-2.4,z:-1.9},
    {type:'lampCorner',x:-2.45,z:1.95},
    {type:'neon',x:3,z:1.15},
    {type:'door',x:1.9,z:2.5},
    // places on the open floor where people do things
    {type:'spot',kind:'window',x:-.5,z:-1.95,yaw:Math.PI,pose:'window',label:'看海'},
    {type:'spot',kind:'window',x:.6,z:-1.95,yaw:Math.PI,pose:'window',label:'看海'},
    {type:'spot',kind:'stretch',x:1.7,z:.5,yaw:Math.PI,pose:'stretch',label:'伸展'},
    {type:'spot',kind:'dance',x:-1.85,z:-.95,yaw:Math.PI/2,pose:'dance',label:'跳舞'},
    {type:'spot',kind:'dance',x:-.9,z:-1.25,yaw:-2.2,pose:'dance',label:'跳舞'},
    {type:'spot',kind:'ball',chase:true,pose:'idle',label:'踢籃球'}
  ],
  balls:[
    {kind:'basket',x:1.7,z:-1.9},{kind:'beach',x:-1.6,z:1.3},{kind:'bowl',x:2.3,z:.4},
    {kind:'tennis',x:-1.9,z:-.6},{kind:'tennis',x:-1.7,z:-.95},{kind:'tennis',x:-.85,y:.445,z:.75},
    {kind:'orb',x:2.4,z:1.75}
  ],
  people:[
    {name:'小美',h:1.64,skin:0xe8b996,hair:0x2a1a16,top:0xd9623f,bottom:0xe9dfcf,shoe:0xf4f0e8,long:true,
      shift:[9,17],bed:[22,8],patience:.8,playful:.4,w:{energy:1,fun:.9,fit:.7,calm:1.2,care:1.2}},
    {name:'阿傑',h:1.78,skin:0xc98f68,hair:0x15110f,top:0x1f6a6e,bottom:0x27304a,shoe:0x202024,
      shift:[22,6],bed:[8,16],patience:.35,playful:.9,w:{energy:1,fun:1.2,fit:1.2,calm:.7,care:.6}}
  ]
};
const RW=ROOM.w/2,RD=ROOM.d/2,RH=ROOM.h;
