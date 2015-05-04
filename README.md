Node Dropbox
===
This is a simple Dropbox clone built in Node.js. The idea was to create the basic RESTful HTTP methods, and then build upon them by introducing a CLI and TCP functionality to automatically synchronize multiple locations.

Features
---
 * CLI functionality - use the `dir` argument to specify a directory other than the CWD, for both the server (`index.js`) and the client (`client.js`).
 * TCP functionality - create, update and delete functions are sent over TCP. Any clients listening will automatically execute the same command.

Advanced JavaScript features have been used - make sure to run using [Babel](https://babeljs.io).