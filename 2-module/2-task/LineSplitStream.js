const stream = require('stream');
const os = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);

    this.stringBuffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.stringBuffer += chunk.toString('utf-8');
    callback();
  }

  _flush(callback) {
    this.stringBuffer.split(os.EOL)
      .forEach(string => this.push(string));
    callback();
  }
}

module.exports = LineSplitStream;
