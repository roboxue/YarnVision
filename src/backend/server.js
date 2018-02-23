const express = require('express')
const proxy = require('http-proxy-middleware')
const cookieParser =  require('cookie-parser')

const app = express()

app.use(express.static('dist'))
app.use(cookieParser())

// Serve hadoop api proxy
// Uses `resourcemanager` field from the cookie to determine the actual hadoop cluster
app.use('/api', function (req, res, next) {
  let hadoopApi = req.cookies.resourcemanager || 'http://gdoop-resourcemanager-vip.snc1:8088'
  proxy({
    target: hadoopApi,
    pathRewrite: {'^/api' : ''},
    changeOrigin: true})(req, res, next)
})

// Serve index.html
app.get('/', (req, res) => res.sendFile("dist/index.html"))

app.listen(3000)
