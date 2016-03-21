'use strict';


module.exports = {
    jpath: [],
    getEmpty() {
        return {
            code: '',
            date: Date.now(),
            procedure: '',
            products: [],
            reagents: [],
            remarks: '',
            title: '',
            reactionRXN: '$RXN\n\n\n\n  0  0\n'
        };
    }
};