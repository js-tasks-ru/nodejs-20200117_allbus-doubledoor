const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  const pathIsNested = pathname.split('/').length > 1;
  if (pathIsNested) {
    res.statusCode = 400;
    res.end('Sorry, nested paths are not supported');
  }

  switch (req.method) {
    case 'GET':
      const filepath = path.join(__dirname, 'files', pathname);
      const readableStream = fs.createReadStream(filepath, { encoding: "utf8" });
      readableStream.on('error', (err) => {
        res.statusCode = 404;
        res.end('Sorry, there is no such file on the server');
      });

      readableStream.pipe(res);
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
