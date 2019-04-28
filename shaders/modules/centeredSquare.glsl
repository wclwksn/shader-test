#pragma glslify: adjustRatio = require(./adjustRatio.glsl)

vec2 centeredSquare(vec2 uv, vec2 resolution) {
  vec2 coord = adjustRatio(uv, vec2(1.), resolution);
  coord -= 0.5;
  coord *= max(resolution.x, resolution.y) / min(resolution.x, resolution.y);
  return coord;
}

#pragma glslify: export(centeredSquare)
