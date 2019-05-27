precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform vec2 imageResolution;
uniform float time;

#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)
#pragma glslify: getZoomedUv = require(./modules/getZoomedUv.glsl)

void main() {
  vec2 uv = gl_FragCoord.st / resolution;
  uv.y = 1. - uv.y;
  uv = adjustRatio(uv, imageResolution, resolution);

  float zoom = mix(0.5, 1., time);
  uv = getZoomedUv(uv, zoom);
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) discard;

  float alpha = time;

  vec3 color = texture2D(image, uv).rgb;

  gl_FragColor = vec4(color, alpha);
}
