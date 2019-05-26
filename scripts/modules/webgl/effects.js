import Program, { noneAttribute } from './program'
import blurFrag from '../../../shaders/postprocessing/blur.frag'
import specularFrag from '../../../shaders/specular.frag'

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

  draw (inFramebufferKey, outFramebufferKey, radius) {
    this.use()

    const iterations = 8
    for (let i = 0; i < iterations; i++) {
      this.webgl.bindFramebuffer(i < iterations - 1 ? outFramebufferKey : null)
      this.setFramebufferUniform('texture', inFramebufferKey)
      this.setUniform('radius', (iterations - 1 - i) * radius)
      this.setUniform('isHorizontal', i % 2 === 0)
      super.draw()

      const t = outFramebufferKey
      outFramebufferKey = inFramebufferKey
      inFramebufferKey = t
    }
  }
}

export class Bloom extends Program {
  constructor (webgl) {
    const option = {
      fragmentShader: specularFrag,
      attributes: noneAttribute,
      uniforms: {
        texture: 'framebuffer'
      },
      hasResolution: true
    }

    if (!webgl.effects['blur']) webgl.createEffect('blur')

    super(webgl, option)
  }

  draw (readFramebufferKey, inFramebufferKey, outFramebufferKey, radius) {
    this.webgl.bindFramebuffer(inFramebufferKey)

    this.use()
    this.setFramebufferUniform('texture', readFramebufferKey)
    super.draw()

    this.webgl.effects['blur'].draw(inFramebufferKey, readFramebufferKey, radius)
  }
}
