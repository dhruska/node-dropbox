let path = require('path')
let net = require('net')
let JsonSocket = require('json-socket')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())
const TCP_PORT = process.env.TCP_PORT || 9838

const HOST = '127.0.0.1'

var socket = new JsonSocket(new net.Socket())
socket.connect(TCP_PORT, HOST)
socket.on('connect', function() { // Wait until we're connected
    socket.on('message', function(message) {
        console.log(message)
    })
})