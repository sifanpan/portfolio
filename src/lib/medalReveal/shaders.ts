export const MEDAL_VERT = `#version 300 es
precision highp float;

in vec2 aPos;
out vec2 vUv;

void main() {
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

export const MEDAL_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uBase;
uniform sampler2D uNormal;
uniform sampler2D uReveal;
uniform vec2 uLight;
uniform float uTime;
uniform float uIntro;
uniform float uClaimed;
uniform float uAspect;

void main() {
  vec2 uv = vUv;
  vec2 p = uv - 0.5;
  p.x *= uAspect;
  float vignette = smoothstep(0.72, 0.28, length(p));

  float reveal = texture(uReveal, uv).r;
  reveal = max(reveal, uIntro);
  reveal = max(reveal, uClaimed);

  vec3 base = texture(uBase, uv).rgb;
  float baseAlpha = texture(uBase, uv).a;
  vec3 nmap = texture(uNormal, uv).rgb * 2.0 - 1.0;
  nmap.z = max(nmap.z, 0.35);
  nmap = normalize(nmap);

  vec2 toLight = uLight - uv;
  toLight.x *= uAspect;
  vec3 lightDir = normalize(vec3(toLight, 0.22));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  float diff = max(dot(nmap, lightDir), 0.0);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(nmap, halfDir), 0.0), 48.0);

  // reveal layer: color base + dynamic metal sheen (engraving handled by DOM relief-base.png)
  vec3 metal = base * (0.22 + diff * 0.78) + vec3(spec * 0.95);

  float revealMix = smoothstep(0.02, 0.22, reveal);
  if (baseAlpha < 0.01 || revealMix < 0.004) discard;

  vec3 color = metal + vec3(spec * 0.25 * revealMix);

  float rim = smoothstep(0.38, 0.08, length(p)) * revealMix * 0.12;
  color += rim * vec3(0.85, 0.78, 0.65);

  color *= 0.88 + vignette * 0.12;
  outColor = vec4(color, baseAlpha * revealMix);
}
`

/** monochrome relief + eraser reveal base (style v1 → relief-style-v1/) */
export const RELIEF_ERASE_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uBase;
uniform sampler2D uNormal;
uniform sampler2D uHeight;
uniform sampler2D uReveal;
uniform sampler2D uBackground;
uniform sampler2D uBgReveal;
uniform vec3 uBgColor;
uniform vec2 uTexel;
uniform vec4 uMedalRect;
uniform float uViewAspect;
uniform float uBgAspect;
uniform float uFlowUnderlay;

vec2 coverUv(vec2 uv, float viewAspect, float imageAspect) {
  vec2 p = uv - 0.5;
  if (viewAspect > imageAspect) {
    p.y *= viewAspect / imageAspect;
  } else {
    p.x *= imageAspect / viewAspect;
  }
  return p + 0.5;
}

void main() {
  vec2 uv = vUv;

  float bgReveal = texture(uBgReveal, uv).r;
  float bgMix = bgReveal > 0.055 ? smoothstep(0.10, 0.92, bgReveal) : 0.0;
  vec3 bgImage = texture(uBackground, coverUv(uv, uViewAspect, uBgAspect)).rgb;
  vec3 scene = mix(uBgColor, bgImage, bgMix);

  vec2 muv = vec2((uv.x - uMedalRect.x) / uMedalRect.z, (uv.y - uMedalRect.y) / uMedalRect.w);
  bool inMedalBox = muv.x >= 0.0 && muv.x <= 1.0 && muv.y >= 0.0 && muv.y <= 1.0;
  if (!inMedalBox) {
    if (uFlowUnderlay > 0.5) discard;
    outColor = vec4(scene, 1.0);
    return;
  }

  float alpha = texture(uBase, muv).a;
  if (alpha < 0.01) {
    if (uFlowUnderlay > 0.5) discard;
    outColor = vec4(scene, 1.0);
    return;
  }

  float reveal = texture(uReveal, muv).r;
  float revealMix = reveal > 0.055 ? smoothstep(0.10, 0.92, reveal) : 0.0;

  // flow screen 1: gray relief via DOM underlay; WebGL only stacks color medal by erase mask
  if (uFlowUnderlay > 0.5) {
    vec3 base = texture(uBase, muv).rgb;
    outColor = vec4(base, alpha * revealMix);
    return;
  }

  // height field → soft volumetric normals (gradient, not line art)
  float spread = 3.0;
  float hL = texture(uHeight, muv - vec2(uTexel.x * spread, 0.0)).r;
  float hR = texture(uHeight, muv + vec2(uTexel.x * spread, 0.0)).r;
  float hU = texture(uHeight, muv + vec2(0.0, uTexel.y * spread)).r;
  float hD = texture(uHeight, muv - vec2(0.0, uTexel.y * spread)).r;
  vec3 formNormal = normalize(vec3((hL - hR) * 2.0, (hD - hU) * 2.0, 0.26));

  vec3 detail = texture(uNormal, muv).rgb * 2.0 - 1.0;
  detail.xy *= 0.3;
  detail.z = max(detail.z, 0.44);
  detail = normalize(detail);
  vec3 nmap = normalize(mix(formNormal, detail, 0.32));

  vec3 lightDir = normalize(vec3(0.44, -0.38, 0.84));
  float key = dot(nmap, lightDir);
  float lit = pow(clamp((key + 0.30) / 1.30, 0.0, 1.0), 0.62);

  float shadow = pow(1.0 - lit, 1.12);
  float shade = 1.0 - shadow * 0.30;
  vec3 relief = uBgColor * shade;

  vec3 base = texture(uBase, muv).rgb;
  vec3 color = mix(relief, base, revealMix);

  outColor = vec4(color, alpha * revealMix);
}
`
