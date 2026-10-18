/* ==========================================================================
   Shaders propios: llama, líquidos (lava / miasma / vacío), bruma y pase final
   ========================================================================== */
const GLSL_NOISE = `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash12(i),hash12(i+vec2(1.,0.)),f.x), mix(hash12(i+vec2(0.,1.)),hash12(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
`;

const SHADERS = {
  flameMat(colA, colB, scale = 1) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColA: { value: new THREE.Color(colA) }, uColB: { value: new THREE.Color(colB) }, uSeed: { value: Math.random() * 100 }, uInt: { value: 1 } },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float sx = length(modelMatrix[0].xyz), sy = length(modelMatrix[1].xyz);
          mv.xy += position.xy * vec2(sx, sy);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: GLSL_NOISE + `
        uniform float uTime, uSeed, uInt; uniform vec3 uColA, uColB; varying vec2 vUv;
        void main(){
          vec2 uv = vUv; float x = (uv.x - .5) * 2.;
          float t = uTime * 1.7 + uSeed;
          float n = fbm(vec2(x * 1.6 + uSeed, uv.y * 2.6 - t * 2.1));
          float w = (0.62 * (1. - uv.y) + 0.05) * (0.55 + 0.9 * n);
          float shape = 1. - smoothstep(0.0, 1.0, abs(x + (n - .5) * .5 * uv.y) / max(w, 0.001));
          float body = shape * smoothstep(1.0, 0.1, uv.y + (n - .5) * .45) * smoothstep(0.0, 0.12, uv.y);
          vec3 col = mix(uColB, uColA, smoothstep(0.05, 0.75, body));
          col += vec3(1.0, 0.92, 0.75) * pow(body, 3.0) * 1.2;
          gl_FragColor = vec4(col * body * 2.2 * uInt, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
  },

  liquidMat(kind) {
    const pal = {
      lava: ['#1a0602', '#c2280a', '#ffb347', 1.0],
      necro: ['#020a07', '#0e6b4c', '#9dffcf', 0.7],
      void: ['#030108', '#2a0f55', '#c9a7ff', 0.8]
    }[kind];
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color(pal[0]) }, uB: { value: new THREE.Color(pal[1]) }, uC: { value: new THREE.Color(pal[2]) }, uGain: { value: pal[3] }, uKind: { value: kind === 'lava' ? 0 : kind === 'necro' ? 1 : 2 }, uReveal: { value: 1 } },
      vertexShader: `
        varying vec3 vW; varying vec2 vUv;
        void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_NOISE + `
        uniform float uTime, uGain, uKind, uReveal; uniform vec3 uA, uB, uC; varying vec3 vW; varying vec2 vUv;
        void main(){
          vec2 p = vW.xz * 0.32;
          float t = uTime * (uKind < 0.5 ? 0.12 : 0.08);
          vec2 q = vec2(fbm(p + vec2(t, -t * .6)), fbm(p * 1.3 - vec2(t * .8, t * .3) + 5.2));
          float n = fbm(p * 1.4 + q * 1.8 + vec2(-t * .5, t));
          vec3 col;
          if (uKind < 0.5) {
            float hot = smoothstep(0.42, 0.78, n);
            col = mix(uA, uB, smoothstep(0.25, 0.55, n)) + uC * pow(hot, 2.2) * 2.5;
            float crust = smoothstep(0.38, 0.30, n);
            col = mix(col, uA * 0.6, crust * 0.85);
          } else if (uKind < 1.5) {
            col = mix(uA, uB, smoothstep(0.3, 0.75, n)) + uC * pow(smoothstep(0.62, 0.9, n), 2.0) * 1.6;
            float ring = sin((n + t * 2.) * 40.) * .5 + .5; col += uB * ring * 0.08;
          } else {
            float sw = fbm(p * 0.7 + vec2(sin(t * 3.), cos(t * 2.)) * 0.6);
            col = mix(uA, uB, smoothstep(0.35, 0.85, sw) * 0.8);
            vec2 g = floor(vW.xz * 6.0);
            float st = step(0.985, hash12(g)) * (0.5 + 0.5 * sin(uTime * 3.0 + hash12(g + 3.) * 30.));
            col += uC * st * 2.0 + uC * pow(smoothstep(0.6, 0.95, n), 3.0) * 0.8;
          }
          gl_FragColor = vec4(col * uGain * uReveal, 1.0);
        }`
    });
  },

  mistMat(color) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uAlpha: { value: 0.0 } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_NOISE + `
        uniform float uTime, uAlpha; uniform vec3 uColor; varying vec3 vW;
        void main(){
          vec2 p = vW.xz * 0.12;
          float n = fbm(p + vec2(uTime * 0.025, uTime * 0.012));
          float m = fbm(p * 2.2 - vec2(uTime * 0.04, -uTime * 0.02) + n);
          float a = smoothstep(0.35, 0.85, n * 0.6 + m * 0.6) * uAlpha;
          gl_FragColor = vec4(uColor, a);
        }`,
      transparent: true, depthWrite: false
    });
  },

  /* Haz de luz volumétrico falso (cono aditivo) */
  beamMat(color) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uAlpha: { value: 0.22 } },
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_NOISE + `uniform float uTime, uAlpha; uniform vec3 uColor; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ float f = pow(abs(dot(vN, vV)), 1.5); float n = fbm(vec2(vUv.x * 6.0, vUv.y * 2.0 - uTime * 0.1));
          float a = f * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.6, vUv.y) * (0.6 + 0.6 * n) * uAlpha; gl_FragColor = vec4(uColor * a, 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
  },

  finalPass() {
    return {
      uniforms: {
        tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 },
        uVignette: { value: 0.85 }, uGrain: { value: 0.035 }, uDamage: { value: 0 }, uFlash: { value: 0 },
        uDesat: { value: 0 }, uTilt: { value: 0 }, uFocus: { value: 0.5 }, uChroma: { value: 0.0025 }, uFade: { value: 0 },
        uWarm: { value: new THREE.Color(1.0, 0.93, 0.82) }, uCool: { value: new THREE.Color(0.75, 0.88, 1.08) }, uExposure: { value: 1.0 }
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime, uVignette, uGrain, uDamage, uFlash, uDesat, uTilt, uFocus, uChroma, uFade, uExposure;
        uniform vec3 uWarm, uCool; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        vec3 tex(vec2 uv){ return texture2D(tDiffuse, uv).rgb; }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        void main(){
          vec2 uv = vUv; vec2 d = uv - 0.5;
          vec3 col;
          if (uTilt > 0.001) {
            float b = smoothstep(0.16, 0.6, abs(uv.y - uFocus)) * uTilt;
            vec3 acc = vec3(0.0);
            for (int i = 0; i < 12; i++) { float a = float(i) * 2.39996; float r = sqrt(float(i) + 0.5) / 3.46; acc += tex(uv + vec2(cos(a), sin(a)) * r * b * 9.0 / uRes); }
            col = acc / 12.0;
          } else col = tex(uv);
          float ca = uChroma * dot(d, d) * 4.0;
          if (ca > 0.00001) { col.r = mix(col.r, tex(uv + d * ca).r, 0.85); col.b = mix(col.b, tex(uv - d * ca).b, 0.85); }
          col *= uExposure;
          float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
          // sombras frías, luces cálidas (gradación de vela)
          col *= mix(uCool, uWarm, smoothstep(0.02, 0.35, l));
          col = mix(col, vec3(l), uDesat);
          float vig = smoothstep(1.05, 0.25, length(d * vec2(1.0, 0.9)) * 1.4);
          col *= mix(1.0, vig, uVignette);
          col = mix(col, vec3(0.45, 0.01, 0.01), uDamage * (1.0 - vig * 0.85) * 0.9);
          // hombro suave para los aditivos
          col = mix(col, 0.8 + 0.2 * (1.0 - exp(-(col - 0.8) / 0.2)), step(0.8, col));
          col = toSRGB(max(col, 0.0));
          col += (h(uv * uRes + fract(uTime * 7.3) * 91.0) - 0.5) * uGrain;
          col += uFlash;
          col *= (1.0 - uFade);
          gl_FragColor = vec4(col, 1.0);
        }`
    };
  }
};
