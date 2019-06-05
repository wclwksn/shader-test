precision highp float;

uniform vec2 size;
uniform sampler2D prevVelocityTexture;

const float speed = 0.000004;

void main() {
  vec2 uv = gl_FragCoord.st / size;
  vec4 prevVelocity = texture2D(prevVelocityTexture, uv);

  gl_FragColor = vec4(prevVelocity.xyz + speed, 1.);
}
