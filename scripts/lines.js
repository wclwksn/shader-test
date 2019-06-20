import Webgl from './modules/webgl'
import { animate } from './modules/animation'

import textureFrag from '../shaders/template/texture.frag'

import resetVelocityFrag from '../shaders/curl/resetVelocity.frag'
import resetPositionFrag from '../shaders/curl/resetPosition.frag'
import velocityFrag from '../shaders/curl/velocity.frag'
import positionFrag from '../shaders/curl/position.frag'
import curlVert from '../shaders/curl/main.vert'
import curlFrag from '../shaders/curl/main.frag'

import trailResetVelocityFrag from '../shaders/trail/resetVelocity.frag'
import trailResetPositionFrag from '../shaders/trail/resetPosition.frag'
import trailVelocityFrag from '../shaders/trail/velocity.frag'
import trailPositionFrag from '../shaders/trail/position.frag'
import trailVert from '../shaders/trail/main.vert'
import trailFrag from '../shaders/trail/main.frag'

const canvas = document.getElementById('canvas')

const curlSize = 300
const curlSizeUniform = [curlSize, curlSize]
const curlUv = []

const trailLength = 40
const trailNum = 20
const trailSizeUniform = [trailLength, trailNum]
const trailUv = []

for (let j = 0; j < curlSize; j++) {
  for (let i = 0; i < curlSize; i++) {
    curlUv.push(i / curlSize, 1 - j / curlSize)
  }
}

for (let j = 0; j < trailNum; j++) {
  for (let i = 0; i < trailLength; i++) {
    trailUv.push(i / trailLength, 1 - j / trailNum)
  }
}

const webgl = new Webgl({
  canvas,
  cameraPosition: [0, 0, 50],
  ambientColor: [0.2, 0.2, 0.2],
  programs: {
    resetVelocity: {
      fragmentShader: resetVelocityFrag,
      hasResolution: false,
      hasCamera: false,
      hasLight: false
    },
    resetPosition: {
      fragmentShader: resetPositionFrag,
      uniforms: {
        size: curlSizeUniform
      },
      hasResolution: false,
      hasCamera: false,
      hasLight: false
    },
    velocity: {
      fragmentShader: velocityFrag,
      uniforms: {
        size: curlSizeUniform,
        prevVelocityTexture: 'framebuffer'
      },
      hasResolution: false,
      hasCamera: false,
      hasLight: false
    },
    position: {
      fragmentShader: positionFrag,
      uniforms: {
        size: curlSizeUniform,
        prevPositionTexture: 'framebuffer',
        velocityTexture: 'framebuffer'
      },
      hasResolution: false,
      hasCamera: false,
      hasLight: false
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
      // isClear: false,
      isTransparent: true
    },
    trailResetVelocity: {
      fragmentShader: trailResetVelocityFrag,
      hasResolution: false,
      hasCamera: false,
      hasLight: false
    },
    trailResetPosition: {
      fragmentShader: trailResetPositionFrag,
      uniforms: {
        size: trailSizeUniform
      },
      hasResolution: false,
      hasCamera: false,
      hasLight: false
    },
    trailVelocity: {
      fragmentShader: trailVelocityFrag,
      uniforms: {
        size: trailSizeUniform,
        prevVelocityTexture: 'framebuffer',
        prevPositionTexture: 'framebuffer'
      },
      hasResolution: false,
      hasTime: true,
      hasCamera: false,
      hasLight: false
    },
    trailPosition: {
      fragmentShader: trailPositionFrag,
      uniforms: {
        size: trailSizeUniform,
        prevPositionTexture: 'framebuffer',
        velocityTexture: 'framebuffer'
      },
      hasResolution: false,
      hasCamera: false,
      hasLight: false
    },
    trail: {
      vertexShader: trailVert,
      fragmentShader: trailFrag,
      attributes: {
        uv: {
          value: trailUv,
          stride: 2
        }
      },
      uniforms: {
        positionTexture: 'framebuffer'
      },
      mode: 'LINES',
      isClear: false,
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
    'fly',
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
    },
    trailVelocity0: {
      width: trailLength,
      height: trailNum
    },
    trailVelocity1: {
      width: trailLength,
      height: trailNum
    },
    trailPosition0: {
      width: trailLength,
      height: trailNum
    },
    trailPosition1: {
      width: trailLength,
      height: trailNum
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

{
  webgl.bindFramebuffer('trailVelocity' + targetbufferIndex)
  webgl.programs['trailResetVelocity'].draw()
}

{
  webgl.bindFramebuffer('trailPosition' + targetbufferIndex)
  webgl.programs['trailResetPosition'].draw()
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
    webgl.bindFramebuffer('trailVelocity' + targetbufferIndex)

    webgl.programs['trailVelocity'].draw({
      prevVelocityTexture: 'trailVelocity' + prevbufferIndex,
      prevPositionTexture: 'trailPosition' + prevbufferIndex
    })
  }

  {
    webgl.bindFramebuffer('trailPosition' + targetbufferIndex)

    webgl.programs['trailPosition'].draw({
      prevPositionTexture: 'trailPosition' + prevbufferIndex,
      velocityTexture: 'trailVelocity' + targetbufferIndex
    })
  }

  {
    webgl.bindFramebuffer('fly')

    webgl.programs['curl'].draw({
      positionTexture: 'position' + targetbufferIndex
    })

    webgl.programs['trail'].draw({
      positionTexture: 'trailPosition' + targetbufferIndex
    })

    webgl.effects['bloom'].draw('fly', '2', '1')
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
  // delay: 0,
  // easing: 'easeInCubic',
  // cubicBezier: [.3, .0, .4, 1],
  isRoop: true,
  onBefore () {
    draw(0)
  }
})
