const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
    super(options);

    this._limit = options.limit;
  }

  _transform(chunk, encoding, callback) {
    this._limit -= chunk.length;
    this._limit >= 0
      ? callback(null, chunk)
      : callback(new LimitExceededError());
  }
}

module.exports = LimitSizeStream;
