precision highp float;

uniform sampler2D texture;
uniform vec2 resolution;
uniform vec2 direction;

#pragma glslify: blur = require('glsl-fast-gaussian-blur')

void main () {
	vec2 uv = gl_FragCoord.xy / resolution;
	gl_FragColor = blur(texture, uv, resolution, direction);
}
