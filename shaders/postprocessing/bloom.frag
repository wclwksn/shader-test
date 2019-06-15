precision highp float;

uniform vec2 resolution;
uniform sampler2D specular;

void main() {
  vec2 uv = gl_FragCoord.st / resolution;
  vec4 specularColor = texture2D(specular, uv);
  specularColor.rgb = pow(specularColor.rgb, vec3(0.3));
  specularColor.a = pow(specularColor.a, 0.7);
  gl_FragColor = specularColor;
  // gl_FragColor = specularColor; // * debug
  // gl_FragColor = vec4(vec3(specularColor.a), 1.);
  // gl_FragColor = vec4(texture2D(specular, uv).rgb, 1.);
}
