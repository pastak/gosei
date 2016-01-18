(function () {
  'use strict'
  const urlInput = document.getElementById('urlInput')
  const canvas = document.getElementById('mainCanvas')
  const context = canvas.getContext('2d')
  const saveButton = document.getElementById('saveButton')
  const pastakWrapper = document.getElementById('pastakWrapper')
  const canvasWrapper = document.getElementById('canvasWrapper')
  let startMovePos = {}
  const pastakImg = new Image()
  let moving = false
  let preData = null
  if (location.search.substr(1)) {
    const queryString = decodeURIComponent(location.search.substr(1))
    const queries = queryString.split('&')
    if (queries) {
      preData = {}
      queries.forEach((q) => {
        const tmp = q.split('=')
        preData[tmp[0]] = tmp[1]
      })
    }
  }
  const pastakPos = {x: 0, y: 0}
  const requestDataUrl = function () {
    return new Promise(function (resolve) {
      fetch('/save', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          x: pastakPos.x - canvasWrapper.offsetLeft,
          y: pastakPos.y - canvasWrapper.offsetTop,
          width: pastakCanvas.width,
          height: pastakCanvas.height,
          imageUrl: urlInput.value
        })
      })
      .then((res) => res.json())
      .then((json) => {
        update()
        resolve(json.dataUrl)
      })
    })
  }
  const upload2Gyazo = function () {
    requestDataUrl().then((url) => {
      fetch('/gyazo', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: url,
          url: location.href
        })
      }).then((res) => res.json())
      .then((json) => window.open(json.get_image_url))
    })
  }
  const update = function () {
    const obj = {
      x: pastakPos.x,
      y: pastakPos.y,
      width: pastakCanvas.width,
      height: pastakCanvas.height,
      imageUrl: urlInput.value
    }
    const query = Object.keys(obj).map((key) => `${key}=${encodeURIComponent(obj[key])}`).join('&')
    history.pushState('save', '', `/?${query}`)
  }
  const loadImage = function (url) {
    return new Promise(function (resolve) {
      const img = document.getElementById('baseImg')
      img.onload = function () {
        canvas.width = img.width
        canvas.height = img.height
        resolve(img)
      }
      img.onerror = function () {
        alert('Image load error. Please set valid image URL')
        preData = null
      }
      img.src = url
    })
  }
  const drawPastak2Canvas = function (img) {
    return new Promise(function (resolve) {
      pastakImg.onload = function () {
        const pastakCanvas = document.getElementById('pastakCanvas')
        const pastakCanvasContext = pastakCanvas.getContext('2d')
        if (preData) {
          pastakCanvas.width = preData.width
          pastakCanvas.height = preData.height
        }
        // 画像の方が小さければ高さを合わせる
        else if (img.height < pastakImg.height) {
          const rate = img.height / pastakImg.height
          pastakCanvas.width = pastakImg.width * rate
          pastakCanvas.height = pastakImg.height * rate
        } else {
          pastakCanvas.width = pastakImg.width
          pastakCanvas.height = pastakImg.height
        }
        if (preData) {
          pastakPos.x = preData.x
          pastakPos.y = preData.y
          preData = null
        } else {
          pastakPos.x = Math.random() * pastakCanvas.width
          pastakPos.y = Math.random() * pastakCanvas.height
        }
        context.drawImage(
          pastakImg,
          pastakPos.x - canvasWrapper.offsetLeft,
          pastakPos.y - canvasWrapper.offsetTop,
          pastakCanvas.width,
          pastakCanvas.height
        )
        pastakWrapper.style.left = pastakPos.x + 'px'
        pastakWrapper.style.top = pastakPos.y + 'px'
        resolve()
      }
      pastakImg.src = '/pastak.png'
    })
  }
  const loadBtn = document.getElementById('loadButton')
  loadBtn.addEventListener('click', function () {
    loadImage(urlInput.value)
      .then(drawPastak2Canvas)
      .then(update)
  })
  const shareButton = document.getElementById('shareButton')
  shareButton.addEventListener('click', function () {
    window.open(`https://twitter.com/share?text=&url=${encodeURIComponent(location.href)}`)
  })
  if (preData) {
    urlInput.value = preData.imageUrl
    loadImage(preData.imageUrl).then(drawPastak2Canvas)
  }
  let resizeStart = {}
  let resizeStarted = false
  const resizeMouseMove = function (event) {
    event.stopPropagation()
    if (!resizeStarted) return
    const _width = Number(pastakCanvas.width) + event.pageX - resizeStart.x
    const _height = Number(pastakCanvas.height) *  (_width / Number(pastakCanvas.width))
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      pastakImg,
      pastakPos.x - canvasWrapper.offsetLeft,
      pastakPos.y - canvasWrapper.offsetTop,
      _width,
      _height
    )
  }
  const resizeMouseUp = function (event) {
    event.stopPropagation()
    if (!resizeStarted) return
    resizeStarted = false
    const pastakCanvasWidth = Number(pastakCanvas.width)
    pastakCanvas.width = Number(pastakCanvas.width) + event.pageX - resizeStart.x
    pastakCanvas.height = Number(pastakCanvas.height) * (Number(pastakCanvas.width) / pastakCanvasWidth)
    context.drawImage(
      pastakImg,
      pastakPos.x - canvasWrapper.offsetLeft,
      pastakPos.y - canvasWrapper.offsetTop,
      pastakCanvas.width,
      pastakCanvas.height
    )
    document.body.removeEventListener('mousemove', resizeMouseMove)
    document.body.removeEventListener('mouseup', resizeMouseUp)
  }
  document.getElementsByClassName('resize-handle')[0].addEventListener('mousedown', (event) => {
    if (resizeStarted) return
    event.stopPropagation()
    resizeStarted = true
    resizeStart = {x: event.pageX, y: event.pageY}
    document.body.addEventListener('mousemove', resizeMouseMove)
    document.body.addEventListener('mouseup', resizeMouseUp)
  })
  const mouseMove = function (event) {
    if (!moving) return
    const tmpPastakPos = {
      x: Number(pastakPos.x) + event.pageX - startMovePos.x,
      y: Number(pastakPos.y) + event.pageY - startMovePos.y
    }
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      pastakImg,
      tmpPastakPos.x - canvasWrapper.offsetLeft,
      tmpPastakPos.y - canvasWrapper.offsetTop,
      pastakCanvas.width,
      pastakCanvas.height
    )
    pastakWrapper.style.left = tmpPastakPos.x + 'px'
    pastakWrapper.style.top = tmpPastakPos.y + 'px'
  }
  const mouseUp = function () {
    if (!moving) return
    pastakPos.x = Number(pastakPos.x) + event.pageX - startMovePos.x,
    pastakPos.y = Number(pastakPos.y) + event.pageY - startMovePos.y
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      pastakImg,
      pastakPos.x - canvasWrapper.offsetLeft,
      pastakPos.y - canvasWrapper.offsetTop,
      pastakCanvas.width,
      pastakCanvas.height
    )
    pastakWrapper.style.left = pastakPos.x + 'px'
    pastakWrapper.style.top = pastakPos.y + 'px'
    startMovePos = {x: 0, y: 0}
    moving = false
    document.body.removeEventListener('mousemove', mouseMove)
    document.body.removeEventListener('mouseup', mouseUp)
  }
  pastakWrapper.addEventListener('mousedown', function (event) {
    if (moving) return
    startMovePos = {x: event.pageX, y: event.pageY}
    moving = true
    document.body.addEventListener('mousemove', mouseMove)
    document.body.addEventListener('mouseup', mouseUp)
  })
  saveButton.addEventListener('click', function () {
    requestDataUrl().then((url) => window.open(url))
  })
  document.getElementById('gyazoButton').addEventListener('click', upload2Gyazo)
  document.getElementById('toggleBorder').addEventListener('click', function () {
    if (document.getElementById('mainCanvas').classList.contains('no-border')) {
      document.getElementById('mainCanvas').classList.remove('no-border')
      document.getElementById('pastakWrapper').classList.remove('no-border')
      document.getElementsByClassName('resize-handle')[0].classList.remove('no-border')
    } else {
      document.getElementById('mainCanvas').classList.add('no-border')
      document.getElementById('pastakWrapper').classList.add('no-border')
      document.getElementsByClassName('resize-handle')[0].classList.add('no-border')
    }
  })
})()
