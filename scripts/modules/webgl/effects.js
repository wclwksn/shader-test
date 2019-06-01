import Program from './program'
import blurFrag from '../../../shaders/postprocessing/blur.frag'
import specularFrag from '../../../shaders/postprocessing/specular.frag'
import bloomFrag from '../../../shaders/postprocessing/bloom.frag'
import zoomblurFrag from '../../../shaders/postprocessing/zoomblur.frag'
import godrayFrag from '../../../shaders/postprocessing/godray.frag'

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

    this.radius = 0.5
  }

  draw (readFramebufferKey, cacheFramebufferKey, radius, isOnscreen) {
    this.use()

    const iterations = 8
    for (let i = 0; i < iterations; i++) {
      this.webgl.bindFramebuffer(isOnscreen && i >= iterations - 1 ? null : cacheFramebufferKey)
      this.setFramebufferUniform('texture', readFramebufferKey)
      this.setUniform('radius', (iterations - 1 - i) * (typeof radius !== 'undefined' ? radius : this.radius))
      this.setUniform('isHorizontal', i % 2 === 0)
      super.draw()

      const t = cacheFramebufferKey
      cacheFramebufferKey = readFramebufferKey
      readFramebufferKey = t
    }
    // output: readFramebufferKey
  }
}

class Specular extends Program {
  constructor (webgl, option = {}) {
    const {
      threshold = 0.5
    } = option

    const programOption = {
      fragmentShader: specularFrag,
      uniforms: {
        texture: 'framebuffer',
        threshold
      }
    }

    super(webgl, programOption)
  }

  draw (readFramebufferKey, outFramebufferKey, threshold) {
    this.webgl.bindFramebuffer(outFramebufferKey)
    this.use()
    this.setFramebufferUniform('texture', readFramebufferKey)
    if (typeof threshold !== 'undefined') this.setUniform('threshold', threshold)
    super.draw()
  }
}

export class Bloom extends Program {
  constructor (webgl) {
    if (!webgl.effects['bloomSpecular']) {
      webgl.effects['bloomSpecular'] = new Specular(webgl, {
        threshold: 0.5
      })
    }

    if (!webgl.effects['bloomBlur']) {
      webgl.effects['bloomBlur'] = new Blur(webgl)
    }

    const option = {
      fragmentShader: bloomFrag,
      uniforms: {
        texture: 'framebuffer',
        specular: 'framebuffer'
      }
    }
    super(webgl, option)

    this.radius = 0.4
  }

  draw (readFramebufferKey, cacheFramebufferKey, outFramebufferKey, radius, isOnscreen) {
    this.webgl.effects['bloomSpecular'].draw(readFramebufferKey, cacheFramebufferKey)

    this.webgl.effects['bloomBlur'].draw(
      cacheFramebufferKey,
      outFramebufferKey,
      typeof radius !== 'undefined' ? radius : this.radius
    )

    this.webgl.bindFramebuffer(isOnscreen ? null : outFramebufferKey)
    this.use()
    this.setFramebufferUniform('texture', readFramebufferKey)
    this.setFramebufferUniform('specular', cacheFramebufferKey)
    super.draw()
  }
}

export class Zoomblur extends Program {
  constructor (webgl) {
    const option = {
      fragmentShader: zoomblurFrag,
      uniforms: {
        texture: 'framebuffer',
        strength: 5,
        center: [webgl.canvas.width / 2, webgl.canvas.height / 2]
      }
    }
    super(webgl, option)
  }

  draw (readFramebufferKey, outFramebufferKey, strength, center, isOnscreen) {
    this.webgl.bindFramebuffer(isOnscreen ? null : outFramebufferKey)
    this.use()
    this.setFramebufferUniform('texture', readFramebufferKey)
    if (typeof strength !== 'undefined') this.setUniform('strength', strength)
    if (typeof center !== 'undefined') this.setUniform('center', center)
    super.draw()
  }
}

export class Godray extends Program {
  constructor (webgl) {
    if (!webgl.effects['godraySpecular']) {
      webgl.effects['godraySpecular'] = new Specular(webgl, {
        threshold: 0.75
      })
    }

    if (!webgl.effects['godrayZoomblur']) {
      webgl.effects['godrayZoomblur'] = new Zoomblur(webgl)
    }

    if (!webgl.effects['godrayBlur']) {
      webgl.effects['godrayBlur'] = new Blur(webgl)
    }

    if (!webgl.effects['godrayBase']) {
      webgl.effects['godrayBase'] = new Program(webgl, {
        fragmentShader: godrayFrag,
        uniforms: {
          texture: 'framebuffer'
        }
      })
    }

    const option = {
      fragmentShader: godrayFrag,
      uniforms: {
        texture: 'framebuffer'
      },
      isAdditive: true,
      isClear: false
    }
    super(webgl, option)

    this.radius = 0.02
  }

  draw (readFramebufferKey, cacheFramebufferKey, outFramebufferKey, strength, center, radius, isOnscreen) {
    this.webgl.effects['godraySpecular'].draw(readFramebufferKey, outFramebufferKey)

    this.webgl.effects['godrayZoomblur'].draw(outFramebufferKey, cacheFramebufferKey, strength, center)

    this.webgl.effects['godrayBlur'].draw(
      cacheFramebufferKey,
      outFramebufferKey,
      typeof radius !== 'undefined' ? radius : this.radius
    )

    this.webgl.bindFramebuffer(isOnscreen ? null : outFramebufferKey)

    {
      const program = this.webgl.effects['godrayBase']
      program.use()
      program.setFramebufferUniform('texture', readFramebufferKey)
      program.draw()
    }

    this.use()
    this.setFramebufferUniform('texture', cacheFramebufferKey)
    super.draw()
  }
}
