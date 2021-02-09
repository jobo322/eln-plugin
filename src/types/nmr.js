'use strict';

const nmrMetadata = require('nmr-metadata');

exports.getMetadata = nmrMetadata.fromJcamp;
exports.getSpectrumType = nmrMetadata.getSpectrumType;
exports.getNucleusFrom2DExperiment = nmrMetadata.getNucleusFrom2DExperiment;
