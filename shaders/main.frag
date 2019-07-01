precision highp float;

uniform vec2 resolution;
uniform sampler2D particle;
uniform sampler2D current;
uniform sampler2D next;
uniform sampler2D godray;

void main() {
  vec2 uv = gl_FragCoord.st / resolution;
  vec2 frameBufferUv = uv;
  uv.y = 1. - uv.y;

  vec4 currentColor = texture2D(current, frameBufferUv);
  vec3 nextColor = texture2D(next, frameBufferUv).rgb;

  vec3 color = mix(nextColor, currentColor.rgb, currentColor.a);

  color += texture2D(particle, frameBufferUv).rgb;
  color += texture2D(godray, frameBufferUv).rgb;

  gl_FragColor = vec4(color, 1.);
}
