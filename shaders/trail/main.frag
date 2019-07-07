precision highp float;

varying vec3 vPosition;
varying vec2 vUv;

const vec3 color = vec3(255., 255., 186.) / 255.;
const float alpha = 0.6;

void main() {
  vec3 cColor = color * mix(0.8, 1., vPosition.z / 30.);
  float cAlpha = alpha * 1. - vUv.x;

  gl_FragColor = vec4(cColor, cAlpha);
}
