import noneVert from '../../../shaders/template/none.vert'

const noneAttribute = {
  position: {
    value: [-1, 1, -1, -1, 1, 1, 1, -1],
    stride: 2
  }
}

export default class Program {
  constructor (webgl, option) {
    this.attributes = {}
    this.uniforms = {}
    this.textureIndexes = {}

    const { gl } = webgl
    this.webgl = webgl

    const {
      vertexShader = noneVert,
      fragmentShaderSelector,
      fragmentShader = document.querySelector(fragmentShaderSelector).textContent,
      attributes,
      uniforms,
      hasResolution = true,
      hasTime = false,
      mode = 'TRIANGLE_STRIP',
      drawType = 'STATIC_DRAW',
      isTransparent = false,
      hasCamera = true,
      hasLight = true,
      isClear = false,
      clearedColor
    } = option
    const isWhole = !option.vertexShader

    this.mode = mode
    this.drawType = drawType
    this.isTransparent = isTransparent
    this.hasResolution = hasResolution
    this.hasCamera = hasCamera
    this.hasLight = hasLight
    this.hasTime = hasTime
    this.isClear = isClear || !!clearedColor
    this.clearedColor = this.isClear ? clearedColor || [0, 0, 0, 0] : null

    this.createProgram(vertexShader, fragmentShader)

    this.use()

    if (isWhole) this.createWholeAttribute()
    else if (attributes) this.createAttribute(attributes)

    if (uniforms) this.createUniform(uniforms)

    if (isTransparent) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  createProgram (vertexShader, fragmentShader) {
    const { gl } = this.webgl

    const program = gl.createProgram()
    gl.attachShader(program, this.createShader('VERTEX_SHADER', vertexShader))
    gl.attachShader(program, this.createShader('FRAGMENT_SHADER', fragmentShader))
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      return
    }

    if (!program) {
      console.error(`Failed to create program "${key}".`)
      return
    }

    this.program = program
  }

  createShader (type, content) {
    const { gl } = this.webgl
    const shader = gl.createShader(gl[type])

    gl.shaderSource(shader, content)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader))
      return
    }

    return shader
  }

  createAttribute (data) {
    Object.keys(data).forEach(key => {
      const { value, stride } = data[key]

      this.addAttribute(key, value, stride)
    })
  }

  addAttribute (key, value, stride) {
    const { gl } = this.webgl
    const location = gl.getAttribLocation(this.program, key)
    const data = new Float32Array(value)
    const attribute = this.attributes[key] = {
      location,
      stride,
      data,
      count: value.length / stride
    }

    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl[this.drawType])
    attribute.vbo = vbo
  }

  updateAttribute (key, index, value) {
    const { gl } = this.webgl
    const { location, stride, vbo, data } = this.attributes[key]

    data[index] = value
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
  }

  setAttribute (key) {
    const { gl } = this.webgl
    const attribute = this.attributes[key]
    const { location, stride, vbo } = attribute

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)
  }

  createWholeAttribute () {
    this.createAttribute(noneAttribute)
  }

  createUniform (data) {
    const mergedData = Object.assign({}, data)

    if (this.hasResolution && !mergedData.resolution) mergedData.resolution = [1, 1]
    if (this.hasTime && !mergedData.time) mergedData.time = 0
    if (this.hasCamera) {
      mergedData.mvpMatrix = new Float32Array(16)
      mergedData.invMatrix = new Float32Array(16)
    }
    if (this.hasLight) {
      if (!mergedData.lightDirection) mergedData.lightDirection = [0, 0, 0]
      if (!mergedData.eyeDirection) mergedData.eyeDirection = [0, 0, 0]
      if (!mergedData.ambientColor) mergedData.ambientColor = [0.1, 0.1, 0.1]
    }

    Object.keys(mergedData).forEach(key => {
      this.addUniform(key, mergedData[key])
    })
  }

  addUniform (key, value) {
    let uniformType
    let uniformValue = value

    const getTypeFromString = (type, value) => {
      switch (type) {
        case 'image':
          uniformType = '1i'
          uniformValue = this.createTexture(key, value)
          break
        case 'framebuffer':
          uniformType = '1i'
          uniformValue = value
          break
        default:
          uniformType = type
          uniformValue = value
      }
    }

    switch (typeof value) {
      case 'number':
        uniformType = '1f'
        break
      case 'boolean':
        uniformType = '1i'
        break
      case 'string':
        getTypeFromString(value)
        break
      case 'object':
        switch (value.constructor.name) {
          case 'Float32Array':
          case 'Array':
            switch (value.length) {
              case 16:
                uniformType = 'Matrix4fv'
                break
              default:
                uniformType = `${value.length}fv`
            }
            break
          case 'HTMLImageElement':
            uniformType = '1i'
            uniformValue = this.createTexture(key, value)
            break
          case 'Object':
            getTypeFromString(value.type, value.value)
            break
        }
        break
    }

    if (!uniformType) {
      console.error(`Failed to add uniform "${key}".`)
      return
    }

    this.uniforms[key] = {
      location: this.webgl.gl.getUniformLocation(this.program, key),
      type: `uniform${uniformType}`
    }

    if (typeof uniformValue !== 'undefined') this.setUniform(key, uniformValue)
  }

  setUniform (key, value) {
    const uniform = this.uniforms[key]
    if (!uniform) return
    const { location, type } = uniform

    const args = /^uniformMatrix/.test(type)
      ? [location, false, value]
      : [location, value]
    this.webgl.gl[type](...args)
  }

  setTextureUniform (key, textureKey) {
    this.setUniform(key, this.textureIndexes[textureKey])
  }

  setFramebufferUniform (key, framebufferKey) {
    this.setUniform(key, this.webgl.framebuffers[framebufferKey].textureIndex)
  }

  createTexture (key, el) {
    if (!el) return

    const { gl } = this.webgl
    const texture = gl.createTexture()
    const textureIndex = this.textureIndexes[key] = ++this.webgl.textureIndex

    gl.activeTexture(gl[`TEXTURE${textureIndex}`])
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el)

    return textureIndex
  }

  updateTexture (key, el) {
    const { gl } = this.webgl

    gl.activeTexture(gl[`TEXTURE${this.textureIndexes[key]}`])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el)
  }

  use () {
    this.webgl.gl.useProgram(this.program)
  }

  draw () {
    const { gl } = this.webgl
    const { attributes } = this

    if (this.isClear) {
      gl.clearColor(...this.clearedColor)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }

    if (this.isTransparent) gl.enable(gl.BLEND)
    else gl.disable(gl.BLEND)

    Object.keys(attributes).forEach(key => {
      this.setAttribute(key)
    })

    gl.drawArrays(gl[this.mode], 0, attributes.position.count)
  }
}
