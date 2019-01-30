'use strict';

const parseNetCDF = require('netcdf-gcms');

const common = require('../common');

function process(filename, content) {
  const extension = common.getExtension(filename);
  var metaData = {};
  if (extension === 'cdf' || extension === 'netcdf') {
    let bufferContent = common.getBufferContent(content);
    let parsed = parseNetCDF(bufferContent, { meta: true });
    if (parsed.series.length === 1) {
      metaData.detector = parsed.series[0].name;
    }
  }
  return metaData;
}

module.exports = {
  jpath: ['spectra', 'chromatogram'],
  find: common.basenameFind,
  getProperty: common.getTargetProperty,
  process
};
