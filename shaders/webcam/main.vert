attribute vec3 position;
attribute vec3 normal;
attribute vec2 instancedUv;

uniform sampler2D positionTexture;
uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec3 ambientColor;
uniform vec3 eyeDirection;
uniform vec2 resolution;
uniform float time;

varying vec4 vColor;

#pragma glslify: rotateQ = require(glsl-y-rotate/rotateQ)
#pragma glslify: random = require(glsl-random)
#pragma glslify: hsv = require(../modules/hsv.glsl)

const float PI = 3.1415926;
const float PI2 = PI * 2.;

const float colorInterval = PI2 * 6.;
const float scale = 2.;
const float rotationSpeed = 20.;
const float minRotationSpeed = 0.1;

void main(void){
  vec3 modelPosition = position;
  vec4 instancedPosition = texture2D(positionTexture, instancedUv);
  float randomValue = instancedPosition.w;

  modelPosition *= 0.5 * scale;

  vec3 axis = normalize(vec3(
    random(vec2(randomValue, 0.)),
    random(vec2(0., randomValue)),
    random(vec2(randomValue, 1.))
  ));
  float radian = PI2 * random(vec2(randomValue));
  radian += time * 0.001 * mix(minRotationSpeed, rotationSpeed, randomValue);
  mat3 rotate = rotateQ(axis, radian);
  modelPosition *= rotate;

  vec3 cNormal = normalize(normal);
  cNormal *= rotate;
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.)).rgb;
  vec3 invEye = normalize(invMatrix * vec4(eyeDirection, 0.)).rgb;
  vec3 halfLE = normalize(invLight + invEye);
  float diffuse = clamp(dot(cNormal, invLight), 0.1, 1.);
  float specular = pow(clamp(dot(cNormal, halfLE), 0., 1.), 50.);

  float colorNTime = mod(time * 0.001, colorInterval) / colorInterval;
  vColor = vec4(hsv(colorNTime * PI2, 0.25 + 0.7 * colorNTime, 0.85 + 0.1 * colorNTime), 1.);
  vColor *= vec4(vec3(diffuse), 1.) + vec4(vec3(specular), 1.);
  vColor.rgb += ambientColor;
  vColor.rgb *= mix(0.1, 1., clamp(((instancedPosition + 50.) / 100.).z, 0., 1.));

  gl_Position = mvpMatrix * (vec4(modelPosition + instancedPosition.xyz, 1.));
}
