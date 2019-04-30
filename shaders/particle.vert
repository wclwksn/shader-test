attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform vec2 resolution;
uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec4 ambientColor;
uniform vec3 eyeDirection;
uniform float time;

varying vec2 vUv;
varying vec4 vModelColor;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: getExistence = require(./getExistence.glsl)

const vec4 color = vec4(vec3(0.5), 1.);
const float radian = 0.;
const vec3 axis = normalize(vec3(0., 1., 0.));

void main() {
  // vec3 resultNormal = rotateQ(axis, radian) * normal;
  vec3 resultNormal = normal;
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.)).xyz;
  vec3 invEye = normalize(invMatrix * vec4(eyeDirection, 0.)).xyz;
  vec3 halfLE = normalize(invLight + invEye);
  float diffuse = clamp(dot(resultNormal, invLight), 0.1, 1.);
  float specular = pow(clamp(dot(resultNormal, halfLE), 0., 1.), 50.);

  vUv = uv;

  vModelColor = vec4(1.);
  // vModelColor *= vec4(vec3(diffuse), 1.) + vec4(vec3(specular), 1.);
  vModelColor += ambientColor;

  float existence = getExistence(uv, time);
  existence = max(existence - 0.01, 0.);

  float noise = snoise3(vec3(uv, snoise2(uv)));

  vec4 cPosition = vec4(position, 1.);
  cPosition.x += existence * noise * resolution.x * 0.01;
  cPosition.y += sin(existence * noise * 3.) * resolution.y * 0.001;
  cPosition.z += existence * mix(0.8, 1., noise) * 20.;

  vModelColor.a *= min(1. - existence * 0.5, 1.);

  gl_Position = mvpMatrix * cPosition;
  gl_PointSize = mix(0.7, 3., existence * 0.1);
}
