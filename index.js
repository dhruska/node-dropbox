let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())

let app = express()

if (NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

app.listen(PORT, () => console.log(`LISTENING @ http://127.0.0.1:${PORT}`))

app.get('*', sendHeaders, (req, res) => {
	if (res.body) {
		res.json(res.body)
		return
	}

	fs.createReadStream(req.filePath).pipe(res)
})

app.head('*', sendHeaders, (req, res) => res.end())

function sendHeaders(req, res, next) {
	nodeify(async () => {
		let filePath = path.resolve(path.join(ROOT_DIR, req.url))
		req.filePath = filePath
		if (filePath.indexOf(ROOT_DIR) !== 0) {
			res.send(400, 'Invalid path')
			return
		}

		let stat = await fs.promise.stat(filePath)
		if (stat.isDirectory()) {
			let files = await fs.promise.readdir(filePath)
			res.body = JSON.stringify(files)
			res.setHeader('Content-Length', res.body.length)
			res.setHeader('Content-Type', 'application/json')
			return
		}

		res.setHeader('Content-Length', stat.size)
		let contentType = mime.contentType(path.extname(filePath))
		res.setHeader('Content-Type', contentType)

	}(), next)
}