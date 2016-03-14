'use strict';

const bulk = require('bulk-require');
const types = bulk(path.join(__dirname, 'types'), '*.js');


module.exports = {
    getType(type, custom) {
        return Object.assign({}, types.default, types[type], custom);
    },

    getAllTypes(custom) {
        var all = [];

        for(var type in types) {
            if(type !== 'default') {
                all.push(module.exports.getType(type, custom));
            }
        }

        return all;
    }
};