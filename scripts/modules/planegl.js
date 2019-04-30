const plainVertexShader = `
attribute vec3 position;
varying vec4 vPosition;
void main() {
  gl_Position = vPosition = vec4(position, 1.);
}
`

export default class Planegl {
  constructor (option) {
    const {
      canvas,
      fragmentShader,
      uniforms,
      clearedColor,
      tick,
      onResize,
      isAutoStart = true
    } = option

    this.attributes = {}
    this.uniforms = {}
    this.textureIndexes = {}
    this.textureIndex = -1

    this.tick = tick
    this.onResize = onResize
    this.clearedColor = clearedColor

    this.initWebgl(canvas)

    this.createProgram(plainVertexShader, fragmentShader)

    this.createPlaneAttribute()

    if (uniforms) this.createUniform(uniforms)

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

    this.attributes[key] = {
      location: gl.getAttribLocation(this.program, key),
      stride,
      vbo: gl.createBuffer(),
      count: value.length / stride
    }

    const { location, stride, vbo } = this.attributes[key]

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(value), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)
  }

  createUniform (data) {
    const mergedData = Object.assign({
      resolution: [0, 0]
    }, data)

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
        case 'Array':
          uniformType = `${value.length}fv`
          break
        case 'HTMLImageElement':
          uniformType = '1i'
          uniformValue = this.createTexture(value, key)
          break
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

  getTextureIndex (key) {
    return this.textureIndexes[key]
  }

  updateTexture (key, img) {
    const { gl } = this

    this.activeTexture(this.getTextureIndex(key))
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
    this.setUniform('resolution', [width, height])

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

      if (this.tick) this.tick(timestamp)

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
