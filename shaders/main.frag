precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform vec2 imageResolution;
uniform float time;

varying vec2 vUv;

#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)
#pragma glslify: getExistence = require(./getExistence.glsl)

void main() {
  vec2 uv = vUv;

  float existence = getExistence(uv, time);
  float alpha = 1. - pow(existence, 0.02);
  if (alpha == 0.) discard;

  uv = adjustRatio(uv, imageResolution, resolution);
  vec3 color = texture2D(image, uv).rgb;

  gl_FragColor = vec4(color, alpha);
  // gl_FragColor = vec4(color, 1.);
  // gl_FragColor = vec4(vec3(existence), 1.);
}
