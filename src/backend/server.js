const express = require('express')
const cors = require('cors')
const proxy = require('http-proxy-middleware')
const cookieParser = require('cookie-parser')
const app = express()

app.use(express.static('dist'))
app.use(cookieParser())
app.use(cors())

// Serve hadoop api proxy
// Uses `X-Resource-Manager` header to determine the actual hadoop cluster
app.use('/api', function (req, res, next) {
  let hadoopApi = req.get('X-Resource-Manager')
  proxy({
    target: hadoopApi,
    pathRewrite: {'^/api': ''},
    changeOrigin: true
  })(req, res, next)
})

// Serve index.html
app.get('/', (req, res) => res.sendFile('dist/index.html'))
app.get('/resourcemanagers', (req, res) => res.json([
  'http://gdoop-resourcemanager-vip.snc1:8088',
  'http://gdoop-resourcemanager-sox-vip.snc1:8088',
  'http://gdoop-resourcemanager-staging-vip.snc1:8088',
  'http://gdoop-resourcemanager-vip.sac1:8088',
  'http://gdoop-resourcemanager-vip.dub1:8088',
  'http://cerebro-resourcemanager-vip.snc1:8088'
]))

app.listen(3000)
