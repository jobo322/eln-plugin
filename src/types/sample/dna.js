'use strict';

const common = require('../common');
const genbankParser = require('genbank-parser');

module.exports = {
  find(dna, filename) {
    let reference = common.getBasename(filename);

    return nmr.find(nmr => {
      return getReference(common.getFilename(nmr)) === reference;
    });
  },

  getProperty(filename, content) {
    return common.getTargetProperty(filename);
  },

  process(filename, content) {
    let toReturn;
    const parsed = genbankParser(contents);
    if (parsed.some(p => p.success !== true)) {
      throw new Error('Error parsing genbank');
    }
    toReturn = {
      seq: parsed
    };
    return toReturn;
  },

  jpath: ['spectra', 'nmr']
};
