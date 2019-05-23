import Program from './program'
import blurFrag from '../../../shaders/postprocessing/blur.frag'

export class Blur extends Program {
  constructor (webgl) {
    const option = {
      fragmentShader: blurFrag,
      uniforms: {
        texture: 'framebuffer',
        radius: 0,
        isHorizontal: false
      },
      hasResolution: true,
      hasCamera: false,
      hasLight: false
    }

    super(webgl, option)
  }

  add (inFramebufferKey, outFramebufferKey, radius) {
    this.use()

    const iterations = 8
    for (let i = 0; i < iterations; i++) {
      this.webgl.bindFramebuffer(i < iterations - 1 ? outFramebufferKey : null)
      this.setFramebufferUniform('texture', inFramebufferKey)
      this.setUniform('radius', (iterations - 1 - i) * radius)
      this.setUniform('isHorizontal', i % 2 === 0)
      this.draw()

      const t = outFramebufferKey
      outFramebufferKey = inFramebufferKey
      inFramebufferKey = t
    }
  }
}
