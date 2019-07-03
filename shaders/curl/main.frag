precision highp float;

uniform float time;

varying vec2 vUv;

#pragma glslify: curlNoise = require(glsl-curl-noise)

const float PI = 3.1415926;
const float PI2 = PI * 2.;

const vec3 color = vec3(192., 235., 252.);
const float maxAlpha = 0.36;
const float minAlpha = 0.01;
const float speed = 0.5;

void main() {
  float cAlpha = mix(minAlpha, maxAlpha, (sin(vUv.x * PI2 + time * speed) + 1.) * 0.5);
  gl_FragColor = vec4(color, cAlpha);
}
