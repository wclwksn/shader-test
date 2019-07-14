precision highp float;

uniform vec2 size;
uniform sampler2D prevVelocityTexture;
uniform sampler2D prevPositionTexture;

#pragma glslify: curlNoise = require(glsl-curl-noise)

const float speed = 0.01;
const float density = 0.01;

void main() {
  vec2 uv = gl_FragCoord.st / size;
  vec3 velocity = texture2D(prevVelocityTexture, uv).xyz;
  vec3 prevPosition = texture2D(prevPositionTexture, uv).xyz;
  velocity += curlNoise(prevPosition * density) * speed;
  gl_FragColor = vec4(velocity, 1.);
}
