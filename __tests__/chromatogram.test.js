'use strict';

const fs = require('fs');
const { join } = require('path');

const chromatogram = require('../src/types/sample/chromatogram');

test('nmr meta info', () => {
  let cdf = fs.readFileSync(join(__dirname, 'data/agilent-lc.cdf'));
  let metadata = chromatogram.process('test_code_batch.cdf', cdf);
  expect(metadata).toStrictEqual({ detector: 'tic' });
});
