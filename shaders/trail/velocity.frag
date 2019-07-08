precision highp float;

uniform vec2 size;
uniform sampler2D prevVelocityTexture;
uniform sampler2D prevPositionTexture;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;

#pragma glslify: curlNoise = require(glsl-curl-noise)

const float PI = 3.1415926;
const float PI2 = PI * 2.;

const float speed = 0.01;
const float density = 0.7;

void main() {
  if (gl_FragCoord.x >= 1.) discard;

  vec2 uv = gl_FragCoord.st / size;
  vec3 velocity = texture2D(prevVelocityTexture, uv).xyz;
  vec3 prevPosition = texture2D(prevPositionTexture, uv).xyz;

  // velocity += curlNoise(prevPosition) - prevPosition;
  vec2 cOffset = vec2(
    offset.x - resolution.x * 0.5,
    -offset.y + resolution.y * 0.5
  );
  velocity.xy += (cOffset - prevPosition.xy) * speed;
  velocity.z += -prevPosition.z * speed;
  // velocity.xy += vec2(
  //   cos(PI2 * 0.0001 * time),
  //   sin(PI2 * 0.0001 * time)
  // ) * 100. + offset - velocity.xy;
  // velocity = curlNoise(prevPosition * density); // * bugs

  gl_FragColor = vec4(velocity, 1.);
}
