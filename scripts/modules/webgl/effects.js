import Program from './program'
import blurFrag from '../../../shaders/postprocessing/blur.frag'
import specularFrag from '../../../shaders/postprocessing/specular.frag'
import bloomFrag from '../../../shaders/postprocessing/bloom.frag'

export class Blur extends Program {
  constructor (webgl) {
    const option = {
      fragmentShader: blurFrag,
      uniforms: {
        texture: 'framebuffer',
        radius: 0,
        isHorizontal: false
      },
      hasCamera: false,
      hasLight: false
    }

    super(webgl, option)
  }

  draw (inFramebufferKey, outFramebufferKey, radius, isDraw) {
    this.use()

    const iterations = 8
    for (let i = 0; i < iterations; i++) {
      this.webgl.bindFramebuffer(isDraw && i >= iterations - 1 ? null : outFramebufferKey)
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

export class Specular extends Program {
  constructor (webgl) {
    const option = {
      fragmentShader: specularFrag,
      uniforms: {
        texture: 'framebuffer'
      }
    }

    super(webgl, option)
  }

  draw (readFramebufferKey) {
    this.use()
    this.setFramebufferUniform('texture', readFramebufferKey)
    super.draw()
  }
}

export class Bloom extends Program {
  constructor (webgl) {
    if (!webgl.effects['blur']) {
      webgl.effects['blur'] = new Blur(webgl)
    }

    if (!webgl.effects['specular']) {
      webgl.effects['specular'] = new Specular(webgl)
    }

    const option = {
      fragmentShader: bloomFrag,
      uniforms: {
        texture: 'framebuffer',
        specular: 'framebuffer'
      }
    }
    super(webgl, option)
  }

  draw (readFramebufferKey, inFramebufferKey, outFramebufferKey, radius, isDraw) {
    this.webgl.bindFramebuffer(outFramebufferKey)

    this.webgl.effects['specular'].draw(readFramebufferKey)

    this.webgl.effects['blur'].draw(outFramebufferKey, inFramebufferKey, radius, isDraw)

    this.webgl.bindFramebuffer(isDraw ? null : outFramebufferKey)

    this.use()
    this.setFramebufferUniform('texture', readFramebufferKey)
    this.setFramebufferUniform('specular', inFramebufferKey)
    super.draw()
  }
}
