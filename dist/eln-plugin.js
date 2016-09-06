(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.elnPlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var parseXYDataRegExp = require('./parseXYData.js');


function getConverter() {

    // the following RegExp can only be used for XYdata, some peakTables have values with a "E-5" ...
    var ntuplesSeparator = /[, \t]{1,}/;

    var GC_MS_FIELDS = ['TIC', '.RIC', 'SCANNUMBER'];

    function convertToFloatArray(stringArray) {
        var l = stringArray.length;
        var floatArray = new Array(l);
        for (var i = 0; i < l; i++) {
            floatArray[i] = parseFloat(stringArray[i]);
        }
        return floatArray;
    }
    
    function Spectrum() {
        
    }

    function convert(jcamp, options) {
        options = options || {};

        var keepRecordsRegExp = /^$/;
        if (options.keepRecordsRegExp) keepRecordsRegExp = options.keepRecordsRegExp;
        var wantXY = !options.withoutXY;

        var start = Date.now();

        var ntuples = {},
            ldr,
            dataLabel,
            dataValue,
            ldrs,
            i, ii, position, endLine, infos;

        var result = {};
        result.profiling = [];
        result.logs = [];
        var spectra = [];
        result.spectra = spectra;
        result.info = {};
        var spectrum = new Spectrum();

        if (!(typeof jcamp === 'string')) return result;
        // console.time('start');

        if (result.profiling) result.profiling.push({
            action: 'Before split to LDRS',
            time: Date.now() - start
        });

        ldrs = jcamp.split(/[\r\n]+##/);

        if (result.profiling) result.profiling.push({
            action: 'Split to LDRS',
            time: Date.now() - start
        });

        if (ldrs[0]) ldrs[0] = ldrs[0].replace(/^[\r\n ]*##/, '');

        for (i = 0, ii = ldrs.length; i < ii; i++) {
            ldr = ldrs[i];
            // This is a new LDR
            position = ldr.indexOf('=');
            if (position > 0) {
                dataLabel = ldr.substring(0, position);
                dataValue = ldr.substring(position + 1).trim();
            } else {
                dataLabel = ldr;
                dataValue = '';
            }
            dataLabel = dataLabel.replace(/[_ -]/g, '').toUpperCase();

            if (dataLabel === 'DATATABLE') {
                endLine = dataValue.indexOf('\n');
                if (endLine === -1) endLine = dataValue.indexOf('\r');
                if (endLine > 0) {
                    var xIndex = -1;
                    var yIndex = -1;
                    // ##DATA TABLE= (X++(I..I)), XYDATA
                    // We need to find the variables

                    infos = dataValue.substring(0, endLine).split(/[ ,;\t]+/);
                    if (infos[0].indexOf('++') > 0) {
                        var firstVariable = infos[0].replace(/.*\(([a-zA-Z0-9]+)\+\+.*/, '$1');
                        var secondVariable = infos[0].replace(/.*\.\.([a-zA-Z0-9]+).*/, '$1');
                        xIndex = ntuples.symbol.indexOf(firstVariable);
                        yIndex = ntuples.symbol.indexOf(secondVariable);
                    }

                    if (xIndex === -1) xIndex = 0;
                    if (yIndex === -1) yIndex = 0;

                    if (ntuples.first) {
                        if (ntuples.first.length > xIndex) spectrum.firstX = ntuples.first[xIndex];
                        if (ntuples.first.length > yIndex) spectrum.firstY = ntuples.first[yIndex];
                    }
                    if (ntuples.last) {
                        if (ntuples.last.length > xIndex) spectrum.lastX = ntuples.last[xIndex];
                        if (ntuples.last.length > yIndex) spectrum.lastY = ntuples.last[yIndex];
                    }
                    if (ntuples.vardim && ntuples.vardim.length > xIndex) {
                        spectrum.nbPoints = ntuples.vardim[xIndex];
                    }
                    if (ntuples.factor) {
                        if (ntuples.factor.length > xIndex) spectrum.xFactor = ntuples.factor[xIndex];
                        if (ntuples.factor.length > yIndex) spectrum.yFactor = ntuples.factor[yIndex];
                    }
                    if (ntuples.units) {
                        if (ntuples.units.length > xIndex) spectrum.xUnit = ntuples.units[xIndex];
                        if (ntuples.units.length > yIndex) spectrum.yUnit = ntuples.units[yIndex];
                    }
                    spectrum.datatable = infos[0];
                    if (infos[1] && infos[1].indexOf('PEAKS') > -1) {
                        dataLabel = 'PEAKTABLE';
                    } else if (infos[1] && (infos[1].indexOf('XYDATA') || infos[0].indexOf('++') > 0)) {
                        dataLabel = 'XYDATA';
                        spectrum.deltaX = (spectrum.lastX - spectrum.firstX) / (spectrum.nbPoints - 1);
                    }
                }
            }

            if (dataLabel === 'XYDATA') {
                if (wantXY) {
                    prepareSpectrum(result, spectrum);
                    // well apparently we should still consider it is a PEAK TABLE if there are no '++' after
                    if (dataValue.match(/.*\+\+.*/)) {
                        if (options.fastParse === false) {
                            parseXYDataRegExp(spectrum, dataValue, result);
                        } else {
                            if (!spectrum.deltaX) {
                                spectrum.deltaX = (spectrum.lastX - spectrum.firstX) / (spectrum.nbPoints - 1);
                            }
                            fastParseXYData(spectrum, dataValue, result);
                        }
                    } else {
                        parsePeakTable(spectrum, dataValue, result);
                    }
                    spectra.push(spectrum);
                    spectrum = new Spectrum();
                }
                continue;
            } else if (dataLabel === 'PEAKTABLE') {
                if (wantXY) {
                    prepareSpectrum(result, spectrum);
                    parsePeakTable(spectrum, dataValue, result);
                    spectra.push(spectrum);
                    spectrum = new Spectrum();
                }
                continue;
            }


            if (dataLabel === 'TITLE') {
                spectrum.title = dataValue;
            } else if (dataLabel === 'DATATYPE') {
                spectrum.dataType = dataValue;
                if (dataValue.indexOf('nD') > -1) {
                    result.twoD = true;
                }
            } else if (dataLabel === 'NTUPLES') {
                if (dataValue.indexOf('nD') > -1) {
                    result.twoD = true;
                }
            } else if (dataLabel === 'XUNITS') {
                spectrum.xUnit = dataValue;
            } else if (dataLabel === 'YUNITS') {
                spectrum.yUnit = dataValue;
            } else if (dataLabel === 'FIRSTX') {
                spectrum.firstX = parseFloat(dataValue);
            } else if (dataLabel === 'LASTX') {
                spectrum.lastX = parseFloat(dataValue);
            } else if (dataLabel === 'FIRSTY') {
                spectrum.firstY = parseFloat(dataValue);
            } else if (dataLabel === 'LASTY') {
                spectrum.lastY = parseFloat(dataValue);
            } else if (dataLabel === 'NPOINTS') {
                spectrum.nbPoints = parseFloat(dataValue);
            } else if (dataLabel === 'XFACTOR') {
                spectrum.xFactor = parseFloat(dataValue);
            } else if (dataLabel === 'YFACTOR') {
                spectrum.yFactor = parseFloat(dataValue);
            } else if (dataLabel === 'DELTAX') {
                spectrum.deltaX = parseFloat(dataValue);
            } else if (dataLabel === '.OBSERVEFREQUENCY' || dataLabel === '$SFO1') {
                if (!spectrum.observeFrequency) spectrum.observeFrequency = parseFloat(dataValue);
            } else if (dataLabel === '.OBSERVENUCLEUS') {
                if (!spectrum.xType) result.xType = dataValue.replace(/[^a-zA-Z0-9]/g, '');
            } else if (dataLabel === '$SFO2') {
                if (!result.indirectFrequency) result.indirectFrequency = parseFloat(dataValue);

            } else if (dataLabel === '$OFFSET') {   // OFFSET for Bruker spectra
                result.shiftOffsetNum = 0;
                if (!result.shiftOffsetVal)  result.shiftOffsetVal = parseFloat(dataValue);
            } else if (dataLabel === '$REFERENCEPOINT') {   // OFFSET for Varian spectra


                // if we activate this part it does not work for ACD specmanager
                //         } else if (dataLabel=='.SHIFTREFERENCE') {   // OFFSET FOR Bruker Spectra
                //                 var parts = dataValue.split(/ *, */);
                //                 result.shiftOffsetNum = parseInt(parts[2].trim());
                //                 result.shiftOffsetVal = parseFloat(parts[3].trim());
            } else if (dataLabel === 'VARNAME') {
                ntuples.varname = dataValue.split(ntuplesSeparator);
            } else if (dataLabel === 'SYMBOL') {
                ntuples.symbol = dataValue.split(ntuplesSeparator);
            } else if (dataLabel === 'VARTYPE') {
                ntuples.vartype = dataValue.split(ntuplesSeparator);
            } else if (dataLabel === 'VARFORM') {
                ntuples.varform = dataValue.split(ntuplesSeparator);
            } else if (dataLabel === 'VARDIM') {
                ntuples.vardim = convertToFloatArray(dataValue.split(ntuplesSeparator));
            } else if (dataLabel === 'UNITS') {
                ntuples.units = dataValue.split(ntuplesSeparator);
            } else if (dataLabel === 'FACTOR') {
                ntuples.factor = convertToFloatArray(dataValue.split(ntuplesSeparator));
            } else if (dataLabel === 'FIRST') {
                ntuples.first = convertToFloatArray(dataValue.split(ntuplesSeparator));
            } else if (dataLabel === 'LAST') {
                ntuples.last = convertToFloatArray(dataValue.split(ntuplesSeparator));
            } else if (dataLabel === 'MIN') {
                ntuples.min = convertToFloatArray(dataValue.split(ntuplesSeparator));
            } else if (dataLabel === 'MAX') {
                ntuples.max = convertToFloatArray(dataValue.split(ntuplesSeparator));
            } else if (dataLabel === '.NUCLEUS') {
                if (result.twoD) {
                    result.yType = dataValue.split(ntuplesSeparator)[0];
                }
            } else if (dataLabel === 'PAGE') {
                spectrum.page = dataValue.trim();
                spectrum.pageValue = parseFloat(dataValue.replace(/^.*=/, ''));
                spectrum.pageSymbol = spectrum.page.replace(/=.*/, '');
                var pageSymbolIndex = ntuples.symbol.indexOf(spectrum.pageSymbol);
                var unit = '';
                if (ntuples.units && ntuples.units[pageSymbolIndex]) {
                    unit = ntuples.units[pageSymbolIndex];
                }
                if (result.indirectFrequency && unit !== 'PPM') {
                    spectrum.pageValue /= result.indirectFrequency;
                }
            } else if (dataLabel === 'RETENTIONTIME') {
                spectrum.pageValue = parseFloat(dataValue);
            } else if (isMSField(dataLabel)) {
                spectrum[convertMSFieldToLabel(dataLabel)] = dataValue;
            }
            if (dataLabel.match(keepRecordsRegExp)) {
                result.info[dataLabel] = dataValue.trim();
            }
        }

        if (result.profiling) result.profiling.push({
            action: 'Finished parsing',
            time: Date.now() - start
        });

        if (Object.keys(ntuples).length > 0) {
            var newNtuples = [];
            var keys = Object.keys(ntuples);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var values = ntuples[key];
                for (var j = 0; j < values.length; j++) {
                    if (!newNtuples[j]) newNtuples[j] = {};
                    newNtuples[j][key] = values[j];
                }
            }
            result.ntuples = newNtuples;
        }

        if (result.twoD && wantXY) {
            add2D(result, options);
            if (result.profiling) result.profiling.push({
                action: 'Finished countour plot calculation',
                time: Date.now() - start
            });
            if (!options.keepSpectra) {
                delete result.spectra;
            }
        }

        var isGCMS = (spectra.length > 1 && (!spectra[0].dataType || spectra[0].dataType.match(/.*mass.*/i)));
        if (isGCMS && options.newGCMS) {
            options.xy = true;
        }

        if (options.xy && wantXY) { // the spectraData should not be a oneD array but an object with x and y
            if (spectra.length > 0) {
                for (var i = 0; i < spectra.length; i++) {
                    var spectrum = spectra[i];
                    if (spectrum.data.length > 0) {
                        for (var j = 0; j < spectrum.data.length; j++) {
                            var data = spectrum.data[j];
                            var newData = {
                                x: new Array(data.length / 2),
                                y: new Array(data.length / 2)
                            };
                            for (var k = 0; k < data.length; k = k + 2) {
                                newData.x[k / 2] = data[k];
                                newData.y[k / 2] = data[k + 1];
                            }
                            spectrum.data[j] = newData;
                        }

                    }

                }
            }
        }

        // maybe it is a GC (HPLC) / MS. In this case we add a new format
        if (isGCMS && wantXY) {
            if (options.newGCMS) {
                addNewGCMS(result);
            } else {
                addGCMS(result);
            }
            if (result.profiling) result.profiling.push({
                action: 'Finished GCMS calculation',
                time: Date.now() - start
            });
        }

        if (result.profiling) {
            result.profiling.push({
                action: 'Total time',
                time: Date.now() - start
            });
        }

        return result;
    }


    function convertMSFieldToLabel(value) {
        return value.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function isMSField(dataLabel) {
        return GC_MS_FIELDS.indexOf(dataLabel) !== -1;
    }

    function addNewGCMS(result) {
        var spectra = result.spectra;
        var length = spectra.length;
        var gcms = {
            times: new Array(length),
            series: [{
                name: 'ms',
                dimension: 2,
                data: new Array(length)
            }]
        };

        var i;
        var existingGCMSFields = [];
        for (i = 0; i < GC_MS_FIELDS.length; i++) {
            var label = convertMSFieldToLabel(GC_MS_FIELDS[i]);
            if (spectra[0][label]) {
                existingGCMSFields.push(label);
                gcms.series.push({
                    name: label,
                    dimension: 1,
                    data: new Array(length)
                });
            }
        }

        for (i = 0; i < length; i++) {
            var spectrum = spectra[i];
            gcms.times[i] = spectrum.pageValue;
            for (var j = 0; j < existingGCMSFields.length; j++) {
                gcms.series[j + 1].data[i] = parseFloat(spectrum[existingGCMSFields[j]]);
            }
            if (spectrum.data) {
                gcms.series[0].data[i] = [spectrum.data[0].x, spectrum.data[0].y];
            }

        }
        result.gcms = gcms;
    }

    function addGCMS(result) {
        var spectra = result.spectra;
        var existingGCMSFields = [];
        var i;
        for (i = 0; i < GC_MS_FIELDS.length; i++) {
            var label = convertMSFieldToLabel(GC_MS_FIELDS[i]);
            if (spectra[0][label]) {
                existingGCMSFields.push(label);
            }
        }
        if (existingGCMSFields.length === 0) return;
        var gcms = {};
        gcms.gc = {};
        gcms.ms = [];
        for (i = 0; i < existingGCMSFields.length; i++) {
            gcms.gc[existingGCMSFields[i]] = [];
        }
        for (i = 0; i < spectra.length; i++) {
            var spectrum = spectra[i];
            for (var j = 0; j < existingGCMSFields.length; j++) {
                gcms.gc[existingGCMSFields[j]].push(spectrum.pageValue);
                gcms.gc[existingGCMSFields[j]].push(parseFloat(spectrum[existingGCMSFields[j]]));
            }
            if (spectrum.data) gcms.ms[i] = spectrum.data[0];

        }
        result.gcms = gcms;
    }

    function prepareSpectrum(result, spectrum) {
        if (!spectrum.xFactor) spectrum.xFactor = 1;
        if (!spectrum.yFactor) spectrum.yFactor = 1;
        if (spectrum.observeFrequency) {
            if (spectrum.xUnit && spectrum.xUnit.toUpperCase() === 'HZ') {
                spectrum.xUnit = 'PPM';
                spectrum.xFactor = spectrum.xFactor / spectrum.observeFrequency;
                spectrum.firstX = spectrum.firstX / spectrum.observeFrequency;
                spectrum.lastX = spectrum.lastX / spectrum.observeFrequency;
                spectrum.deltaX = spectrum.deltaX / spectrum.observeFrequency;
            }
        }
        if (result.shiftOffsetVal) {
            var shift = spectrum.firstX - result.shiftOffsetVal;
            spectrum.firstX = spectrum.firstX - shift;
            spectrum.lastX = spectrum.lastX - shift;
        }
    }


    function convertTo3DZ(spectra) {
        var noise = 0;
        var minZ = spectra[0].data[0][0];
        var maxZ = minZ;
        var ySize = spectra.length;
        var xSize = spectra[0].data[0].length / 2;
        var z = new Array(ySize);
        for (var i = 0; i < ySize; i++) {
            z[i] = new Array(xSize);
            var xVector = spectra[i].data[0];
            for (var j = 0; j < xSize; j++) {
                var value = xVector[j * 2 + 1];
                z[i][j] = value;
                if (value < minZ) minZ = value;
                if (value > maxZ) maxZ = value;
                if (i !== 0 && j !== 0) {
                    noise += Math.abs(value - z[i][j - 1]) + Math.abs(value - z[i - 1][j]);
                }
            }
        }
        return {
            z: z,
            minX: spectra[0].data[0][0],
            maxX: spectra[0].data[0][spectra[0].data[0].length - 2], // has to be -2 because it is a 1D array [x,y,x,y,...]
            minY: spectra[0].pageValue,
            maxY: spectra[ySize - 1].pageValue,
            minZ: minZ,
            maxZ: maxZ,
            noise: noise / ((ySize - 1) * (xSize - 1) * 2)
        };

    }

    function add2D(result, options) {
        var zData = convertTo3DZ(result.spectra);
        result.contourLines = generateContourLines(zData, options);
        delete zData.z;
        result.minMax = zData;
    }


    function generateContourLines(zData, options) {
        var noise = zData.noise;
        var z = zData.z;
        var nbLevels = options.nbContourLevels || 7;
        var noiseMultiplier = options.noiseMultiplier === undefined ? 5 : options.noiseMultiplier;
        var povarHeight0, povarHeight1, povarHeight2, povarHeight3;
        var isOver0, isOver1, isOver2, isOver3;
        var nbSubSpectra = z.length;
        var nbPovars = z[0].length;
        var pAx, pAy, pBx, pBy;

        var x0 = zData.minX;
        var xN = zData.maxX;
        var dx = (xN - x0) / (nbPovars - 1);
        var y0 = zData.minY;
        var yN = zData.maxY;
        var dy = (yN - y0) / (nbSubSpectra - 1);
        var minZ = zData.minZ;
        var maxZ = zData.maxZ;

        //System.out.prvarln('y0 '+y0+' yN '+yN);
        // -------------------------
        // Povars attribution
        //
        // 0----1
        // |  / |
        // | /  |
        // 2----3
        //
        // ---------------------d------

        var iter = nbLevels * 2;
        var contourLevels = new Array(iter);
        var lineZValue;
        for (var level = 0; level < iter; level++) { // multiply by 2 for positif and negatif
            var contourLevel = {};
            contourLevels[level] = contourLevel;
            var side = level % 2;
            var factor = (maxZ - noiseMultiplier * noise) * Math.exp((level >> 1) - nbLevels);
            if (side === 0) {
                lineZValue = factor + noiseMultiplier * noise;
            } else {
                lineZValue = (0 - factor) - noiseMultiplier * noise;
            }
            var lines = [];
            contourLevel.zValue = lineZValue;
            contourLevel.lines = lines;

            if (lineZValue <= minZ || lineZValue >= maxZ) continue;

            for (var iSubSpectra = 0; iSubSpectra < nbSubSpectra - 1; iSubSpectra++) {
                var subSpectra = z[iSubSpectra];
                var subSpectraAfter = z[iSubSpectra + 1];
                for (var povar = 0; povar < nbPovars - 1; povar++) {
                    povarHeight0 = subSpectra[povar];
                    povarHeight1 = subSpectra[povar + 1];
                    povarHeight2 = subSpectraAfter[povar];
                    povarHeight3 = subSpectraAfter[povar + 1];

                    isOver0 = (povarHeight0 > lineZValue);
                    isOver1 = (povarHeight1 > lineZValue);
                    isOver2 = (povarHeight2 > lineZValue);
                    isOver3 = (povarHeight3 > lineZValue);

                    // Example povar0 is over the plane and povar1 and
                    // povar2 are below, we find the varersections and add
                    // the segment
                    if (isOver0 !== isOver1 && isOver0 !== isOver2) {
                        pAx = povar + (lineZValue - povarHeight0) / (povarHeight1 - povarHeight0);
                        pAy = iSubSpectra;
                        pBx = povar;
                        pBy = iSubSpectra + (lineZValue - povarHeight0) / (povarHeight2 - povarHeight0);
                        lines.push(pAx * dx + x0);
                        lines.push(pAy * dy + y0);
                        lines.push(pBx * dx + x0);
                        lines.push(pBy * dy + y0);
                    }
                    // remove push does not help !!!!
                    if (isOver3 !== isOver1 && isOver3 !== isOver2) {
                        pAx = povar + 1;
                        pAy = iSubSpectra + 1 - (lineZValue - povarHeight3) / (povarHeight1 - povarHeight3);
                        pBx = povar + 1 - (lineZValue - povarHeight3) / (povarHeight2 - povarHeight3);
                        pBy = iSubSpectra + 1;
                        lines.push(pAx * dx + x0);
                        lines.push(pAy * dy + y0);
                        lines.push(pBx * dx + x0);
                        lines.push(pBy * dy + y0);
                    }
                    // test around the diagonal
                    if (isOver1 !== isOver2) {
                        pAx = (povar + 1 - (lineZValue - povarHeight1) / (povarHeight2 - povarHeight1)) * dx + x0;
                        pAy = (iSubSpectra + (lineZValue - povarHeight1) / (povarHeight2 - povarHeight1)) * dy + y0;
                        if (isOver1 !== isOver0) {
                            pBx = povar + 1 - (lineZValue - povarHeight1) / (povarHeight0 - povarHeight1);
                            pBy = iSubSpectra;
                            lines.push(pAx);
                            lines.push(pAy);
                            lines.push(pBx * dx + x0);
                            lines.push(pBy * dy + y0);
                        }
                        if (isOver2 !== isOver0) {
                            pBx = povar;
                            pBy = iSubSpectra + 1 - (lineZValue - povarHeight2) / (povarHeight0 - povarHeight2);
                            lines.push(pAx);
                            lines.push(pAy);
                            lines.push(pBx * dx + x0);
                            lines.push(pBy * dy + y0);
                        }
                        if (isOver1 !== isOver3) {
                            pBx = povar + 1;
                            pBy = iSubSpectra + (lineZValue - povarHeight1) / (povarHeight3 - povarHeight1);
                            lines.push(pAx);
                            lines.push(pAy);
                            lines.push(pBx * dx + x0);
                            lines.push(pBy * dy + y0);
                        }
                        if (isOver2 !== isOver3) {
                            pBx = povar + (lineZValue - povarHeight2) / (povarHeight3 - povarHeight2);
                            pBy = iSubSpectra + 1;
                            lines.push(pAx);
                            lines.push(pAy);
                            lines.push(pBx * dx + x0);
                            lines.push(pBy * dy + y0);
                        }
                    }
                }
            }
        }

        return {
            minX: zData.minX,
            maxX: zData.maxX,
            minY: zData.minY,
            maxY: zData.maxY,
            segments: contourLevels
        };
    }

    function fastParseXYData(spectrum, value) {
        // TODO need to deal with result
        //  console.log(value);
        // we check if deltaX is defined otherwise we calculate it

        var yFactor = spectrum.yFactor;
        var deltaX = spectrum.deltaX;


        spectrum.isXYdata = true;
        // TODO to be improved using 2 array {x:[], y:[]}
        var currentData = [];
        spectrum.data = [currentData];


        var currentX = spectrum.firstX;
        var currentY = spectrum.firstY;

        // we skip the first line
        //
        var endLine = false;
        for (var i = 0; i < value.length; i++) {
            var ascii = value.charCodeAt(i);
            if (ascii === 13 || ascii === 10) {
                endLine = true;
            } else {
                if (endLine) break;
            }
        }

        // we proceed taking the i after the first line
        var newLine = true;
        var isDifference = false;
        var isLastDifference = false;
        var lastDifference = 0;
        var isDuplicate = false;
        var inComment = false;
        var currentValue = 0;
        var isNegative = false;
        var inValue = false;
        var skipFirstValue = false;
        var decimalPosition = 0;
        var ascii;
        for (; i <= value.length; i++) {
            if (i === value.length) ascii = 13;
            else ascii = value.charCodeAt(i);
            if (inComment) {
                // we should ignore the text if we are after $$
                if (ascii === 13 || ascii === 10) {
                    newLine = true;
                    inComment = false;
                }
            } else {
                // when is it a new value ?
                // when it is not a digit, . or comma
                // it is a number that is either new or we continue
                if (ascii <= 57 && ascii >= 48) { // a number
                    inValue = true;
                    if (decimalPosition > 0) {
                        currentValue += (ascii - 48) / Math.pow(10, decimalPosition++);
                    } else {
                        currentValue *= 10;
                        currentValue += ascii - 48;
                    }
                } else if (ascii === 44 || ascii === 46) { // a "," or "."
                    inValue = true;
                    decimalPosition++;
                } else {
                    if (inValue) {
                        // need to process the previous value
                        if (newLine) {
                            newLine = false; // we don't check the X value
                            // console.log("NEW LINE",isDifference, lastDifference);
                            // if new line and lastDifference, the first value is just a check !
                            // that we don't check ...
                            if (isLastDifference) skipFirstValue = true;
                        } else {
                            // need to deal with duplicate and differences
                            if (skipFirstValue) {
                                skipFirstValue = false;
                            } else {
                                if (isDifference) {
                                    lastDifference = isNegative ? (0 - currentValue) : currentValue;
                                    isLastDifference = true;
                                    isDifference = false;
                                }
                                var duplicate = isDuplicate ? currentValue - 1 : 1;
                                for (var j = 0; j < duplicate; j++) {
                                    if (isLastDifference) {
                                        currentY += lastDifference;
                                    } else {
                                        currentY = isNegative ? (0 - currentValue) : currentValue;
                                    }
                                    currentData.push(currentX);
                                    currentData.push(currentY * yFactor);
                                    currentX += deltaX;
                                }
                            }
                        }
                        isNegative = false;
                        currentValue = 0;
                        decimalPosition = 0;
                        inValue = false;
                        isDuplicate = false;
                    }

                    // positive SQZ digits @ A B C D E F G H I (ascii 64-73)
                    if ((ascii < 74) && (ascii > 63)) {
                        inValue = true;
                        isLastDifference = false;
                        currentValue = ascii - 64;
                    } else
                    // negative SQZ digits a b c d e f g h i (ascii 97-105)
                    if ((ascii > 96) && (ascii < 106)) {
                        inValue = true;
                        isLastDifference = false;
                        currentValue = ascii - 96;
                        isNegative = true;
                    } else
                    // DUP digits S T U V W X Y Z s (ascii 83-90, 115)
                    if (ascii === 115) {
                        inValue = true;
                        isDuplicate = true;
                        currentValue = 9;
                    } else if ((ascii > 82) && (ascii < 91)) {
                        inValue = true;
                        isDuplicate = true;
                        currentValue = ascii - 82;
                    } else
                    // positive DIF digits % J K L M N O P Q R (ascii 37, 74-82)
                    if ((ascii > 73) && (ascii < 83)) {
                        inValue = true;
                        isDifference = true;
                        currentValue = ascii - 73;
                    } else
                    // negative DIF digits j k l m n o p q r (ascii 106-114)
                    if ((ascii > 105) && (ascii < 115)) {
                        inValue = true;
                        isDifference = true;
                        currentValue = ascii - 105;
                        isNegative = true;
                    } else
                    // $ sign, we need to check the next one
                    if (ascii === 36 && value.charCodeAt(i + 1) === 36) {
                        inValue = true;
                        inComment = true;
                    } else
                    // positive DIF digits % J K L M N O P Q R (ascii 37, 74-82)
                    if (ascii === 37) {
                        inValue = true;
                        isDifference = true;
                        currentValue = 0;
                        isNegative = false;
                    } else if (ascii === 45) { // a "-"
                        // check if after there is a number, decimal or comma
                        var ascii2 = value.charCodeAt(i + 1);
                        if ((ascii2 >= 48 && ascii2 <= 57) || ascii2 === 44 || ascii2 === 46) {
                            inValue = true;
                            isLastDifference = false;
                            isNegative = true;
                        }
                    } else if (ascii === 13 || ascii === 10) {
                        newLine = true;
                        inComment = false;
                    }
                    // and now analyse the details ... space or tabulation
                    // if "+" we just don't care
                }
            }
        }
    }

    function parsePeakTable(spectrum, value, result) {
        var removeCommentRegExp = /\$\$.*/;
        var peakTableSplitRegExp = /[,\t ]+/;

        spectrum.isPeaktable = true;
        var i, ii, j, jj, values;
        var currentData = [];
        spectrum.data = [currentData];

        // counts for around 20% of the time
        var lines = value.split(/,? *,?[;\r\n]+ */);

        for (i = 1, ii = lines.length; i < ii; i++) {
            values = lines[i].trim().replace(removeCommentRegExp, '').split(peakTableSplitRegExp);
            if (values.length % 2 === 0) {
                for (j = 0, jj = values.length; j < jj; j = j + 2) {
                    // takes around 40% of the time to add and parse the 2 values nearly exclusively because of parseFloat
                    currentData.push(parseFloat(values[j]) * spectrum.xFactor);
                    currentData.push(parseFloat(values[j + 1]) * spectrum.yFactor);
                }
            } else {
                result.logs.push('Format error: ' + values);
            }
        }
    }


    return convert;

}

var convert = getConverter();

function JcampConverter(input, options, useWorker) {
    if (typeof options === 'boolean') {
        useWorker = options;
        options = {};
    }
    if (useWorker) {
        return postToWorker(input, options);
    } else {
        return convert(input, options);
    }
}

var stamps = {},
    worker;

function postToWorker(input, options) {
    if (!worker) {
        createWorker();
    }
    return new Promise(function (resolve) {
        var stamp = Date.now() + '' + Math.random();
        stamps[stamp] = resolve;
        worker.postMessage(JSON.stringify({
            stamp: stamp,
            input: input,
            options: options
        }));
    });
}

function createWorker() {
    var workerURL = URL.createObjectURL(new Blob([
        'var getConverter =' + getConverter.toString() + ';var convert = getConverter(); onmessage = function (event) { var data = JSON.parse(event.data); postMessage(JSON.stringify({stamp: data.stamp, output: convert(data.input, data.options)})); };'
    ], {type: 'application/javascript'}));
    worker = new Worker(workerURL);
    URL.revokeObjectURL(workerURL);
    worker.addEventListener('message', function (event) {
        var data = JSON.parse(event.data);
        var stamp = data.stamp;
        if (stamps[stamp]) {
            stamps[stamp](data.output);
        }
    });
}

module.exports = {
    convert: JcampConverter
};

},{"./parseXYData.js":2}],2:[function(require,module,exports){
'use strict';


var xyDataSplitRegExp = /[,\t \+-]*(?=[^\d,\t \.])|[ \t]+(?=[\d+\.-])/;
var removeCommentRegExp = /\$\$.*/;
var DEBUG=false;

module.exports=function(spectrum, value, result) {
    // we check if deltaX is defined otherwise we calculate it
    if (!spectrum.deltaX) {
        spectrum.deltaX = (spectrum.lastX - spectrum.firstX) / (spectrum.nbPoints - 1);
    }

    spectrum.isXYdata=true;

    var currentData = [];
    var currentPosition=0;
    spectrum.data = [currentData];

    var currentX = spectrum.firstX;
    var currentY = spectrum.firstY;
    var lines = value.split(/[\r\n]+/);
    var lastDif, values, ascii, expectedY;
    values = [];
    for (var i = 1, ii = lines.length; i < ii; i++) {
        //var previousValues=JSON.parse(JSON.stringify(values));
        values = lines[i].trim().replace(removeCommentRegExp, '').split(xyDataSplitRegExp);
        if (values.length > 0) {
            if (DEBUG) {
                if (!spectrum.firstPoint) {
                    spectrum.firstPoint = +values[0];
                }
                var expectedCurrentX = (values[0] - spectrum.firstPoint) * spectrum.xFactor + spectrum.firstX;
                if ((lastDif || lastDif === 0)) {
                    expectedCurrentX += spectrum.deltaX;
                }
                result.logs.push('Checking X value: currentX: ' + currentX + ' - expectedCurrentX: ' + expectedCurrentX);
            }
            for (var j = 1, jj = values.length; j < jj; j++) {
                if (j === 1 && (lastDif || lastDif === 0)) {
                    lastDif = null; // at the beginning of each line there should be the full value X / Y so the diff is always undefined
                    // we could check if we have the expected Y value
                    ascii = values[j].charCodeAt(0);

                    if (false) { // this code is just to check the jcamp DIFDUP and the next line repeat of Y value
                        // + - . 0 1 2 3 4 5 6 7 8 9
                        if ((ascii === 43) || (ascii === 45) || (ascii === 46) || ((ascii > 47) && (ascii < 58))) {
                            expectedY = +values[j];
                        } else
                        // positive SQZ digits @ A B C D E F G H I (ascii 64-73)
                        if ((ascii > 63) && (ascii < 74)) {
                            expectedY = +(String.fromCharCode(ascii - 16) + values[j].substring(1));
                        } else
                        // negative SQZ digits a b c d e f g h i (ascii 97-105)
                        if ((ascii > 96) && (ascii < 106)) {
                            expectedY = -(String.fromCharCode(ascii - 48) + values[j].substring(1));
                        }
                        if (expectedY !== currentY) {
                            result.logs.push('Y value check error: Found: ' + expectedY + ' - Current: ' + currentY);
                            result.logs.push('Previous values: ' + previousValues.length);
                            result.logs.push(previousValues);
                        }
                    }
                } else {
                    if (values[j].length > 0) {
                        ascii = values[j].charCodeAt(0);
                        // + - . 0 1 2 3 4 5 6 7 8 9
                        if ((ascii === 43) || (ascii === 45) || (ascii === 46) || ((ascii > 47) && (ascii < 58))) {
                            lastDif = null;
                            currentY = +values[j];
                            // currentData.push(currentX, currentY * spectrum.yFactor);
                            currentData[currentPosition++]=currentX;
                            currentData[currentPosition++]=currentY * spectrum.yFactor;
                            currentX += spectrum.deltaX;
                        } else
                        // positive SQZ digits @ A B C D E F G H I (ascii 64-73)
                        if ((ascii > 63) && (ascii < 74)) {
                            lastDif = null;
                            currentY = +(String.fromCharCode(ascii - 16) + values[j].substring(1));
                            // currentData.push(currentX, currentY * spectrum.yFactor);
                            currentData[currentPosition++] = currentX;
                            currentData[currentPosition++] = currentY * spectrum.yFactor;
                            currentX += spectrum.deltaX;
                        } else
                        // negative SQZ digits a b c d e f g h i (ascii 97-105)
                        if ((ascii > 96) && (ascii < 106)) {
                            lastDif = null;
                            // we can multiply the string by 1 because if may not contain decimal (is this correct ????)
                            currentY = -(String.fromCharCode(ascii - 48) + values[j].substring(1))*1;
                            //currentData.push(currentX, currentY * spectrum.yFactor);
                            currentData[currentPosition++]=currentX;
                            currentData[currentPosition++]=currentY * spectrum.yFactor;
                            currentX += spectrum.deltaX;
                        } else



                        // DUP digits S T U V W X Y Z s (ascii 83-90, 115)
                        if (((ascii > 82) && (ascii < 91)) || (ascii === 115)) {
                            var dup = (String.fromCharCode(ascii - 34) + values[j].substring(1)) - 1;
                            if (ascii === 115) {
                                dup = ('9' + values[j].substring(1)) - 1;
                            }
                            for (var l = 0; l < dup; l++) {
                                if (lastDif) {
                                    currentY = currentY + lastDif;
                                }
                                // currentData.push(currentX, currentY * spectrum.yFactor);
                                currentData[currentPosition++]=currentX;
                                currentData[currentPosition++]=currentY * spectrum.yFactor;
                                currentX += spectrum.deltaX;
                            }
                        } else
                        // positive DIF digits % J K L M N O P Q R (ascii 37, 74-82)
                        if (ascii === 37) {
                            lastDif = +('0' + values[j].substring(1));
                            currentY += lastDif;
                            // currentData.push(currentX, currentY * spectrum.yFactor);
                            currentData[currentPosition++]=currentX;
                            currentData[currentPosition++]=currentY * spectrum.yFactor;
                            currentX += spectrum.deltaX;
                        } else if ((ascii > 73) && (ascii < 83)) {
                            lastDif = (String.fromCharCode(ascii - 25) + values[j].substring(1))*1;
                            currentY += lastDif;
                            // currentData.push(currentX, currentY * spectrum.yFactor);
                            currentData[currentPosition++]=currentX;
                            currentData[currentPosition++]=currentY * spectrum.yFactor;
                            currentX += spectrum.deltaX;
                        } else
                        // negative DIF digits j k l m n o p q r (ascii 106-114)
                        if ((ascii > 105) && (ascii < 115)) {
                            lastDif = -(String.fromCharCode(ascii - 57) + values[j].substring(1))*1;
                            currentY += lastDif;
                            // currentData.push(currentX, currentY * spectrum.yFactor);
                            currentData[currentPosition++]=currentX;
                            currentData[currentPosition++]=currentY * spectrum.yFactor;
                            currentX += spectrum.deltaX;
                        }
                    }
                }
            }
        }
    }
}

},{}],3:[function(require,module,exports){
'use strict';

/**
 * Returns an experiment string based on a pulse sequence
 * @param {string} pulse
 * @return {string}
 */
module.exports = function getSpectrumType(pulse) {
    if (typeof pulse !== 'string') {
        return '';
    }

    pulse = pulse.toLowerCase();
    if (pulse.includes('zg')) {
        return '1d';
    }

    if (pulse.includes('hsqct') ||
        (pulse.includes('invi') && (pulse.includes('ml') || pulse.includes('di')))) {
        return 'hsqctocsy';
    }

    if (pulse.includes('hsqc') || pulse.includes('invi')) {
        return 'hsqc';
    }

    if (pulse.includes('hmbc') || (pulse.includes('inv4') && pulse.includes('lp'))) {
        return 'hmbc';
    }

    if (pulse.includes('cosy')) {
        return 'cosy';
    }

    if (pulse.includes('jres')) {
        return 'jres';
    }

    if (pulse.includes('tocsy') || pulse.includes('mlev') || pulse.includes('dipsi')) {
        return 'tocsy';
    }

    if (pulse.includes('noesy')) {
        return 'noesy';
    }

    if (pulse.includes('roesy')) {
        return 'roesy';
    }

    if (pulse.includes('dept')) {
        return 'dept';
    }

    if (pulse.includes('jmod') || pulse.includes('apt')) {
        return 'aptjmod';
    }

    return '';
};

},{}],4:[function(require,module,exports){
'use strict';

const jcampconverter = require('jcampconverter');

const getSpectrumType = require('./getSpectrumType');

/**
 * @typedef NMRMetadata
 * @type Object
 * @property {number} dimension
 * @property {number[]} nucleus
 * @property {string} title
 * @property {string} solvent
 * @property {string} pulse
 * @property {string} experiment
 * @property {number} temperature - Temperature in K
 * @property {number} frequency
 * @property {string} date - Date in ISO string format
 */

/**
 * Returns a metadata object from JCAMP
 * @param {string} jcampData
 * @return {NMRMetadata} metadata
 */
exports.parseJcamp = function (jcampData) {
    const jcamp = jcampconverter.convert(jcampData.toString(), {
        keepRecordsRegExp: /.*/,
        withoutXY: true
    });

    const metadata = {
        dimension: jcamp.twoD ? 2 : 1,
        nucleus: []
    };

    const info = jcamp.info;
    maybeAdd(metadata, 'title', info['TITLE']);
    maybeAdd(metadata, 'solvent', info['.SOLVENTNAME']);
    maybeAdd(metadata, 'pulse', info['.PULSESEQUENCE'] || info['.PULPROG'] || info['$PULPROG']);
    maybeAdd(metadata, 'experiment', getSpectrumType(metadata.pulse));
    maybeAdd(metadata, 'temperature', parseFloat(info['$TE'] || info['.TE']));
    maybeAdd(metadata, 'frequency', parseFloat(info['.OBSERVEFREQUENCY']));

    if (metadata.dimension === 1) {
        const nucleus = info['.OBSERVENUCLEUS'];
        if (nucleus) {
            metadata.nucleus = [nucleus.replace(/[^A-Za-z0-9]/g,'')];
        }
    } else {
        const nucleus = info['.NUCLEUS'];
        if (nucleus) {
            metadata.nucleus = nucleus.split(',').map(nuc => nuc.trim());
        }
    }
    if (metadata.nucleus.length === 0) {
        metadata.nucleus = exports.getNucleusFrom2DExperiment(metadata.experiment);
    }

    if (info['$DATE']) {
        metadata.date = (new Date(info['$DATE'] * 1000)).toISOString();
    }

    return metadata;
};

/**
 * Returns a list of nuclei based on an experiment string
 * @param {string} experiment
 * @return {string[]}
 */
exports.getNucleusFrom2DExperiment = function (experiment) {
    if (typeof experiment !== 'string') {
        return [];
    }
    experiment = experiment.toLowerCase();
    if (experiment.includes('jres')) {
        return ['1H'];
    }
    if (experiment.includes('hmbc') || experiment.includes('hsqc')) {
        return ['1H', '13C'];
    }
    return ['1H', '1H'];
};

exports.getSpectrumType = getSpectrumType;

function maybeAdd(obj, name, value) {
    if (value) {
        obj[name] = value;
    }
}

},{"./getSpectrumType":3,"jcampconverter":1}],5:[function(require,module,exports){
'use strict';

const types = require('./types');
const defaults = require('./util/defaults');

module.exports = {
    process: function (type, doc, content, customMetadata) {
        let filename = content.filename;
        let fileContent = getTextContent(content);

        const typeProcessor = types.getType(type);
        const arr = createFromJpath(doc, typeProcessor);
        const entry = typeProcessor.find(arr, filename);
        const property = typeProcessor.getProperty(filename, content);
        if(property === undefined) {
            throw new Error(`Could not get property of ${filename} (type ${type}`);
        }
        const metadata = typeProcessor.process(filename, fileContent);

        // process
        metadata[property] = {
            filename: module.exports.getFilename(type, content.filename)
        };


        if(entry) {
            Object.assign(entry, metadata, customMetadata);
        } else {
            Object.assign(metadata, customMetadata);
            arr.push(metadata);
        }

        return doc;
    },

    getType: function(type, doc, kind) {
        const typeProcessor = types.getType(type, kind);
        return getFromJpath(doc, typeProcessor);
    },

    getFilename(type, filename) {
        var match = /[^\/]*$/.exec(filename);
        if(match) filename = match[0];
        const typeProcessor = types.getType(type);
        const jpath = typeProcessor.jpath;
        if(!jpath) throw new Error('No such type or no jpath');
        return jpath.concat(filename).join('/');
    },

    getEmpty(kind, content) {
        const typeProcessors = types.getAllTypes(kind);
        if(!content) content = {};
        for(let i=0; i<typeProcessors.length; i++) {
            createFromJpath(content, typeProcessors[i]);
        }

        return content;
    },

    defaults(kind, content) {
        var empty = module.exports.getEmpty(kind);
        defaults(true, content, empty);
        return content;
    }
};

function createFromJpath(doc, typeProcessor) {
    const jpath = typeProcessor.jpath;
    if(!jpath) throw new Error('createFromJpath: undefined jpath argument');
    for (let i = 0; i < jpath.length; i++) {
        if (doc[jpath[i]] === undefined) {
            if (i !== jpath.length - 1) {
                doc[jpath[i]] = {};
            } else {
                doc[jpath[i]] = typeProcessor.getEmpty();
            }
        }
        doc = doc[jpath[i]];
    }
    if(jpath.length === 0) {
        doc = Object.assign(doc, typeProcessor.getEmpty());
    }
    return doc;
}

function getFromJpath(doc, typeProcessor) {
    if(!doc) return;
    const jpath = typeProcessor.jpath;
    if(!jpath) throw new Error('getFromJpath: undefined jpath argument');
    for (let i = 0; i < jpath.length; i++) {
        if (doc[jpath[i]] === undefined) {
            return undefined;
        }
        doc = doc[jpath[i]];
    }
    return doc;
}

function getTextContent(content) {
    switch(content.encoding) {
        case 'base64':
            return atob(content.content);
        default:
            return content.content;
    }
}
},{"./types":6,"./util/defaults":17}],6:[function(require,module,exports){
'use strict';


const lib = ({"types":({"common":require("./types/common.js"),"default":require("./types/default.js"),"nmr":require("./types/nmr.js"),"reaction":({"general":require("./types/reaction/general.js")}),"sample":({"general":require("./types/sample/general.js"),"ir":require("./types/sample/ir.js"),"mass":require("./types/sample/mass.js"),"nmr":require("./types/sample/nmr.js"),"physical":require("./types/sample/physical.js"),"raman":require("./types/sample/raman.js")})})});

module.exports = {
    getType(type, kind, custom) {
        if(kind) {
            if(lib.types[kind][type]) {
                return Object.assign({}, lib.types.default, lib.types[kind].default, lib.types[kind][type], custom);
            }
        } else {
            for(var kind in lib.types) {
                if(lib.types[kind][type]) {
                    return Object.assign({}, lib.types.default, lib.types[kind].default, lib.types[kind][type], custom);
                }
            }
        }

        return Object.assign({}, lib.types.default);
    },

    getAllTypes(kind, custom) {
        var all = [];

        for(var type in lib.types[kind]) {
            if(type !== 'default') {
                all.push(module.exports.getType(type, kind, custom));
            }
        }
        return all;
    }
};
},{"./types/common.js":7,"./types/default.js":8,"./types/nmr.js":9,"./types/reaction/general.js":10,"./types/sample/general.js":11,"./types/sample/ir.js":12,"./types/sample/mass.js":13,"./types/sample/nmr.js":14,"./types/sample/physical.js":15,"./types/sample/raman.js":16}],7:[function(require,module,exports){
'use strict';

const reg0 = /.*\/([^\/]*$)/;
const reg1 = /\.[0-9]+$/;
const reg2 = /(.*)\.(.*)/;

var common = module.exports = {};

common.getBasename = function (filename) {
    let base = filename.replace(reg0, '$1');
    return base.replace(reg1, '');
};

common.getExtension = function (filename) {
    let extension = common.getBasename(filename);
    return extension.replace(reg2, '$2').toLowerCase();
};


common.getFilename = function (typeEntry) {
    let keys = Object.keys(typeEntry);
    for (let i = 0; i < keys.length; i++) {
        if (typeEntry[keys[i]] && typeEntry[keys[i]].filename) {
            return typeEntry[keys[i]].filename;
        }
    }
};

common.basenameFind = function (typeEntries, filename) {
    let reference = common.getBasename(filename);

    return typeEntries.find(typeEntry => {
        return common.getBasename(common.getFilename(typeEntry)) === reference;
    });
};

common.jcampGetProperty = function (filename) {
    const extension = common.getExtension(filename);
    if(extension === 'jdx' || extension === 'dx') {
        return 'jcamp';
    } else if(extension === 'pdf') {
        return 'pdf';
    }
    return 'file';
};
},{}],8:[function(require,module,exports){
'use strict';

module.exports = {
    process() {
        return {};
    },

    getEmpty() {
        return [];
    }
};
},{}],9:[function(require,module,exports){
'use strict';

const nmrMetadata = require('nmr-metadata');

exports.getMetadata = nmrMetadata.parseJcamp;
exports.getSpectrumType = nmrMetadata.getSpectrumType;
exports.getNucleusFrom2DExperiment = nmrMetadata.getNucleusFrom2DExperiment;

},{"nmr-metadata":4}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
'use strict';

module.exports = {
    jpath: ['general'],
    getEmpty() {
        return {
            description: '',
            name: [],
            mf: '',
            molfile: '',
            mw: 0
        }
    }
};
},{}],12:[function(require,module,exports){
'use strict';

const common = require('../common');

module.exports = {
    jpath: ['spectra', 'ir'],
    find: common.basenameFind,
    getProperty: common.jcampGetProperty
};
},{"../common":7}],13:[function(require,module,exports){
'use strict';

const common = require('../common');

module.exports = {
    jpath: ['spectra', 'mass'],
    find: common.basenameFind,
    getProperty: common.jcampGetProperty
};
},{"../common":7}],14:[function(require,module,exports){
'use strict';

const isFid = /[^a-z]fid[^a-z]/i;
const isFt = /[^a-z]ft[^a-z]/i;
const replaceFid = /[^a-z]fid[^a-z]?/i;
const replaceFt = /[^a-z]ft[^a-z]?/i;

const common = require('../common');
const nmrLib = require('../nmr');


module.exports = {
    find(nmr, filename) {
        let reference = getReference(filename);

        return nmr.find(nmr => {
            return getReference(common.getFilename(nmr)) === reference;
        });
    },

    getProperty(filename, content) {
        const extension = common.getExtension(filename);
        if(extension === 'jdx' || extension === 'dx') {
            if(isFid.test(filename)) {
                return 'jcampFID';
            }
            if(isFt.test(filename)) {
                return 'jcampFT';
            }
            return 'jcamp';
        } else if(extension === 'pdf') {
            return 'pdf';
        }
        return 'file';
    },

    process(filename, content) {
        const extension = common.getExtension(filename);
        var metaData = {};
        if(extension === 'jdx' || extension === 'dx') {
            metaData =  nmrLib.getMetadata(content);
        }
        return metaData;
    },

    jpath: ['spectra', 'nmr']
};

const reg2 = /(.*)\.(.*)/;

function getReference(filename) {
    if(typeof filename === 'undefined') return;

    let reference = common.getBasename(filename);
    reference = reference.replace(reg2, '$1');


    if(isFid.test(filename)) {
        reference = reference.replace(replaceFid, '');
    } else if(isFt.test(filename)) {
        reference = reference.replace(replaceFt, '');
    }
    return reference;
}

},{"../common":7,"../nmr":9}],15:[function(require,module,exports){
'use strict';

module.exports = {
    jpath: ['physical'],
    getEmpty() {
        return {
            bp: [],
            density: [],
            mp: [],
            nd: []
        }
    }
};
},{}],16:[function(require,module,exports){
'use strict';

const common = require('../common');

module.exports = {
    jpath: ['spectra', 'raman'],
    find: common.basenameFind,
    getProperty: common.jcampGetProperty
};

},{"../common":7}],17:[function(require,module,exports){
/*
    Modified from https://github.com/justmoon/node-extend
    Copyright (c) 2014 Stefan Thomas
 */


'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
    if (typeof Array.isArray === 'function') {
        return Array.isArray(arr);
    }

    return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
    if (!obj || toStr.call(obj) !== '[object Object]') {
        return false;
    }

    var hasOwnConstructor = hasOwn.call(obj, 'constructor');
    var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
    // Not own constructor property must be Object
    if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
        return false;
    }

    // Own properties are enumerated firstly, so to speed up,
    // if last one is own, then all properties are own.
    var key;
    for (key in obj) { /**/ }

    return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function defaults() {
    var options, name, src, copy, copyIsArray, clone;
    var target = arguments[0];
    var i = 1;
    var length = arguments.length;
    var deep = false;

    // Handle a deep copy situation
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    } else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
        target = {};
    }

    for (; i < length; ++i) {
        options = arguments[i];
        // Only deal with non-null/undefined values
        if (options != null) {
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop
                if (target !== copy) {
                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && isArray(src) ? src : [];
                        } else {
                            clone = src && isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        if(typeof target[name] === 'undefined') {
                            target[name] = defaults(deep, clone, copy);
                        } else {
                            defaults(deep, clone, copy);
                        }


                        // Don't bring in undefined values
                    } else if (typeof copy !== 'undefined') {
                        if(typeof target[name] === 'undefined') {
                            target[name] = copy;
                        }
                    }
                }
            }
        }
    }

    // Return the modified object
    return target;
};
},{}]},{},[5])(5)
});