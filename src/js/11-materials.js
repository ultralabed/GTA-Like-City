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
  rug:new THREE.MeshStandardMaterial({map:rugTexture(),bumpMap:weave,bumpScale:.01,roughness:1})
};
