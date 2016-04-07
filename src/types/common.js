'use strict';

const reg0 = /.*\/([^\/]*$)/;
const reg1 = /\.[0-9]+$/;
const reg2 = /(.*)\.(.*)/;

var common = module.exports = {};

common.getBasename = function (filename) {
    let base = filename.replace(reg0, '$1');
    return base.replace(reg1, '');
};

common.getExtension = function (filename) {
    let extension = common.getBasename(filename);
    return extension.replace(reg2, '$2');
};


common.getFilename = function (typeEntry) {
    let keys = Object.keys(typeEntry);
    for (let i = 0; i < keys.length; i++) {
        if (typeEntry[keys[i]] && typeEntry[keys[i]].filename) {
            return typeEntry[keys[i]].filename;
        }
    }
};

common.basenameFind = function (typeEntries, filename) {
    let reference = common.getBasename(filename);

    return typeEntries.find(typeEntry => {
        return common.getBasename(common.getFilename(typeEntry)) === reference;
    });
};

common.jcampGetProperty = function (filename) {
    const extension = common.getExtension(filename);
    if(extension === 'jdx' || extension === 'dx') {
        return 'jcamp';
    } else if(extension === 'pdf') {
        return 'pdf';
    }
    return 'file';
};