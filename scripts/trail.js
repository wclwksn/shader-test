import Webgl from './modules/webgl'

import textureFrag from '../shaders/template/texture.frag'

import resetVelocityFrag from '../shaders/trail/resetVelocity.frag'
import resetPositionFrag from '../shaders/trail/resetPosition.frag'
import velocityFrag from '../shaders/trail/velocity.frag'
import positionFrag from '../shaders/trail/position.frag'
import mainVert from '../shaders/trail/main.vert'
import mainFrag from '../shaders/trail/main.frag'

const length = 80
const num = 40

const sizeUniform = [length, num]
let pointer = [window.innerWidth / 2, window.innerHeight / 2]
let offset = pointer
const uv = []

for (let j = 0; j < num; j++) {
  for (let i = 0; i < length; i++) {
    uv.push(i / length, 1 - j / num)
  }
}

const webgl = new Webgl({
  cameraPosition: [0, 0, Math.min(window.innerWidth, window.innerHeight) * 2],
  ambientColor: [0.2, 0.2, 0.2],
  programs: {
    resetVelocity: {
      fragmentShader: resetVelocityFrag,
      uniforms: {
        size: sizeUniform
      },
      isFloats: true,
    },
    resetPosition: {
      fragmentShader: resetPositionFrag,
      uniforms: {
        size: sizeUniform
      },
      isFloats: true,
      hasResolution: true,
    },
    velocity: {
      fragmentShader: velocityFrag,
      uniforms: {
        size: sizeUniform,
        prevVelocityTexture: 'framebuffer',
        prevPositionTexture: 'framebuffer',
        time: 0,
        offset,
      },
      isFloats: true,
      hasResolution: true,
      hasTime: true,
    },
    position: {
      fragmentShader: positionFrag,
      uniforms: {
        size: sizeUniform,
        prevPositionTexture: 'framebuffer',
        velocityTexture: 'framebuffer',
        offset,
        time: 0,
      },
      isFloats: true,
      hasResolution: true,
    },
    main: {
      vertexShader: mainVert,
      fragmentShader: mainFrag,
      attributes: {
        uv: {
          value: uv,
          size: 2
        }
      },
      uniforms: {
        positionTexture: 'framebuffer',
        time: 0,
        offset,
      },
      mode: 'LINES',
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
  framebufferFloats: {
    velocity0: {
      width: length,
      height: num
    },
    velocity1: {
      width: length,
      height: num
    },
    position0: {
      width: length,
      height: num
    },
    position1: {
      width: length,
      height: num
    }
  },
  isAutoStart: false
})

let loopCount = 0
let targetbufferIndex
let prevbufferIndex
let i

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

  for (i = 0; i < offset.length; i++) {
    offset[i] += (pointer[i] - offset[i]) * 0.15
  }

  {
    webgl.bindFramebuffer('velocity' + targetbufferIndex)

    webgl.programs['velocity'].draw({
      prevVelocityTexture: 'velocity' + prevbufferIndex,
      prevPositionTexture: 'position' + prevbufferIndex,
      offset,
      time,
    })
  }

  {
    webgl.bindFramebuffer('position' + targetbufferIndex)

    webgl.programs['position'].draw({
      prevPositionTexture: 'position' + prevbufferIndex,
      velocityTexture: 'velocity' + targetbufferIndex,
      time,
      offset,
    })
  }

  {
    webgl.bindFramebuffer('scene')

    webgl.programs['main'].draw({
      positionTexture: 'position' + targetbufferIndex,
      time,
      offset,
    })

    webgl.effects['bloom'].draw('scene', '2', '1', 0.2)
  }

  {
    webgl.unbindFramebuffer()

    webgl.programs['texture'].draw({
      texture: '1'
    })
  }

  requestAnimationFrame(draw)
}
requestAnimationFrame(draw)

window.addEventListener('mousemove', event => {
  pointer = [event.clientX, event.clientY]
})
