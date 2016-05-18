'use strict';

const isFid = /[^a-z]fid[^a-z]/i;
const isFt = /[^a-z]ft[^a-z]/i;
const replaceFid = /[^a-z]fid[^a-z]?/i;
const replaceFt = /[^a-z]ft[^a-z]?/i;

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
            if(isFt.test(filename)) {
                return 'jcampFT';
            }
            return 'jcamp';
        } else if(extension === 'pdf') {
            return 'pdf';
        }
        return 'file';
    },

    process(filename, content) {
        const extension = common.getExtension(filename);
        var metaData = {};
        if(extension === 'jdx' || extension === 'dx') {
            metaData =  nmrLib.getMetadata(content);
        }

        var types = ["1H", "13C", "HSQC", "HMBC", "HMQC", "JRES", "COSY", "TOCSY", "HSQCTOCSY2D", "NOESY", "ROESY", "19F", "31P", "DEPT", "APTJMOD", "other"].join("|")

        var reg = new RegExp(`(${types})[^a-zA-Z0-9]`,'i');
        var m = filename.match(reg);
        if(m) {
            metaData.experiment = m[1].toUpperCase();
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
    } else if(isFt.test(filename)) {
        reference = reference.replace(replaceFt, '');
    }
    return reference;
}

