/***
 * the DEPICT data pertaining to gene sets
 *
 * The following externally visible functions are required:
 *         1) a function to process records
 *         2) a function to display the processed records
 * As well, always create a 'new mpgSoftware.dynamicUi.Categorizor()' as a means of building a
 *         3) set of categorizor routines
 * and try to use its prototype functions.  If you like, you can always override the definitions for:
 *          categorizeTissueNumbers
 *           categorizeSignificanceNumbers
 * @type {*|{}}
 */
var mpgSoftware = mpgSoftware || {};  // encapsulating variable
mpgSoftware.dynamicUi = mpgSoftware.dynamicUi || {};   // second level encapsulating variable

mpgSoftware.dynamicUi.depictGeneSets = (function () {
    "use strict";


    /***
     * 1) a function to process records
     * @param data
     * @param rawGeneAssociationRecords
     * @returns {*}
     */
    var processRecordsFromDepictGeneSet = function (data, rawGeneAssociationRecords) {
        var dataArrayToProcess = [];
        if ( typeof data !== 'undefined'){
            dataArrayToProcess = {  gene:data.gene,
                                    tissues:_.map(data.data,function(oneRec){
                                        return {
                                            gene:oneRec.gene,
                                            gene_list:oneRec.gene_list,
                                            pathway_description:oneRec.pathway_description,
                                            pathway_id:oneRec.pathway_id,
                                            tissue:oneRec.pathway_id,
                                            value:oneRec.pvalue
                                        };
                                    })
            };
        }
        rawGeneAssociationRecords.push(dataArrayToProcess);
        return rawGeneAssociationRecords;
    };


    /***
     *  2) a function to display the processed records
     * @param idForTheTargetDiv
     * @param objectContainingRetrievedRecords
     */
    var displayGeneSetFromDepict = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        mpgSoftware.dynamicUi.displayForGeneTable('table.combinedGeneTableHolder', // which table are we adding to
            'DEP_GS', // Which codename from dataAnnotationTypes in geneSignalSummary are we referencing
            'depictGeneSetInfo', // name of the persistent field where the data we received is stored
            '', // we may wish to pull out one record for summary purposes
            function(records,tissueTranslations){
                return _.map(_.sortBy(records,['pvalue']),function(oneRecord){
                    return {    pathway_description:  oneRecord.pathway_description,
                        gene_list: oneRecord.gene_list,
                        pathway_id: oneRecord.pathway_id.includes(":")?
                            oneRecord.pathway_id.split(":")[1]:oneRecord.pathway_id,
                        value: UTILS.realNumberFormatter(""+oneRecord.value),
                        tissue: oneRecord.tissue,
                        numericalValue: oneRecord.value };
                });

            },
            function(records, // all records
                     recordsCellPresentationString,// record count cell text
                     significanceCellPresentationString,// significance cell text
                     dataAnnotationTypeCode,// driving code
                     significanceValue,
                     gene ){ // value of significance for sorting
                return {  numberOfRecords:records.length,
                    cellPresentationStringMap:{ Records:recordsCellPresentationString,
                        Significance:significanceCellPresentationString },
                    recordsExist:(records.length)?[1]:[],
                    gene:gene,
                    tissueCategoryNumber:categorizor.categorizeTissueNumbers( records.length ),
                    significanceCategoryNumber:categorizor.categorizeSignificanceNumbers( significanceValue ),
                    significanceValue:significanceValue,
                    data:records
                }
            } );

    };



    /***
     *  3) set of categorizor routines
     * @type {Categorizor}
     */
    var categorizor = new mpgSoftware.dynamicUi.Categorizor();
    categorizor.categorizeSignificanceNumbers = Object.getPrototypeOf(categorizor).genePValueSignificance;




// public routines are declared below
    return {
        processRecordsFromDepictGeneSet: processRecordsFromDepictGeneSet,
        displayGeneSetFromDepict:displayGeneSetFromDepict
    }
}());



