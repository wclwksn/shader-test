vec2 getZoomedUv(vec2 uv, float zoom) {
  float zoomScale = 1. / zoom;
  return uv * zoomScale + (1. - zoomScale) / 2. * zoomScale;
}

#pragma glslify: export(getZoomedUv)
