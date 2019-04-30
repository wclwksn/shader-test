import Webgl, { loadImage } from './modules/webgl'
import { animate } from './modules/animation'
import mainVertexShader from '../shaders/main.vert'
import mainFragmentShader from '../shaders/main.frag'
import particleVertexShader from '../shaders/particle.vert'
import particleFragmentShader from '../shaders/particle.frag'

loadImage(require('../images/room.jpg')).then(img => {
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
      particleNormal.push(0, 0, 1)
      particleUv.push(i / width, 1 - j / height)
    }
  }

  const webgl = new Webgl({
    canvas,
    cameraPosition: [0, 0, 100],
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

  animate(time => {
    {
      const program = webgl.programs.main
      program.use()

      program.setUniform('time', time)

      program.draw()
    }

    {
      const program = webgl.programs.particle
      program.use()

      // program.updateAttribute('position', 2, (Math.sin(time) + 1) / 2)

      program.setUniform('time', time)

      program.draw()
    }
  }, {
    finish: 9,
    duration: 10000,
    isRoop: true
  })
})
