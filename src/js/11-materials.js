/* ---------- materials ---------- */
const [woodMap,woodBump]=woodTextures();
const plaster=noiseBump(256,2600,1,5,1.5), weave=weaveBump(7);
const M={
  floor:new THREE.MeshStandardMaterial({map:woodMap,bumpMap:woodBump,bumpScale:.006,roughness:.3}),
  wall:new THREE.MeshStandardMaterial({color:0xe4dacb,bumpMap:plaster,bumpScale:.003,roughness:.92}),
  sage:new THREE.MeshStandardMaterial({color:0x8c9a7e,bumpMap:plaster,bumpScale:.003,roughness:.9}),
  accent:new THREE.MeshStandardMaterial({color:0x1c4a50,bumpMap:plaster,bumpScale:.003,roughness:.88}),
  ceil:new THREE.MeshStandardMaterial({color:0xf1ece4,roughness:.95}),
  trim:new THREE.MeshStandardMaterial({color:0xf4efe6,roughness:.55}),
  walnut:new THREE.MeshStandardMaterial({color:0x56351f,roughness:.48,bumpMap:woodBump,bumpScale:.002}),
  sofa:new THREE.MeshStandardMaterial({color:0xd9cdbb,bumpMap:weave,bumpScale:.006,roughness:.95}),
  coral:new THREE.MeshStandardMaterial({color:0xc4553b,bumpMap:weave,bumpScale:.006,roughness:.9}),
  teal:new THREE.MeshStandardMaterial({color:0x1f6a6e,bumpMap:weave,bumpScale:.006,roughness:.9}),
  linen:new THREE.MeshStandardMaterial({color:0xefe4d2,bumpMap:weave,bumpScale:.004,roughness:1}),
  black:new THREE.MeshStandardMaterial({color:0x0c0c0e,roughness:.35,metalness:.9}),
  brass:new THREE.MeshStandardMaterial({color:0xb48a48,roughness:.24,metalness:1}),
  glass:new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.03,metalness:0,transparent:true,opacity:.1,depthWrite:false}),
  ceramic:new THREE.MeshStandardMaterial({color:0xe9e2d6,roughness:.25}),
  terracotta:new THREE.MeshStandardMaterial({color:0xa9583a,roughness:.8}),
  leaf:new THREE.MeshStandardMaterial({color:0x2c6a34,roughness:.5}),
  grass:new THREE.MeshStandardMaterial({map:speckle('#557a3c',5000,.16),roughness:1}),
  asphalt:new THREE.MeshStandardMaterial({map:speckle('#3a3a40',5000,.12),roughness:.85,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),
  concrete:new THREE.MeshStandardMaterial({map:speckle('#aaa49b',3500,.1,true),roughness:.9,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
  paint:new THREE.MeshStandardMaterial({color:0xe8e4d8,roughness:.7,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),
  sand:new THREE.MeshStandardMaterial({map:speckle('#d9c59a',4000,.1),roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),
  water:new THREE.MeshStandardMaterial({color:0x2a6f9a,roughness:.24,metalness:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
  bark:new THREE.MeshStandardMaterial({color:0x4a3626,roughness:.95}),
  crown:new THREE.MeshStandardMaterial({color:0x3f7a3a,roughness:.9,flatShading:true}),
  crown2:new THREE.MeshStandardMaterial({color:0x5a8a3c,roughness:.9,flatShading:true}),
  steel:new THREE.MeshStandardMaterial({color:0x2a2c32,roughness:.5,metalness:.7}),
  rug:new THREE.MeshStandardMaterial({map:rugTexture(),bumpMap:weave,bumpScale:.01,roughness:1})
};
