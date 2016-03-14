'use strict';

module.exports = {
    jpath: ['general'],
    getEmpty() {
        return {
            description: '',
            iupac: [{
                language: '',
                name: ''
            }],
            mf: '',
            molfile: '',
            mw: 0
        }
    }
};