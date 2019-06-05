precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;

void main() {
  vec2 uv = gl_FragCoord.st / size;
  vec4 prevPosition = texture2D(prevPositionTexture, uv);
  vec4 velocity = texture2D(velocityTexture, uv);

  gl_FragColor = vec4(prevPosition.xyz + velocity.xyz, 1.);
}
