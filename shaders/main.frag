precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform vec2 imageResolution;
uniform float time;

varying vec4 vPosition;

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: getUv = require(./modules/getUv.glsl)
#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)

void main() {
  vec2 uv = getUv(vPosition);

  float existence = snoise3(vec3(uv, 10.));
  existence = mix(0.3, 1., existence);
  existence *= time * 0.5;
  // existence = pow(existence, 2.);
  // existence = step(1., existence);

  uv = adjustRatio(uv, imageResolution, resolution);
  vec3 color = texture2D(image, uv).rgb;

  gl_FragColor = vec4(color, mix(1., 0., step(1., existence)));
  // gl_FragColor = vec4(color, 1.);
  // gl_FragColor = vec4(vec3(existence), 1.);
}
