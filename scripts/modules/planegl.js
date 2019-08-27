export default class Planegl {
  constructor (option) {
    this.uniforms = {}
    this.textureIndexes = {}
    this.textureIndex = -1

    const {
      canvas,
      fragmentShaderId,
      fragmentShader = document.getElementById(fragmentShaderId).textContent,
      uniforms,
      clearedColor,
      tick,
      hasResolution = true,
      hasTime = true,
      onResize,
      isAutoStart = true
    } = option

    this.tick = tick
    this.hasResolution = hasResolution
    this.hasTime = hasTime
    this.onResize = onResize
    this.clearedColor = clearedColor

    this.initWebgl(canvas)

    this.createProgram(fragmentShader)

    this.createPlaneAttribute()

    this.createUniform(uniforms)

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
      this.canvas = document.createElement('canvas')
      this.canvas.style.display = 'block'
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'
      document.body.appendChild(this.canvas)
    }

    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
  }

  createProgram (fragmentShader) {
    const { gl } = this

    const program = gl.createProgram()
    gl.attachShader(program, this.createShader('VERTEX_SHADER', 'attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}'))
    gl.attachShader(program, this.createShader('FRAGMENT_SHADER', fragmentShader))
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    if (!program) throw new Error('Failed to create program.')

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

  createPlaneAttribute () {
    const { gl } = this
    const location = gl.getAttribLocation(this.program, 'position')

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
  }

  createUniform (data) {
    const mergedData = Object.assign({}, data)

    if (this.hasResolution && !mergedData.resolution) mergedData.resolution = [0, 0]
    if (this.hasTime && !mergedData.time) mergedData.time = 0

    Object.keys(mergedData).forEach(key => {
      this.addUniform(key, mergedData[key])
    })
  }

  addUniform (key, value) {
    const { gl } = this
    let originalType
    let uniformType
    let uniformValue = value

    const getTypeFromString = (type, value) => {
      switch (type) {
        case 'image':
          originalType = 'image'
          uniformType = '1i'
          uniformValue = this.createTexture(key, value)
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
            uniformType = `${value.length}fv`
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

    const location = gl.getUniformLocation(this.program, key)
    const type = `uniform${uniformType}`

    let set
    switch (originalType) {
      case 'image':
        set = textureKey => {
          gl[type](location, this.textureIndexes[textureKey])
        }
        break
      default:
        set = newValue => {
          gl[type](location, newValue)
        }
    }

    Object.defineProperty(this.uniforms, key, { set })

    if (typeof uniformValue !== 'undefined') this.uniforms[key] = uniformValue
  }

  createTexture (key, el) {
    const { gl } = this
    const texture = gl.createTexture()
    const textureIndex = this.textureIndexes[key] = ++this.textureIndex

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

  clearColor (clearedColor = [0, 0, 0, 1]) {
    this.gl.clearColor(...clearedColor)
  }

  setSize () {
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight

    this.canvas.width = width
    this.canvas.height = height

    this.gl.viewport(0, 0, width, height)
    if (this.hasResolution) this.uniforms.resolution = [width, height]

    if (this.onResize) this.onResize()
  }

  initSize () {
    this.setSize()
    window.addEventListener('resize', () => { this.setSize() })
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

      if (this.hasTime) this.uniforms.time = time

      if (this.tick) this.tick(time)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
  }
}
