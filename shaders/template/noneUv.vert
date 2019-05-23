attribute vec2 position;

varying vec2 vUv;

void main () {
  gl_Position = vec4(position, 0., 1.);
  vUv = (position + 1.) * 0.5;
  vUv.y = 1. - vUv.y;
}
