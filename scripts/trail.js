import Webgl from './modules/webgl'
import { animate } from './modules/animation'

import textureFrag from '../shaders/template/texture.frag'

import resetVelocityFrag from '../shaders/trail/resetVelocity.frag'
import resetPositionFrag from '../shaders/trail/resetPosition.frag'
import velocityFrag from '../shaders/trail/velocity.frag'
import positionFrag from '../shaders/trail/position.frag'
import trailVert from '../shaders/trail/main.vert'
import trailFrag from '../shaders/trail/main.frag'

const canvas = document.getElementById('canvas')

const trailLength = 40
const trailNum = 20
const trailSizeUniform = [trailLength, trailNum]
const trailUv = []

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
      isFloats: true
    },
    resetPosition: {
      fragmentShader: resetPositionFrag,
      uniforms: {
        size: trailSizeUniform
      },
      isFloats: true
    },
    velocity: {
      fragmentShader: velocityFrag,
      uniforms: {
        size: trailSizeUniform,
        prevVelocityTexture: 'framebuffer',
        prevPositionTexture: 'framebuffer'
      },
      isFloats: true,
      hasTime: true
    },
    position: {
      fragmentShader: positionFrag,
      uniforms: {
        size: trailSizeUniform,
        prevPositionTexture: 'framebuffer',
        velocityTexture: 'framebuffer'
      },
      isFloats: true
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
      width: trailLength,
      height: trailNum
    },
    velocity1: {
      width: trailLength,
      height: trailNum
    },
    position0: {
      width: trailLength,
      height: trailNum
    },
    position1: {
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

const draw = time => {
  targetbufferIndex = loopCount++ % 2
  prevbufferIndex = 1 - targetbufferIndex

  {
    webgl.bindFramebuffer('velocity' + targetbufferIndex)

    webgl.programs['velocity'].draw({
      prevVelocityTexture: 'velocity' + prevbufferIndex,
      prevPositionTexture: 'position' + prevbufferIndex
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

    webgl.programs['trail'].draw({
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
  // delay: 0,
  // easing: 'easeInCubic',
  // cubicBezier: [.3, .0, .4, 1],
  isRoop: true,
  onBefore () {
    draw(0)
  }
})
