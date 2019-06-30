import Webgl from './modules/webgl'
import loadImage from './modules/loadImage'
import { animate, cubicOut, cubicInOut } from './modules/animation'
import { mix, clamp } from './modules/math'

import fullVert from '../shaders/template/full.vert'
import mainFrag from '../shaders/main.frag'
import particleVert from '../shaders/particle.vert'
import particleFrag from '../shaders/particle.frag'
import nextFrag from '../shaders/next.frag'
import godrayFrag from '../shaders/godray.frag'

loadImage([
  require('../images/room.jpg'),
  require('../images/star.jpeg'),
  require('../images/watercolor.jpg'),
  require('../images/fire.jpg'),
]).then(([
  img1,
  img2,
  maskImg,
  godrayImg,
]) => {
  const canvas = document.getElementById('canvas')
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const halfWidth = width / 2
  const halfHeight = height / 2
  const particlePosition = []
  const particleNormal = []
  const particleUv = []
  const fullPosition = {
    value: [
      -halfWidth, halfHeight, 0,
      -halfWidth, -halfHeight, 0,
      halfWidth, halfHeight, 0,
      halfWidth, -halfHeight, 0
    ],
    stride: 3
  }

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
          time: 0,
          image: img1,
          imageResolution: [img1.width, img1.height],
          mask: maskImg,
        },
        mode: 'POINTS',
        drawType: 'DYNAMIC_DRAW',
        isTransparent: true
      },
      next: {
        vertexShader: fullVert,
        fragmentShader: nextFrag,
        attributes: {
          position: fullPosition
        },
        uniforms: {
          time: 0,
          image: img2,
          imageResolution: [img2.width, img2.height]
        },
        isTransparent: true
      },
      godray: {
        vertexShader: fullVert,
        fragmentShader: godrayFrag,
        attributes: {
          position: fullPosition
        },
        uniforms: {
          mask: godrayImg,
        },
        isTransparent: true
      },
      main: {
        vertexShader: fullVert,
        fragmentShader: mainFrag,
        attributes: {
          position: fullPosition
        },
        uniforms: {
          time: 0,
          image: img1,
          imageResolution: [img1.width, img1.height],
          mask: maskImg,
          particle: 'framebuffer',
          next: 'framebuffer',
          godray: 'framebuffer',
        }
      },
    },
    effects: [
      'bloom',
      'blur',
      'godray',
      'godrayLight'
    ],
    framebuffers: [
      'particle',
      'next',
      'godray',
      '1',
      '2'
    ],
    isAutoStart: false
  })

  const draw = time => {
    {
      webgl.bindFramebuffer('particle')

      webgl.programs['particle'].draw({
        time
      })

      webgl.effects['bloom'].draw('particle', '2', '1', 0.2)
    }

    {
      webgl.bindFramebuffer('next')

      const cTime = cubicOut(clamp((time - 0.2) * 1.2, 0, 1))

      webgl.programs['next'].draw({
        time: cTime
      })

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

    {
      webgl.bindFramebuffer('godray')

      const cTime = cubicInOut(time)

      webgl.programs['godray'].draw()

      webgl.effects['godrayLight'].draw(
        'godray',
        'next',
        'particle',
        mix(15, 20, cTime),
        [
          mix(webgl.canvas.width * 0.5, webgl.canvas.width * 0.65, cTime),
          mix(webgl.canvas.height * 1, webgl.canvas.height * 1.5, cTime)
        ],
        mix(0.4, 1.5, cTime)
      )
    }

    {
      webgl.unbindFramebuffer()

      webgl.programs['main'].draw({
        time,
        particle: '1',
        next: '2',
        godray: 'particle',
      })
    }
  }

  animate(draw, {
    duration: 4000,
    delay: 2000,
    // easing: 'easeInCubic',
    // cubicBezier: [.3, .0, .4, 1],
    isRoop: true,
    onBefore () {
      setTimeout(() => {
        draw(0)
      }, 1000)
    }
  })
})
