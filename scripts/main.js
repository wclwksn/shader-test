import Webgl, { loadImage } from './modules/webgl'
import { animate } from './modules/animation'
import mainVertexShader from '../shaders/main.vert'
import mainFragmentShader from '../shaders/main.frag'
import particleVertexShader from '../shaders/particle.vert'
import particleFragmentShader from '../shaders/particle.frag'

const image = require('../images/room.jpg')
// const image = require('../images/star.jpeg')

loadImage(image).then(img => {
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
    cameraPosition: [0, 0, 100],
    ambientColor: [0.2, 0.2, 0.2],
    programs: {
      main: {
        vertexShader: mainVertexShader,
        fragmentShader: mainFragmentShader,
        attributes: {
          position: {
            value: [
              -halfWidth, halfHeight, 0,
              -halfWidth, -halfHeight, 0,
              halfWidth, halfHeight, 0,
              halfWidth, -halfHeight, 0
            ],
            stride: 3
          },
          uv: {
            value: [
              0, 0,
              0, 1,
              1, 0,
              1, 1
            ],
            stride: 2
          }
        },
        uniforms: {
          imageResolution: [img.width, img.height],
          image: img
        }
      },
      particle: {
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
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
          imageResolution: [img.width, img.height],
          image: img
        },
        mode: 'POINTS',
        drawType: 'DYNAMIC_DRAW',
        isTransparent: true
      }
    },
    isAutoStart: false
  })

  const draw = time => {
    {
      const program = webgl.programs.main
      program.use()
      program.setUniform('time', time)
      program.draw()
    }

    {
      const program = webgl.programs.particle
      program.use()
      program.setUniform('time', time)
      program.draw()
    }
  }

  animate(draw, {
    duration: 8000,
    // delay: 0,
    // easing: 'easeInCubic',
    // cubicBezier: [.3, .0, .4, 1],
    isRoop: true,
    onBefore () {
      draw(0)
    }
  })
})
