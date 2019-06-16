precision highp float;

varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 color = vec3(255., 255., 186.) / 255.;
  color *= mix(0.7, 1., vPosition.z / 30.);

  float alpha = 0.6;
  alpha *= 1. - vUv.x;

  gl_FragColor = vec4(color, alpha);
}
