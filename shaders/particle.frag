precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform vec2 imageResolution;

varying vec2 vUv;
varying vec4 vModelColor;

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)

void main() {
  if (vModelColor.a == 0.) discard;

  vec2 uv = vUv;
  uv = adjustRatio(uv, imageResolution, resolution);

  vec4 color = texture2D(image, uv);
  color *= vModelColor;

  gl_FragColor = color;
}
