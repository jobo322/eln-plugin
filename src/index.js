'use strict';

const types = require('./types');

module.exports = {
    process: function (type, doc, content, customMetadata) {
        let filename = content.filename;

        const typeProcessor = types(type);
        const arr = createFromJpath(doc, typeProcessor.jpath);
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
        const typeProcessor = types(type);
        const jpath = typeProcessor.jpath;
        if(!jpath) throw new Error('No such type or no jpath');
        return jpath.concat(filename).join('/');
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

