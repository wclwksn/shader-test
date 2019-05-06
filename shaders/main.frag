precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform sampler2D image2;
uniform vec2 imageResolution;
uniform vec2 imageResolution2;
uniform float time;

varying vec2 vUv;

#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)
#pragma glslify: getExistence = require(./getExistence.glsl)

void main() {
  // discard; // * debug
  vec2 uv = vUv;

  float existence = getExistence(uv, time);
  existence = smoothstep(0.95, 1., existence);
  float alpha = 1. - existence;
  // alpha = 1.; // * debug
  // alpha = 1. - existence; // * debug

  vec3 color = texture2D(image, adjustRatio(uv, imageResolution, resolution)).rgb;
  vec3 color2 = texture2D(image2, adjustRatio(uv, imageResolution2, resolution)).rgb;

  gl_FragColor = vec4(mix(color2, color, alpha), 1.);
  // gl_FragColor = vec4(color, 1.); // * debug
  // gl_FragColor = vec4(vec3(existence), 1.); // * debug
}
