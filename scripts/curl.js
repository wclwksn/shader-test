import Webgl from './modules/webgl'
import { animate } from './modules/animation'

import textureFrag from '../shaders/template/texture.frag'

import resetVelocityFrag from '../shaders/curl/resetVelocity.frag'
import resetPositionFrag from '../shaders/curl/resetPosition.frag'
import velocityFrag from '../shaders/curl/velocity.frag'
import positionFrag from '../shaders/curl/position.frag'
import curlVert from '../shaders/curl/main.vert'
import curlFrag from '../shaders/curl/main.frag'

const canvas = document.getElementById('canvas')

const curlSize = 300
const curlSizeUniform = [curlSize, curlSize]
const curlUv = []

for (let j = 0; j < curlSize; j++) {
  for (let i = 0; i < curlSize; i++) {
    curlUv.push(i / curlSize, 1 - j / curlSize)
  }
}

const webgl = new Webgl({
  canvas,
  cameraPosition: [0, 0, 50],
  ambientColor: [0.2, 0.2, 0.2],
  programs: {
    resetVelocity: {
      fragmentShader: resetVelocityFrag,
      isFloats: true
    },
    resetPosition: {
      fragmentShader: resetPositionFrag,
      uniforms: {
        size: curlSizeUniform
      },
      isFloats: true
    },
    velocity: {
      fragmentShader: velocityFrag,
      uniforms: {
        size: curlSizeUniform,
        prevVelocityTexture: 'framebuffer'
      },
      isFloats: true
    },
    position: {
      fragmentShader: positionFrag,
      uniforms: {
        size: curlSizeUniform,
        prevPositionTexture: 'framebuffer',
        velocityTexture: 'framebuffer'
      },
      isFloats: true
    },
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
        positionTexture: 'framebuffer'
      },
      mode: 'LINE_STRIP',
      isTransparent: true
    },
    texture: {
      fragmentShader: textureFrag,
      uniforms: {
        texture: 'framebuffer'
      },
      isClear: false,
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
  framebufferFloats: {
    velocity0: {
      width: curlSize,
      height: curlSize
    },
    velocity1: {
      width: curlSize,
      height: curlSize
    },
    position0: {
      width: curlSize,
      height: curlSize
    },
    position1: {
      width: curlSize,
      height: curlSize
    }
  },
  isAutoStart: false
})

let loopCount = 0
let targetbufferIndex
let prevbufferIndex

targetbufferIndex = loopCount++ % 2

{
  webgl.bindFramebuffer('velocity' + targetbufferIndex)
  webgl.programs['resetVelocity'].draw()
}

{
  webgl.bindFramebuffer('position' + targetbufferIndex)
  webgl.programs['resetPosition'].draw()
}

const draw = time => {
  targetbufferIndex = loopCount++ % 2
  prevbufferIndex = 1 - targetbufferIndex

  {
    webgl.bindFramebuffer('velocity' + targetbufferIndex)

    webgl.programs['velocity'].draw({
      prevVelocityTexture: 'velocity' + prevbufferIndex
    })
  }

  {
    webgl.bindFramebuffer('position' + targetbufferIndex)

    webgl.programs['position'].draw({
      prevPositionTexture: 'position' + prevbufferIndex,
      velocityTexture: 'velocity' + targetbufferIndex
    })
  }

  {
    webgl.bindFramebuffer('scene')

    webgl.programs['curl'].draw({
      positionTexture: 'position' + targetbufferIndex
    })

    webgl.effects['bloom'].draw('scene', '2', '1')
  }

  {
    webgl.unbindFramebuffer()

    webgl.programs['texture'].draw({
      texture: '1'
    })
  }
}

animate(draw, {
  duration: 7000,
  isRoop: true,
  onBefore () {
    draw(0)
  }
})
