'use strict';

const isFid = /[^a-z]fid[^a-z]/i;
const replaceFid = /[^a-z]fid[^a-z]?/i;

const common = require('../common');
const nmrLib = require('../nmr');


module.exports = {
    find(nmr, filename) {
        let reference = getReference(filename);

        return nmr.find(nmr => {
            return getReference(common.getFilename(nmr)) === reference;
        });
    },

    getProperty(filename, content) {
        const extension = common.getExtension(filename);
        if(extension === 'jdx' || extension === 'dx') {
            if(isFid.test(filename)) {
                return 'jcampFID';
            }
        }
        return common.getTargetProperty(filename);
    },

    process(filename, content) {
        const extension = common.getExtension(filename);
        var metaData = {};
        if(extension === 'jdx' || extension === 'dx') {
            metaData =  nmrLib.getMetadata(content);
        }
        return metaData;
    },

    jpath: ['spectra', 'nmr']
};

const reg2 = /(.*)\.(.*)/;

function getReference(filename) {
    if(typeof filename === 'undefined') return;

    let reference = common.getBasename(filename);
    reference = reference.replace(reg2, '$1');


    if(isFid.test(filename)) {
        reference = reference.replace(replaceFid, '');
    }
    return reference;
}
