'use strict';

const nmrMetadata = require('nmr-metadata');

exports.getMetadata = nmrMetadata.parseJcamp;
exports.getSpectrumType = nmrMetadata.getSpectrumType;
exports.getNucleusFrom2DExperiment = nmrMetadata.getNucleusFrom2DExperiment;
