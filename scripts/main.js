import Webgl, { loadImage } from './modules/webgl'
import fragmentShader from '../shaders/main.frag'

loadImage(require('../images/room.jpg')).then(img => {
  new Webgl({
    canvas: 'canvas',
    fragmentShader,
    uniforms: {
      time: 0,
      imageResolution: [img.width, img.height],
      image: img
    },
    tick (timestamp) {
      this.setUniform('time', timestamp / 1000)
    }
  })
})
