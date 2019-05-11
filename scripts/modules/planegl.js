const plainVertexShader = `
attribute vec3 position;
varying vec4 vPosition;
void main() {
  gl_Position = vPosition = vec4(position, 1.);
}
`

export default class Planegl {
  constructor (option) {
    this.attributes = {}
    this.uniforms = {}
    this.textureIndexes = {}
    this.textureIndex = -1

    const {
      canvas,
      fragmentShaderSelector,
      fragmentShader = document.querySelector(fragmentShaderSelector).textContent,
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

    this.createProgram(plainVertexShader, fragmentShader)

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
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'
      document.body.appendChild(this.canvas)
    }

    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
  }

  createProgram (vertexShader, fragmentShader) {
    const { gl } = this

    this.program = gl.createProgram()
    gl.attachShader(this.program, this.createShader('VERTEX_SHADER', vertexShader))
    gl.attachShader(this.program, this.createShader('FRAGMENT_SHADER', fragmentShader))
    gl.linkProgram(this.program)

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program))
      return
    }

    gl.useProgram(this.program)

    if (!this.program) throw new Error('Failed to create this.program.')
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
    const key = 'position'
    const value = [
      -1, 1, 0,
      -1, -1, 0,
      1, 1, 0,
      1, -1, 0
    ]
    const stride = 3
    const location = gl.getAttribLocation(this.program, key)
    const vbo = gl.createBuffer()

    this.attributes[key] = {
      location,
      stride,
      vbo,
      count: value.length / stride
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(value), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)
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
      location: gl.getUniformLocation(this.program, key),
      type: `uniform${uniformType}`
    }

    if (typeof uniformValue !== 'undefined') this.setUniform(key, uniformValue)
  }

  setUniform (key, value) {
    const { gl } = this
    const uniform = this.uniforms[key]
    if (!uniform) return

    gl[uniform.type](uniform.location, value)
  }

  createTexture (img, key) {
    const { gl } = this
    const textureIndex = ++this.textureIndex
    const texture = gl.createTexture()
    this.textureIndexes[key] = textureIndex

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

  updateTexture (key, img) {
    const { gl } = this

    this.activeTexture(this.textureIndexes[key])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  }

  clearColor (clearedColor = [0, 0, 0, 1]) {
    const { gl } = this
    gl.clearColor(...clearedColor)
  }

  setSize () {
    const { gl } = this
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight

    this.canvas.width = width
    this.canvas.height = height

    gl.viewport(0, 0, width, height)
    if (this.hasResolution) this.setUniform('resolution', [width, height])

    if (this.onResize) this.onResize()
  }

  initSize () {
    this.setSize()
    window.addEventListener('resize', () => { this.setSize() })
  }

  start () {
    const { gl } = this

    const render = timestamp => {
      if (this.clearedColor) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      const time = timestamp / 1000
      if (this.hasTime) this.setUniform('time', time)

      if (this.tick) this.tick(time)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.attributes.position.count)

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
