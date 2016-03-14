'use strict';

const bulk = require('bulk-require');
const lib = bulk(__dirname, 'types/*.js');


module.exports = {
    getType(type, custom) {
        return Object.assign({}, lib.types.default, lib.types[type], custom);
    },

    getAllTypes(custom) {
        var all = [];

        for(var type in lib.types) {
            if(type !== 'default') {
                all.push(module.exports.getType(type, custom));
            }
        }
        return all;
    }
};