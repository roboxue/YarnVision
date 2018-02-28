const express = require('express')
const cors = require('cors')
const proxy = require('http-proxy-middleware')
const cookieParser = require('cookie-parser')
const app = express()

const resourcemanagers = process.argv.slice(2)

app.use(express.static('dist'))
app.use(cookieParser())
app.use(cors())

// Serve hadoop api proxy
// Uses `X-Resource-Manager` header to determine the actual hadoop cluster
app.use('/hadoopapi', function (req, res, next) {
  let hadoopApi = req.get('X-Resource-Manager')
  proxy({
    target: hadoopApi,
    pathRewrite: {'^/hadoopapi': ''},
    changeOrigin: true
  })(req, res, next)
})

// Serve index.html
app.get(['/', '/apps'], (req, res) => res.sendFile('dist/index.html', {root: __dirname}))
app.get('/api/resourcemanagers', (req, res) => res.json(resourcemanagers))

app.listen(3000)
