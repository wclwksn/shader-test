precision highp float;

varying vec4 vColor;
varying vec2 vUv;
varying float vSize;

void main() {
  // discard; // * debug
  if (vColor.a == 0.) discard;

  vec4 color = vColor;

  vec2 p = vUv * 2. - 1.;
  color.a *= min(0.3 * vSize / length(p), 1.);
  if (color.a == 0.) discard;

  gl_FragColor = color;
  // gl_FragColor = vec4(1.); // * debug
}
