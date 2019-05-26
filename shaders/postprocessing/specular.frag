precision highp float;

uniform vec2 resolution;
uniform sampler2D texture;

const float minBright = 0.5;

void main() {
  vec2 uv = gl_FragCoord.st / resolution;
  vec3 color = texture2D(texture, uv).rgb;
  color *= step(minBright, color);
  gl_FragColor = vec4(color, 1.);
}
