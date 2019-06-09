precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;

void main() {
  vec2 uv = gl_FragCoord.st / size;
  vec3 prevPosition = texture2D(prevPositionTexture, uv).xyz;
  vec3 velocity = texture2D(velocityTexture, uv).xyz;

  gl_FragColor = vec4(prevPosition + velocity, 1.);
}
