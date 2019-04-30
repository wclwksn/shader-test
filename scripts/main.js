import Webgl, { loadImage } from './modules/webgl'
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

  new Webgl({
    canvas,
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
            value: [
              -halfWidth / 2, halfHeight / 2, 0,
              -halfWidth / 2, -halfHeight / 2, 0,
              halfWidth / 2, halfHeight / 2, 0,
              halfWidth / 2, -halfHeight / 2, 0
            ],
            stride: 3
          },
          normal: {
            value: [
              0, 0, 1,
              0, 0, 1,
              0, 0, 1,
              0, 0, 1
            ],
            stride: 3
          }
        },
        uniforms: {
          imageResolution: [img.width, img.height],
          image: img
        },
        mode: 'POINTS',
        drawType: 'DYNAMIC_DRAW'
      }
    },
    tick (time) {
      {
        const program = this.programs.main
        program.use()

        program.setUniform('time', time)

        program.draw()
      }

      {
        const program = this.programs.particle
        program.use()

        program.updateAttribute('position', 2, (Math.sin(time) + 1) / 2)

        program.setUniform('time', time)

        program.draw()
      }
    }
  })
})
