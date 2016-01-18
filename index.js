'use strict'
const app = new require('koa')()
const spawn = require('child_process').spawn
const path = require('path')
const fs = require('fs')
const request = require('request')
const md5 = require('md5')
const Datauri = new require('datauri')()
const serve = require('koa-static')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')

router
.post('/gyazo', bodyParser(), function *() {
  const reqBody = this.request.body
  this.body = yield new Promise(function (resolve) {
    request.post({
      url: 'https://upload.gyazo.com/api/upload/easy_auth',
      form: {
        client_id: '49c49db959afb1b4d9b75014691141ef467ac139eb3c91adc6688253608d863a',
        image_url: reqBody.imageUrl,
        title: 'gosei.pastak.net'
        referer_url: reqBody.url
      }
    }, function (error, res, body) {
      resolve(body)
    })
  })
})
.post('/save', bodyParser(), function *(next) {
  const reqBody = this.request.body
  this.body = yield new Promise(function (resolve) {
    request.head(reqBody.imageUrl, function(error, response, body) {
      let ext = '.'
      switch (response.headers['content-type']) {
        case 'image/png':
          ext += 'png'
          break
        case 'image/jpeg':
          ext += 'jpg'
          break
        case 'image/gif':
          ext += 'gif'
          break
        default:
          return resolve({error: 'image invalid'})
      }
      const tmpFileName = md5(response.body) + ext
      const tmpFileFullPath = path.resolve(__dirname, './tmp/' + tmpFileName)
      request(reqBody.imageUrl)
        .pipe(fs.createWriteStream(tmpFileFullPath))
        .on('close', function () {
          const resize = spawn('convert', ['-resize', `${reqBody.width}x`, path.resolve(__dirname, './static/pastak.png'), '-'])
          const composite = spawn('convert', [
            tmpFileFullPath,
            '-',
            '-gravity', 'northwest', '-geometry', `+${reqBody.x}+${reqBody.y}`, '-compose', 'over','-composite','-'
          ])
          let res = new Buffer('')
          resize.stdout.on('data', function (data) {
            composite.stdin.write(data)
          })
          resize.on('close', (code) => {
            if (code !== 0) {
              console.log(`ps process exited with code ${code}`)
            }
            composite.stdin.end()
          })
          composite.stdout.on('data', function (data) {
            res = Buffer.concat([res, data])
          })
          composite.on('close', function () {
            resolve({dataUrl: Datauri.format(ext, res).content})
            fs.unlink(tmpFileFullPath)
          })
      })
    })
  })
})

app.use(router.routes())
app.use(serve('./static'))

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
