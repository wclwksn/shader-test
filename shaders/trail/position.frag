precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform vec2 resolution;
uniform float time;
uniform vec2 offset;

const float PI = 3.1415926;
const float PI2 = PI * 2.;

const float speed = 0.0015;
const float radius = 20.;
const float largeRadius = 80.;

void main() {
  float prevX =
    gl_FragCoord.x >= 2.
    ? 2.
    : gl_FragCoord.x >= 1.
      ? 1.
      : 0.;
  vec2 uv = (gl_FragCoord.st - vec2(prevX, 0.)) / size;
  vec4 prevPosition = texture2D(prevPositionTexture, uv);
  vec3 position = prevPosition.xyz;
  float radian = PI2 * time * speed * mix(0.5, 1., prevPosition.w);
  position.xy =
    gl_FragCoord.x < 1.
    ? vec2(
      cos(radian),
      sin(radian)
    ) * (gl_FragCoord.y < 4. ? largeRadius : radius)
    + vec2(
      offset.x - resolution.x * 0.5,
      -offset.y + resolution.y * 0.5
    )
    : prevPosition.xy;

  gl_FragColor = vec4(position, prevPosition.w);
}
