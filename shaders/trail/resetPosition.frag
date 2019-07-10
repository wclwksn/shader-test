precision highp float;

uniform vec2 size;
uniform vec2 resolution;

#pragma glslify: random = require(glsl-random)
// #pragma glslify: rotateQ = require(glsl-y-rotate/rotateQ)

// const float PI = 3.1415926;

const float maxPos = 0.1;

void main() {
  vec2 nPosition = gl_FragCoord.st / size * 2. - 1.;
  vec4 position = vec4(
    (mix(0.5, 1., random(vec2(1. - nPosition.y))) * 2. - 1.) * resolution.x * 0.5 * maxPos,
    (random(vec2(nPosition.y)) * 2. - 1.) * resolution.y * 0.5 * maxPos,
    (random(nPosition) * 2. - 1.) * min(resolution.x, resolution.y) * 0.5 * maxPos,
    random(nPosition)
  );
  // position.xyz *= rotateQ(normalize(vec3(random(vec2(position.w, 0.)), random(vec2(0., position.w)), 0.)), PI * position.w);
  gl_FragColor = position;
}
