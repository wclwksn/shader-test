precision highp float;

uniform vec2 resolution;
uniform sampler2D texture;
uniform sampler2D specular;

const float brightness = 4.;

void main() {
  vec2 uv = gl_FragCoord.st / resolution;
  vec4 color = texture2D(texture, uv);
  color.rgb += texture2D(specular, uv).rgb * brightness;
  gl_FragColor = color;
  // gl_FragColor = texture2D(specular, uv); // * debug
}
