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

mpgSoftware.dynamicUi.depictGenePvalue = (function () {
    "use strict";



    const prepareDataForApiCall = function ( objectWithDataToPrepare ) {
        var phenotype = objectWithDataToPrepare.getAccumulatorObject("phenotype", objectWithDataToPrepare.baseDomElement);
        var dataForCall = _.map(objectWithDataToPrepare.getAccumulatorObject(objectWithDataToPrepare.nameOfAccumulatorFieldWithIndex,
            objectWithDataToPrepare.baseDomElement), function (o) {
            return {
                gene: o.name,
                phenotype: phenotype
            }
        });
        return dataForCall;
    };



    /***
     * 1) a function to process records
     * @param data
     * @param rawGeneAssociationRecords
     * @returns {*}
     */
    var processRecordsFromDepictGenePvalue = function (data, rawGeneAssociationRecords) {
        var dataArrayToProcess = [];
        if ( typeof data !== 'undefined'){
            _.forEach(data,function(oneRec){
                dataArrayToProcess = {
                    gene: oneRec.gene,
                    tissues: [{
                        gene: oneRec.gene,
                        value: oneRec.pvalue
                    }]
                };
            });
        }
        rawGeneAssociationRecords.push(dataArrayToProcess);
    };


    /***
     *  2) a function to display the processed records
     * @param idForTheTargetDiv
     * @param objectContainingRetrievedRecords
     */
    var displayGenesFromDepict = function (idForTheTargetDiv, objectContainingRetrievedRecords, callingParameters) {

        mpgSoftware.dynamicUi.displayForGeneTable(callingParameters.placeToDisplayData, // which table are we adding to
            callingParameters,
            '', // we may wish to pull out one record for summary purposes
            function(records,tissueTranslations){
                return _.map(_.sortBy(records,['value']),function(tissueRecord){
                    return {    value:UTILS.realNumberFormatter(''+tissueRecord.value),
                        numericalValue:tissueRecord.value,
                        dataset: tissueRecord.dataset };
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

    let sortUtility = new mpgSoftware.dynamicUi.SortUtility();
    const sortRoutine = Object.getPrototypeOf(sortUtility).numericalComparisonWithEmptiesAtBottom;


// public routines are declared below
    return {
        prepareDataForApiCall:prepareDataForApiCall,
        processRecordsFromDepictGenePvalue: processRecordsFromDepictGenePvalue,
        displayGenesFromDepict:displayGenesFromDepict,
        sortRoutine:sortRoutine
    }
}());



