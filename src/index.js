'use strict';

const types = require('./types/types');

const jpaths = {
    nmr: ['$content', 'spectra', 'nmr']
};

module.exports = {
    process: function (type, doc, content, customMetadata) {
        let filename = content.filename;

        const arr = createFromJpath(doc, jpaths[type]);
        const typeProcessor = types(type);
        const entry = typeProcessor.find(arr, filename);
        const property = typeProcessor.getProperty(filename, content);
        if(property === undefined) {
            throw new Error(`Could not get property of ${filename} (type ${type}`);
        }
        const metadata = typeProcessor.process(filename, content.content);

        // process
        metadata[property] = {
            filename: module.exports.getFilename(type, content.filename)
        };


        if(entry) {
            Object.assign(entry, metadata, customMetadata);
        } else {
            Object.assign(metadata, customMetadata);
            arr.push(metadata);
        }

        return doc;
    },

    getFilename(type, filename) {
        if(!jpaths[type]) throw new Error('No such type');
        return jpaths[type].concat(filename).join('/')
    }
};

function createFromJpath(doc, jpath) {
    if(!jpath) throw new Error('createFromJpath: undefined jpath argument');
    for (let i = 0; i < jpath.length; i++) {
        if (doc[jpath[i]] === undefined) {
            if (i !== jpath.length - 1) {
                doc[jpath[i]] = {};
            } else {
                doc[jpath[i]] = [];
            }
        }
        doc = doc[jpath[i]];
    }
    return doc;
}

