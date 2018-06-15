'use strict';

const common = require('../common');
const genbankParser = require('genbank-parser');

module.exports = {
  find(nucleic, filename) {
    let reference = common.getBasename(filename);

    return nucleic.find(nucleic => {
      return common.getBasename(common.getFilename(nucleic)) === reference;
    });
  },

  getProperty(filename, content) {
    return common.getTargetProperty(filename);
  },

  process(filename, content) {
    let toReturn;
    const parsed = genbankParser(content);
    if (parsed.some(p => p.success !== true)) {
      throw new Error('Error parsing genbank');
    }
    toReturn = {
      seq: parsed
    };
    return toReturn;
  },

  jpath: ['biology', 'nucleic']
};
