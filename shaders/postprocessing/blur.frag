precision highp float;

uniform sampler2D texture;
uniform vec2 resolution;
uniform float radius;
uniform bool isHorizontal;

#define COUNT 10

void main () {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 direction = isHorizontal ? vec2(1., 0.) : vec2(0., 1.);
  vec3 color = vec3(0.);

  float weight[COUNT];
  float t = 0.;
  float fi;
  float r;
  float w;
  for (int i = 0; i < COUNT; i++) {
    fi = float(i);
    r = 1. + 2. * fi;
    w = exp(-0.5 * (r * r) / radius);
    weight[i] = w;
    t += w * mix(1., 2., min(fi, 1.));
  }
  for (int i = 0; i < COUNT; i++) {
    weight[i] /= t;
  }

  color += texture2D(texture, (fragCoord + direction * -9.) / resolution).rgb * weight[9];
  color += texture2D(texture, (fragCoord + direction * -8.) / resolution).rgb * weight[8];
  color += texture2D(texture, (fragCoord + direction * -7.) / resolution).rgb * weight[7];
  color += texture2D(texture, (fragCoord + direction * -6.) / resolution).rgb * weight[6];
  color += texture2D(texture, (fragCoord + direction * -5.) / resolution).rgb * weight[5];
  color += texture2D(texture, (fragCoord + direction * -4.) / resolution).rgb * weight[4];
  color += texture2D(texture, (fragCoord + direction * -3.) / resolution).rgb * weight[3];
  color += texture2D(texture, (fragCoord + direction * -2.) / resolution).rgb * weight[2];
  color += texture2D(texture, (fragCoord + direction * -1.) / resolution).rgb * weight[1];
  color += texture2D(texture, (fragCoord + direction *  0.) / resolution).rgb * weight[0];
  color += texture2D(texture, (fragCoord + direction *  1.) / resolution).rgb * weight[1];
  color += texture2D(texture, (fragCoord + direction *  2.) / resolution).rgb * weight[2];
  color += texture2D(texture, (fragCoord + direction *  3.) / resolution).rgb * weight[3];
  color += texture2D(texture, (fragCoord + direction *  4.) / resolution).rgb * weight[4];
  color += texture2D(texture, (fragCoord + direction *  5.) / resolution).rgb * weight[5];
  color += texture2D(texture, (fragCoord + direction *  6.) / resolution).rgb * weight[6];
  color += texture2D(texture, (fragCoord + direction *  7.) / resolution).rgb * weight[7];
  color += texture2D(texture, (fragCoord + direction *  8.) / resolution).rgb * weight[8];
  color += texture2D(texture, (fragCoord + direction *  9.) / resolution).rgb * weight[9];

  gl_FragColor = vec4(color, 1.);
  // gl_FragColor = vec4(vec3(0.5), 1.);
}
