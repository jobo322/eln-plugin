'use strict';

const isFid = /[^a-z]fid[^a-z]/i;
const isFt = /[^a-z]ft[^a-z]/i;
const replaceFid = /[^a-z]fid[^a-z]?/i;
const replaceFt = /[^a-z]ft[^a-z]?/i;


module.exports = {
    find(nmr, filename) {
        let reference = getReference(filename);

        return nmr.find(nmr => {
            return getReference(getFilename(nmr)) === reference;
        });
    },

    getProperty(filename, content) {
        if(isFid.test(filename)) {
            return 'jcampFID';
        }
        if(isFt.test(filename)) {
            return 'jcampFT';
        }
        return 'jcamp';
    },

    process(filename, content) {
        return getNmrMetadata(content);
    },

    jpath: ['spectra', 'nmr']
};

function getFilename(nmr) {
    let keys = Object.keys(nmr);
    for(let i=0; i<keys.length; i++) {
        if(nmr[keys[i]].filename) {
            return nmr[keys[i]].filename;
        }
    }
}

function getReference(filename) {
    const reg0 = /.*\/([^\/]*$)/;
    const reg1 = /\.[0-9]+$/;
    const reg2 = /(.*)\.(.*)/
    let reference = filename.replace(reg0, '$1');
    reference = reference.replace(reg1, '');
    //const extension = reference.replace(reg2, '$2');
    reference = reference.replace(reg2, '$1');


    if(isFid.test(filename)) {
        reference = reference.replace(replaceFid, '');
    } else if(isFt.test(filename)) {
        reference = reference.replace(replaceFt, '');
    }
    return reference;
}

const anReg = /[0-9]{5,}/;
function getNmrMetadata(filecontent) {
    const metadata = {
        nucleus: []
    };

    var line;
    if (line = getLineIfExist(filecontent, '##.SOLVENT NAME= ')) {
        metadata.solvent = line;
    }
    if (line = getLineIfExist(filecontent, '##.PULPROG= ')) {
        metadata.pulse = line;
    } else if (line = getLineIfExist(filecontent, '##.PULSE SEQUENCE= ')) {
        metadata.pulse = line;
    }
    if (line = getLineIfExist(filecontent, '##.OBSERVE FREQUENCY= ')) {
        metadata.frequency = parseFloat(line);
    }
    if (line = getLineIfExist(filecontent, '##.TE= ')) {
        metadata.temperature = parseFloat(line);
    }
    if (line = getLineIfExist(filecontent, '##NUM DIM= ')) {
        metadata.dimension = parseInt(line);
    } else {
        metadata.dimension = 1;
    }
    if (metadata.dimension === 1) {
        if (line = getLineIfExist(filecontent, '##.OBSERVE NUCLEUS= ')) {
            metadata.nucleus.push(line.replace('^', ''));
        }
    } else {
        if (line = getLineIfExist(filecontent, '##.NUCLEUS= ')) {
            const split = line.split(',');
            for (let j = 0; j < split.length; j++) {
                metadata.nucleus.push(split[j].trim());
            }
        }
    }
    if (line = getLineIfExist(filecontent, '##TITLE=')) {
        const resReg = anReg.exec(line);
        metadata.title = resReg ? parseInt(resReg[0]) : -1;
    }
    if (line = getLineIfExist(filecontent, '$$ Date_')) {
        let date = line.trim();
        const theDate = new Date(0);
        theDate.setDate(parseInt(date.substr(-2, 2)));
        theDate.setMonth(parseInt(date.substr(-4, 2)) - 1);
        theDate.setYear(parseInt(date.substr(0, date.length - 4)));
        if (line = getLineIfExist(filecontent, '$$ Time')) {
            date = line.trim().split('.');
            theDate.setHours(parseInt(date[0]));
            theDate.setMinutes(parseInt(date[1]));
        }
        metadata.date = theDate;
    }

    return metadata;
}

function getLineIfExist(str, prefix) {
    const line = str.indexOf(prefix);
    if (line > -1) {
        return str.substring(line + prefix.length, str.indexOf('\n', line)).trim();
    }
}
