'use strict';

const common = (module.exports = {});

common.getBasename = function (filename) {
  let base = filename.replace(/.*\//, '');
  return base.replace(/\.[0-9]+$/, '');
};

common.getExtension = function (filename) {
  let extension = common.getBasename(filename);
  return extension.replace(/.*\./, '').toLowerCase();
};

common.getFilename = function (typeEntry) {
  let keys = Object.keys(typeEntry);
  for (let i = 0; i < keys.length; i++) {
    if (typeEntry[keys[i]] && typeEntry[keys[i]].filename) {
      return typeEntry[keys[i]].filename;
    }
  }
  return undefined;
};

common.basenameFind = function (typeEntries, filename) {
  let reference = common.getBasename(filename);

  return typeEntries.find((typeEntry) => {
    return common.getBasename(common.getFilename(typeEntry)) === reference;
  });
};

common.getTargetProperty = function (filename) {
  switch (common.getExtension(filename)) {
    case 'jdx':
    case 'dx':
    case 'jcamp':
      return 'jcamp';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'tif':
    case 'tiff':
    case 'svg':
      return 'image';
    case 'cif':
      return 'cif';
    case 'pdb':
      return 'pdb';
    case 'xml':
      return 'xml';
    case 'cdf':
    case 'nc':
    case 'netcdf':
      return 'cdf';
    case 'pdf':
      return 'pdf';
    case 'txt':
    case 'text':
    case 'csv':
    case 'tsv':
      return 'text';
    case 'gbk':
    case 'gb':
      return 'genbank';
    default:
      return 'file';
  }
};
