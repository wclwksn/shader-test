precision highp float;

uniform vec2 resolution;
uniform sampler2D texture;
uniform sampler2D specular;

const float brightness = 4.;

void main() {
  vec2 uv = gl_FragCoord.st / resolution;
  vec3 color = texture2D(texture, uv).rgb;
  color += texture2D(specular, uv).rgb * brightness;
  gl_FragColor = vec4(color, 1.);
}
