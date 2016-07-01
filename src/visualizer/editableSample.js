'use strict'
/**
 * Created by acastillo on 7/1/16.
 */
define(['src/util/api', 'src/util/ui', 'OCLE', 'ExpandableMolecule','../index'], function (API, UI, OCLE, ExpandableMolecule, elnPlugin) {

    var roc = API.cache('roc');
    var couchDB = API.cache('couchDB');
    var uuid = couchDB.uuid;

    if (!roc && uuid) {
        var couchUrl = couchDB.couchUrl;
        var database = couchDB.database;
        roc = new Roc({
            url: couchUrl,
            database: database,
            processor: elnPlugin,
            kind: couchDB.kind
        });

        roc.document(uuid, {
            varName: 'sample'
        }).then(function (sample) {
            var sampleVar = API.getVar('sample');

            API.createData('annot1d', null);
            API.createData('annot2d', null);
            API.setVariable('sampleCode', sampleVar, ['$id', 0]);
            API.setVariable('creationDate', sampleVar, ['$creationDate']);
            API.setVariable('modificationDate', sampleVar, ['$modificationDate']);
            API.setVariable('content', sampleVar, ['$content']);
            API.setVariable('molfile', sampleVar, ['$content', 'general', 'molfile']);
            API.setVariable('mf', sampleVar, ['$content', 'general', 'mf']);
            API.setVariable('mw', sampleVar, ['$content', 'general', 'mw']);
            API.setVariable('description', sampleVar, ['$content', 'general', 'description']);
            API.setVariable('iupac', sampleVar, ['$content', 'general', 'iupac']);
            API.setVariable('bp', sampleVar, ['$content', 'physical', 'bp']);
            API.setVariable('nd', sampleVar, ['$content', 'physical', 'nd']);
            API.setVariable('mp', sampleVar, ['$content', 'physical', 'mp']);
            API.setVariable('density', sampleVar, ['$content', 'physical', 'density']);
            API.setVariable('nmr', sampleVar, ['$content', 'spectra', 'nmr']);
            API.setVariable('ir', sampleVar, ['$content', 'spectra', 'ir']);
            API.setVariable('mass', sampleVar, ['$content', 'spectra', 'mass']);
            updateAttachments(sample);

            var expandableMolecule = new ExpandableMolecule(sample);
            API.cache('expandableMolecule', expandableMolecule);
            if(typeof IframeBridge !='undefined'){
                sample.onChange(function (event) {
                    IframeBridge.postMessage('tab.status', {
                        saved: false
                    });
                });
            }

        });

        API.cache('roc', roc);
    }


    function updateAttachments(entry) {
        return roc.getAttachmentList(API.cache('couchDB').uuid).then(function (list) {
            API.createData('sampleAttachments', list);
        })
    }

    if (!roc) return;

    var sample = API.getData('sample');

    if (this.action) {
        switch (this.action.name) {
            case 'refresh':
                roc.get(uuid);
                break;
            case 'save':
                roc.update(sample).then(function () {
                    sample.onChange(function (event) {
                        IframeBridge.postMessage('tab.status', {
                            saved: true
                        });
                    });
                });
                break;
            default:
                break;
        }
    }
}
