precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform vec2 imageResolution;
uniform float time;
uniform float margin;

#pragma glslify: ease = require(glsl-easings/sine-out)
#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)
#pragma glslify: getZoomedUv = require(./modules/getZoomedUv.glsl)

const float minZoom = 0.9;
const float delay = 2.;

void main() {
  vec2 pictureResolution = resolution - vec2(margin * 2.);

  vec2 uv = (gl_FragCoord.st - vec2(margin)) / pictureResolution;
  uv.y = 1. - uv.y;
  uv = adjustRatio(uv, imageResolution, pictureResolution);

  float cTime = ease(max(time * (1. + delay) - delay, 0.));

  float zoom = mix(minZoom, 1., cTime);
  uv = getZoomedUv(uv, zoom);
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) discard;

  float alpha = cTime;

  vec3 color = texture2D(image, uv).rgb;

  gl_FragColor = vec4(color, alpha);
}
