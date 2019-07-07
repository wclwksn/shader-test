import Webgl from './modules/webgl'

import textureFrag from '../shaders/template/texture.frag'

import mainVert from '../shaders/curl/main.vert'
import mainFrag from '../shaders/curl/main.frag'

const particleOneSideNum = 800
const bloomRadius = 8

const uv = []
const maxI = particleOneSideNum - 1
for (let j = 0; j < particleOneSideNum; j++) {
  for (let i = 0; i < particleOneSideNum; i++) {
    uv.push(i / maxI, 1 - j / maxI)
  }
}

const webgl = new Webgl({
  cameraPosition: [0, 0, Math.min(window.innerWidth, window.innerHeight) / 2],
  programs: {
    curl: {
      vertexShader: mainVert,
      fragmentShader: mainFrag,
      attributes: {
        uv: {
          value: uv,
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
  onBefore: () => {
    document.body.style.backgroundColor = '#c0ebfc'
  },
  tick: time => {
    {
      webgl.bindFramebuffer('scene')

      webgl.programs['curl'].draw({
        time
      })

      webgl.effects['bloom'].draw('scene', '2', '1', bloomRadius)
    }

    {
      webgl.unbindFramebuffer()

      webgl.programs['texture'].draw({
        texture: '1'
      })
    }
  },
})
