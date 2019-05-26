import Webgl from './modules/webgl'
import loadImage from './modules/loadImage'
import { animate } from './modules/animation'

import mainVert from '../shaders/main.vert'
import mainFrag from '../shaders/main.frag'
import particleVert from '../shaders/particle.vert'
import particleFrag from '../shaders/particle.frag'

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
        isTransparent: true,
        isClear: true
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
          image2: img2,
          imageResolution2: [img2.width, img2.height],
          particle: 'framebuffer'
        },
        hasTime: true
      }
    },
    effects: [
      'bloom'
    ],
    framebuffers: ['particle', '1', '2'],
    isAutoStart: false
  })

  const outFramebufferKey = '1'
  const inFramebufferKey = '2'

  const draw = time => {
    webgl.bindFramebuffer('particle')

    {
      const program = webgl.programs['particle']
      program.use()
      program.setUniform('time', time)
      program.draw()
    }

    webgl.effects['bloom'].draw('particle', inFramebufferKey, outFramebufferKey, 0.4)

    webgl.unbindFramebuffer()

    {
      const program = webgl.programs['main']
      program.use()
      program.setUniform('time', time)
      program.setFramebufferUniform('particle', outFramebufferKey)
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
