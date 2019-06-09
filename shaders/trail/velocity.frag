precision highp float;

uniform vec2 size;
uniform float time;
uniform sampler2D prevVelocityTexture;
uniform sampler2D prevPositionTexture;

#pragma glslify: snoise = require(glsl-noise/simplex/4d)

void main() {
  if (gl_FragCoord.x >= 1.) discard;

  vec2 uv = gl_FragCoord.st / size;
  vec3 velocity = texture2D(prevVelocityTexture, uv).xyz;
  vec3 prevPosition = texture2D(prevPositionTexture, uv).xyz;

  velocity += 40. * vec3(
    snoise(vec4(0.1 * prevPosition, 7.225 + 0.5 * time)),
    snoise(vec4(0.1 * prevPosition, 3.553 + 0.5 * time)),
    snoise(vec4(0.1 * prevPosition, 1.259 + 0.5 * time))
  ) * 0.2;
  velocity += -prevPosition * length(prevPosition) * 0.01;
  // velocity *= 0.9 + abs(sin(uv.y * 9.)) * 0.1;

  gl_FragColor = vec4(velocity, 1.);
}
