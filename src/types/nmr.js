'use strict';

const jcampConverter = require('jcampconverter');

var nmr = module.exports = {};

nmr.getMetadata = function (filecontent) {
        const metadata = {
            nucleus: []
        };

        var jcamp = jcampConverter.convert(filecontent, {
            keepRecordsRegExp: /.*/
        });
        var info = jcamp.info;
        metadata.solvent = info['.SOLVENTNAME'];
        metadata.pulse = info['.PULSESEQUENCE'] || info['.PULPROG'];
        metadata.dimension = jcamp.twoD ? 2 : 1;
        metadata.temperature = info['.TE'];
        metadata.frequency = parseFloat(info['.OBSERVEFREQUENCY']);
        metadata.title = info['TITLE'];

        if(metadata.dimension === 1) {
            var nucleus = info['.OBSERVENUCLEUS'];
            if(nucleus) {
                metadata.nucleus.push(nucleus);
            }
        } else {
            nucleus = info['.NUCLEUS'];
            if(nucleus) {
                metadata.nucleus = metadata.nucleus.concat(nucleus.split(',').map(nuc => nuc.trim());
            }
        }

        return metadata;
    };
