'use strict';

const fs = require('fs');
const path = require('path');

var ls = fs.readdirSync(path.join(__dirname, '../src/types'));
console.log(ls);

var r = ls.map(ls => {
    return `require('./types/${ls}');`;
}).join('\n');

fs.writeFileSync(path.join(__dirname, '../src/req.js'), r);