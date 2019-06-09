attribute vec2 uv;

uniform mat4 mvpMatrix;

uniform vec2 resolution;
uniform sampler2D positionTexture;

#pragma glslify: curlNoise = require(glsl-curl-noise)

void main() {
  vec3 resultPosition = texture2D(positionTexture, uv).xyz;
  resultPosition *= min(resolution.x, resolution.y) * 0.003;

  gl_Position = mvpMatrix * vec4(resultPosition, 1.);
  // gl_Position = mvpMatrix * vec4(uv * 100., 0., 1.); // * debug
  gl_PointSize = 0.5;
}
