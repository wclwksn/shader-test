import WebGl, { loadImage } from './modules/webgl'
import fragmentShader from '../shaders/main.frag'
import image from '../images/room.jpg'

loadImage(image).then(img => {
  const webGl = new WebGl({
    canvas: document.querySelector('canvas'),
    fragmentShader,
    uniforms: {
      time: {
        type: '1f',
        value: 0
      },
      imageResolution: {
        type: '2fv',
        value: [img.width, img.height]
      },
      image: {
        type: 'image',
        value: img
      }
    }
  })
})
