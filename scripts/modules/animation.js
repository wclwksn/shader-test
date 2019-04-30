import * as easingFunctions from './easing'

/**
 * アニメーション関数
 *
 * @param {AnimationCallback} fn アニメーションフレーム毎に実行するコールバック
 * @param {Object} [options={}] オプション
 * @param {Number} [options.begin=0] 開始位置
 * @param {Number} [options.finish=1] 終了位置
 * @param {Number} [options.duration=500] 全体時間
 * @param {string} [options.easing='easeInOutCubic'] Easing function
 * @param {Array} [options.cubicBezier] Cubic Bezier Curve points
 * @param {Boolean} [options.isRoop=false] Animation Roop
 * @param {Function} [options.onAfter] Callback after end of animation
 */
export function animate (fn, options = {}) {
  const {
    begin = 0,
    finish = 1,
    duration = 500,
    easing = 'easeInOutCubic',
    cubicBezier,
    isRoop = false,
    onAfter
  } = options

  const change = finish - begin
  let easingFunction
  let startTime

  if (cubicBezier) {
    easingFunction = easingFunctions.getBezierEasing(...cubicBezier)
  } else {
    easingFunction = easingFunctions[easing]
  }

  function tick (timestamp) {
    const time = Math.min(duration, timestamp - startTime)
    const position = easingFunction(time, begin, change, duration)

    fn(position, time)

    if (time === duration) {
      if (isRoop) {
        startTime = timestamp
        requestAnimationFrame(tick)
      } else {
        onAfter && onAfter()
      }
    } else {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(timestamp => {
    startTime = timestamp
    tick(timestamp)
  })
}

export class Animation {
  constructor (fn, options) {
    const {
      begin = 0,
      finish = 1,
      duration = 500,
      easing = 'easeInOutCubic',
      cubicBezier,
      isRoop = false,
      isAuto = true,
      onBefore,
      onAfter,
      onStop
    } = options

    this.fn = fn
    this.duration = duration
    this.originalFrom = begin
    this.originalTo = finish
    this.isRoop = isRoop
    this.onBefore = onBefore
    this.onAfter = onAfter
    this.onStop = onStop

    if (cubicBezier) {
      this.easingFunction = easingFunctions.getBezierEasing(...cubicBezier)
    } else {
      this.easingFunction = easingFunctions[easing]
    }

    isAuto && this.start()
  }

  set easing (easing) {
    this.easingFunction = easingFunctions[easing]
  }

  tick (timestamp) {
    const time = Math.min(this.duration, timestamp - this.startTime)
    const position = this.easingFunction(time, this.begin, this.change, this.duration)

    this.fn(position, time)

    if (time === this.duration) {
      if (this.isRoop) {
        this.animate()
      } else {
        this.onAfter && this.onAfter()
      }
    } else {
      this.requestID = requestAnimationFrame(this.tick.bind(this))
    }
  }

  animate () {
    this.requestID = requestAnimationFrame(timestamp => {
      this.startTime = timestamp
      this.tick(timestamp)
    })
  }

  start () {
    this.onBefore && this.onBefore()
    this.begin = this.originalFrom
    this.finish = this.originalTo
    this.change = this.finish - this.begin

    this.requestID && this.stop()
    this.animate()
  }

  reverse () {
    this.onBefore && this.onBefore()
    this.begin = this.originalTo
    this.finish = this.originalFrom
    this.change = this.finish - this.begin

    this.requestID && this.stop()
    this.animate()
  }

  play () {
    this.animate()
  }

  stop () {
    cancelAnimationFrame(this.requestID)
    this.requestID = null
    this.onStop && this.onStop()
  }
}

/**
 * @typedef {function} AnimationCallback
 * @param {number} position 現在位置
 * @param {number} time 現在時刻 (0 ~ duration)
 */
