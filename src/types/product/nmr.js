'use strict';

const isFid = /[^a-z]fid[^a-z]/i;
const isFt = /[^a-z]ft[^a-z]/i;
const replaceFid = /[^a-z]fid[^a-z]?/i;
const replaceFt = /[^a-z]ft[^a-z]?/i;

const common = require('../common');

const jcampConverter = require('jcampconverter');


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
        if(extension === 'jdx' || extension === 'dx') {
            return getNmrMetadata(content);
        }
        return {};
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

function getNmrMetadata(filecontent) {
    const metadata = {
        nucleus: []
    };

    var jcamp = jcampConverter.convert(filecontent, {
        keepRecordsRegExp: /.*/
    });
    var info = jcamp.info;
    metadata.solvent = info['.SOLVENTNAME'];
    metadata.pulse = info['.PULSESEQUENCE'] || info['.PULPROG'];
    metadata.dimension = info['.NUMDIM'] || 1;
    metadata.temperature = info['.TE'];
    metadata.frequency = info['.OBSERVEFREQUENCY'];
    metadata.title = info['TITLE'];

    if(metadata.dimension === 1) {
        var nucleus = info['.OBSERVENUCLEUS'];
        if(nucleus) {
            metadata.nucleus.push(nucleus);
        }
    } else {
        nucleus = info['.NUCLEUS'];
        if(nucleus) {
            metadata.nucleus = metadata.nucleus.concat(nucleus.split(','));
        }
    }

    return metadata;
}

function getLineIfExist(str, prefix) {
    const line = str.indexOf(prefix);
    if (line > -1) {
        return str.substring(line + prefix.length, str.indexOf('\n', line)).trim();
    }
}
