export default class Planegl {
  constructor (option) {
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
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'
      document.body.appendChild(this.canvas)
    }

    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
  }

  createProgram (fragmentShader) {
    const { gl } = this

    const program = gl.createProgram()
    gl.attachShader(program, this.createShader('VERTEX_SHADER', 'attribute vec3 position;varying vec4 vPosition;void main(){gl_Position=vPosition=vec4(position,1.);}'))
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0)
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
    let uniformType
    let uniformValue = value

    if (typeof value === 'number') {
      uniformType = '1f'
    } else if (typeof value === 'object') {
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

    this.gl[uniform.type](uniform.location, value)
  }

  createTexture (key, el) {
    const { gl } = this
    const texture = gl.createTexture()
    this.textureIndexes[key] = ++this.textureIndex

    gl.activeTexture(gl[`TEXTURE${this.textureIndex}`])
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el)

    return this.textureIndex
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
    if (this.hasResolution) this.setUniform('resolution', [width, height])

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

      if (this.hasTime) this.setUniform('time', time)

      if (this.tick) this.tick(time)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

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
