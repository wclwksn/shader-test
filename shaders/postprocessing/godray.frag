precision highp float;

uniform sampler2D texture;
uniform vec2 resolution;

void main () {
  vec2 uv = gl_FragCoord.st / resolution;
  gl_FragColor = texture2D(texture, uv);
}
