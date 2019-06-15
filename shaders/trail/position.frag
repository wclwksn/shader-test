precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;

void main() {
  float prevX =
    gl_FragCoord.x >= 2.
    ? 2.
    : gl_FragCoord.x >= 1.
      ? 1.
      : 0.;
  vec2 uv = (gl_FragCoord.st - vec2(prevX, 0.)) / size;
  vec3 prevPosition = texture2D(prevPositionTexture, uv).xyz;
  vec3 velocity =
    gl_FragCoord.x < 1.
    ? texture2D(velocityTexture, uv).xyz * 0.002
    : vec3(0.);

  gl_FragColor = vec4(prevPosition + velocity, 1.);
}
