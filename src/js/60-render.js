/* ---------- reflections: photograph the room itself and use it as the mirror image ---------- */
const pmrem=new THREE.PMREMGenerator(renderer);let envRT=null,bakedKey='';
// reflections are re-photographed when you enter another room, or walk a good way down the street
function bakeKey(){const r=roomAt(pos.x,pos.z);return r?r.house.id+r.id:'out'+Math.round(pos.x/16)+','+Math.round(pos.z/16);}
function bakeEnv(){
  const hadDust=dust.visible;dust.visible=false;dyn.visible=false;scene.environment=null;
  M.water.visible=M.glass.visible=false;                              // mirror-like things can catch the sun so brightly that the photo breaks; leave them out
  const r=roomAt(pos.x,pos.z);bakedKey=bakeKey();                     // photograph the room you are standing in, or the street around you
  if(r)scene.position.set(-r.cx,-1.4,-r.cz);else scene.position.set(-pos.x,-1.6,-pos.z);scene.updateMatrixWorld(true);
  const rt=pmrem.fromScene(scene,.03,.05,500);
  scene.position.set(0,0,0);scene.updateMatrixWorld(true);dust.visible=hadDust;dyn.visible=true;M.water.visible=M.glass.visible=true;
  scene.environment=rt.texture;if(envRT)envRT.dispose();envRT=rt;
}

/* ---------- post-processing: bloom + film tone curve ---------- */
let composer=null,finalPass=null;
const canHDR=renderer.capabilities.isWebGL2&&(renderer.extensions.has('EXT_color_buffer_float')||renderer.extensions.has('EXT_color_buffer_half_float'));
if(canHDR&&THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.ShaderPass&&THREE.RenderPass){
  const rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:4});
  composer=new THREE.EffectComposer(renderer,rt);
  composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(256,256),.5,.55,.95));
  finalPass=new THREE.ShaderPass({
    uniforms:{tDiffuse:{value:null},exposure:{value:1},time:{value:0},res:{value:new THREE.Vector2(1,1)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform float exposure;uniform float time;uniform vec2 res;varying vec2 vUv;
      vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
      void main(){vec2 c=vUv-0.5;float d=dot(c,c);vec2 o=c*d*0.006;
        vec3 col=vec3(texture2D(tDiffuse,vUv-o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv+o).b);
        col*=exposure*(1.0-d*0.85);
        float l=dot(col,vec3(0.2126,0.7152,0.0722));
        col=mix(col,col*vec3(0.92,1.0,1.1),clamp(1.0-l*3.0,0.0,1.0)*0.35);
        col=aces(col);col=pow(col,vec3(1.0/2.2));
        float n=fract(sin(dot(vUv*res+time,vec2(12.9898,78.233)))*43758.5453);
        gl_FragColor=vec4(col+(n-0.5)*0.022,1.0);}`
  });
  composer.addPass(finalPass);
}else{
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputEncoding=THREE.sRGBEncoding;
}

function resize(){
  const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;
  renderer.setPixelRatio(pr);renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.fov=w<h?82:68;camera.updateProjectionMatrix();
  if(composer){composer.setPixelRatio(pr);composer.setSize(w,h);finalPass.uniforms.res.value.set(w*pr,h*pr);}
}
addEventListener('resize',resize);resize();
