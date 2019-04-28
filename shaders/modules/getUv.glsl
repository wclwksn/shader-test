vec2 getUv(vec4 position) {
  vec2 uv = (position.xy + 1.) * 0.5;
  uv.y = 1. - uv.y;
  return uv;
}

#pragma glslify: export(getUv)
