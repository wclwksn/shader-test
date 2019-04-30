attribute vec3 position;
attribute vec2 uv;

uniform mat4 mvpMatrix;

varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position = mvpMatrix * vec4(position, 1.);
}
