precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;

void main () {
  vec2 uv = gl_FragCoord.st / size;
  vec4 prevPosition = texture2D(prevPositionTexture, uv);
  vec4 velocity = texture2D(velocityTexture, uv);

  vec3 position;
  if (velocity.w == 1.) {
    vec2 nPosition = uv * 2. - 1.;
    position = vec3(nPosition * size, 0.);
  } else {
    position = prevPosition.xyz + velocity.xyz;
  }

  gl_FragColor = vec4(position, prevPosition.w);
}
