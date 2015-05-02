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
    		// I was having trouble with express body-parser which is why the body is being sent in this format
    		var keys = Object.keys(message.contents)
    		var msg = !!keys && keys.length > 0 ? keys[0] : ''
    		var filePath = ROOT_DIR + message.path
    		var dirName = message.type === 'file' ? path.dirname(filePath) : filePath // path.dirname truncates the new folder if we're creating a dir
    		console.log(message)
	        switch (message.action) {
	        	case 'create':
	        		mkdirp(dirName, (err) => {
	        			console.log('dir created: ' + dirName)
	        			if (err) return
		        		if (message.type === 'file') {	
		        			let stream = fs.createWriteStream(filePath)
							stream.write(msg);
							stream.end();
							console.log('File created: ' + filePath + ', Contents: ' + msg)
		        		} else if (message.type !== 'dir') {
		        			console.log('Invalid command: create ' + message.type)
		        		}
		        	})
	        	break
	        	case 'update':

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
