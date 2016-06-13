'use strict';

const jcampConverter = require('jcampconverter');

exports.getMetadata = function (filecontent) {
    const metadata = {
        nucleus: []
    };
    
    var jcamp = jcampConverter.convert(filecontent, {
        keepRecordsRegExp: /.*/
    });
    var info = jcamp.info;
    metadata.solvent = info['.SOLVENTNAME'];
    metadata.pulse = info['.PULSESEQUENCE'] || info['.PULPROG']||info['$PULPROG'];
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
    
    metadata.experiment = getSpectrumType(metadata.pulse);
    if(info['$DATE'])
        metadata.date = (new Date(info['$DATE'] * 1000)).toISOString();
    
    return metadata;
};

function getSpectrumType(pulprog){
    if(!pulprog)
        return "empty";
    pulprog = pulprog.toLowerCase();
    
    if(pulprog.includes("zg")){
        return "1d";
    }

    if(pulprog.includes("hsqct")||
        (pulprog.includes("invi")&&(pulprog.includes("ml")||pulprog.includes("di")))){
        return "hsqctocsy";
    }

    if(pulprog.includes("hsqc")||pulprog.includes("invi")){
        return "hsqc";
    }

    if(pulprog.includes("hmbc")||(pulprog.includes("inv4")&&pulprog.includes("lp"))){
        return "hmbc";
    }

    if(pulprog.includes("cosy")){
        return "cosy";
    }

    if(pulprog.includes("jres")){
        return "jres";
    }

    if(pulprog.includes("tocsy")||pulprog.includes("mlev")||pulprog.includes("dipsi")){
        return "tocsy";
    }

    if(pulprog.includes("noesy")){
        return "noesy";
    }

    if(pulprog.includes("roesy")){
        return "roesy";
    }
    if(pulprog.includes("dept")){
        return "dept";
    }

    if(pulprog.includes("jmod")||pulprog.includes("apt")){
        return "aptjmod";
    }
    return "";
}

function getNucleusFrom2DExperiment(experiment) {
    experiment = experiment.toLowerCase();
    if (experiment.includes('jres')) {
        return ['1H'];
    }
    if (experiment.includes('hmbc') || experiment.includes('hsqc')) {
        return ['1H', '13C'];
    }
    return ['1H', '1H'];
}

exports.getSpectrumType = getSpectrumType;
exports.getNucleusFrom2DExperiment = getNucleusFrom2DExperiment;
