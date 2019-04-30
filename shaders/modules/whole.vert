attribute vec3 position;
varying vec4 vPosition;

void main() {
  gl_Position = vPosition = vec4(position, 1.);
}
