'use strict';

const bulk = require('bulk-require');
const lib = bulk(__dirname, 'types/*.js');

module.exports = function (type, custom) {
    var x = Object.assign({}, lib.types.default, lib.types[type], custom);
    console.log(x);
    return x;
};