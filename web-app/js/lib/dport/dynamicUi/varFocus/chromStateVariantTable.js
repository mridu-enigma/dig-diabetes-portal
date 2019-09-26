var mpgSoftware = mpgSoftware || {};  // encapsulating variable
mpgSoftware.dynamicUi = mpgSoftware.dynamicUi || {};   // second level encapsulating variable

mpgSoftware.dynamicUi.chromStateVariantTable = (function () {
    "use strict";


    /***
     * 1) a function to process records
     * @param data
     * @param rawGeneAssociationRecords
     * @returns {*}
     */
    var processRecordsFromChromState = function (data, arrayOfRecords, callingParameters) {
        // We want to come away with a list so that for each variant we know all of that tissues it contains
        if (( typeof data !== 'undefined')&&
            ( typeof data.data !== 'undefined')){
            arrayOfRecords.splice(0,arrayOfRecords.length);
            // first go through and take all of our variants and find their position. Commit this to an array.
            const nameList = mpgSoftware.dynamicUi.getAccumulatorObject(callingParameters.nameOfAccumulatorFieldWithIndex)[0].data;
            const varIdsAndPositions = _.map(nameList,
                                            function (varId){
                                                const varIdElements =  varId.var_id.split("_");
                                                let varIdPosition = 0;
                                                if (varIdElements.length>2){
                                                    varIdPosition = parseInt(varIdElements[1]);
                                                }
                                                return {name:varId.var_id,position:varIdPosition,arrayOfRecords:[]}
                                            });
            // Now let's go through each tissue, and figure out the mapping to each variant
            var uniqueAnnotations = _.map(_.groupBy(data.data, function (o) { return o.annotation }),
                                                    function(value,key) {return key});
            var recordsGroupedByTissueId = _.groupBy(data.data, function (o) { return o.tissue_id });
            let tissues = [];
            _.forEach(recordsGroupedByTissueId, function (value,key) {
                tissues.push(key);
                var allRecordsForOneVariety = {name:key,arrayOfRecords:value};
                _.forEach(allRecordsForOneVariety.arrayOfRecords, function (overlap) {
                    _.forEach(varIdsAndPositions, function (varIds) {
                        if ((overlap.start<=varIds.position) &&
                            (overlap.end>=varIds.position)) {
                            varIds.arrayOfRecords.push (overlap);
                        }
                    });

                });

            });
            arrayOfRecords.push({header:{   uniqueAnnotations:uniqueAnnotations,
                                            uniqueTissues:tissues
                                        },
                                data:varIdsAndPositions});

        }
        return arrayOfRecords;
    };



    var createSingleChromStateCell = function (recordsPerTissue,dataAnnotationType) {
        var significanceValue = 0;
        var returnValue = {};
        if (( typeof recordsPerTissue !== 'undefined')&&
            (recordsPerTissue.length>0)){
            var mostSignificantRecord=recordsPerTissue[0];

            significanceValue = mostSignificantRecord.value;
            returnValue['significanceValue'] = significanceValue;
            returnValue['significanceCellPresentationString'] = Mustache.render($('#'+dataAnnotationType.dataAnnotation.significanceCellPresentationStringWriter)[0].innerHTML,
                {significanceValue:significanceValue,
                    recordsPerTissue:recordsPerTissue,
                    significanceValueAsString:UTILS.realNumberFormatter(""+significanceValue),
                    recordDescription:mostSignificantRecord.tissue,
                    numberRecords:recordsPerTissue.length});
        }
        return returnValue;
    };




    /***
     *  2) a function to display the processed records
     * @param idForTheTargetDiv
     * @param objectContainingRetrievedRecords
     */
    var displayTissueInformationFromChromState = function (idForTheTargetDiv, objectContainingRetrievedRecords, callingParameters ) {

        mpgSoftware.dynamicUi.displayForVariantTable(idForTheTargetDiv, // which table are we adding to
            callingParameters.code, // Which codename from dataAnnotationTypes in geneSignalSummary are we referencing
            callingParameters.nameOfAccumulatorField, // name of the persistent field where the data we received is stored
            callingParameters.nameOfAccumulatorFieldWithIndex,
            // insert header records as necessary into the intermediate structure, and return header names that we can match on for the columns
            function(records,tissueTranslations){
                //return _.orderBy(_.filter(records,function(o){return (o.p_value<0.05)}),['p_value'],['asc']);
                return _.orderBy(records,['SOURCE'],['asc']);
            },

            // take all the records for each row and insert them into the intermediateDataStructure
            function(tissueRecords,
                     recordsCellPresentationString,
                     significanceCellPresentationString,
                     dataAnnotationTypeCode,
                     significanceValue,
                     tissueName ){
                return {
                    tissueRecords:tissueRecords,
                    recordsExist:(tissueRecords.length>0)?[1]:[],
                    cellPresentationStringMap:{
                        'Significance':significanceCellPresentationString,
                        'Records':recordsCellPresentationString
                    },
                    dataAnnotationTypeCode:dataAnnotationTypeCode,
                    significanceValue:significanceValue,
                    tissueNameKey:( typeof tissueName !== 'undefined')?tissueName.replace(/ /g,"_"):'var_name_missing',
                    tissueName:tissueName,
                    tissuesFilteredByAnnotation:tissueRecords};

            },
            createSingleChromStateCell
        )

    };



    /***
     *  3) set of categorizor routines
     * @type {Categorizor}
     */
    var categorizor = new mpgSoftware.dynamicUi.Categorizor();
    categorizor.categorizeSignificanceNumbers = Object.getPrototypeOf(categorizor).genePValueSignificance;




// public routines are declared below
    return {
        processRecordsFromChromState: processRecordsFromChromState,
        displayTissueInformationFromChromState:displayTissueInformationFromChromState
    }
}());