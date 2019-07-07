attribute vec2 uv;

uniform mat4 mvpMatrix;

uniform vec2 resolution;
uniform float time;

varying vec2 vUv;

#pragma glslify: curlNoise = require(glsl-curl-noise)
#pragma glslify: adjustRatio = require(../modules/adjustRatio.glsl)

const float speed = 0.1;
const float size = 0.34;
const float density = 0.7;

void main() {
  vUv = uv;

  vec2 cUv = adjustRatio(uv, vec2(1.), resolution);
  vec3 position = vec3(cUv * 2. - 1., 0.) + time * speed;
  position = curlNoise(position * density) * min(resolution.x, resolution.y) * size;

  gl_Position = mvpMatrix * vec4(position, 1.);
}
