import matIV from './minMatrix.js'
import noneVert from '../../shaders/template/none.vert'

const PI2 = Math.PI * 2
const noneAttribute = {
  value: [-1, 1, -1, -1, 1, 1, 1, -1],
  stride: 2
}
let textureIndex = -1

class Program {
  constructor (webgl, option) {
    this.attributes = {}
    this.uniforms = {}
    this.textureIndexes = {}

    const {
      gl,
      framebuffers
    } = webgl

    this.gl = gl
    this.framebuffers = framebuffers

    const {
      framebuffer,
      vertexShader = noneVert,
      fragmentShaderSelector,
      fragmentShader = document.querySelector(fragmentShaderSelector).textContent,
      attributes,
      uniforms,
      hasResolution = false,
      hasTime = false,
      mode = 'TRIANGLE_STRIP',
      drawType = 'STATIC_DRAW',
      isTransparent = false,
      hasCamera = true,
      hasLight = true
    } = option
    const isWhole = !option.vertexShader

    this.mode = mode
    this.drawType = drawType
    this.isTransparent = isTransparent
    this.hasResolution = hasResolution
    this.hasCamera = hasCamera
    this.hasLight = hasLight
    this.hasTime = hasTime

    this.createProgram(vertexShader, fragmentShader)

    this.use()

    if (isWhole) this.createWholeAttribute()
    else if (attributes) this.createAttribute(attributes)

    if (uniforms) this.createUniform(uniforms)

    if (isTransparent) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  createProgram (vertexShader, fragmentShader) {
    const { gl } = this

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
    const { gl } = this
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
    const { gl } = this
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
    const { gl } = this
    const { location, stride, vbo, data } = this.attributes[key]

    data[index] = value
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
  }

  setAttribute (key) {
    const { gl } = this
    const attribute = this.attributes[key]
    const { location, stride, vbo } = attribute

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)
  }

  createWholeAttribute () {
    this.createAttribute({
      position: noneAttribute
    })
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

    if (typeof value === 'number') {
      uniformType = '1f'
    } else if (typeof value === 'object') {
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
          if (value.type === 'image') {
            uniformType = '1i'
            uniformValue = this.createTexture(key, value.value)
          } else {
            uniformType = value.type
            uniformValue = value.value
          }
          break
      }
    }

    if (!uniformType) {
      console.error(`Failed to add uniform "${key}".`)
      return
    }

    this.uniforms[key] = {
      location: this.gl.getUniformLocation(this.program, key),
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
    this.gl[type](...args)
  }

  setTextureUniform (key, textureKey) {
    this.setUniform(key, this.textureIndexes[textureKey])
  }

  setFramebufferUniform (key, framebufferKey) {
    this.setUniform(key, this.framebuffers[framebufferKey].textureIndex)
  }

  createTexture (key, el) {
    const { gl } = this
    const texture = gl.createTexture()
    this.textureIndexes[key] = ++textureIndex

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
    const { gl } = this

    gl.activeTexture(gl[`TEXTURE${this.textureIndexes[key]}`])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el)
  }

  use () {
    this.gl.useProgram(this.program)
  }

  draw () {
    const { gl, attributes } = this

    if (this.isTransparent) gl.enable(gl.BLEND)
    else gl.disable(gl.BLEND)

    Object.keys(attributes).forEach(key => {
      this.setAttribute(key)
    })

    gl.drawArrays(gl[this.mode], 0, attributes.position.count)
  }
}

export default class Webgl {
  constructor (option) {
    this.programs = {}
    this.framebuffers = {}
    this.mMatrix = matIV.identity(matIV.create())
    this.vMatrix = matIV.identity(matIV.create())
    this.pMatrix = matIV.identity(matIV.create())
    this.vpMatrix = matIV.identity(matIV.create())
    this.mvpMatrix = matIV.identity(matIV.create())
    this.invMatrix = matIV.identity(matIV.create())

    const {
      canvas,
      fov,
      near = 0.1,
      far = 2000,
      cameraPosition = [0, 0, 30],
      cameraRotation = [0, 0],
      lightDirection = [-1, 1, 1],
      eyeDirection = cameraPosition,
      ambientColor = [0.1, 0.1, 0.1],
      clearedColor,
      programs = {},
      framebuffers = [],
      tick,
      onResize,
      isAutoStart = true
    } = option

    this.initWebgl(canvas)

    this.fov = typeof fov !== 'undefined' ? fov : Math.atan(this.canvas.clientHeight / 2 / cameraPosition[2]) * (180 / Math.PI) * 2
    this.near = near
    this.far = far
    this.cameraPosition = cameraPosition
    this.cameraRotation = cameraRotation

    this.lightDirection = lightDirection
    this.eyeDirection = eyeDirection
    this.ambientColor = ambientColor

    this.tick = tick
    this.onResize = onResize
    this.clearedColor = clearedColor

    Object.keys(programs).forEach(key => {
      this.createProgram(key, programs[key])
    })

    this.initSize()

    switch (framebuffers.constructor.name) {
      case 'Array':
        framebuffers.forEach(key => {
          this.createFramebuffer(key)
        })
        break
      case 'Object':
        Object.keys(framebuffers).forEach(key => {
          const { width, height } = framebuffers[key]
          this.createFramebuffer(key, width, height)
        })
        break
    }

    if (clearedColor) this.clearColor(clearedColor)

    if (isAutoStart) this.start()
  }

  initWebgl (canvas) {
    if (typeof canvas === 'string') {
      this.canvas = document.querySelector(canvas)
    } else if (typeof canvas === 'object' && canvas.constructor.name === 'HTMLCanvasElement') {
      this.canvas = canvas
    } else {
      this.canvas = document.createElement('canvas')
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'
      document.body.appendChild(this.canvas)
    }

    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
  }

  createProgram (key, option) {
    this.programs[key] = new Program(this, option)
  }

  createFramebuffer (key, width = this.canvas.width, height = this.canvas.height) {
    const { gl } = this

    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    const depthRenderBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer)
    const fTexture = gl.createTexture()
    ++textureIndex
    gl.activeTexture(gl[`TEXTURE${textureIndex}`])
    gl.bindTexture(gl.TEXTURE_2D, fTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    // gl.bindTexture(gl.TEXTURE_2D, null)

    this.framebuffers[key] =  { framebuffer, textureIndex }
  }

  createFramebufferFloat (key, width, height = width) {
    const { gl } = this
    const textureFloat = gl.getExtension('OES_texture_float')
    const textureHalfFloat = gl.getExtension('OES_texture_half_float')

    if (!(textureFloat || textureHalfFloat)) {
      console.error('float texture not support')
      return
    }

    const flg = textureFloat ? gl.FLOAT : textureHalfFloat.HALF_FLOAT_OES
    const framebuffer = gl.createFramebuffer()
    const texture = gl.createTexture()
    ++textureIndex

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.activeTexture(gl[`TEXTURE${textureIndex}`])
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, flg, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    this.framebuffers[key] = { framebuffer, textureIndex }
  }

  bindFramebuffer (key) {
    const { gl } = this

    gl.bindFramebuffer(gl.FRAMEBUFFER, key ? this.framebuffers[key].framebuffer : null)
  }

  clearColor (clearedColor = [0, 0, 0, 1]) {
    this.gl.clearColor(...clearedColor)
  }

  setSize () {
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight

    this.canvas.width = width
    this.canvas.height = height
    this.aspect = width / height

    this.gl.viewport(0, 0, width, height)

    Object.keys(this.programs).forEach(key => {
      const program = this.programs[key]
      if (program.hasResolution) {
        program.use()
        program.setUniform('resolution', [width, height])
      }
    })

    this.updateCamera()
    this.updateLight()

    if (this.onResize) this.onResize()
  }

  initSize () {
    this.setSize()
    window.addEventListener('resize', () => { this.setSize() })
  }

  updateCamera () {
    const {
      fov,
      near,
      far,
      cameraPosition,
      cameraRotation,
      mMatrix,
      vMatrix,
      pMatrix,
      vpMatrix,
      mvpMatrix,
      invMatrix
    } = this
    const cameraPositionRate = 0.3

    // cameraPosition[0] += (pointer.x * cameraPositionRate - cameraPosition[0]) * 0.1
    // cameraPosition[1] += (pointer.y * cameraPositionRate - cameraPosition[1]) * 0.1
    // cameraPosition[2] += (settings.zPosition - cameraPosition[2]) * 0.1
    this.eyeDirection = cameraPosition

    matIV.identity(mMatrix)
    matIV.lookAt(
      cameraPosition,
      [cameraPosition[0], cameraPosition[1], 0.0],
      [0.0, 1.0, 0.0],
      vMatrix
    )
    matIV.perspective(fov, this.aspect, near, far, pMatrix)
    matIV.multiply(pMatrix, vMatrix, vpMatrix)

    cameraRotation[0] = cameraRotation[0] % PI2
    cameraRotation[1] = cameraRotation[1] % PI2
    matIV.rotate(mMatrix, cameraRotation[0], [0.0, 1.0, 0.0], mMatrix)
    matIV.rotate(mMatrix, cameraRotation[1], [-1.0, 0.0, 0.0], mMatrix)
    matIV.multiply(vpMatrix, mMatrix, mvpMatrix)
    matIV.inverse(mMatrix, invMatrix)

    Object.keys(this.programs).forEach(key => {
      const program = this.programs[key]
      if (program.hasCamera) {
        program.use()
        program.setUniform('mvpMatrix', mvpMatrix)
        program.setUniform('invMatrix', invMatrix)
      }
    })
  }

  updateLight () {
    const {
      lightDirection,
      eyeDirection,
      ambientColor
    } = this

    Object.keys(this.programs).forEach(key => {
      const program = this.programs[key]
      if (program.hasLight) {
        program.use()
        program.setUniform('lightDirection', lightDirection)
        program.setUniform('eyeDirection', eyeDirection)
        program.setUniform('ambientColor', ambientColor)
      }
    })
  }

  start () {
    const { gl } = this
    let initialTimestamp

    requestAnimationFrame(timestamp => {
      initialTimestamp = timestamp
    })

    const render = timestamp => {
      const time = (timestamp - initialTimestamp) / 1000

      if (this.clearedColor) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      if (this.tick) this.tick(time)

      this.requestID = requestAnimationFrame(render)
    }
    this.requestID = requestAnimationFrame(render)
  }

  stop () {
    if (!this.requestID) return

    cancelAnimationFrame(this.requestID)
    this.requestID = null
  }
}

export function loadImage (srcs, isCrossOrigin) {
  if (!(typeof srcs === 'object' && srcs.constructor.name === 'Array')) {
    srcs = [srcs]
  }

  let promises = []

  srcs.forEach(src => {
    const img = new Image()

    promises.push(
      new Promise(resolve => {
        img.addEventListener('load', () => {
          resolve(img)
        })
      })
    )

    if (isCrossOrigin) img.crossOrigin = 'anonymous'
    img.src = src
  })

  return Promise.all(promises)
}
