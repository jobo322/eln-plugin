'use strict';

module.exports = {
    getExtension(filename) {
        const reg1 = /\.[0-9]+$/;
        const reg2 = /(.*)\.(.*)/
        var extension = filename.replace(reg1, '');
        return extension.replace(reg2, '$2');
    },

    process() {
        return {};
    }
};