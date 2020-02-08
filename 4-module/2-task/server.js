const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const LimitSizeStream = require('./LimitSizeStream');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  if (pathname.indexOf('/') !== -1) {
    res.statusCode = 400;
    res.end();
  }

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':

      const writeStream = fs.createWriteStream(filepath, { flags: 'wx' })
        .on('error', err => {
          if (err.code === 'EEXIST') {
            res.statusCode = 409;
            res.end('File already exists');
          } else {
            res.statusCode = 500;
            res.end('Internal server error');
          }

        })
        .on('close', () => {
          res.statusCode = 201;
          res.end('File created');
        });

      const limitSizeStream = new LimitSizeStream({ limit: 1046576 })
        .on('error', err => {
          if (err.code === 'LIMIT_EXCEEDED') {
            console.log('limit error occured');
            res.statusCode = 413;
            res.end('File is too large');
          } else {
            res.statusCode = 500;
            res.end('Internal server error');
          }

          writeStream.destroy();
          fs.unlink(filepath, err => {});
        });

      req.on('close', () => {
        if (req.aborted) {
          limitSizeStream.destroy();
          writeStream.destroy();

          fs.unlink(filepath, err => {});

          res.end();
        }
      });
      
      req.on('error', () => {
        fs.unlink(filepath, err => {});
      });

      req.pipe(limitSizeStream).pipe(writeStream);
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
