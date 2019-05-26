#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
// #pragma glslify: ease = require(glsl-easings/quadratic-in)

float getExistence(vec2 uv, float time) {
  uv.x += 0.1;
  float existence = snoise3(vec3(uv * 0.7, 10.)) / 0.71;
  existence = (existence + 1.) / 2.;
  // existence = ease(existence);
  // existence = pow(existence, 2.);
  existence = mix(0.5, 1., existence);
  existence *= time * 2.;
  // existence = smoothstep(0.9, 1., existence);
  return existence;
}

#pragma glslify: export(getExistence)
