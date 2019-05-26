vec3 vignette(vec3 color, vec2 nPosition, float size) {
  return color * min(size - length(nPosition), 1.);
}
// color *= min(size - length(nPosition), 1.);

#pragma glslify: export(vignette)
