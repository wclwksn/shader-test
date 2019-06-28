attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec3 ambientColor;
uniform vec3 eyeDirection;

uniform vec2 resolution;
uniform vec2 imageResolution;
uniform sampler2D image;
uniform float time;

varying vec4 vColor;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: ease = require(glsl-easings/quartic-out)
#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)
#pragma glslify: getExistence = require(./getExistence.glsl)

// const float radian = 0.;
// const vec3 axis = normalize(vec3(0., 1., 0.));
const float maxZ = 30.;

void main() {
  float existence = getExistence(uv, time);
  existence = max(existence - 0.95, 0.);
  existence = smoothstep(0., 0.5, existence);
  existence = ease(existence);

  float noise = snoise2(uv * resolution * 0.5) / 0.71;
  float plusNoise = (noise + 1.) / 2.;

  vec4 cPosition = vec4(position, 1.);
  cPosition.x += existence * mix(0.1, 1., plusNoise) * resolution.x * 0.7;
  cPosition.y += existence * noise * resolution.y * 0.2;
  cPosition.z += existence * plusNoise * maxZ;

  vColor = texture2D(image, adjustRatio(uv, imageResolution, resolution));
  vColor *= 1.1;

  // vec3 resultNormal = rotateQ(axis, radian) * normal;
  vec3 resultNormal = normal;
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.)).xyz;
  vec3 invEye = normalize(invMatrix * vec4(eyeDirection, 0.)).xyz;
  vec3 halfLE = normalize(invLight + invEye);
  float diffuse = clamp(dot(resultNormal, invLight), 0.1, 1.);
  float specular = pow(clamp(dot(resultNormal, halfLE), 0., 1.), 50.);
  vColor.rgb *= vec3(diffuse);
  vColor.rgb += vec3(specular);
  vColor.rgb += ambientColor;
  // vColor.rgb = vec3(noise); // * debug

  float alphaNoise = snoise2(uv * resolution * 2.) / 0.71;
  alphaNoise = (alphaNoise + 1.) / 2.;
  vColor.a = 1. - existence * mix(5., 1.5, alphaNoise);
  vColor.a *= 1. - step(existence, 0.);
  // vColor.a = 1.; // * debug

  gl_Position = mvpMatrix * cPosition;
  gl_PointSize = mix(1., 4., cPosition.z / maxZ) * mix(1., 2.5, existence);
  // gl_PointSize = 1.; // * debug
}
