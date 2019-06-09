precision highp float;

uniform vec2 size;

void main() {
  vec2 position = gl_FragCoord.st / size * 2. - 1.;
  gl_FragColor = vec4(position, 0., 1.);
}