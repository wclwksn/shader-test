precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform sampler2D mask;
uniform vec2 imageResolution;
uniform float time;
uniform float margin;

#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)
#pragma glslify: vignette = require(./modules/vignette.glsl)
#pragma glslify: getExistence = require(./getExistence.glsl)

void main() {
  vec2 pictureResolution = resolution - vec2(margin * 2.);

  vec2 uv = (gl_FragCoord.st - vec2(margin)) / pictureResolution;
  vec2 frameBufferUv = uv;
  uv.y = 1. - uv.y;

  vec2 nPosition = uv * 2. - 1.;

  float existence = getExistence(uv, time, mask);
  existence = smoothstep(0.95, 1., existence);
  float alpha = 1. - existence;

  vec3 color = texture2D(image, adjustRatio(uv, imageResolution, pictureResolution)).rgb;

  // destColor = vignette(destColor, nPosition, 1.5);

  gl_FragColor = vec4(color, alpha);
}
