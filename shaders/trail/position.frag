precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;

void main() {
  if (gl_FragCoord.x >= 1.) {
    vec2 uv = (gl_FragCoord.st - vec2(1., 0.)) / size;
    vec3 prevPosition = texture2D( prevPositionTexture, uv ).xyz;
    gl_FragColor = vec4(prevPosition, 1.);
  } else {
    vec2 uv = gl_FragCoord.st / size;
    vec3 prevPosition = texture2D(prevPositionTexture, uv).xyz;
    vec3 velocity = texture2D(velocityTexture, uv).xyz;

    gl_FragColor = vec4(prevPosition + velocity * 0.002, 1.);
  }
}
