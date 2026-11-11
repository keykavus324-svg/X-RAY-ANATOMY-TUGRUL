import * as THREE from 'three';

/**
 * Radiograph-style shaders.
 *
 * Three looks share one shader body; the differences are blending, depth and how the
 * surface is lit.  Every material also carries the "reveal" uniforms that carve the
 * cut-away plane or the circular X-ray lens out of the model, in local model space so
 * the opening turns with the head.
 */

export const createGlobals = () => ({
  uBrightness: { value: 1.15 },
  uOpacity: { value: 1.0 },
  uRevealMode: { value: 0 },       // 0 none · 1 plane X · 2 plane Y · 3 lens
  uAxis: { value: new THREE.Vector3(1, 0, 0) },
  uCut: { value: 0.0 },
  uFeather: { value: 0.02 },
  uLensCenter: { value: new THREE.Vector2(0, 0) },  // physical pixels, origin bottom-left
  uLensRadius: { value: 120.0 },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uLightDir: { value: new THREE.Vector3(-0.35, 0.55, 0.76).normalize() },
});

const REVEAL_GLSL = /* glsl */`
  uniform int uRevealMode;
  uniform vec3 uAxis;
  uniform float uCut;
  uniform float uFeather;
  uniform vec2 uLensCenter;
  uniform float uLensRadius;
  uniform vec2 uResolution;
  varying vec3 vLocal;

  float revealMask() {
    if (uRevealMode == 0) return 1.0;
    if (uRevealMode == 3) {
      float d = distance(gl_FragCoord.xy, uLensCenter);
      float f = max(uLensRadius * 0.45, 1.0);
      return 1.0 - smoothstep(uLensRadius - f, uLensRadius, d);
    }
    float s = dot(vLocal, uAxis) - uCut;
    float f = max(uFeather, 0.0008);
    return 1.0 - smoothstep(-f, f, s);
  }
`;

const VERT = /* glsl */`
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG_XRAY = /* glsl */`
  precision highp float;
  uniform vec3 uColor;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform float uHighlight;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  ${REVEAL_GLSL}
  void main() {
    float mask = revealMask();
    if (mask < 0.004) discard;
    vec3 N = normalize(vNormalV);
    vec3 V = normalize(-vViewPos);
    float facing = abs(dot(N, V));
    // Thin edges of a shell read as dense bone; the flat interior reads as soft tissue.
    float rim = pow(1.0 - facing, 2.0);
    float body = 0.055 + 0.30 * pow(facing, 0.75);
    float sheen = 0.72 + 0.28 * max(dot(N, normalize(vec3(-0.3, 0.6, 0.75))), 0.0);
    vec3 col = uColor * (body + rim * 1.15) * sheen * uBrightness;
    col = mix(col, mix(uColor, vec3(1.0), 0.35) * (body + rim * 1.7) * 1.35 * uBrightness, uHighlight * 0.85);
    float a = (0.10 + rim * 0.55 + uHighlight * 0.25) * uOpacity * mask;
    gl_FragColor = vec4(col, a);
  }
`;

const FRAG_SOLID = /* glsl */`
  precision highp float;
  uniform vec3 uColor;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform float uHighlight;
  uniform vec3 uLightDir;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  ${REVEAL_GLSL}
  void main() {
    float mask = revealMask();
    if (mask < 0.004) discard;
    vec3 N = normalize(vNormalV);
    vec3 V = normalize(-vViewPos);
    if (dot(N, V) < 0.0) N = -N;
    vec3 L = normalize(uLightDir);
    float key = max(dot(N, L), 0.0);
    float fill = max(dot(N, normalize(vec3(0.7, -0.35, 0.6))), 0.0) * 0.28;
    float rim = pow(1.0 - abs(dot(N, V)), 2.4) * 0.62;
    float sky = 0.5 + 0.5 * N.y;
    vec3 base = uColor * (0.16 + 0.10 * sky + 0.72 * key + fill);
    base += uColor * rim;
    base = mix(base, mix(uColor, vec3(1.0), 0.25) * 1.35, uHighlight * 0.6);
    gl_FragColor = vec4(base * uBrightness, uOpacity * mask);
  }
`;

const FRAG_WIRE = /* glsl */`
  precision highp float;
  uniform vec3 uColor;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform float uHighlight;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  ${REVEAL_GLSL}
  void main() {
    float mask = revealMask();
    if (mask < 0.004) discard;
    vec3 N = normalize(vNormalV);
    vec3 V = normalize(-vViewPos);
    float facing = abs(dot(N, V));
    float glow = 0.35 + 0.65 * pow(1.0 - facing, 1.6);
    vec3 col = uColor * glow * uBrightness * (1.0 + uHighlight * 0.8);
    gl_FragColor = vec4(col, (0.30 + 0.3 * uHighlight) * uOpacity * mask);
  }
`;

/** Build one material per look.  All looks share the same uniform objects so a state
 *  change (brightness, reveal…) is written once. */
export function createLookSet(colorHex, globals, highlight = 0) {
  const shared = { ...globals, uColor: { value: new THREE.Color(colorHex) }, uHighlight: { value: highlight } };

  const xray = new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: VERT,
    fragmentShader: FRAG_XRAY,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const solid = new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: VERT,
    fragmentShader: FRAG_SOLID,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });

  const wire = new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: VERT,
    fragmentShader: FRAG_WIRE,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    wireframe: true,
  });

  // Dimmed copy used when one structure is highlighted and the rest should step back.
  const ghost = new THREE.ShaderMaterial({
    uniforms: { ...shared, uOpacity: { value: 0.28 } },
    vertexShader: VERT,
    fragmentShader: FRAG_XRAY,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  return { xray, solid, wire, ghost, shared };
}

export const LOOK_ORDER = ['xray', 'solid', 'wire'];
