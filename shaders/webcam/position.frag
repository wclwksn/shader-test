precision highp float;

uniform vec2 size;
uniform sampler2D prevPositionTexture;
uniform sampler2D velocityTexture;

// #pragma glslify: rotateQ = require(glsl-y-rotate/rotateQ)
// #pragma glslify: random = require(glsl-random)
#pragma glslify: curlNoise = require(glsl-curl-noise)

// const float PI = 3.1415926;
// const float PI2 = PI * 2.;

// const float speed = 0.0015;
// const float radius = 20.;
// const float largeRadius = 80.;

void main() {
  vec2 uv = gl_FragCoord.st / size;
  vec4 prevPosition = texture2D(prevPositionTexture, uv);
  vec4 prevVelocity = texture2D(velocityTexture, uv);

  // prevPosition.xyz *= 0.5 * scale;

  // vec3 axis = normalize(vec3(
  //   random(vec2(instancedPosition.x, 0.)),
  //   random(vec2(0., instancedPosition.y)),
  //   random(vec2(instancedPosition.z, 1.))
  // ));
  // // axis = normalize(vec3(0., 1., 0.));
  // mat3 rotate = rotateQ(axis, PI2 * random(instancedPosition.xy) * time * 0.00015);
  // // prevPosition *= rotate;

  // vec3 cPosition = prevPosition + instancedPosition * scale * spread;
  // cPosition *= rotate;

  // gl_FragColor = vec4(curlNoise(prevPosition.xyz * 0.1), prevPosition.w);
  gl_FragColor = vec4(prevPosition.xyz + prevVelocity.xyz, prevPosition.w);
}
