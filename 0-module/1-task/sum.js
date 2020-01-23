function sum(a, b) {
  const aIsNotNumber = typeof(a) !== 'number';
  const bIsNotNumber = typeof(b) !== 'number';

  if (aIsNotNumber || bIsNotNumber) 
    throw new TypeError();

  return a + b;
}

module.exports = sum;
