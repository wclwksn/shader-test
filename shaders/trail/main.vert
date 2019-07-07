attribute vec2 uv;

uniform mat4 mvpMatrix;

uniform vec2 resolution;
uniform sampler2D positionTexture;

varying vec3 vPosition;
varying vec2 vUv;

#pragma glslify: curlNoise = require(glsl-curl-noise)

// const float size = 0.2;

void main() {
  vec3 position = texture2D(positionTexture, uv).xyz;
  // position *= min(resolution.x, resolution.y) * size;
  vPosition = position;
  vUv = uv;

  gl_Position = mvpMatrix * vec4(position, 1.);
  // gl_Position = mvpMatrix * vec4(uv * 100., 0., 1.); // * debug
  gl_PointSize = 0.5;
}
