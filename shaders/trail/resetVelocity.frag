precision highp float;

uniform vec2 size;

#pragma glslify: random = require(glsl-random)

const float PI = 3.1415926;
const float PI2 = PI * 2.;

void main() {
  vec2 position = gl_FragCoord.st / size * 2. - 1.;
  gl_FragColor = vec4(
    0.,
    0.,
    random(position),
    1.
  );
}
