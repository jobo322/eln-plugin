'use strict';

const fs = require('fs');
const { join } = require('path');

const chromatogram = require('../src/types/sample/chromatogram');

test('nmr meta info', () => {
  let cdf = fs.readFileSync(join(__dirname, 'data/agilent-hplc.cdf'), 'base64');
  let metadata = chromatogram.process('test_code_batch.cdf', {
    content: cdf,
    encoding: 'base64'
  });
  expect(metadata).toStrictEqual({ detector: 'tic' });
});
