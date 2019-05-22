attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec4 ambientColor;
uniform vec3 eyeDirection;

varying vec2 vUv;
varying vec4 vModelColor;

const vec4 color = vec4(vec3(0.5), 1.);
const float radian = 0.;
const vec3 axis = normalize(vec3(0., 1., 0.));

void main() {
  // vec3 resultNormal = rotateQ(axis, radian) * normal;
  vec3 resultNormal = normal;
  vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.)).xyz;
  vec3 invEye = normalize(invMatrix * vec4(eyeDirection, 0.)).xyz;
  vec3 halfLE = normalize(invLight + invEye);
  float diffuse = clamp(dot(resultNormal, invLight), 0.1, 1.);
  float specular = pow(clamp(dot(resultNormal, halfLE), 0., 1.), 50.);

  vModelColor = color;
  vModelColor *= vec4(vec3(diffuse), 1.) + vec4(vec3(specular), 1.);
  vModelColor += ambientColor;

  vUv = uv;

  gl_Position = mvpMatrix * vec4(position, 1.);
  // gl_Position = vec4(position, 1.);
}
