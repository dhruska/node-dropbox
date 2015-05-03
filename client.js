let fs = require('fs')
let path = require('path')
let net = require('net')
let mkdirp = require('mkdirp')
let argv = require('yargs')
	.default('dir', process.cwd())
	.argv
let JsonSocket = require('json-socket')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(argv.dir)
const TCP_PORT = process.env.TCP_PORT || 9838

const HOST = '127.0.0.1'

var socket = new JsonSocket(new net.Socket())
socket.connect(TCP_PORT, HOST)
socket.on('connect', function() {
    socket.on('message', function(message) {
    	if (!!message) {
    		var filePath = ROOT_DIR + message.path
    		var dirName = message.type === 'file' ? path.dirname(filePath) : filePath // path.dirname truncates the new folder if we're creating a dir
    		console.log(message)
	        switch (message.action) {
	        	case 'create':
	        		mkdirp(dirName, (err) => {
	        			if (err) return
		        		if (message.type === 'file') {	
		        			let stream = fs.createWriteStream(filePath)
							stream.write(message.contents)
							stream.end()
							console.log('File created: ' + filePath + ', Contents: ' + message.contents)
		        		} else if (message.type !== 'dir') {
		        			console.log('Invalid command: create ' + message.type)
		        		}
		        	})
	        	break
	        	case 'update':
	        		if (message.type === 'file') {
	        			let stream = fs.createWriteStream(filePath)
	        			stream.write(message.contents)
	        			stream.end()
	        		} else {
	        			console.log('Invalid command: update ' + message.type)
	        		}
	        	break
	        	case 'delete':
	        		if (message.type === 'file') {

	        		} else if (message.type === 'dir') {

	        		}
	        		else {
	        			console.log('Invalid command: delete ' + message.type)
	        		}
				break
	        	default:
	        		console.log('Invalid command: ' + message.action)
	        }
	  	}
    })
})
