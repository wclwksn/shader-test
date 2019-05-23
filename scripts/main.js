import Webgl from './modules/webgl'
import { noneAttribute } from './modules/webgl/program'
import loadImage from './modules/loadImage'
import { animate } from './modules/animation'
import { mix } from './modules/math'

import mainVert from '../shaders/main.vert'
import mainFrag from '../shaders/main.frag'
import particleVert from '../shaders/particle.vert'
import particleFrag from '../shaders/particle.frag'
import specularFrag from '../shaders/specular.frag'

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
        hasResolution: true,
        hasTime: true,
        mode: 'POINTS',
        drawType: 'DYNAMIC_DRAW',
        isTransparent: true,
        isClear: true
      },
      specular: {
        fragmentShader: specularFrag,
        attributes: noneAttribute,
        uniforms: {
          texture: 'framebuffer'
        },
        hasResolution: true
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
          particle: 'framebuffer',
          specular: 'framebuffer'
        },
        hasResolution: true,
        hasTime: true
      }
    },
    effects: [
      'blur'
    ],
    framebuffers: ['particle', '1', '2'],
    isAutoStart: false
  })

  const draw = time => {
    let writeBuffer = '1'
    let readBuffer = '2'

    webgl.bindFramebuffer('particle')

    {
      const program = webgl.programs['particle']
      program.use()
      program.setUniform('time', time)
      program.draw()
    }

    webgl.bindFramebuffer(writeBuffer)

    {
      const program = webgl.programs['specular']
      program.use()
      program.setFramebufferUniform('texture', 'particle')
      program.draw()
    }

    webgl.effects['blur'].add(writeBuffer, readBuffer, 0.4)

    webgl.unbindFramebuffer()

    {
      const program = webgl.programs['main']
      program.use()
      program.setUniform('time', time)
      program.setFramebufferUniform('particle', 'particle')
      program.setFramebufferUniform('specular', writeBuffer)
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
