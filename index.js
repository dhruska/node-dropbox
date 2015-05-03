let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let argv = require('yargs')
	.default('dir', process.cwd())
	.argv
let net = require('net')
let JsonSocket = require('json-socket')
let multer  = require('multer')
let bodyParser = require('body-parser')

require('longjohn')
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(argv.dir)

let app = express()

var urlEncodedParser = bodyParser.urlencoded({extended: false})

if (NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

app.listen(PORT, ()=> console.log(`LISTENING @ http://127.0.0.1:${PORT}`))

app.get('*', setFileMeta, sendHeaders, (req, res) => {
	if (res.body) {
		res.json(res.body)
		return
	}

	fs.createReadStream(req.filePath).pipe(res)
})

app.head('*', setFileMeta, sendHeaders, (req, res) => res.end())

app.delete('*', setFileMeta, (req, res, next) => {
	async ()=> {
		if (!req.stat) return res.send(400, 'Invalid Path')

		if (req.stat && req.stat.isDirectory()) {
			await rimraf.promise(req.filePath)
			sendToClients('delete', req.filePath, 'dir', null, Date.now())
		} else {
			await fs.promise.unlink(req.filePath)
			sendToClients('delete', req.url, 'file', null, Date.now())
		}
		res.end()
	}().catch(next) // Call next on failure
})

app.put('*', urlEncodedParser, setFileMeta, setDirDetails, (req, res, next) => {
	async ()=> {
		if (req.stat) return res.send(405, 'File exists')
		await mkdirp.promise(req.dirPath)

		if (!req.isDir) {
			let stream = fs.createWriteStream(req.filePath)
			req.pipe(stream) // Filepath is a file
			stream.write(req.msg)
		}

		sendToClients('create', req.url, req.isDir ? 'dir' : 'file', req.msg, Date.now())
		res.end()
	}().catch(next)
})

app.post('*', setFileMeta, setDirDetails, urlEncodedParser, (req, res, next) => {
	async ()=> {
		if (!req.stat) return res.send(405, 'File does not exist')
		if (req.isDir) return res.send(405, 'Path is a directory') // This is an advanced case

		await fs.promise.truncate(req.filePath, 0)
		req.pipe(fs.createWriteStream(req.filePath)) // Filepath is a file
		sendToClients('update', req.url, 'file', req.body, Date.now())
		console.log('sent to clients: ' + req.url + ' with data: ' + req.body)
		res.end()
	}().catch(next)
})


function setDirDetails(req, res, next) {
	let filePath = req.filePath
	let endsWithSlash = filePath.charAt(filePath.length-1) === path.sep
	let hasExt = path.extname(filePath) !== ''
	req.isDir = endsWithSlash || !hasExt
	req.dirPath = req.isDir ? filePath : path.dirname(filePath)
	next()
}

function setFileMeta(req, res, next) {
	req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
	if (req.filePath.indexOf(ROOT_DIR) !== 0) {
		res.send(400, 'Invalid path')
		return
	}
    // I was having trouble with express body-parser which is why the body is being sent in this format
	var keys = !!req.body ? Object.keys(req.body) : undefined
	req.msg = !!keys && keys.length > 0 ? keys[0] : ''
	fs.promise.stat(req.filePath)
		.then(stat => req.stat = stat, ()=> req.stat = null)
		.nodeify(next)
}

function sendHeaders(req, res, next) {
	nodeify(async ()=> {
		if (req.stat.isDirectory()) {
			let files = await fs.promise.readdir(req.filePath)
			res.body = JSON.stringify(files)
			res.setHeader('Content-Length', res.body.length)
			res.setHeader('Content-Type', 'application/json')
			return
		}

		res.setHeader('Content-Length', req.stat.size)
		let contentType = mime.contentType(path.extname(req.filePath))
		res.setHeader('Content-Type', contentType)

	}(), next) // Use nodeify to call next on success or failure
}


// TCP
const HOST = '127.0.0.1'
const TCP_PORT = 9838

var sendToClients;
var server = net.createServer()
server.listen(TCP_PORT)
server.on('connection', function(socket) {
    socket = new JsonSocket(socket)
    socket.on('message', function(message) {
        // Message received from client
    })
    sendToClients = function(action, path, type, contents, time) {
		socket.sendMessage({
			"action": action,
			"path": path,
			"type": type,
			"contents": contents,
			"time": time
		})
	}
})
