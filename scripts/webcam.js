import Webgl from './modules/webgl'

import textureFrag from '../shaders/template/texture.frag'

import resetVelocityFrag from '../shaders/webcam/resetVelocity.frag'
import resetPositionFrag from '../shaders/webcam/resetPosition.frag'
import velocityFrag from '../shaders/webcam/velocity.frag'
import positionFrag from '../shaders/webcam/position.frag'
import mainVert from '../shaders/webcam/main.vert'
import mainFrag from '../shaders/webcam/main.frag'

// const length = 80
// const num = 40
const width = 100
const height = 100
// const pointSize = 1
// const pointHalfSize = pointSize / 2

// const sizeUniform = [length, num]
// let pointer = [window.innerWidth / 2, window.innerHeight / 2]
// let offset = pointer
// const uv = []

// for (let j = 0; j < num; j++) {
//   for (let i = 0; i < length; i++) {
//     uv.push(i / length, 1 - j / num)
//   }
// }

const halfWidth = width / 2
const halfHeight = height / 2
const particlePosition = []
const particleNormal = []
const particleUv = []
for (let j = 0; j < height; j++) {
  for (let i = 0; i < width; i++) {
    // particlePosition.push(0, 0, 0)
    particlePosition.push(i - halfWidth, j - halfHeight, 0)
    // particleNormal.push((Math.random() * 2 - 1) * 0.1, (Math.random() * 2 - 1) * 0.1, 1)
    // particleUv.push(i / width, 1 - j / height)
  }
}

const webgl = new Webgl({
  cameraPosition: [0, 0, Math.min(window.innerWidth, window.innerHeight)],
  programs: {
    // resetVelocity: {
    //   fragmentShader: resetVelocityFrag,
    //   uniforms: {
    //     size: sizeUniform
    //   },
    //   isFloats: true,
    // },
    // resetPosition: {
    //   fragmentShader: resetPositionFrag,
    //   uniforms: {
    //     size: sizeUniform
    //   },
    //   isFloats: true,
    //   hasResolution: true,
    // },
    // velocity: {
    //   fragmentShader: velocityFrag,
    //   uniforms: {
    //     size: sizeUniform,
    //     prevVelocityTexture: 'framebuffer',
    //     prevPositionTexture: 'framebuffer',
    //     time: 0,
    //     offset,
    //   },
    //   isFloats: true,
    //   hasResolution: true,
    //   hasTime: true,
    // },
    // position: {
    //   fragmentShader: positionFrag,
    //   uniforms: {
    //     size: sizeUniform,
    //     prevPositionTexture: 'framebuffer',
    //     velocityTexture: 'framebuffer',
    //     offset,
    //     time: 0,
    //   },
    //   isFloats: true,
    //   hasResolution: true,
    // },
    main: {
      vertexShader: mainVert,
      fragmentShader: mainFrag,
      attributes: {
        position: {
          value: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
          size: 3,
        },
        normal: {
          value: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
          size: 3
        },
        indices: {
          value: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
          isIndices: true
        },
      },
      instancedAttributes: {
        instancedPosition: {
          value: particlePosition,
          size: 3
        },
        // instancedUv: {
        //   value: particleUv,
        //   size: 2
        // }
      },
      uniforms: {
        time: 0
      },
      // mode: 'LINE_STRIP',
      isDepth: true,
      // isTransparent: true,
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
  // framebufferFloats: {
  //   velocity0: {
  //     width: length,
  //     height: num
  //   },
  //   velocity1: {
  //     width: length,
  //     height: num
  //   },
  //   position0: {
  //     width: length,
  //     height: num
  //   },
  //   position1: {
  //     width: length,
  //     height: num
  //   }
  // },
  isAutoStart: false
})

// let loopCount = 0
// let targetbufferIndex
// let prevbufferIndex
// let i

// targetbufferIndex = loopCount++ % 2

// {
//   webgl.bindFramebuffer('velocity' + targetbufferIndex)
//   webgl.programs['resetVelocity'].draw()
// }

// {
//   webgl.bindFramebuffer('position' + targetbufferIndex)
//   webgl.programs['resetPosition'].draw()
// }

const draw = time => {
  // targetbufferIndex = loopCount++ % 2
  // prevbufferIndex = 1 - targetbufferIndex

  // for (i = 0; i < offset.length; i++) {
  //   offset[i] += (pointer[i] - offset[i]) * 0.15
  // }

  // {
  //   webgl.bindFramebuffer('velocity' + targetbufferIndex)

  //   webgl.programs['velocity'].draw({
  //     prevVelocityTexture: 'velocity' + prevbufferIndex,
  //     prevPositionTexture: 'position' + prevbufferIndex,
  //     offset,
  //     time,
  //   })
  // }

  // {
  //   webgl.bindFramebuffer('position' + targetbufferIndex)

  //   webgl.programs['position'].draw({
  //     prevPositionTexture: 'position' + prevbufferIndex,
  //     velocityTexture: 'velocity' + targetbufferIndex,
  //     time,
  //     offset,
  //   })
  // }

  {
    webgl.bindFramebuffer('scene')

    webgl.programs['main'].draw({
      // positionTexture: 'position' + targetbufferIndex,
      time,
      // offset,
    })

    webgl.effects['bloom'].draw('scene', '2', '1')
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

// window.addEventListener('mousemove', event => {
//   pointer = [event.clientX, event.clientY]
// })
