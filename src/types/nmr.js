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
                metadata.nucleus.push(nucleus.replace(/[^A-Za-z0-9]/g,''));
            }
        } else {
            nucleus = info['.NUCLEUS'];
            if(nucleus) {
                metadata.nucleus = metadata.nucleus.concat(nucleus.split(',').map(nuc => nuc.trim()));
            }
        }

        metadata.experiment = getSpectraType(metadata.pulse)

        return metadata;
    };

function getSpectraType(pulprog){
    pulprog = pulprog.toLowerCase();

    if(contains(pulprog,"zg")){
        return "1d";
    }

    if(contains(pulprog,"hsqct")||
        (contains(pulprog,"invi")&&(contains(pulprog,"ml")||contains(pulprog,"di")))){
        return "hsqctocsy";
    }

    if(contains(pulprog,"hsqc")||contains(pulprog,"invi")){
        return "hsqc";
    }

    if(contains(pulprog,"hmbc")||(contains(pulprog,"inv4")&&contains(pulprog,"lp"))){
        return "hmbc";
    }

    if(contains(pulprog,"cosy")){
        return "cosy";
    }

    if(contains(pulprog,"jres")){
        return "jres";
    }

    if(contains(pulprog,"tocsy")||contains(pulprog,"mlev")||contains(pulprog,"dipsi")){
        return "tocsy";
    }

    if(contains(pulprog,"noesy")){
        return "noesy";
    }

    if(contains(pulprog,"roesy")){
        return "roesy";
    }
    if(contains(pulprog,"dept")){
        return "dept";
    }

    if(contains(pulprog,"jmod")||contains(pulprog,"apt")){
        return "aptjmod";
    }
    return "";
}

function  contains(name, pattern) {
    return name.indexOf(pattern)>=0;
}