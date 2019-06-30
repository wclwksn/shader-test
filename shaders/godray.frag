precision highp float;

uniform vec2 resolution;
uniform sampler2D mask;

void main() {
  vec2 uv = gl_FragCoord.st / resolution;
  uv.y = 1. - uv.y;
  uv.y += 0.85;
  if (uv.y > 1.) discard;

  vec4 color = texture2D(mask, uv);
  color += 0.4;
  gl_FragColor = color;
  // gl_FragColor = vec4(vec3(1.) - color.rgb, color.a);
}
