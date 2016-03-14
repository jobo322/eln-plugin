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
            title: ''
        };
    }
};