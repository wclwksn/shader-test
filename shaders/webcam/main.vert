attribute vec3 position;
attribute vec3 normal;
attribute vec3 instancedPosition;
// attribute vec2 instancedUv;

uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec3 ambientColor;
uniform vec3 eyeDirection;
uniform float time;

varying vec4 vColor;
// varying vec2 vUv;
// varying float vSize;

#pragma glslify: rotateQ = require(glsl-y-rotate/rotateQ)
#pragma glslify: random = require(glsl-random)
#pragma glslify: hsv = require(../modules/hsv.glsl)

const float PI = 3.1415926;
const float PI2 = PI * 2.;

const float colorInterval = PI2 * 6.;
const float scale = 5.;
const float spread = 1.5;

void main(void){
  vec3 defaultPosition = position;

  defaultPosition.xyz *= 0.5 * scale;

  vec3 axis = normalize(vec3(
    random(vec2(instancedPosition.x, 0.)),
    random(vec2(0., instancedPosition.y)),
    random(vec2(instancedPosition.z, 1.))
  ));
  // axis = normalize(vec3(0., 1., 0.));
  mat3 rotate = rotateQ(axis, PI2 * random(instancedPosition.xy) * time * 0.00015);
  // defaultPosition *= rotate;

  vec3 cPosition = defaultPosition + instancedPosition * scale * spread;
  cPosition *= rotate;

  vec3 cNormal = normalize(normal);
  cNormal *= rotate;
  float colorNTime = mod(time * 0.001, colorInterval) / colorInterval;
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.)).rgb;
  vec3 invEye = normalize(invMatrix * vec4(eyeDirection, 0.)).rgb;
  vec3 halfLE = normalize(invLight + invEye);
  float diffuse = clamp(dot(cNormal, invLight), 0.1, 1.);
  float specular = pow(clamp(dot(cNormal, halfLE), 0., 1.), 50.);
  vColor = vec4(hsv(colorNTime * PI2, 0.25 + 0.7 * colorNTime, 0.85 + 0.1 * colorNTime), 1.);
  vColor *= vec4(vec3(diffuse), 1.) + vec4(vec3(specular), 1.);
  vColor.rgb += ambientColor;
  vColor.rgb *= mix(0.1, 1., ((instancedPosition + 50.) / 100.).z);
  // vColor.a = 1.;
  // vColor.a = 0.5;
  // vColor = vec4(vec3(1.), 1.);
  // vColor = vec4(vec3(1.), 0.5);

  gl_Position = mvpMatrix * vec4(cPosition, 1.);
}
