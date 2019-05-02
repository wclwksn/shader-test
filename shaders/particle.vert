attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform vec2 resolution;
uniform mat4 mvpMatrix;
uniform float time;

varying vec2 vUv;
varying vec3 vNormal;
varying float vAlpha;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: getExistence = require(./getExistence.glsl)

const vec4 color = vec4(vec3(0.5), 1.);

void main() {
  vUv = uv;
  vNormal = normal;

  float existence = getExistence(uv, time);
  existence = max(existence - 0.01, 0.);

  float noise = snoise3(vec3(uv, snoise2(uv)));

  vec4 cPosition = vec4(position, 1.);
  cPosition.x += existence * noise * resolution.x * 0.01;
  cPosition.y += sin(existence * noise * 3.) * resolution.y * 0.001;
  cPosition.z += existence * mix(0.8, 1., noise) * 20.;

  vAlpha = min(1. - existence * 0.3, 1.);
  // vAlpha = 1.;

  gl_Position = mvpMatrix * cPosition;
  gl_PointSize = mix(1., 3., existence * 0.1);
}
