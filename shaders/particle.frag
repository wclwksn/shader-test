precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform vec2 imageResolution;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec3 ambientColor;
uniform vec3 eyeDirection;

varying vec2 vUv;
varying vec3 vNormal;
varying float vAlpha;

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)

const float radian = 0.;
const vec3 axis = normalize(vec3(0., 1., 0.));

void main() {
  if (vAlpha == 0.) discard;

  vec2 uv = vUv;
  uv = adjustRatio(uv, imageResolution, resolution);

  vec4 color = texture2D(image, uv);

  // vec3 resultNormal = rotateQ(axis, radian) * vNormal;
  vec3 resultNormal = vNormal;
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.)).xyz;
  vec3 invEye = normalize(invMatrix * vec4(eyeDirection, 0.)).xyz;
  vec3 halfLE = normalize(invLight + invEye);
  float diffuse = clamp(dot(resultNormal, invLight), 0.1, 1.);
  float specular = pow(clamp(dot(resultNormal, halfLE), 0., 1.), 50.);
  color.rgb *= vec3(diffuse);
  color.rgb += vec3(specular);
  color.rgb += ambientColor;

	vec2 p = gl_PointCoord * 2. - 1.;
  color.a *= 1. - smoothstep(0.8, 1., length(p));
  color.a *= vAlpha;

  gl_FragColor = color;
}
