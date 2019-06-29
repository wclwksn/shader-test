#pragma glslify: ease = require(glsl-easings/sine-in)

const float extraTime = 1.1;

float getExistence(vec2 uv, float time, sampler2D mask) {
  vec4 maskColor = texture2D(mask, uv);
  float existence = ease(1. - (maskColor.r + maskColor.g + maskColor.b) / 3.);
  existence += time * extraTime;
  return existence;
}

#pragma glslify: export(getExistence)
