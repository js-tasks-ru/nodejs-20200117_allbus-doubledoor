const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const LimitSizeStream = require('./LimitSizeStream');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  console.log(pathname);
  if (pathname.includes('/')) {
    console.log(pathname, 'returning 400 error');
    res.statusCode = 400;
    res.end();
    return;
  }

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':

      const writeStream = fs.createWriteStream(filepath, {flags: 'wx+'});

      writeStream.on('error', err => {
        if (err.code === 'EEXIST') {
          res.statusCode = 409;
          res.end('File already exists');
          return;
        }
    
        fs.unlink(filepath, (err) => {
          if (err) throw err;
          console.log('write stream: file was deleted')
        });
    
        res.statusCode = 500;
        res.end('Internal server error');
      });
    
      writeStream.on('close', () => {
        res.statusCode = 201;
        res.end('File created');
      });

      const limitSizeStream = new LimitSizeStream({ limit: 1046576 });

      limitSizeStream.on('error', err => {
        if (err.code === 'LIMIT_EXCEEDED') {
          res.statusCode = 413;
          res.end('File is too large');
        }
      });

      req.on('close', () => {
        if (req.aborted) {
          fs.unlink(filepath, (err) => {
            if (err) throw err;
          });
        }
      });
      
      req.on('error', () => {
        fs.unlink(filepath, (err) => {
          if (err) throw err;
        });
      });

      req.pipe(limitSizeStream).pipe(writeStream);
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
