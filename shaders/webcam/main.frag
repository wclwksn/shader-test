precision highp float;

varying vec4 vColor;

void main() {
  vec4 color = vColor;

  gl_FragColor = color;
  // gl_FragColor = vec4(1.); // * debug
}
