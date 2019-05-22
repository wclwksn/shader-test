import Webgl, { loadImage } from './modules/webgl'
import { animate } from './modules/animation'
import mainVert from '../shaders/main.vert'
import mainFrag from '../shaders/main.frag'
import particleVert from '../shaders/particle.vert'
import particleFrag from '../shaders/particle.frag'
import blurFrag from '../shaders/postprocessing/blur.frag'

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
          image: img,
          imageResolution: [img.width, img.height],
          image2: img2,
          imageResolution2: [img2.width, img2.height]
        },
        hasResolution: true,
        hasTime: true
      },
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
        isTransparent: true
      },
      blur: {
        fragmentShader: blurFrag,
        uniforms: {
          texture: {
            type: '1i'
          },
          direction: [0, 0]
        },
        hasResolution: true
      }
    },
    framebuffers: ['1', '2'],
    isAutoStart: false
  })

  const iterations = 8
  let writeBuffer
  let readBuffer
  let t

  const draw = time => {
    writeBuffer = '1'
    readBuffer = '2'

    webgl.bindFramebuffer(writeBuffer)

    {
      const program = webgl.programs['main']
      program.use()
      program.setUniform('time', time)
      program.draw()
    }

    {
      const program = webgl.programs['particle']
      program.use()
      program.setUniform('time', time)
      program.draw()
    }

    {
      const program = webgl.programs['blur']
      program.use()

      for (let i = 0; i < iterations; i++) {
        t = writeBuffer
        writeBuffer = readBuffer
        readBuffer = t

        const radius = (iterations - i - 1) * (Math.sin(time * 12) * 0.5 + 0.5)

        webgl.bindFramebuffer(i < iterations - 1 ? writeBuffer : null)
        program.setFramebufferUniform('texture', readBuffer)
        program.setUniform('direction', i % 2 === 0 ? [radius, 0] : [0, radius])
        program.draw()
      }
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
