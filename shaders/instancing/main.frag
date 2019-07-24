precision highp float;

varying vec4 vColor;

void main () {
  gl_FragColor = vColor;
  // gl_FragColor = vec4(1.); // * debug
}
