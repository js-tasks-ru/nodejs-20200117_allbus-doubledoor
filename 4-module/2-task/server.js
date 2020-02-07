const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const LimitSizeStream = require('./LimitSizeStream');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  if (pathname.split('/').length > 1) {
    res.statusCode = 400;
    res.end();
    return;
  }

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
      const limitSizeStreamOptions = { limit: 1048576 };

      const writeStream = createWriteStream(filepath, res);
      const limitSizeStream = createLimitSizeStream(limitSizeStreamOptions, res);

      req.on('abort', () => {
        fs.unlink(pathname);
      })
      req.pipe(limitSizeStream).pipe(writeStream);

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

function createWriteStream(filepath, res) {
  const writeStream = fs.createWriteStream(filepath, {flags: 'wx'});

  writeStream.on('error', err => {
    if (err.code === 'EEXIST') {
      res.statusCode = 409;
      res.end('File already exists');
      return;
    }

    fs.unlink(filepath);

    res.statusCode = 500;
    res.end('Internal server error');
  });

  writeStream.on('close', () => {
    res.statusCode = 201;
    res.end('File created');
  });

  return writeStream;
}

function createLimitSizeStream(options, res) {
  const limitSizeStream = new LimitSizeStream(options.limit);

  limitSizeStream.on('error', err => {
    console.log('error in limit stream');
    if (err.code === 'LIMIT_EXCEEDED') {
      console.log('LIMIT_EXCEEDED LIMIT_EXCEEDED LIMIT_EXCEEDED');
      res.statusCode = 419;
      res.end('File is too large');
    }
  });

  return limitSizeStream;
}

module.exports = server;
