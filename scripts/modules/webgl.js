import matIV from './minMatrix.js'
import wholeVertexShader from '../../shaders/modules/whole.vert'

const PI2 = Math.PI * 2
const wholeAttribute = {
  value: [
    -1, 1, 0,
    -1, -1, 0,
    1, 1, 0,
    1, -1, 0
  ],
  stride: 3
}
let textureIndex = -1

class Program {
  constructor (gl, option) {
    this.attributes = {}
    this.uniforms = {}
    this.textureIndexes = {}

    const {
      vertexShader = wholeVertexShader,
      fragmentShader,
      attributes,
      uniforms,
      mode = 'TRIANGLE_STRIP',
      drawType = 'STATIC_DRAW',
      isTransparent = false,
      hasResolution = true,
      hasCamera = true,
      hasLight = true,
      hasTime = true
    } = option
    const isWhole = !option.vertexShader

    this.gl = gl
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
      position: wholeAttribute
    })
  }

  createUniform (data) {
    const mergedData = Object.assign({}, data)

    if (this.hasResolution) mergedData.resolution = [0, 0]
    if (this.hasTime) mergedData.time = 0
    if (this.hasCamera) {
      mergedData.mvpMatrix = new Float32Array(16)
      mergedData.invMatrix = new Float32Array(16)
    }
    if (this.hasLight) {
      mergedData.lightDirection = [0, 0, 0]
      mergedData.eyeDirection = [0, 0, 0]
      mergedData.ambientColor = [0.1, 0.1, 0.1]
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
          uniformValue = this.createTexture(value, key)
          break
        case 'Object':
          uniformType = value.type
          uniformValue = value.value
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

  createTexture (img, key) {
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

    return textureIndex
  }

  getTextureIndex (key) {
    return this.textureIndexes[key]
  }

  updateTexture (key, img) {
    const { gl } = this

    this.activeTexture(this.getTextureIndex(key))
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
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
      lightDirection = [-0.5, 0.5, 0.5],
      eyeDirection = cameraPosition,
      ambientColor = [0.1, 0.1, 0.1],
      clearedColor,
      programs,
      tick = () => {},
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

    if (clearedColor) this.clearColor(clearedColor)

    this.initSize()

    if (isAutoStart) this.start()
  }

  initWebgl (canvas) {
    if (typeof canvas === 'string') {
      this.canvas = document.querySelector(canvas)
    } else if (typeof canvas === 'object' && canvas.constructor.name === 'HTMLCanvasElement') {
      this.canvas = canvas
    } else {
      throw new Error(`Failed to set canvas.`)
    }

    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
  }

  createProgram (key, option) {
    this.programs[key] = new Program(this.gl, option)
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

      this.tick(time)

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

export function loadImage (src, isCrossOrigin) {
  const img = new Image()

  const promise = new Promise(resolve => {
    img.addEventListener('load', () => {
      resolve(img)
    })
  })

  if (isCrossOrigin) img.crossOrigin = 'anonymous'
  img.src = src

  return promise
}
