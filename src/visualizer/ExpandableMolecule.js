'use strict'
/**
 * Tested with OCLE https://www.lactame.com/lib/openchemlib-extended/1.4.0/openchemlib-extended
 * Created by acastillo on 7/1/16.
 */
define(['src/util/api', 'OCLE'], function (API, OCLE) {

    class ExpandableMolecule {
        constructor(sampleIn, OCLE) {
            this.sample = sampleIn;
            this.molfile = this.sample.$content.general.molfile;
            var molecule = OCLE.Molecule.fromMolfile(this.molfile + '');
            this.idCode = molecule.getIDCode();
            this.expandedHydrogens = false;
            this.jsmeEditionMode = false;
            var that = this;
            API.createData('editableMolfile', this.molfile || "").then(
                function (editableMolfile) {
                    //console.log('editableMolfile variable was created');
                    editableMolfile.onChange(function (event) {
                        // us this really a modification ? or a loop event ...
                        // need to compare former oclID with new oclID
                        var idCode = OCLE.Molecule.fromMolfile(event.target + '').getIDCode();
                        //console.log(idCode, that.idCode);
                        //console.log(this.value);
                        if (idCode != that.idCode) {
                            that.idCode = idCode;
                            //console.log('molfile changed');
                            that.molfile = event.target + '';
                            that.sample.setChildSync('$content.general.molfile', that.molfile);
                            that.updateMolfiles();
                            that.updateMF();
                        } else {
                            console.log('no update');
                        }

                        // by default we would like the depict mode
                        that.updateMolfiles();
                        that.updateMF();
                    });
                    that.updateMolfiles();
                    that.toggleJSMEEdition(false);
                }
            );
        }

        toggleJSMEEdition(force, noDepictUpdate) {
            if (force !== undefined && force === this.jsmeEditionMode) return;
            if (force === undefined) {
                this.jsmeEditionMode = !this.jsmeEditionMode;
            } else {
                this.jsmeEditionMode = force;
            }
            //console.log("JSME edit mode: "+this.jsmeEditionMode);
            var prefs = {
                "prefs": [
                    "oldlook",
                    "nozoom"
                ],
                "labelsize": "14",
                "bondwidth": "1",
                "defaultaction": "105",
                "highlightColor": "3",
                "outputResult": [
                    "yes"
                ]
            };

            if (this.jsmeEditionMode) {
                API.getData("editableMolfile").triggerChange();
                this.expandedHydrogens = false;
            } else {
                prefs.prefs.push('depict');
                if (!noDepictUpdate) {
                    this.expandedHydrogens = false;
                    API.createData("viewMolfile", this.viewMolfile);
                }

            }
            //console.log('setJSMEPreferences', prefs);
            API.doAction('setJSMEPreferences', prefs)
        }

        setExpandedHydrogens(force) {
            if (force === undefined) {
                this.expandedHydrogens = !this.expandedHydrogens;
            } else {
                this.expandedHydrogens = force;
            }
            //console.log("Expanded hydrogens: "+this.expandedHydrogens);
            if (this.expandedHydrogens) {
                API.createData("viewMolfileExpandedH", this.viewMolfileExpandedH);
                this.toggleJSMEEdition(false, true);
            } else {
                API.createData("viewMolfile", this.viewMolfile);
            }
        }

        updateMolfiles() {
            // prevent the loop by checking actelionID
            var molecule = OCLE.Molecule.fromMolfile(this.molfile);
            this.viewMolfile = molecule.toVisualizerMolfile();

            molecule.addImplicitHydrogens();
            this.viewMolfileExpandedH = molecule.toVisualizerMolfile();
            this.mf = molecule.getMolecularFormula().formula;
            this.mw = molecule.getMolecularFormula().relativeWeight;
            this.nH = molecule.getNumberOfAtoms('H');
        }

        updateMF() {
            UI.showNotification('Updated mf and mw', 'info');
            this.sample.$content.general.molfile = this.molfile;
            this.sample.$content.general.mf = this.mf;
            this.sample.$content.general.mw = this.mw;
        }
    }
    return ExpandableMolecule;
});
