(function () {
  'use strict'
  const urlInput = document.getElementById('urlInput')
  const canvas = document.getElementById('mainCanvas')
  const context = canvas.getContext('2d')
  const saveButton = document.getElementById('saveButton')
  const pastakWrapper = document.getElementById('pastakWrapper')
  const canvasWrapper = document.getElementById('canvasWrapper')
  const pastakPos = {x: 0, y: 0}
  const loadImage = function (url) {
    return new Promise(function (resolve) {
      const img = new Image()
      img.onload = function () {
        resolve(img)
      }
      img.onerror = function () {
        alert('Image load error')
      }
      img.src = url
    })
  }
  const drawImage2Canvas = function (img) {
    canvas.width = img.width
    canvas.height = img.height
    context.drawImage(img, 0, 0)
    return img
  }
  const drawPastak2Canvas = function (img) {
    const pastakImg = new Image()
    pastakImg.onload = function () {
      const pastakCanvas = document.getElementById('pastakCanvas')
      const pastakCanvasContext = pastakCanvas.getContext('2d')
      // 画像の方が小さければ高さを合わせる
      if (img.height < pastakImg.height) {
        const rate = img.height / pastakImg.height
        pastakCanvas.width = pastakImg.width * rate
        pastakCanvas.height = pastakImg.height * rate
      } else {
        pastakCanvas.width = img.width
        pastakCanvas.height = img.height
      }
      pastakPos.x = Math.random() * pastakCanvas.width
      pastakPos.y = Math.random() * pastakCanvas.height
      pastakCanvasContext.drawImage(pastakImg, 0, 0, pastakCanvas.width, pastakCanvas.height)
      pastakWrapper.style.left = pastakPos.x + 'px'
      pastakWrapper.style.top = pastakPos.y + 'px'
    }
    pastakImg.src = '/pastak.png'
  }
  const loadBtn = document.getElementById('loadButton')
  loadBtn.addEventListener('click', function () {
    loadImage(urlInput.value)
      .then(drawImage2Canvas)
      .then(drawPastak2Canvas)
  })
  saveButton.addEventListener('click', function () {
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
    .then((json) => window.open(json.dataUrl))
  })
})()
