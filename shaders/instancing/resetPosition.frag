precision highp float;

uniform vec2 size;
// uniform vec2 resolution;

#pragma glslify: random = require(glsl-random)

void main () {
  vec2 nPosition = gl_FragCoord.st / size * 2. - 1.;
  vec4 position = vec4(
    nPosition * size,
    0.,
    random(nPosition)
  );
  gl_FragColor = position;
}
