precision highp float;

uniform vec2 resolution;
uniform sampler2D image;
uniform sampler2D particle;
uniform sampler2D next;
uniform vec2 imageResolution;
uniform float time;

#pragma glslify: adjustRatio = require(./modules/adjustRatio.glsl)
#pragma glslify: vignette = require(./modules/vignette.glsl)
#pragma glslify: getExistence = require(./getExistence.glsl)

void main() {
  // discard; // * debug
  vec2 uv = gl_FragCoord.st / resolution;
  vec2 frameBufferUv = uv;
  uv.y = 1. - uv.y;

  vec2 nPosition = uv * 2. - 1.;

  float existence = getExistence(uv, time);
  existence = smoothstep(0.95, 1., existence);
  float alpha = 1. - existence;
  // alpha = 1.; // * debug
  // alpha = 1. - existence; // * debug

  vec3 color = texture2D(image, adjustRatio(uv, imageResolution, resolution)).rgb;
  vec3 color2 = texture2D(next, frameBufferUv).rgb;
  vec3 particleColor = texture2D(particle, frameBufferUv).rgb;

  vec3 destColor = mix(color2, color, alpha);

  destColor = vignette(destColor, nPosition, 1.5);

  destColor += particleColor;

  gl_FragColor = vec4(destColor, 1.);
  // gl_FragColor = vec4(particleColor, 1.); // * debug
  // gl_FragColor = vec4(color, 1.); // * debug
  // gl_FragColor = vec4(vec3(existence), 1.); // * debug
  // gl_FragColor = texture2D(next, frameBufferUv); // * debug
}
