attribute vec2 uv;

uniform mat4 mvpMatrix;

uniform vec2 resolution;
uniform sampler2D positionTexture;
uniform float time;
uniform vec2 offset;

varying vec3 vPosition;
varying vec2 vUv;

#pragma glslify: curlNoise = require(glsl-curl-noise)
#pragma glslify: rotateQ = require(glsl-y-rotate/rotateQ)
#pragma glslify: random = require(glsl-random)

const float PI = 3.1415926;
const float PI2 = PI * 2.;

void main() {
  vec4 position = texture2D(positionTexture, uv);

  position.xy -= vec2(
    offset.x - resolution.x * 0.5,
    -offset.y + resolution.y * 0.5
  );

  vec3 axis = normalize(vec3(
    random(vec2(position.w, 0.)),
    random(vec2(0., position.w)),
    random(vec2(position.w, 1.))
  ));
  // vec3 axis = normalize(
  //   mod(position.w * 10., 2.) < 1.
  //   ? vec3(1., 0., 0.)
  //   : vec3(0., 1., 0.)
  // );
  position.xyz *= rotateQ(axis, PI2 * position.w);

  position.xy += vec2(
    offset.x - resolution.x * 0.5,
    -offset.y + resolution.y * 0.5
  );

  vUv = uv;

  gl_Position = mvpMatrix * vec4(position.xyz, 1.);
  // gl_Position = mvpMatrix * vec4(uv * 100., 0., 1.); // * debug
  vPosition = gl_Position.xyz;

  // gl_PointSize = 0.5;
}
