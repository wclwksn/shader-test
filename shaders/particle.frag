precision highp float;

varying vec4 vColor;

void main() {
  // discard; // * debug
  if (vColor.a == 0.) discard;

  vec4 color = vColor;

	vec2 p = gl_PointCoord * 2. - 1.;
  color.a *= min(0.2 / length(p), 1.);
  // color.a = 0.; // * debug
  if (color.a == 0.) discard;

  gl_FragColor = color;
  // gl_FragColor = vec4(1.); // * debug
}
