export default function loadImage (srcs, isCrossOrigin) {
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
