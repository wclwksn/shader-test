precision highp float;

uniform vec2 size;
uniform sampler2D prevVelocityTexture;
uniform sampler2D prevPositionTexture;

#pragma glslify: curlNoise = require(glsl-curl-noise)

const float speed = 2.;
const float density = 0.007;
const float ease = 0.02;

void main () {
  vec2 uv = gl_FragCoord.st / size;
  vec4 velocity = texture2D(prevVelocityTexture, uv);
  vec3 prevPosition = texture2D(prevPositionTexture, uv).xyz;
  velocity.xyz += curlNoise(prevPosition * density) * speed;
  velocity.xyz *= velocity.w;
  if (velocity.w > 0.01) {
    velocity.w -= velocity.w * ease;
  } else {
    velocity.w = 1.;
  }
  gl_FragColor = velocity;
}
