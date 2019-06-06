attribute vec2 uv;

uniform mat4 mvpMatrix;

uniform vec2 resolution;
uniform sampler2D positionTexture;

void main() {
  vec4 position = texture2D(positionTexture, uv);
  position.xyz *= min(resolution.x, resolution.y) * 0.5;

  gl_Position = mvpMatrix * position;
  // gl_Position = mvpMatrix * vec4(uv * 100., 0., 1.); // * debug
  gl_PointSize = 0.5;
}
