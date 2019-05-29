import Webgl from './modules/webgl'
import loadImage from './modules/loadImage'
import { animate, cubicOut } from './modules/animation'
import { mix, clamp } from './modules/math'

import mainVert from '../shaders/main.vert'
import mainFrag from '../shaders/main.frag'
import particleVert from '../shaders/particle.vert'
import particleFrag from '../shaders/particle.frag'
import nextFrag from '../shaders/next.frag'

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

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      particlePosition.push(i - halfWidth, j - halfHeight, 0)
      particleNormal.push((Math.random() * 2 - 1) * 0.1, (Math.random() * 2 - 1) * 0.1, 1)
      particleUv.push(i / width, 1 - j / height)
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
        hasTime: true,
        isTransparent: true
      }
    },
    effects: [
      'bloom'
    ],
    framebuffers: [
      'particle',
      'next',
      '1',
      '2'
    ],
    isAutoStart: false
  })

  const draw = time => {
    webgl.bindFramebuffer('particle')

    {
      const program = webgl.programs['particle']
      program.use()
      program.setUniform('time', time)
      program.draw()
    }

    webgl.effects['bloom'].draw('particle', '2', '1', 0.4)

    webgl.bindFramebuffer('next')

    {
      const cTime = cubicOut(clamp((time - 0.1) * 1.2, 0, 1))

      const program = webgl.programs['next']
      program.use()
      program.setUniform('time', cTime)
      program.draw()

      webgl.effects['blur'].draw('next', '2', mix(2, 0, cTime))
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
