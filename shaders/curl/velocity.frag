precision highp float;

uniform vec2 size;
uniform sampler2D prevVelocityTexture;

const float speed = 0.000004;

void main() {
  vec2 uv = gl_FragCoord.st / size;
  vec3 prevVelocity = texture2D(prevVelocityTexture, uv).xyz;

  gl_FragColor = vec4(prevVelocity + speed, 1.);
}
