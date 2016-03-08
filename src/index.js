'use strict';

const types = require('./types/types');

const jpaths = {
    nmr: ['$content', 'spectra', 'nmr']
};

module.exports = {
    nmr: function (doc, content, customMetadata) {
        process(doc, content, customMetadata, 'nmr');
    }
};

function process(doc, content, customMetadata, type) {
    let filename = content.filename;

    const arr = createFromJpath(doc, jpaths[type]);
    const typeProcessor = types(type);
    const entry = typeProcessor.find(arr, filename);
    const property = typeProcessor.getProperty(filename, content);
    const metadata = typeProcessor.process(filename, content.data);

    // process
    metadata[property] = {
        filename: content.filename
    };


    if(entry) {
        Object.assign(entry, metadata, customMetadata);
    } else {
        Object.assign(metadata, customMetadata);
        arr.push(metadata);
    }

    console.log(JSON.stringify(doc, null,'\t'));
    return doc;
}

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

function getFromJpath(doc, jpath) {
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

