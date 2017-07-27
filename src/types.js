'use strict';

const bulk = require('bulk-require');
const lib = bulk(__dirname, 'types/**/*.js');

module.exports = {
    getType(type, kind, custom) {
        if(kind) {
            if(lib.types[kind][type]) {
                return Object.assign({}, lib.types.default, lib.types[kind].default, lib.types[kind][type], custom);
            }
        } else {
            for(var kind in lib.types) {
                if(lib.types[kind][type]) {
                    return Object.assign({}, lib.types.default, lib.types[kind].default, lib.types[kind][type], custom);
                }
            }
        }

        return Object.assign({}, lib.types.default);
    },

    getAllTypes(kind, custom) {
        var all = [];

        for(var type in lib.types[kind]) {
            if(type !== 'default') {
                all.push(module.exports.getType(type, kind, custom));
            }
        }
        return all;
    }
    
    getUtil(kind) {
        var kind =  lib.types[kind];
        if (kind) {
            return kind.util;
        }
        return undefined;
    }
};
