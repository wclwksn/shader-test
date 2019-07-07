precision highp float;

uniform vec2 size;
uniform vec2 resolution;

#pragma glslify: random = require(glsl-random)

const float maxPos = 0.1;

void main() {
  vec2 position = gl_FragCoord.st / size * 2. - 1.;
  gl_FragColor = vec4(
    (mix(0.5, 1., random(vec2(1. - position.y))) * 2. - 1.) * resolution.x * 0.5 * maxPos,
    (random(vec2(position.y)) * 2. - 1.) * resolution.y * 0.5 * maxPos,
    (random(position) * 2. - 1.) * min(resolution.x, resolution.y) * 0.5 * maxPos,
    mix(0.5, 1., random(position))
  );
}
