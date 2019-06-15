import Webgl from './modules/webgl'
import loadImage from './modules/loadImage'
import { animate, cubicOut } from './modules/animation'
import { mix, clamp } from './modules/math'

import mainVert from '../shaders/main.vert'
import mainFrag from '../shaders/main.frag'
import particleVert from '../shaders/particle.vert'
import particleFrag from '../shaders/particle.frag'
import nextFrag from '../shaders/next.frag'

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

const image = require('../images/room.jpg')
const image2 = require('../images/star.jpeg')

loadImage([image, image2]).then(([img, img2]) => {
  const canvas = document.getElementById('canvas')
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const halfWidth = width / 2
  const halfHeight = height / 2
  const particlePosition = []
  const particleNormal = []
  const particleUv = []

  const curlSize = 300
  const curlSizeUniform = [curlSize, curlSize]
  const curlUv = []

  const trailSize = 100
  const trailSizeUniform = [trailSize, trailSize]
  const trailUv = []

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      particlePosition.push(i - halfWidth, j - halfHeight, 0)
      particleNormal.push((Math.random() * 2 - 1) * 0.1, (Math.random() * 2 - 1) * 0.1, 1)
      particleUv.push(i / width, 1 - j / height)
    }
  }

  for (let j = 0; j < curlSize; j++) {
    for (let i = 0; i < curlSize; i++) {
      curlUv.push(i / curlSize, 1 - j / curlSize)
    }
  }

  for (let j = 0; j < trailSize; j++) {
    for (let i = 0; i < trailSize; i++) {
      trailUv.push(i / trailSize, 1 - j / trailSize)
    }
  }

  const webgl = new Webgl({
    canvas,
    cameraPosition: [0, 0, 50],
    ambientColor: [0.2, 0.2, 0.2],
    programs: {
      particle: {
        vertexShader: particleVert,
        fragmentShader: particleFrag,
        attributes: {
          position: {
            value: particlePosition,
            stride: 3
          },
          normal: {
            value: particleNormal,
            stride: 3
          },
          uv: {
            value: particleUv,
            stride: 2
          }
        },
        uniforms: {
          image: img,
          imageResolution: [img.width, img.height]
        },
        hasTime: true,
        mode: 'POINTS',
        drawType: 'DYNAMIC_DRAW',
        isTransparent: true
      },
      next: {
        vertexShader: mainVert,
        fragmentShader: nextFrag,
        attributes: {
          position: {
            value: [
              -halfWidth, halfHeight, 0,
              -halfWidth, -halfHeight, 0,
              halfWidth, halfHeight, 0,
              halfWidth, -halfHeight, 0
            ],
            stride: 3
          }
        },
        uniforms: {
          image: img2,
          imageResolution: [img2.width, img2.height]
        },
        hasTime: true,
        isTransparent: true
      },
      main: {
        vertexShader: mainVert,
        fragmentShader: mainFrag,
        attributes: {
          position: {
            value: [
              -halfWidth, halfHeight, 0,
              -halfWidth, -halfHeight, 0,
              halfWidth, halfHeight, 0,
              halfWidth, -halfHeight, 0
            ],
            stride: 3
          }
        },
        uniforms: {
          image: img,
          imageResolution: [img.width, img.height],
          particle: 'framebuffer',
          next: 'framebuffer'
        },
        hasTime: true
      },
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
        mode: 'POINTS',
        isClear: false
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
      }
    },
    effects: [
      'bloom',
      'blur',
      'godray'
    ],
    framebuffers: [
      'particle',
      'next',
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
        width: trailSize,
        height: trailSize
      },
      trailVelocity1: {
        width: trailSize,
        height: trailSize
      },
      trailPosition0: {
        width: trailSize,
        height: trailSize
      },
      trailPosition1: {
        width: trailSize,
        height: trailSize
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

    const program = webgl.programs['resetVelocity']
    program.use()
    program.draw()
  }

  {
    webgl.bindFramebuffer('position' + targetbufferIndex)

    const program = webgl.programs['resetPosition']
    program.use()
    program.draw()
  }

  {
    webgl.bindFramebuffer('trailVelocity' + targetbufferIndex)

    const program = webgl.programs['trailResetVelocity']
    program.use()
    program.draw()
  }

  {
    webgl.bindFramebuffer('trailPosition' + targetbufferIndex)

    const program = webgl.programs['trailResetPosition']
    program.use()
    program.draw()
  }

  const draw = time => {
    {
      webgl.bindFramebuffer('particle')

      const program = webgl.programs['particle']
      program.use()
      program.setUniform('time', time)
      program.draw()

      webgl.effects['bloom'].draw('particle', '2', '1', 0.4)
    }

    {
      webgl.bindFramebuffer('next')

      const cTime = cubicOut(clamp((time - 0.2) * 1.2, 0, 1))

      const program = webgl.programs['next']
      program.use()
      program.setUniform('time', cTime)
      program.draw()

      webgl.effects['blur'].draw('next', '2', mix(2, 0, cTime))

      webgl.effects['godray'].draw(
        'next',
        'particle',
        '2',
        mix(60, 10, time),
        [
          webgl.canvas.width * 0.5,
          mix(webgl.canvas.height, webgl.canvas.height * 0.5, time)
        ],
        mix(0.5, 0.02, time)
      )
    }

    targetbufferIndex = loopCount++ % 2
    prevbufferIndex = 1 - targetbufferIndex

    {
      webgl.bindFramebuffer('velocity' + targetbufferIndex)

      const program = webgl.programs['velocity']
      program.use()
      program.setFramebufferUniform('prevVelocityTexture', 'velocity' + prevbufferIndex)
      program.draw()
    }

    {
      webgl.bindFramebuffer('position' + targetbufferIndex)

      const program = webgl.programs['position']
      program.use()
      program.setFramebufferUniform('prevPositionTexture', 'position' + prevbufferIndex)
      program.setFramebufferUniform('velocityTexture', 'velocity' + targetbufferIndex)
      program.draw()
    }

    {
      webgl.bindFramebuffer('trailVelocity' + targetbufferIndex)

      const program = webgl.programs['trailVelocity']
      program.use()
      program.setFramebufferUniform('prevVelocityTexture', 'trailVelocity' + prevbufferIndex)
      program.setFramebufferUniform('prevPositionTexture', 'trailPosition' + prevbufferIndex)
      program.draw()
    }

    {
      webgl.bindFramebuffer('trailPosition' + targetbufferIndex)

      const program = webgl.programs['trailPosition']
      program.use()
      program.setFramebufferUniform('prevPositionTexture', 'trailPosition' + prevbufferIndex)
      program.setFramebufferUniform('velocityTexture', 'trailVelocity' + targetbufferIndex)
      program.draw()
    }

    webgl.unbindFramebuffer()

    {
      const program = webgl.programs['main']
      program.use()
      program.setUniform('time', time)
      program.setFramebufferUniform('particle', '1')
      program.setFramebufferUniform('next', '2')
      program.draw()
    }

    {
      const program = webgl.programs['curl']
      program.use()
      program.setFramebufferUniform('positionTexture', 'position' + targetbufferIndex)
      program.draw()
    }

    {
      const program = webgl.programs['trail']
      program.use()
      program.setFramebufferUniform('positionTexture', 'trailPosition' + targetbufferIndex)
      program.draw()
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
})
