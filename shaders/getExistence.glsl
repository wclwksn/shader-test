#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

float getExistence(vec2 uv, float time) {
  uv.x += 0.3;
  float existence = snoise3(vec3(uv * 0.7, 10.));
  existence = mix(0.2, 1., existence);
  existence *= time * 0.8;
  existence = pow(existence, 1.5);
  return max(existence - 1.2, 0.);
}

#pragma glslify: export(getExistence)
