precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;

#pragma glslify: curlNoise = require(glsl-curl-noise)

void main() {
  vec2 uv = gl_FragCoord.st / size;
  vec4 prevPosition = texture2D(prevPositionTexture, uv);
  vec4 velocity = texture2D(velocityTexture, uv);
  vec3 position = curlNoise(prevPosition.xyz);

  gl_FragColor = vec4(position, 1.);
}
