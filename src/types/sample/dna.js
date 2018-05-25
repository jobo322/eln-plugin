'use strict';

const common = require('../common');
const genbankParser = require('genbank-parser');

module.exports = {
  find(dna, filename) {
    let reference = common.getBasename(filename);

    return dna.find(dna => {
      return getReference(common.getFilename(dna)) === reference;
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

  jpath: ['biology', 'dna']
};
