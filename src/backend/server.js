const express = require('express')
const proxy = require('http-proxy-middleware')

const app = express()

app.use(express.static('dist'))
app.get('/', (req, res) => res.sendFile("dist/index.html"))
app.use('/api', function (req, res, next) {
  proxy({
    target: 'http://gdoop-resourcemanager-vip.snc1:8088',
    pathRewrite: {'^/api' : ''},
    changeOrigin: true})(req, res, next)
})

app.listen(3000)
