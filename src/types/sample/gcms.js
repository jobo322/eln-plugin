'use strict';

const isFid = /[^a-z]fid[^a-z]/i;
const isFt = /[^a-z]ft[^a-z]/i;

const common = require('../common');

module.exports = {
    jpath: ['spectra', 'gc'],

    find: common.basenameFind,

    getProperty(filename, content) {
        const extension = common.getExtension(filename);
        if(extension === 'jdx' || extension === 'dx') {
            if(isFid.test(filename)) {
                return 'jcampFID';
            }
            if(isFt.test(filename)) {
                return 'jcampFT';
            }
            return 'jcamp';
        }
        return 'file';
    }
};
