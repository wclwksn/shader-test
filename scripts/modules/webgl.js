import plainVertexShader from '../../shaders/plain.vert'

export default class WebGl {
  constructor (option) {
    const {
      canvas,
      vertexShader = plainVertexShader,
      fragmentShader,
      uniforms,
      clearedColor,
      mode = 'TRIANGLE_STRIP',
      tick = () => {},
      onResize,
      isAutoStart = true
    } = option
    const isPlain = !option.vertexShader

    this.attributes = {}
    this.uniforms = {}
    this.textureIndexes = {}
    this.attributeCount = 0
    this.textureIndex = -1

    this.canvas = canvas
    this.mode = mode
    this.tick = tick
    this.onResize = onResize

    this.initWebGL()
    this.createProgram(vertexShader, fragmentShader)
    if (isPlain) this.createPlainAttribute()
    if (uniforms) this.createUniform(uniforms)
    this.clearColor(clearedColor)
    this.initSize()
    if (isAutoStart) this.start()
  }

  initWebGL () {
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
  }

  createShader (type, content) {
    const shader = this.gl.createShader(this.gl[type])
    this.gl.shaderSource(shader, content)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader))
      return
    }

    return shader
  }

  createProgram (vertexShader, fragmentShader) {
    this.program = this.gl.createProgram()
    this.gl.attachShader(this.program, this.createShader('VERTEX_SHADER', vertexShader))
    this.gl.attachShader(this.program, this.createShader('FRAGMENT_SHADER', fragmentShader))
    this.gl.linkProgram(this.program)

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error(this.gl.getProgramInfoLog(this.program))
      return
    }

    this.gl.useProgram(this.program)

    if (!this.program) throw new Error('Failed to create this.program.')
  }

  createAttribute (data) {
    Object.keys(data).forEach(key => {
      const { stride, value } = data[key]
      this.attributes[key] = {
        location: this.gl.getAttribLocation(this.program, key),
        stride,
        vbo: this.createVbo(value)
      }

      this.attributeCount += value.length / stride
    })
  }

  createPlainAttribute () {
    const position = [
      -1, 1, 0,
      -1, -1, 0,
      1, 1, 0,
      1, -1, 0
    ]

    this.createAttribute({
      position: {
        stride: 3,
        value: position
      }
    })

    this.setAttribute('position')
  }

  createVbo (data) {
    const vbo = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    return vbo
  }

  setAttribute (name) {
    const { vbo, location, stride } = this.attributes[name]

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo)
    this.gl.enableVertexAttribArray(location)
    this.gl.vertexAttribPointer(location, stride, this.gl.FLOAT, false, 0, 0)
  }

  addUniform (name, value, type) {
    let uniformType = type
    let uniformValue = value

    if (type === 'image') {
      uniformType = '1i'
      uniformValue = this.createTexture(value, name)
    }

    this.uniforms[name] = {
      location: this.gl.getUniformLocation(this.program, name),
      type: `uniform${uniformType}`
    }

    if (typeof uniformValue !== 'undefined') this.setUniform(name, uniformValue)
  }

  createUniform (data) {
    const mergedData = Object.assign({
      resolution: {
        type: '2fv'
      }
    }, data)

    Object.keys(mergedData).forEach(name => {
      const { type, value } = mergedData[name]
      this.addUniform(name, value, type)
    })
  }

  setUniform (name, value) {
    const uniform = this.uniforms[name]
    if (!uniform) return

    this.gl[uniform.type](uniform.location, value)
  }

  createTexture (img, name) {
    const textureIndex = ++this.textureIndex
    const texture = this.gl.createTexture()
    this.textureIndexes[name] = textureIndex

    this.gl.activeTexture(this.gl[`TEXTURE${textureIndex}`])
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    // this.gl.generateMipmap(this.gl.TEXTURE_2D)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img)

    return textureIndex
  }

  getTextureIndex (name) {
    return this.textureIndexes[name]
  }

  updateTexture (name, img) {
    this.activeTexture(this.getTextureIndex(name))
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img)
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
    this.setUniform('resolution', [width, height])

    if (this.onResize) this.onResize()
  }

  initSize () {
    this.setSize()
    window.addEventListener('resize', () => { this.setSize() })
  }

  start () {
    requestAnimationFrame(timestamp => {
      this.initialTimestamp = timestamp
    })

    const render = timestamp => {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

      this.setUniform('time', (timestamp - this.initialTimestamp) / 1000)

      this.tick(timestamp)

      this.gl.drawArrays(this.gl[this.mode], 0, this.attributeCount)

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
