'use strict';

module.exports = {
    jpath: ['physical'],
    getEmpty() {
        return {
            bp: [{
                doi: '',
                high: 0,
                low: 0,
                pressure: 0
            }],
            density: [{
                doi: '',
                high: 0,
                low: 0,
                temperature: 0
            }],
            mp: [{
                doi: '',
                high: 0,
                low: 0
            }],
            nd: [{
                doi: '',
                high: 0,
                low: 0,
                temperature: 0
            }]
        }
    }
};