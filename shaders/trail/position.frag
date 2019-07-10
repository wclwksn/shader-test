precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;
uniform vec2 resolution;
uniform float time;
uniform vec2 offset;

// #pragma glslify: rotateQ = require(glsl-y-rotate/rotateQ)
// #pragma glslify: random = require(glsl-random)

const float PI = 3.1415926;
const float PI2 = PI * 2.;

const float speed = 0.01;

void main() {
  float prevX =
    gl_FragCoord.x >= 2.
    ? 2.
    : gl_FragCoord.x >= 1.
      ? 1.
      : 0.;
  vec2 uv = (gl_FragCoord.st - vec2(prevX, 0.)) / size;
  vec4 prevPosition = texture2D(prevPositionTexture, uv);
  // vec3 velocity =
  //   gl_FragCoord.x < 1.
  //   ? texture2D(velocityTexture, uv).xyz * prevPosition.w
  //   : vec3(0.);
  // position.xy -= vec2(
  //   offset.x - resolution.x * 0.5,
  //   (resolution.y - offset.y) - resolution.y * 0.5
  // ) * 0.01;
  vec3 position = prevPosition.xyz;
  position.xy =
    gl_FragCoord.x < 1.
    ? vec2(
      cos(PI2 * time * 0.001),
      sin(PI2 * time * 0.001)
    ) * 100.
    + vec2(
      offset.x - resolution.x * 0.5,
      -offset.y + resolution.y * 0.5
    )
    : prevPosition.xy;

  // vec3 axis = normalize(vec3(random(vec2(prevPosition.w, 0.)), random(vec2(0., prevPosition.w)), 0.));
  // // axis.xy += vec2(
  // //   offset.x - resolution.x * 0.5,
  // //   -offset.y + resolution.y * 0.5
  // // );
  // position *= rotateQ(axis, PI * prevPosition.w);

  // position.z =
  //   gl_FragCoord.x < 1.
  //   ? 0.
  //   : prevPosition.z;

  gl_FragColor = vec4(position, prevPosition.w);
}
