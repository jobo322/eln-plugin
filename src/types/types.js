'use strict';

const defaultType = require('./default');

module.exports = function(type, custom) {
        const t = require('./' + type);
        return Object.assign({}, defaultType, t, custom);
};