import Webgl from './modules/webgl'

import textureFrag from '../shaders/template/texture.frag'

import curlVert from '../shaders/curl/main.vert'
import curlFrag from '../shaders/curl/main.frag'

const curlSize = 800
const curlSizeUniform = [curlSize, curlSize]
const curlUv = []

for (let j = 0; j < curlSize; j++) {
  for (let i = 0; i < curlSize; i++) {
    curlUv.push(i / curlSize, 1 - j / curlSize)
  }
}

const webgl = new Webgl({
  cameraPosition: [0, 0, Math.min(window.innerWidth, window.innerHeight)],
  programs: {
    curl: {
      vertexShader: curlVert,
      fragmentShader: curlFrag,
      attributes: {
        uv: {
          value: curlUv,
          stride: 2
        }
      },
      uniforms: {
        time: 0
      },
      mode: 'LINE_STRIP',
      isTransparent: true
    },
    texture: {
      fragmentShader: textureFrag,
      uniforms: {
        texture: 'framebuffer'
      },
      clearedColor: [0, 0, 0, 1],
      isTransparent: true
    }
  },
  effects: [
    'bloom'
  ],
  framebuffers: [
    'scene',
    '1',
    '2'
  ],
  tick: time => {
    {
      webgl.bindFramebuffer('scene')

      webgl.programs['curl'].draw({
        time
      })

      webgl.effects['bloom'].draw('scene', '2', '1', 8)
    }

    {
      webgl.unbindFramebuffer()

      webgl.programs['texture'].draw({
        texture: '1'
      })
    }
  }
})
