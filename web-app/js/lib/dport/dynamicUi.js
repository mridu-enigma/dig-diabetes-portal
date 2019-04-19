var mpgSoftware = mpgSoftware || {};

/***
 * Rules:
 *   setAccumulatorObject should be done within processRecordXXX
 *   resetAccumulatorObject should be done within modifyScreenFields
 *
 *   challenge: sometimes one Ajax call must proceed another.  How to organize this in an elegant way?
 *      Each call might have dependencies in the accumulatorObject.
 *      Each call might set one or more fields in the accumulator object.
 *
 *
 * @type {{installDirectorButtonsOnTabs, modifyScreenFields, adjustLowerExtent, adjustUpperExtent}}
 */

(function( factory ){
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( ['jquery', 'datatables.net'], function ( $ ) {
            return factory( $, window, document );
        } );
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        module.exports = function (root, $) {
            if ( ! root ) {
                root = window;
            }

            if ( ! $ || ! $.fn.dataTable ) {
                $ = require('datatables.net')(root, $).$;
            }

            return factory( $, root, root.document );
        };
    }
    else {
        // Browser
        factory( jQuery, window, document );
    }
}(function( $, window, document, undefined ) {
    'use strict';

// Unique value allowing multiple absolute ordering use cases on a single page.
    var _unique = 0;

// Function to encapsulate code that is common to both the string and number
// ordering plug-ins.
    var _setup = function ( values ) {
        if ( ! $.isArray( values ) ) {
            values = [ values ];
        }

        var o = {
            name: 'absoluteOrder'+(_unique++),
            alwaysTop: {},
            alwaysBottom: {}
        };

        // In order to provide performance, the symbols that are to be looked for
        // are stored as parameter keys in an object, allowing O(1) lookup, rather
        // than O(n) if it were in an array.
        for ( var i=0, ien=values.length ; i<ien ; i++ ) {
            var conf = values[i];

            if ( typeof conf === 'string' ) {
                o.alwaysTop[ conf ] = true;
            }
            else if ( conf.position === undefined || conf.position === 'top' ) {
                o.alwaysTop[ conf.value ] = true;
            }
            else {
                o.alwaysBottom[ conf.value ] = true;
            }
        }

        // Ascending ordering method
        o.asc = function ( a, b, isNumber ) {
            if ( o.alwaysTop[ a ] && o.alwaysTop[ b ] ) {
                return 0;
            }
            else if ( o.alwaysBottom[ a ] && o.alwaysBottom[ b ] ) {
                return 0;
            }
            else if ( o.alwaysTop[ a ] || o.alwaysBottom[ b ] ) {
                return -1;
            }
            else if ( o.alwaysBottom[ a ] || o.alwaysTop[ b ] ) {
                return 1;
            }

            if ( isNumber ) {
                // Cast as a number if required
                if ( typeof a === 'string' ) {
                    a = a.replace(/[^\d\-\.]/g, '') * 1;
                }
                if ( typeof b === 'string' ) {
                    b = b.replace(/[^\d\-\.]/g, '') * 1;
                }
            }

            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        };

        // Descending ordering method
        o.desc = function ( a, b, isNumber ) {
            if ( o.alwaysTop[ a ] && o.alwaysTop[ b ] ) {
                return 0;
            }
            else if ( o.alwaysBottom[ a ] && o.alwaysBottom[ b ] ) {
                return 0;
            }
            else if ( o.alwaysTop[ a ] || o.alwaysBottom[ b ] ) {
                return -1;
            }
            else if ( o.alwaysBottom[ a ] || o.alwaysTop[ b ] ) {
                return 1;
            }

            if ( isNumber ) {
                if ( typeof a === 'string' ) {
                    a = a.replace(/[^\d\-\.]/g, '') * 1;
                }
                if ( typeof b === 'string' ) {
                    b = b.replace(/[^\d\-\.]/g, '') * 1;
                }
            }

            return ((a < b) ? 1 : ((a > b) ? -1 : 0));
        };

        return o;
    };

// String based ordering
    $.fn.dataTable.absoluteOrder = function ( values ) {
        var conf = _setup( values );

        $.fn.dataTable.ext.type.order[ conf.name+'-asc' ] = conf.asc;
        $.fn.dataTable.ext.type.order[ conf.name+'-desc' ] = conf.desc;

        // Return the name of the sorting plug-in that was created so it can be used
        // with the `columns.type` parameter. There is no auto-detection here.
        return conf.name;
    };

// Number based ordering - strips out everything but the number information
    $.fn.dataTable.absoluteOrderNumber = function ( values ) {
        var conf = _setup( values );

        $.fn.dataTable.ext.type.order[ conf.name+'-asc' ] = function ( a, b ) {
            return conf.asc( a, b, true );
        };
        $.fn.dataTable.ext.type.order[ conf.name+'-desc' ] = function ( a, b ) {
            return conf.desc( a, b, true );
        };

        return conf.name;
    };


}));


var mpgSoftware = mpgSoftware || {};  // encapsulating variable
mpgSoftware.dynamicUi = (function () {
    var loading = $('#rSpinner');
    var commonTable;
    var dyanamicUiVariables;
    var clearBeforeStarting = false;

    var CELL_COLORING_BLUISH_TOP = '#1240FE';
    var CELL_COLORING_BLUISH_TOP_MINUS1 = '#3D63FF';
    var CELL_COLORING_BLUISH_TOP_MINUS2 = '#6482FE';
    var CELL_COLORING_BLUISH_TOP_MINUS3 = '#91A6FE';
    var CELL_COLORING_BLUISH_TOP_MINUS4 = '#CCD6FE';
    var CELL_COLORING_BLUISH_BOTTOM = '#eeeeee';

    var CELL_COLORING_REDDISH_TOP = '#FE2F06';
    var CELL_COLORING_REDDISH_TOP_MINUS1 = '#FE5E3D';
    var CELL_COLORING_REDDISH_TOP_MINUS2 = '#FE8870';
    var CELL_COLORING_REDDISH_TOP_MINUS3 = '#FFAC9C';
    var CELL_COLORING_REDDISH_TOP_MINUS4 = '#FFCEC4';
    var CELL_COLORING_REDDISH_BOTTOM = '#eeeeee';

    var CELL_COLORING_UNUSED = '#FFFFFF';


    var matrixMath = (function(){

        var Matrix = function(dataArray,numberOfRows,numberOfColumns){
            if (( typeof dataArray === 'undefined') ||
                (!$.isArray(dataArray))||
                (dataArray.length<1)){
                alert(" No data array to work with")
            } else if ((dataArray.length % numberOfColumns) !== 0) {  // sanity check 1
                alert(" CRITICAL ERROR in matrix constructor.  Consistency check (dataArray.length % numberOfColumns) === 0) has failed.")
            } else if ((dataArray.length % numberOfRows) !== 0) {  // sanity check 2
                console.log(" CRITICAL ERROR in matrix constructor.  Consistency check (dataArray.length % numberOfRows) === 0) has failed.")
            }
            return {
                dataArray:dataArray,
                numberOfRows:numberOfRows,
                numberOfColumns:numberOfColumns
            }
        };

        var getElement = function(matrix,row,column){
            return matrix.dataArray[(row*matrix.numberOfColumns)+column];
        };
        var setElement = function(matrix,row,column,element){
            matrix.dataArray[(row*matrix.numberOfColumns)+column]=element;
        };


        var buildArrayOfZeros = function(numberOfRows,numberOfColumns){
            var dataArray = Array.apply(null, Array(numberOfRows*numberOfColumns)).map(function(){return 0});
            return new Matrix(dataArray,numberOfRows,numberOfColumns);
        };

        /***
         * We are building an identity matrix, except swapping column A and B
         * @param matrix
         * @param colA
         * @param colB
         */
        var buildMatrixToSwapColumns  = function(matrix,colA,colB){
            if ((colA>=matrix.numberOfColumns) || (colB>=matrix.numberOfColumns)){
                alert("buildMatrixToSwapColumns problem with number of columns requested.")
            }
            _.times(matrix.numberOfColumns,function(column){
                if (column===colA){
                    setElement (matrix,column,colB,1);
                } else if (column===colB){
                    setElement (matrix,column,colA,1);
                } else {
                    setElement (matrix,column,column,1);
                }
            });
            return matrix;
        };


        var getRowFromMatrix = function(matrix,rowNumber){
            return _.slice(matrix.dataArray,rowNumber*matrix.numberOfColumns,(1+rowNumber)*matrix.numberOfColumns);
        };

        var getColumnFromMatrix = function(matrix,columnNumber){
            var column = [];
            _.times(matrix.numberOfRows,function(rowNumber){
                column.push(getElement(matrix,rowNumber,columnNumber));
            });
            return column;
        };


        var innerProduct = function (vectorA, vectorB){
            //  we're going to assume that these are the same length
            var sum = 0;
            _.times(vectorA.length,function(elementIndex){
                sum += (vectorA[elementIndex]*vectorB[elementIndex]);
            });
            return sum;
        }

        var binaryInnerProduct = function (vectorA, vectorB){
            //  we're going to assume that these are the same length
            //  Now we are assuming that vectorB contains all zeros, except for exactly one element == 1.
            //  The location of the nonzero element in the vector therefore determines which element of vectorA is returned
            var returnValue = "";
            _.times(vectorA.length,function(elementIndex){
                if  (vectorB[elementIndex]===1){
                    returnValue = vectorA[elementIndex];
                }
            });
            return returnValue;
        }



        var multiplyMatrices = function(matrixA,matrixB){
            var returnValue = buildArrayOfZeros(matrixA.numberOfRows,matrixB.numberOfColumns);
            _.times(matrixA.numberOfRows,function(rowNumber){
                var rowVector = getRowFromMatrix(matrixA,rowNumber);
                _.times(matrixB.numberOfColumns,function(columnNumber){
                    var columnVector = getColumnFromMatrix(matrixB,columnNumber);
                    setElement(returnValue,rowNumber,columnNumber,binaryInnerProduct(rowVector,columnVector));
                });
            });
            return returnValue;
        }

        var swapColumnsInDataStructure = function(dataArray,numberOfRows,numberOfColumns,colA,colB){
            var matrixToManipulate = new Matrix(dataArray,numberOfRows,numberOfColumns);
            var multiplierMatrix = buildMatrixToSwapColumns (buildArrayOfZeros(numberOfColumns,numberOfColumns),colA,colB);
            return multiplyMatrices(matrixToManipulate,multiplierMatrix).dataArray;
        };

        return {
            swapColumnsInDataStructure:swapColumnsInDataStructure
        }
    }());






    var getDatatypeInformation = function( dataTypeCode ) {
        var returnValue = {};
        var additionalParameters = getDyanamicUiVariables();
        var index = _.findIndex( additionalParameters.dataAnnotationTypes, { 'code' : dataTypeCode } );
        if ( index === -1 ) {
            alert(' ERROR: fielding request for dataTypeCode='+dataTypeCode+', which does not exist.')
        } else {
            returnValue = { index: index,
                            dataAnnotation: additionalParameters.dataAnnotationTypes[index] };
        }
        return returnValue;
    }



    var setDyanamicUiVariables = function (incomingDyanamicUiVariables) {
        dyanamicUiVariables = incomingDyanamicUiVariables;
    };

    var getDyanamicUiVariables = function () {
        return dyanamicUiVariables;
    };


    var actionDefaultFollowUp = function (actionId) {
        var defaultFollowUp = {
            displayRefinedContextFunction: undefined,
            placeToDisplayData: undefined,
            actionId: undefined
        };
        switch (actionId) {

            case "getTissuesFromProximityForLocusContext":
                defaultFollowUp.displayRefinedContextFunction = displayRefinedGenesInARange;
                defaultFollowUp.placeToDisplayData = '#dynamicGeneHolder div.dynamicUiHolder';
                break;

            case "getTissuesFromEqtlsForTissuesTable":
                defaultFollowUp.displayRefinedContextFunction = displayGenesPerTissueFromEqtl;
                defaultFollowUp.placeToDisplayData = '#dynamicTissueHolder div.dynamicUiHolder';
                break;

            case "getTissuesFromEqtlsForGenesTable":
                defaultFollowUp.displayRefinedContextFunction = displayTissuesPerGeneFromEqtl;
                defaultFollowUp.placeToDisplayData = '#dynamicTissueHolder div.dynamicUiHolder';
                break;

            case "getVariantsFromQtlForContextDescription":
                defaultFollowUp.displayRefinedContextFunction = displayVariantRecordsFromVariantQtlSearch;
                defaultFollowUp.placeToDisplayData = '#dynamicVariantHolder div.dynamicUiHolder';
                break;

            case "getPhenotypesFromQtlForPhenotypeTable":
                defaultFollowUp.displayRefinedContextFunction = displayPhenotypeRecordsFromVariantQtlSearch;
                defaultFollowUp.placeToDisplayData = '#dynamicPhenotypeHolder div.dynamicUiHolder';
                break;

            case "getPhenotypesFromECaviarForPhenotypeTable":
                defaultFollowUp.displayRefinedContextFunction = displayPhenotypesFromColocalization;
                defaultFollowUp.placeToDisplayData = '#dynamicPhenotypeHolder div.dynamicUiHolder';
                break;

            case "getPhenotypesFromECaviarForTissueTable":
                defaultFollowUp.displayRefinedContextFunction = displayTissuesFromColocalization;
                defaultFollowUp.placeToDisplayData = '#dynamicPhenotypeHolder div.dynamicUiHolder';
                break;

            case "getRecordsFromECaviarForGeneTable":
                defaultFollowUp.displayRefinedContextFunction = displayGenesFromECaviar;
                defaultFollowUp.placeToDisplayData = '#dynamicPhenotypeHolder div.dynamicUiHolder';
                break;

            case "getRecordsFromColocForGeneTable":
                defaultFollowUp.displayRefinedContextFunction = displayGenesFromColoc;
                defaultFollowUp.placeToDisplayData = '#dynamicPhenotypeHolder div.dynamicUiHolder';
                break;

            case "getAnnotationsFromModForGenesTable":
                defaultFollowUp.displayRefinedContextFunction = displayRefinedModContext;
                defaultFollowUp.placeToDisplayData = '#dynamicPhenotypeHolder div.dynamicUiHolder';
                break;

            case "replaceGeneContext":
                defaultFollowUp.displayRefinedContextFunction = displayRangeContext;
                defaultFollowUp.placeToDisplayData = '#contextDescription';
                break;

            case "getTissuesFromAbcForGenesTable":
                defaultFollowUp.displayRefinedContextFunction = displayGenesFromAbc;
                defaultFollowUp.placeToDisplayData = '#dynamicGeneHolder div.dynamicUiHolder';
                break;

            case "getGeneAssociationsForGenesTable":
                defaultFollowUp.displayRefinedContextFunction = displayGenePhenotypeAssociations;
                defaultFollowUp.placeToDisplayData = '#dynamicGeneHolder div.dynamicUiHolder';
                break;

            case "getSkatGeneAssociationsForGeneTable":
                defaultFollowUp.displayRefinedContextFunction = displayGeneSkatAssociationsForGeneTable;
                defaultFollowUp.placeToDisplayData = '#dynamicGeneHolder div.dynamicUiHolder';
                break;

            case "getFirthGeneAssociationsForGeneTable":
                defaultFollowUp.displayRefinedContextFunction = displayGeneFirthAssociationsForGeneTable;
                defaultFollowUp.placeToDisplayData = '#dynamicGeneHolder div.dynamicUiHolder';
                break;

            case "getInformationFromDepictForGenesTable":
                defaultFollowUp.displayRefinedContextFunction = displayGenesFromDepict;
                defaultFollowUp.placeToDisplayData = '#dynamicGeneHolder div.dynamicUiHolder';
                break;

            case "getDepictGeneSetForGenesTable":
                defaultFollowUp.displayRefinedContextFunction = displayGeneSetFromDepict;
                defaultFollowUp.placeToDisplayData = '#dynamicGeneHolder div.dynamicUiHolder';
                break;

            case "getRecordsFromAbcForTissueTable":
                defaultFollowUp.displayRefinedContextFunction = displayTissuesFromAbc;
                defaultFollowUp.placeToDisplayData = '#dynamicTissueHolder div.dynamicUiHolder';
                break;

            case "getVariantsWeWillUseToBuildTheVariantTable":
                defaultFollowUp.displayRefinedContextFunction = displayVariantsForAPhenotype;
                defaultFollowUp.placeToDisplayData = '#dynamicVariantHolder div.dynamicUiHolder';
                break;

            case "getEqtlsGivenVariantList":
                defaultFollowUp.displayRefinedContextFunction = displayEqtlsGivenVariantList;
                defaultFollowUp.placeToDisplayData = '#dynamicVariantHolder div.dynamicUiHolder';
                break;

            case "getABCGivenVariantList":
                defaultFollowUp.displayRefinedContextFunction = displayAbcGivenVariantList;
                defaultFollowUp.placeToDisplayData = '#dynamicVariantHolder div.dynamicUiHolder';
                break;

            case "getDnaseGivenVariantList":
                defaultFollowUp.displayRefinedContextFunction = displayDnaseGivenVariantList;
                defaultFollowUp.placeToDisplayData = '#dynamicVariantHolder div.dynamicUiHolder';
                break;
            case "getH3k27acGivenVariantList":
                defaultFollowUp.displayRefinedContextFunction = displayH3k27acGivenVariantList;
                defaultFollowUp.placeToDisplayData = '#dynamicVariantHolder div.dynamicUiHolder';
                break;

            default:
                break;
        }
        return defaultFollowUp;
    }


    var actionContainer = function (actionId, followUp) {
        var additionalParameters = getDyanamicUiVariables();
        var displayFunction = ( typeof followUp.displayRefinedContextFunction !== 'undefined') ? followUp.displayRefinedContextFunction : undefined;
        var displayLocation = ( typeof followUp.placeToDisplayData !== 'undefined') ? followUp.placeToDisplayData : undefined;
        var nextActionId = ( typeof followUp.actionId !== 'undefined') ? followUp.actionId : undefined;

        var functionToLaunchDataRetrieval;

        switch (actionId) {

            case "getTissuesFromProximityForLocusContext":
                functionToLaunchDataRetrieval = function () {
                    var chromosome = getAccumulatorObject("chromosome");
                    var startPos = getAccumulatorObject("extentBegin");
                    var endPos = getAccumulatorObject("extentEnd");
                    retrieveRemotedContextInformation(buildRemoteContextArray({
                        name: "getTissuesFromProximityForLocusContext",
                        retrieveDataUrl: additionalParameters.retrieveListOfGenesInARangeUrl,
                        dataForCall: {
                            chromosome: chromosome,
                            startPos: startPos,
                            endPos: endPos
                        },
                        processEachRecord: processRecordsFromProximitySearch,
                        displayRefinedContextFunction: displayFunction,
                        placeToDisplayData: displayLocation,
                        actionId: nextActionId
                    }));
                };
                break;

            case "getTissuesFromEqtlsForTissuesTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getTissuesFromEqtlsForTissuesTable"});
                        actionToUndertake();
                    } else {
                        resetAccumulatorObject("tissueNameArray");
                        resetAccumulatorObject("tissuesForEveryGene");
                        resetAccumulatorObject("genesForEveryTissue");
                        var geneNameArray = _.map(getAccumulatorObject("geneInfoArray"), function (o) {
                            return {gene: o.name}
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getTissuesFromEqtlsForTissuesTable",
                            retrieveDataUrl: additionalParameters.retrieveEqtlDataUrl,
                            dataForCall: geneNameArray,
                            processEachRecord: processRecordsFromEqtls,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                }
                break;

            case "getTissuesFromEqtlsForGenesTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getTissuesFromEqtlsForGenesTable"});
                        actionToUndertake();
                    } else {
                        resetAccumulatorObject("tissueNameArray");
                        resetAccumulatorObject("genesForEveryTissue");
                        resetAccumulatorObject("tissuesForEveryGene");
                        var geneNameArray = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {gene: o.name}
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getTissuesFromEqtlsForGenesTable",
                            retrieveDataUrl: additionalParameters.retrieveEqtlDataUrl,
                            dataForCall: geneNameArray,
                            processEachRecord: processRecordsFromEqtls,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;

            case "getGeneAssociationsForGenesTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getGeneAssociationsForGenesTable"});
                        actionToUndertake();
                    } else {
                        var phenotype = $('li.chosenPhenotype').attr('id');
                        var dataForCall = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {
                                gene: o.name,
                                phenotype: phenotype,
                                propertyNames: "[\"P_VALUE\"]"
                            }
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getGeneAssociationsForGenesTable",
                            retrieveDataUrl: additionalParameters.retrieveGeneLevelAssociationsUrl,
                            dataForCall: dataForCall,
                            processEachRecord: mpgSoftware.dynamicUi.metaXcan.processMetaXcanRecords,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId,
                            nameOfAccumulatorField:'rawGeneAssociationRecords'
                        }));
                    }
                };
                break;

            case "getSkatGeneAssociationsForGeneTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getSkatGeneAssociationsForGeneTable"});
                        actionToUndertake();
                    } else {
                        var phenotype = $('li.chosenPhenotype').attr('id');
                        var dataForCall = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {
                                gene: o.name,
                                phenotype: phenotype,
                                propertyNames: "[\"P_VALUE\"]",
                                preferredSampleGroup: "ExSeq_52k_mdv37"
                            }
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getSkatGeneAssociationsForGeneTable",
                            retrieveDataUrl: additionalParameters.retrieveGeneLevelAssociationsUrl,
                            dataForCall: dataForCall,
                            processEachRecord: mpgSoftware.dynamicUi.geneBurdenSkat.processGeneSkatAssociationRecords,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId,
                            nameOfAccumulatorField:'rawGeneSkatRecords'
                        }));
                    }
                };
                break;


            case "getFirthGeneAssociationsForGeneTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getFirthGeneAssociationsForGeneTable"});
                        actionToUndertake();
                    } else {
                        var phenotype = $('li.chosenPhenotype').attr('id');
                        var dataForCall = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {
                                gene: o.name,
                                phenotype: phenotype,
                                propertyNames: "[\"P_VALUE\"]",
                                preferredSampleGroup: "ExSeq_52k_mdv37"
                            }
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getFirthGeneAssociationsForGeneTable",
                            retrieveDataUrl: additionalParameters.retrieveGeneLevelAssociationsUrl,
                            dataForCall: dataForCall,
                            processEachRecord: mpgSoftware.dynamicUi.geneBurdenFirth.processGeneFirthAssociationRecords,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId,
                            nameOfAccumulatorField:'rawGeneFirthRecords'
                        }));
                    }
                };
                break;



            case "getVariantsFromQtlForContextDescription":
                functionToLaunchDataRetrieval = function () {
                    var chromosome = getAccumulatorObject("chromosome");
                    var startPos = getAccumulatorObject("extentBegin");
                    var endPos = getAccumulatorObject("extentEnd");
                    resetAccumulatorObject("phenotypesForEveryVariant");
                    resetAccumulatorObject("variantsForEveryPhenotype");
                    retrieveRemotedContextInformation(buildRemoteContextArray({
                        name: "getVariantsFromQtlForContextDescription",
                        retrieveDataUrl: additionalParameters.retrieveVariantsWithQtlRelationshipsUrl,
                        dataForCall: {
                            chromosome: chromosome,
                            startPos: startPos,
                            endPos: endPos
                        },
                        processEachRecord: processRecordsFromVariantQtlSearch,
                        displayRefinedContextFunction: displayFunction,
                        placeToDisplayData: displayLocation,
                        actionId: nextActionId
                    }));
                };
                break;

            case "getPhenotypesFromQtlForPhenotypeTable":
                functionToLaunchDataRetrieval = function () {
                    var chromosome = getAccumulatorObject("chromosome");
                    var startPos = getAccumulatorObject("extentBegin");
                    var endPos = getAccumulatorObject("extentEnd");
                    resetAccumulatorObject("phenotypesForEveryVariant");
                    resetAccumulatorObject("variantsForEveryPhenotype");
                    retrieveRemotedContextInformation(buildRemoteContextArray({
                        name: "getPhenotypesFromQtlForPhenotypeTable",
                        retrieveDataUrl: additionalParameters.retrieveVariantsWithQtlRelationshipsUrl,
                        dataForCall: {
                            chromosome: chromosome,
                            startPos: startPos,
                            endPos: endPos
                        },
                        processEachRecord: processRecordsFromVariantQtlSearch,
                        displayRefinedContextFunction: displayFunction,
                        placeToDisplayData: displayLocation,
                        actionId: nextActionId
                    }));
                };
                break;


            case "getPhenotypesFromECaviarForPhenotypeTable":
                functionToLaunchDataRetrieval = function () {
                    var chromosome = getAccumulatorObject("chromosome");
                    var startPos = getAccumulatorObject("extentBegin");
                    var endPos = getAccumulatorObject("extentEnd");
                    var geneNameArray = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                        return {gene: o.name}
                    });
                    retrieveRemotedContextInformation(buildRemoteContextArray({
                        name: "getPhenotypesFromECaviarForPhenotypeTable",
                        retrieveDataUrl: additionalParameters.retrieveECaviarDataUrl,
                        dataForCall: geneNameArray,
                        processEachRecord: processRecordsFromECaviar,//TODO
                        displayRefinedContextFunction: displayFunction,
                        placeToDisplayData: displayLocation,
                        actionId: nextActionId
                    }));
                };
                break;

            case "getPhenotypesFromECaviarForTissueTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getPhenotypesFromECaviarForTissueTable"});
                        actionToUndertake();
                    } else {
                        var geneNameArray = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {gene: o.name}
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getPhenotypesFromECaviarForPhenotypeTable",
                            retrieveDataUrl: additionalParameters.retrieveECaviarDataUrl,
                            dataForCall: geneNameArray,
                            processEachRecord: processRecordsFromECaviar,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));

                    }
                };
                break;

            case "getRecordsFromECaviarForGeneTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getRecordsFromECaviarForGeneTable"});
                        actionToUndertake();
                    } else {
                        var phenotype = $('li.chosenPhenotype').attr('id');
                        var geneNameArray = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {gene: o.name,
                                phenotype:phenotype}
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getRecordsFromECaviarForGeneTable",
                            retrieveDataUrl: additionalParameters.retrieveECaviarDataUrl,
                            dataForCall: geneNameArray,
                            processEachRecord: processRecordsFromECaviar,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;

            case "getRecordsFromColocForGeneTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getRecordsFromColocForGeneTable"});
                        actionToUndertake();
                    } else {
                        var phenotype = $('li.chosenPhenotype').attr('id');
                        var geneNameArray = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {gene: o.name,
                                phenotype:phenotype}
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getRecordsFromColocForGeneTable",
                            retrieveDataUrl: additionalParameters.retrieveColocDataUrl,
                            dataForCall: geneNameArray,
                            processEachRecord: processRecordsFromColoc,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;


            case "getAnnotationsFromModForGenesTable":
                functionToLaunchDataRetrieval = function () {

                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getAnnotationsFromModForGenesTable"});
                        actionToUndertake();
                    } else {
                        var geneNameArray = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {gene: o.name}
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getAnnotationsFromModForGenesTable",
                            retrieveDataUrl: additionalParameters.retrieveModDataUrl,
                            dataForCall: geneNameArray,
                            processEachRecord: processRecordsFromMod,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;

            case "replaceGeneContext":
                functionToLaunchDataRetrieval = function () {
                    var somethingSymbol = $('#inputBoxForDynamicContextId').val();
                    somethingSymbol = somethingSymbol.replace(/\//g, "_");
                    setAccumulatorObject("geneNameArray", [{name: somethingSymbol}]);
                    retrieveRemotedContextInformation(buildRemoteContextArray({
                        name: "replaceGeneContext",
                        retrieveDataUrl: additionalParameters.geneInfoAjaxUrl,
                        dataForCall: {geneName: somethingSymbol},
                        processEachRecord: processRecordsUpdateContext,
                        displayRefinedContextFunction: displayFunction,
                        placeToDisplayData: displayLocation,
                        actionId: nextActionId
                    }));
                };
                break;

            case "getTissuesFromAbcForGenesTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getTissuesFromAbcForGenesTable"});
                        actionToUndertake();
                    } else {
                        var geneNameArray = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {gene: o.name}
                        });
                        geneNameArray = _.map(getAccumulatorObject("geneInfoArray"), function (o) {
                            return {gene: o.name}
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getTissuesFromAbcForGenesTable",
                            retrieveDataUrl: additionalParameters.retrieveAbcDataUrl,
                            dataForCall: geneNameArray,
                            processEachRecord: processRecordsFromAbc,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;

            case "getRecordsFromAbcForTissueTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getRecordsFromAbcForTissueTable"});
                        actionToUndertake();
                    } else {
                        var geneNameArray = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {gene: o.name}
                        });
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getRecordsFromAbcForTissueTable",
                            retrieveDataUrl: additionalParameters.retrieveAbcDataUrl,
                            dataForCall: geneNameArray,
                            processEachRecord: processRecordsFromAbc,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;

            case "getVariantsWeWillUseToBuildTheVariantTable":
                functionToLaunchDataRetrieval = function () {

                    var phenotype = $('li.chosenPhenotype').attr('id');
                    var chromosome = $('span.dynamicUiChromosome').text();
                    var startExtent = $('span.dynamicUiGeneExtentBegin').text();
                    var endExtent = $('span.dynamicUiGeneExtentEnd').text();
                    var dataNecessaryToRetrieveVariantsPerPhenotype;
                    if (( typeof phenotype === 'undefined') ||
                        (typeof chromosome === 'undefined') ||
                        (typeof startExtent === 'undefined') ||
                        (typeof endExtent === 'undefined')) {
                        alert(" missing a value when we want to collect variants for a phenotype");
                    } else {
                        dataNecessaryToRetrieveVariantsPerPhenotype = {
                            phenotype: phenotype,
                            geneToSummarize: "chr" + chromosome + ":" + startExtent + "-" + endExtent
                        }

                    }


                    retrieveRemotedContextInformation(buildRemoteContextArray({
                        name: "getVariantsWeWillUseToBuildTheVariantTable",
                        retrieveDataUrl: additionalParameters.retrieveTopVariantsAcrossSgsUrl,
                        dataForCall: dataNecessaryToRetrieveVariantsPerPhenotype,
                        processEachRecord: processRecordsFromQtl,
                        displayRefinedContextFunction: displayFunction,
                        placeToDisplayData: displayLocation,
                        actionId: nextActionId
                    }));

                };
                break;

            case "getEqtlsGivenVariantList":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("variantNameArray")) {
                        var actionToUndertake = actionContainer("getVariantsWeWillUseToBuildTheVariantTable", {actionId: "getEqtlsGivenVariantList"});
                        actionToUndertake();
                    } else {
                        var variantsAsJson = "[]";
                        if (getAccumulatorObject("variantNameArray").length > 0) {
                            variantsAsJson = "[\"" + getAccumulatorObject("variantNameArray").join("\",\"") + "\"]";
                        }
                        var dataForCall = {variants: variantsAsJson};
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getEqtlsGivenVariantList",
                            retrieveDataUrl: additionalParameters.retrieveEqtlDataWithVariantsUrl,
                            dataForCall: dataForCall,
                            processEachRecord: processEqtlRecordsFromVariantBasedRequest,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;
            case "getABCGivenVariantList":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("variantNameArray")) {
                        var actionToUndertake = actionContainer("getVariantsWeWillUseToBuildTheVariantTable", {actionId: "getABCGivenVariantList"});
                        actionToUndertake();
                    } else {
                        var variantsAsJson = "[]";
                        if (getAccumulatorObject("variantNameArray").length > 0) {
                            variantsAsJson = "[\"" + getAccumulatorObject("variantNameArray").join("\",\"") + "\"]";
                        }
                        var dataForCall = {variants: variantsAsJson};
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getABCGivenVariantList",
                            retrieveDataUrl: additionalParameters.retrieveAbcDataUrl,
                            dataForCall: dataForCall,
                            processEachRecord: processAbcRecordsFromVariantBasedRequest,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;
            case "getInformationFromDepictForGenesTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getInformationFromDepictForGenesTable"});
                        actionToUndertake();
                    } else {
                        var phenotype = $('li.chosenPhenotype').attr('id');
                        var dataForCall = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {
                                gene: o.name,
                                phenotype: phenotype
                            }
                        });

                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getInformationFromDepictForGenesTable",
                            retrieveDataUrl: additionalParameters.retrieveDepictDataUrl,
                            dataForCall: dataForCall,
                            processEachRecord: processRecordsFromDepict,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;

            case "getDepictGeneSetForGenesTable":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("geneNameArray")) {
                        var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", {actionId: "getDepictGeneSetForGenesTable"});
                        actionToUndertake();
                    } else {
                        var phenotype = $('li.chosenPhenotype').attr('id');
                        var dataForCall = _.map(getAccumulatorObject("geneNameArray"), function (o) {
                            return {
                                gene: o.name,
                                phenotype: phenotype
                            }
                        });

                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getDepictGeneSetForGenesTable",
                            retrieveDataUrl: additionalParameters.retrieveDepictGeneSetUrl,
                            dataForCall: dataForCall,
                            processEachRecord: mpgSoftware.dynamicUi.depictGeneSets.processRecordsFromDepictGeneSet,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId,
                            nameOfAccumulatorField:'depictGeneSetInfo'
                        }));
                    }
                };
                break;

            case "getDnaseGivenVariantList":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("variantNameArray")) {
                        var actionToUndertake = actionContainer("getVariantsWeWillUseToBuildTheVariantTable", {actionId: "getDnaseGivenVariantList"});
                        actionToUndertake();
                    } else {
                        var variantsAsJson = "[]";
                        if (getAccumulatorObject("variantNameArray").length > 0) {
                            variantsAsJson = "[\"" + getAccumulatorObject("variantNameArray").join("\",\"") + "\"]";
                        }
                        var dataForCall = {variants: variantsAsJson};
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getDnaseGivenVariantList",
                            retrieveDataUrl: additionalParameters.retrieveDnaseDataUrl,
                            dataForCall: dataForCall,
                            processEachRecord: processDnaseRecordsFromVariantBasedRequest,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;
            case "getH3k27acGivenVariantList":
                functionToLaunchDataRetrieval = function () {
                    if (accumulatorObjectFieldEmpty("variantNameArray")) {
                        var actionToUndertake = actionContainer("getVariantsWeWillUseToBuildTheVariantTable", {actionId: "getH3k27acGivenVariantList"});
                        actionToUndertake();
                    } else {
                        var variantsAsJson = "[]";
                        if (getAccumulatorObject("variantNameArray").length > 0) {
                            variantsAsJson = "[\"" + getAccumulatorObject("variantNameArray").join("\",\"") + "\"]";
                        }
                        var dataForCall = {variants: variantsAsJson};
                        retrieveRemotedContextInformation(buildRemoteContextArray({
                            name: "getH3k27acGivenVariantList",
                            retrieveDataUrl: additionalParameters.retrieveH3k27acDataUrl,
                            dataForCall: dataForCall,
                            processEachRecord: processH3k27acRecordsFromVariantBasedRequest,
                            displayRefinedContextFunction: displayFunction,
                            placeToDisplayData: displayLocation,
                            actionId: nextActionId
                        }));
                    }
                };
                break;


            default:
                break;
        }

        return functionToLaunchDataRetrieval;
    };


    /***
     *
     * @param data
     * @returns {{geneName: undefined, chromosome: undefined, extentBegin: undefined, extentEnd: undefined}}
     */
    var processRecordsUpdateContext = function (data) {
        var returnObject = {
            geneName: undefined,
            chromosome: undefined,
            extentBegin: undefined,
            extentEnd: undefined,
        };
        if (( typeof data !== 'undefined') &&
            ( typeof data.geneInfo !== 'undefined')) {
            returnObject.geneName = data.geneInfo.Gene_name;
            returnObject.chromosome = data.geneInfo.CHROM;
            returnObject.extentBegin = data.geneInfo.BEG - 1;
            returnObject.extentEnd = data.geneInfo.END + 1;
        }
        return returnObject;
    };
    var displayRangeContext = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        $(idForTheTargetDiv).empty().append(Mustache.render($('#contextDescriptionSection')[0].innerHTML,
            objectContainingRetrievedRecords
        ));
        setAccumulatorObject("extentBegin", objectContainingRetrievedRecords.extentBegin);
        setAccumulatorObject("extentEnd", objectContainingRetrievedRecords.extentEnd);
        setAccumulatorObject("chromosome", objectContainingRetrievedRecords.chromosome);
        setAccumulatorObject("originalGeneName", objectContainingRetrievedRecords.geneName);

        addAdditionalResultsObject({
            rangeContext: {
                extentBegin: objectContainingRetrievedRecords.extentBegin,
                extentEnd: objectContainingRetrievedRecords.extentEnd,
                chromosome: objectContainingRetrievedRecords.chromosome,
                geneName: objectContainingRetrievedRecords.geneName
            }
        })
    }






    var addRowHolderToIntermediateDataStructure = function (dataAnnotationTypeCode,intermediateDataStructure){
        var displayDetails = getDatatypeInformation(dataAnnotationTypeCode );
        intermediateDataStructure.rowsToAdd.push({
            code: displayDetails.dataAnnotation.code,
            category: displayDetails.dataAnnotation.category,
            displayCategory: displayDetails.dataAnnotation.displayCategory,
            subcategory: displayDetails.dataAnnotation.subcategory,
            displaySubcategory: displayDetails.dataAnnotation.displaySubcategory,
            columnCells: []
        });
    }



    /***
     * Mod annotation search
     * @param idForTheTargetDiv
     * @param objectContainingRetrievedRecords
     */
    var processRecordsFromMod = function (data) {
        var returnObject = {
            uniqueGenes: [],
            uniqueGeneDescription: [],
            uniqueMods: []
        };
        var originalGene = data.gene;
        if ( (data.records.length === 0) ||
            (data.is_error )) {
            // no mods.  add an empty record for this gene to the global structure
            var modNameArray = getAccumulatorObject("modNameArray");
            modNameArray.push({geneName: originalGene, mods: []});
            setAccumulatorObject("modNameArray", modNameArray);
            if (!returnObject.uniqueGenes.includes(originalGene)) {
                returnObject.uniqueGenes.push(originalGene);
            }
            ;
        } else {
            // we have mods for this gene. First let's save them
            _.forEach(data.records, function (oneRec) {
                if (!returnObject.uniqueGenes.includes(oneRec.Human_gene)) {
                    returnObject.uniqueGenes.push(oneRec.Human_gene);
                }

                if (!returnObject.uniqueMods.includes(oneRec.Term)) {
                    returnObject.uniqueMods.push(oneRec.Term);
                }

                if (!returnObject.uniqueGeneDescription.includes(oneRec.Name)) {
                    returnObject.uniqueGeneDescription.push(oneRec.Name);
                }

                //returnObject.rawData.push(oneRec);
            });
            // now let's add them to our global structure.  First, find any record for this gene that we might already have
            var geneIndex = _.findIndex(getAccumulatorObject("modNameArray"), {geneName: originalGene});
            if (geneIndex < 0) { // this is the only path we ever take, right
                var modNameArray = getAccumulatorObject("modNameArray");
                modNameArray.push({
                    geneName: originalGene,
                    mods: returnObject
                });
                setAccumulatorObject("modNameArray", modNameArray);
            }
        }
        return returnObject;
    };
    var displayRefinedModContext = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var dataAnnotationTypeCode = 'MOD';
        var returnObject = createNewDisplayReturnObject();
        var selectorForIidForTheTargetDiv = idForTheTargetDiv;
        $(selectorForIidForTheTargetDiv).empty();
        _.forEach(getAccumulatorObject("modNameArray"), function (geneWithMods) {
            returnObject.uniqueGenes.push({name: geneWithMods.geneName});

            var recordToDisplay = {
                mods: [],
                humanGene: geneWithMods.mods.uniqueGenes,
                geneDescription: geneWithMods.mods.uniqueGeneDescription,
                geneName: geneWithMods.geneName
            };
            _.forEach(geneWithMods.mods.uniqueMods, function (eachMod) {
                recordToDisplay.mods.push({modName: eachMod})
            });
            returnObject.geneModTerms.push(recordToDisplay);

        });

        addAdditionalResultsObject({refinedModContext: returnObject});
        var intermediateDataStructure = new IntermediateDataStructure();

        // Mod data for the gene table
        if (returnObject.genesExist()) {
            addRowHolderToIntermediateDataStructure(dataAnnotationTypeCode,intermediateDataStructure);

            // set up the headers, and give us an empty row of column cells
            var headerNames = [];
            if (accumulatorObjectFieldEmpty("geneNameArray")) {
                console.log("We always have to have a record of the current gene names in depict display. We have a problem.");
            } else {
                headerNames  = _.map(getAccumulatorObject("geneNameArray"),'name');
                _.forEach(getAccumulatorObject("geneNameArray"), function (oneRecord) {
                    intermediateDataStructure.rowsToAdd[0].columnCells.push(new IntermediateStructureDataCell(oneRecord.name,
                        {},"header",'EMC'));
                });
            }
        }
        if (( typeof returnObject.geneModTerms !== 'undefined') && ( returnObject.geneModTerms.length>0 )) {

            _.forEach(returnObject.geneModTerms, function (recordsPerGene) {
                var indexOfColumn = _.indexOf(headerNames, recordsPerGene.geneName);
                if (indexOfColumn === -1) {
                    console.log("Did not find index of recordsPerGene.geneName.  Shouldn't we?")
                } else {
                    if ((recordsPerGene.mods.length === 0)) {
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] =
                            new IntermediateStructureDataCell(recordsPerGene.geneName,
                                {}, "tissue specific",'EMC');
                    } else {
                        var modRecs = _.sortBy(recordsPerGene.mods,["modName"]);
                        var cellPresentationString = "records="+recordsPerGene.mods.length;
                        var renderData = {
                            cellPresentationStringMap:{ Records:cellPresentationString,
                                                        Significance:cellPresentationString },
                            cellPresentationString :cellPresentationString,
                            numberOfRecords:recordsPerGene.mods.length,
                            tissueCategoryNumber:categorizeTissueNumbers( recordsPerGene.mods.length ),
                            significanceCategoryNumber:categorizeSignificanceNumbers( [0], "MOD" ),//categorizeSignificanceNumbers( modRecs, "MOD" ),
                            recordsExist:(recordsPerGene.mods.length)?[1]:[],
                            geneName:recordsPerGene.geneName,
                            humanGene:recordsPerGene.humanGene,
                            geneDescription:recordsPerGene.geneDescription,
                            significanceValue:0,
                            modTerms: modRecs
                        };
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] =
                            new IntermediateStructureDataCell(recordsPerGene.geneName,
                             renderData,"tissue specific",dataAnnotationTypeCode);
                    }
                }
            });
            intermediateDataStructure.tableToUpdate = "table.combinedGeneTableHolder";
        }


        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
            '#dynamicGeneTable',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'geneTableGeneHeaders');

    };

    /***
     * The object is passed into mustache and describes the display that will be presented to users
     * @returns {{rawData: Array, uniqueGenes: Array, uniqueEqtlGenes: Array, genePositions: Array, uniqueTissues: Array, geneTissueEqtls: Array, geneModTerms: Array, genesPositionsExist: (function(): *), genesExist: (function(): *), tissuesExist: (function(): *), eqtlTissuesExist: (function(): *), eqtlGenesExist: (function(): *), geneModsExist: (function(): *)}}
     */
    var createNewDisplayReturnObject = function () {
        return {
            rawData: [],
            uniqueGenes: [],
            uniqueEqtlGenes: [],
            genePositions: [],
            uniqueTissues: [],
            uniquePhenotypes: [],
            uniqueVariants: [],
            geneTissueEqtls: [],
            variantPhenotypeQtl: [],
            phenotypeVariantQtl: [],
            geneModTerms: [],
            phenotypesByColocalization: [],
            genesByAbc: [],
            genesByDepict: [],
            tissuesByAbc: [],
            geneAssociations: [],
            variantsToAnnotate: [],
            genesPositionsExist: function () {
                return (this.genePositions.length > 0) ? [1] : [];
            },
            genesExist: function () {
                return (this.uniqueGenes.length > 0) ? [1] : [];
            },
            variantsExist: function () {
                return (this.uniqueVariants.length > 0) ? [1] : [];
            },
            phenotypesExist: function () {
                return (this.uniquePhenotypes.length > 0) ? [1] : [];
            },
            tissuesExist: function () {
                return (this.uniqueTissues.length > 0) ? [1] : [];
            },
            eqtlTissuesExist: function () {
                return (this.uniqueEqtlGenes.length > 0) ? [1] : [];
            },
            eqtlGenesExist: function () {
                return (this.geneTissueEqtls.length > 0) ? [1] : [];
            },
            geneModsExist: function () {
                return (this.geneModTerms.length > 0) ? [1] : [];
            },
            variantPhenotypesExist: function () {
                return (this.variantPhenotypeQtl.length > 0) ? [1] : [];
            },
            phenotypeVariantsExist: function () {
                return (this.phenotypeVariantQtl.length > 0) ? [1] : [];
            }

        };
    };

    /***
     * Default constructor of the shared accumulator object
     * @param additionalParameters
     * @returns {{extentBegin: (*|jQuery), extentEnd: (*|jQuery), chromosome: string, originalGeneName: *, geneNameArray: Array, tissueNameArray: Array, modNameArray: Array, mods: Array, contextDescr: {chromosome: string, extentBegin: (*|jQuery), extentEnd: (*|jQuery), moreContext: Array}}}
     */
    var AccumulatorObject = function (additionalParameters) {
        var chrom = (additionalParameters.geneChromosome.indexOf('chr') > -1) ?
            additionalParameters.geneChromosome.substr(3) :
            additionalParameters.geneChromosome;
        return {
            extentBegin: additionalParameters.geneExtentBegin,
            extentEnd: additionalParameters.geneExtentEnd,
            chromosome: chrom,
            originalGeneName: additionalParameters.geneName
        };
    };

    /***
     * retrieve the accumulator object, pulling back a specified field if requested
     * @param chosenField
     * @returns {jQuery}
     */
    var getAccumulatorObject = function (chosenField) {
        var accumulatorObject = $("#configurableUiTabStorage").data("dataHolder");
        var returnValue;
        if (typeof accumulatorObject === 'undefined') {
            alert('Fatal error.  Malfunction is imminent. Missing accumulator object.');
            return;
        }
        if (typeof chosenField !== 'undefined') {
            returnValue = accumulatorObject[chosenField];

            if (typeof returnValue === 'undefined') {
                // if someone requests a field that doesn't exist then as a default we can give them an array.  If we
                //  get a request for something that we recognize, we can also provide something more specific.
                switch (chosenField){ // we can provide defaults for some accumulator objects
                    case "currentSortRequest":
                        accumulatorObject[chosenField] = {
                            columnNumberValue: 1,
                            currentSort: "geneMethods",
                            sortOrder: "asc",
                            table: "table.combinedGeneTableHolder"
                        };
                        break;
                    default:
                        accumulatorObject[chosenField] = new Array();
                        break;
                }
                returnValue = accumulatorObject[chosenField];
            }
        } else {
            returnValue = accumulatorObject;
        }

        return returnValue
    };

    /***
     * store the accumulator object in the DOM
     * @param accumulatorObject
     * @returns {*}
     */
    var setAccumulatorObject = function (specificField, value) {
        if (typeof specificField === 'undefined') {
            alert("Serious error.  Attempted assignment of unspecified field.");
            return;
        }
        var accumulatorObject = getAccumulatorObject();
        accumulatorObject[specificField] = value;
        return getAccumulatorObject(specificField);
    };

    /***
     * Reset the chosen field in the accumulator object to its default value. If no field is specified then reset the entire
     * accumulator object to its default.
     */
    var resetAccumulatorObject = function (specificField) {
        var additionalParameters = getDyanamicUiVariables();
        var filledOutSharedAccumulatorObject = new AccumulatorObject(additionalParameters);
        if (typeof specificField !== 'undefined') {
            if (typeof filledOutSharedAccumulatorObject === 'undefined') {
                alert(" Unexpected absence of field '" + specificField + "' in shared accumulator object");
            }
            setAccumulatorObject(specificField, []);
        } else {
            $("#configurableUiTabStorage").data("dataHolder", filledOutSharedAccumulatorObject);
        }
    };


    var addAdditionalResultsObject = function (returnObject) {
        var resultsArray = getAccumulatorObject("resultsArray");
        if (typeof resultsArray === 'undefined') {
            setAccumulatorObject("resultsArray", []);
            resultsArray = getAccumulatorObject("resultsArray");
        }
        resultsArray.push(returnObject);
    };


    var accumulatorObjectFieldEmpty = function (specificField) {
        var returnValue = true;
        var accumulatorObjectField = getAccumulatorObject(specificField);
        if (Array.isArray(accumulatorObjectField)) {
            if (accumulatorObjectField.length > 0) {
                returnValue = false;
            }
        }
        return returnValue;
    };

    function IntermediateDataStructure() {
        this.headerNames = [];
        this.headerContents = [];
        this.headers = [];
        this.rowsToAdd = [];
        this.tableToUpdate = "";
    };


    /***
     * Need to build an intermediate data structure. It'll be an object but looks like this:
     * headerNames: ['Header name 1','header name 2']
     * headerContents: [' HTML for a header',' HTML for a header']
     * headers: { name: 'index name of header',
     *              contents: 'display HTML for header' }
     * rowsToAdd:  [ { category: 'name for first column',
     *                 subcategory: 'name for second column',
     *                 columnCells:  [  {'Header name 1':' HTML for a cell'},
     *                                  {'header name 2':' HTML for a cell'} ]
     * @param idForTheTargetDiv
     * @param templateInfo
     * @param returnObject
     * @param clearBeforeStarting
     */
    var prepareToPresentToTheScreen = function (idForTheTargetDiv,
                                                templateInfo,
                                                returnObject,
                                                clearBeforeStarting,
                                                intermediateDataStructure,
                                                storeRecords,
                                                typeOfRecord) {
        if (clearBeforeStarting) {
            $(idForTheTargetDiv).empty();
        }

        if (typeof intermediateDataStructure !== 'undefined') {

            buildOrExtendDynamicTable(intermediateDataStructure.tableToUpdate,
                intermediateDataStructure,
                storeRecords,
                typeOfRecord);

        } else {

            $(idForTheTargetDiv).append(Mustache.render($(templateInfo)[0].innerHTML,
                returnObject
            ));

        }


    }





    var processRecordsFromECaviar = function (data) {
        // build up an object to describe this
        var returnObject = {
            rawData: []
        };

        var rawColocalizationInfo = getAccumulatorObject('rawColocalizationInfo');

        _.forEach(data, function (oneRec) {

            rawColocalizationInfo.push(oneRec);

        });

        return rawColocalizationInfo;
    };





    var processRecordsFromColoc = function (data) {
        var rawColocalizationInfo = getAccumulatorObject('rawColoInfo');

        _.forEach(data, function (oneRec) {
            rawColocalizationInfo.push(oneRec);
        });

        return rawColocalizationInfo;
    };




    var processRecordsFromAbc = function (data) {
        // build up an object to describe this
        var returnObject = {
            rawData: []
        };

        var rawAbcInfo = getAccumulatorObject('rawAbcInfo');

        _.forEach(data, function (oneRec) {

            rawAbcInfo.push(oneRec);

        });

        return rawAbcInfo;
    };


    var processRecordsFromDepict = function (data) {
        // build up an object to describe this
        var returnObject = {
            rawData: []
        };

        var rawAbcInfo = getAccumulatorObject('rawDepictInfo');

        _.forEach(data, function (oneRec) {

            rawAbcInfo.push(oneRec);

        });

        return rawAbcInfo;
    };


    // var processRecordsFromDepictGeneSet = function (data) {
    //
    //     var depictGeneSet = getAccumulatorObject('depictGeneSetInfo');
    //
    //     //_.forEach(data, function (oneRec) {
    //     //    depictGeneSet.push(oneRec);
    //     //});
    //
    //     depictGeneSet.push(data);
    //
    //
    //     return depictGeneSet;
    // };


    var processRecordsFromQtl = function (data) {
        // build up an object to describe this
        var returnObject = {
            rawData: []
        };

        var rawQtlInfo = getAccumulatorObject('rawQtlInfo');
        var sampleGroupWithCredibleSetNames = (data.sampleGroupsWithCredibleSetNames.length > 0) ? data.sampleGroupsWithCredibleSetNames[0] : "";
        var  uniqueVariants = [];
        if (sampleGroupWithCredibleSetNames.length > 0) {
            rawQtlInfo["credSetDataset"] = sampleGroupWithCredibleSetNames;
            rawQtlInfo["variants"] = _.filter(data.variants.variants, function (o) {
                return o.dataset === sampleGroupWithCredibleSetNames;
               // return o.dataset === "GWAS_IBDGenetics_eu_CrdSet_mdv80"
            });
        } else {
            rawQtlInfo["credSetDataset"] = sampleGroupWithCredibleSetNames;
            rawQtlInfo["variants"] = _.filter(data.variants.variants, function (o, cnt) {
                var skipIt = true;
                if (!uniqueVariants.includes(o.VAR_ID)){
                    uniqueVariants.push(o.VAR_ID);
                    skipIt = false;
                }
                return ((uniqueVariants.length < 11)&&(!skipIt));
            });
        }


        return rawQtlInfo;
    };


    var retrieveExtents = function (geneName, defaultStart, defaultEnd) {
        var returnValue = {regionStart: defaultStart, regionEnd: defaultEnd};
        var geneInfoArray = getAccumulatorObject("geneInfoArray");
        var geneInfoIndex = _.findIndex(geneInfoArray, {name: geneName});
        if (geneInfoIndex >= 0) {
            returnValue.regionStart = geneInfoArray[geneInfoIndex].startPos;
            returnValue.regionEnd = geneInfoArray[geneInfoIndex].endPos;
        }
        return returnValue
    }


    var displayGenesFromAbc = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var dataAnnotationTypeCode = 'ECA';
        var returnObject = createNewDisplayReturnObject();

        // for each gene collect up the data we want to display
        _.forEach(_.groupBy(getAccumulatorObject("rawAbcInfo"), 'GENE'), function (value, geneName) {
            var geneObject = {geneName: geneName};
            geneObject['source'] = _.map(_.uniqBy(value, 'SOURCE'), function (o) {
                return {tissueName:o.SOURCE,value:o.VALUE};
            }).sort();
            geneObject['experiment'] = _.map(_.uniqBy(value, 'EXPERIMENT'), function (o) {
                return o.EXPERIMENT
            }).sort();
            geneObject['chrom'] = _.first(_.map(_.uniqBy(value, 'CHROM'), function (o) {
                return o.CHROM
            }).sort());
            var startPosRec = _.minBy(value, function (o) {
                return o.START
            });
            geneObject['start_pos'] = (startPosRec) ? startPosRec.START : 0;
            var stopPosRec = _.maxBy(value, function (o) {
                return o.STOP
            });
            geneObject['stop_pos'] = (stopPosRec) ? stopPosRec.STOP : 0;
            geneObject['abcTissuesVector'] = function () {
                return geneObject['source'];
            };
            geneObject['sourceByTissue'] = function () {
                return _.groupBy(value, 'SOURCE');
            };
            var extents = retrieveExtents(geneName, startPosRec, stopPosRec);
            geneObject['regionStart'] = extents.regionStart;
            geneObject['regionEnd'] = extents.regionEnd;

            returnObject.genesByAbc.push(geneObject);

        });

        // now concoct a few functions that mustache can call
        returnObject['abcGenesExist'] = function () {
            return (this.genesByAbc.length > 0) ? [1] : [];
        };


        addAdditionalResultsObject({genesFromAbc: returnObject});


        var intermediateDataStructure = new IntermediateDataStructure();

        if (( typeof returnObject.abcGenesExist !== 'undefined') && ( returnObject.abcGenesExist())) {
            addRowHolderToIntermediateDataStructure(dataAnnotationTypeCode,intermediateDataStructure);

            // set up the headers, and give us an empty row of column cells
            var headerNames = [];
            if (accumulatorObjectFieldEmpty("geneNameArray")) {
                console.log("We always have to have a record of the current gene names in ABC display. We have a problem.");
            } else {
                headerNames  = _.map(getAccumulatorObject("geneNameArray"),'name');
                _.forEach(getAccumulatorObject("geneNameArray"), function (oneRecord) {
                    intermediateDataStructure.rowsToAdd[0].columnCells.push(new IntermediateStructureDataCell("",
                        {}, "header of some sort",'EMC' ));
                });
            }


            // set up the headers, and give us an empty row of column cells


            // fill in all of the column cells
            _.forEach(returnObject.genesByAbc, function (recordsPerGene) {
                var indexOfColumn = _.indexOf(headerNames, recordsPerGene.geneName);
                if (indexOfColumn === -1) {
                    console.log("Did not find index of recordsPerGene.geneName.  Shouldn't we?")
                } else {
                    if ((recordsPerGene.source.length === 0) &&
                        (recordsPerGene.experiment.length === 0)) {
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                            {},"not sure this is ever used?",'EMC');
                    } else {
                        if ((recordsPerGene.source.length === 0)) {
                            intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                                {}, "tissue specific",'EMC');
                        } else {
                            var sortedTissues = _.map(_.sortBy(recordsPerGene.source,["value"]),function(tissueRecord){
                                return {    tissueName: tissueRecord.tissueName,
                                            numericalValue:tissueRecord.value,
                                            value:UTILS.realNumberFormatter(""+tissueRecord.value) };
                            });
                            var recordsCellPresentationString = "records="+recordsPerGene.source.length;
                            var significanceCellPresentationString = "CLPP="+records[0].clpp+" ("+records[0].tissueName+")";
                            var significanceValue = 0;
                            if (( typeof records !== 'undefined')&&
                                (records.length>0)){
                                significanceValue = sortedTissues[0].numericalValue;
                                significanceCellPresentationString = "ABC="+sortedTissues[0].value+" ("+sortedTissues[0].tissueName+")";
                            }
                            var renderData = {
                                cellPresentationStringMap:{ Records:recordsCellPresentationString,
                                    Significance:significanceCellPresentationString },
                                numberOfTissues:recordsPerGene.source.length,
                                tissueCategoryNumber:categorizeTissueNumbers( recordsPerGene.source.length ),
                                significanceCategoryNumber:categorizeSignificanceNumbers( sortedTissues, "ABC" ),
                                tissuesExist:(recordsPerGene.source.length)?[1]:[],
                                geneName:recordsPerGene.geneName,
                                significanceValue:significanceValue,
                                tissues:sortedTissues
                            };
                            intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell('eQTL',
                                renderData,'tisseRecord',dataAnnotationTypeCode );
                        };
                    }

                }
            });
            intermediateDataStructure.tableToUpdate = "table.combinedGeneTableHolder";
        }


        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
            '#dynamicAbcGeneTable',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'geneTableGeneHeaders');


        _.forEach(returnObject.genesByAbc, function (value) {
            $('#tissues_' + value.geneName).data('allUniqueTissues', value.abcTissuesVector());
            $('#tissues_' + value.geneName).data('sourceByTissue', value.sourceByTissue());
            $('#tissues_' + value.geneName).data('regionStart', value.start_pos);
            $('#tissues_' + value.geneName).data('regionEnd', value.stop_pos);
            $('#tissues_' + value.geneName).data('geneName', value.geneName);
        });


        $('div.openTissues').on('show.bs.collapse', function () {
            // the user wants to drill down into the tissues. Let's make them a graphic using the data we stored above
            var dataMatrix =
                _.map($(this).data("sourceByTissue"),
                    function (v, k) {
                        var retVal = [];
                        _.forEach(v, function (oneRec) {
                            retVal.push(oneRec);
                        });
                        return retVal;
                    }
                );
            var geneInfoArray = getAccumulatorObject("geneInfoArray");
            var geneInfoIndex = _.findIndex(geneInfoArray, {name: $(this).data("geneName")});
            var additionalParameters;
            if (geneInfoIndex < 0) {
                additionalParameters = {
                    regionStart: _.minBy(_.flatMap($(this).data("sourceByTissue")), 'START').START,
                    regionEnd: _.maxBy(_.flatMap($(this).data("sourceByTissue")), 'STOP').STOP,
                    stateColorBy: ['Flanking TSS'],
                    mappingInformation: _.map($(this).data('allUniqueTissues'), function () {
                        return [1]
                    })
                };
            } else {
                additionalParameters = {
                    regionStart: geneInfoArray[geneInfoIndex].startPos,
                    regionEnd: geneInfoArray[geneInfoIndex].endPos,
                    stateColorBy: ['Flanking TSS'],
                    mappingInformation: _.map($(this).data('allUniqueTissues'), function () {
                        return [1]
                    })
                };
            }

            //  here comes that D3 graphic!
            $('#tooltip_' + $(this).attr('id')).empty();
            $('#graphic_' + $(this).attr('id')).empty();
            buildMultiTissueDisplay(['Flanking TSS'],
                $(this).data('allUniqueTissues'),
                dataMatrix,
                additionalParameters,
                '#tooltip_' + $(this).attr('id'),
                '#graphic_' + $(this).attr('id'));

        });
    };



    var buildRegionGraphic = function (placeForGraphic,placeForTooltip,divWithData) {
        // the user wants to drill down into the tissues. Let's make them a graphic using the data we stored above
        var dataMatrix =
            _.map($(divWithData).data("sourceByTissue"),
                function (v, k) {
                    var retVal = [];
                    _.forEach(v, function (oneRec) {
                        retVal.push(oneRec);
                    });
                    return retVal;
                }
            );
        var geneInfoArray = getAccumulatorObject("geneInfoArray");
        var geneInfoIndex = _.findIndex(geneInfoArray, {name: $(divWithData).data("geneName")});
        var additionalParameters;
        if (geneInfoIndex < 0) {
            additionalParameters = {
                regionStart: _.minBy(_.flatMap($(divWithData).data("sourceByTissue")), 'START').START,
                regionEnd: _.maxBy(_.flatMap($(divWithData).data("sourceByTissue")), 'STOP').STOP,
                stateColorBy: ['Flanking TSS'],
                mappingInformation: _.map($(divWithData).data('allUniqueTissues'), function () {
                    return [1]
                })
            };
        } else {
            additionalParameters = {
                regionStart: geneInfoArray[geneInfoIndex].startPos,
                regionEnd: geneInfoArray[geneInfoIndex].endPos,
                stateColorBy: ['Flanking TSS'],
                mappingInformation: _.map($(divWithData).data('allUniqueTissues'), function () {
                    return [1]
                })
            };
        }

        //  here comes that D3 graphic!
        $(placeForTooltip).empty();
        $(placeForGraphic).empty();
        buildMultiTissueDisplay(['Flanking TSS'],
            _.map($(divWithData).data('allUniqueTissues'),'tissueName'),
            dataMatrix,
            additionalParameters,
            placeForTooltip,
            placeForGraphic);

    };










    var displayGenesFromDepict = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var dataAnnotationTypeCode = 'DEP_GP';
        var returnObject = createNewDisplayReturnObject();

        // for each gene collect up the data we want to display
        _.forEach(_.groupBy(getAccumulatorObject("rawDepictInfo"), 'gene'), function (value, geneName) {
            var geneObject = {geneName: geneName};
            geneObject['chrom'] = _.first(_.map(_.uniqBy(value, 'region_chr'), function (o) {
                return o.region_chr
            }).sort());
            var startPosRec = _.minBy(value, function (o) {
                return o.region_start
            });
            geneObject['start_pos'] = (startPosRec) ? startPosRec.region_start : 0;
            var stopPosRec = _.maxBy(value, function (o) {
                return o.region_end
            });
            geneObject['stop_pos'] = (stopPosRec) ? stopPosRec.region_end : 0;
            //geneObject['recordByDataSet'] = function(){
            //    return _.groupBy(value,'dataset');
            //};
            var recordsByDataSet = [];
            _.forEach(_.groupBy(value, 'dataset'), function (recValue, datasetName) {
                var myRecValue = recValue[0];
               // myRecValue["formattedPValue"] = UTILS.realNumberFormatter(myRecValue["pvalue"]);
                recordsByDataSet.push(myRecValue);
            });

            geneObject['recordByDataSet'] = recordsByDataSet;
            returnObject.genesByDepict.push(geneObject);

        });

        addAdditionalResultsObject({genesFromAbc: returnObject});

        var intermediateDataStructure = new IntermediateDataStructure();

        if (( typeof returnObject.genesByDepict !== 'undefined') && ( returnObject.genesByDepict.length > 0)) {
            addRowHolderToIntermediateDataStructure(dataAnnotationTypeCode,intermediateDataStructure);

            // set up the headers, and give us an empty row of column cells
            var headerNames = [];
            if (accumulatorObjectFieldEmpty("geneNameArray")) {
                console.log("We always have to have a record of the current gene names in depict display. We have a problem.");
            } else {
                headerNames  = _.map(getAccumulatorObject("geneNameArray"),'name');
                _.forEach(getAccumulatorObject("geneNameArray"), function (oneRecord) {
                    intermediateDataStructure.rowsToAdd[0].columnCells.push(new IntermediateStructureDataCell(oneRecord.name,
                        {},"header",'EMC'));
                });
            }


            // set up the headers, and give us an empty row of column cells


            // fill in all of the column cells
            _.forEach(returnObject.genesByDepict, function (recordsPerGene) {
                var indexOfColumn = _.indexOf(headerNames, recordsPerGene.geneName);
                if (indexOfColumn === -1) {
                    console.log("Did not find index of recordsPerGene.geneName.  Shouldn't we?")
                } else {
                    if ((recordsPerGene.recordByDataSet.length === 0)) {
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                            {}, "tissue specific",'EMC');
                    } else {
                        var records = _.map(_.sortBy(recordsPerGene.recordByDataSet,['pvalue']),function(tissueRecord){
                            return {    value:UTILS.realNumberFormatter(''+tissueRecord.pvalue),
                                        numericalValue:tissueRecord.pvalue,
                                        dataset: tissueRecord.dataset };
                        });
                        var recordsCellPresentationString = "records="+recordsPerGene.recordByDataSet.length;
                        var significanceCellPresentationString = "CLPP="+records[0].clpp+" ("+records[0].tissueName+")";
                        var significanceValue = 0;
                        if (( typeof records !== 'undefined')&&
                            (records.length>0)){
                            significanceValue = records[0].numericalValue;
                            significanceCellPresentationString = "p="+records[0].value;
                        }
                        var renderData = {
                            cellPresentationStringMap:{ Records:recordsCellPresentationString,
                                Significance:significanceCellPresentationString },
                            numberOfRecords:recordsPerGene.recordByDataSet.length,
                            tissueCategoryNumber:categorizeTissueNumbers( recordsPerGene.recordByDataSet.length ),
                            significanceCategoryNumber:categorizeSignificanceNumbers( records, "DEP" ),
                            recordsExist:(recordsPerGene.recordByDataSet.length)?[1]:[],
                            geneName:recordsPerGene.geneName,
                            significanceValue:records[0].numericalValue,
                            records:records
                        };
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                            renderData,"tissue specific", dataAnnotationTypeCode);
                    }

                }
            });
            intermediateDataStructure.tableToUpdate = "table.combinedGeneTableHolder";
        }


        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
            '#dynamicAbcGeneTable',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'geneTableGeneHeaders');

    };







    var displayGeneSetFromDepict = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        displayForGeneTable('table.combinedGeneTableHolder', // which table are we adding to
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
                    tissueCategoryNumber:categorizeTissueNumbers( records.length ),
                    recordsExist:(records.length)?[1]:[],
                    gene:gene,
                    significanceCategoryNumber:categorizeSignificanceNumbers( records, dataAnnotationTypeCode, significanceValue ),
                    significanceValue:significanceValue,
                    data:records
                }
            } );



        // var dataAnnotationTypeCode = 'DEP_GS';
        // var returnObject = createNewDisplayReturnObject();
        // var depictGeneSet = getAccumulatorObject('depictGeneSetInfo');
        // if (( typeof getAccumulatorObject("depictGeneSetInfo") !== 'undefined') &&
        //     ( getAccumulatorObject("depictGeneSetInfo").length > 0 ) &&
        //     ( typeof getAccumulatorObject("depictGeneSetInfo").data !== 'undefined') &&
        //     ( getAccumulatorObject("depictGeneSetInfo").data.length > 0 ) ){
        //     _.forEach(getAccumulatorObject("depictGeneSetInfo").data, function (informationForAPathway, index) {
        //         depictGeneSet.push(informationForAPathway);
        //     });
        //
        // }
        //
        // var intermediateDataStructure = new IntermediateDataStructure();
        //
        // if (( typeof depictGeneSet !== 'undefined') && ( depictGeneSet.length > 0)) {
        //     addRowHolderToIntermediateDataStructure(dataAnnotationTypeCode,intermediateDataStructure);
        //
        //
        //
        //     // set up the headers, and give us an empty row of column cells
        //     var headerNames = [];
        //     if (accumulatorObjectFieldEmpty("geneNameArray")) {
        //         console.log("We always have to have a record of the current gene names in depict gene set display. We have a problem.");
        //     } else {
        //         headerNames  = _.map(getAccumulatorObject("geneNameArray"),'name');
        //         _.forEach(getAccumulatorObject("geneNameArray"), function (oneRecord) {
        //             intermediateDataStructure.rowsToAdd[0].columnCells.push(new IntermediateStructureDataCell(oneRecord.name,
        //                 {},"header",'EMC'));
        //         });
        //     }
        //
        //
        //     // set up the headers, and give us an empty row of column cells
        //
        //
        //     // fill in all of the column cells
        //     _.forEach(depictGeneSet, function (recordsPerGene) {
        //         var indexOfColumn = _.indexOf(headerNames, recordsPerGene.gene);
        //         recordsPerGene["recordsExist"] =  [];
        //         if (indexOfColumn === -1) {
        //             console.log("Did not find index of recordsPerGene.geneName.  Shouldn't we?")
        //         } else {
        //             recordsPerGene["numberOfRecords"] =  recordsPerGene.data.length;
        //             if ((recordsPerGene.data.length === 0)) {
        //                 intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
        //                     {}, "tissue specific",'EMC');
        //             } else {
        //                 recordsPerGene.data = _.sortBy(recordsPerGene.data,['pvalue']);
        //
        //                 recordsPerGene["recordsExist"] =  [1];
        //                 recordsPerGene["tissueCategoryNumber"]=categorizeTissueNumbers( recordsPerGene.data.length );
        //                 recordsPerGene["significanceCategoryNumber"]=categorizeSignificanceNumbers( recordsPerGene.data,"DEG" );
        //                 recordsPerGene["significanceValue"]=recordsPerGene.data[0].pvalue;
        //                 _.forEach(recordsPerGene.data,function(eachPathway){
        //                     eachPathway["pvalue_str"] =  UTILS.realNumberFormatter(''+eachPathway.pvalue);
        //                     if (eachPathway.pathway_id.includes(":")){
        //                         eachPathway["pathway_id_str"] = eachPathway.pathway_id.split(":")[1];
        //                     } else {
        //                         eachPathway["pathway_id_str"] = eachPathway.pathway_id;
        //                     }
        //                     var recordsCellPresentationString = "records="+recordsPerGene.data.length;
        //                     var significanceCellPresentationString = "0";
        //                         significanceCellPresentationString  = "p="+recordsPerGene.data[0].pvalue_str+" ("+recordsPerGene.data[0].pathway_id+")";
        //                     recordsPerGene["cellPresentationStringMap"] = { Records:recordsCellPresentationString,
        //                         Significance:significanceCellPresentationString };
        //                     eachPathway["number_genes"] = eachPathway.gene_list.length;
        //                 });
        //                 intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
        //                     recordsPerGene,"tissue specific", dataAnnotationTypeCode);
        //             }
        //
        //         }
        //     });
        //     intermediateDataStructure.tableToUpdate = "table.combinedGeneTableHolder";
        // }
        //
        //
        // prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
        //     '#dynamicAbcGeneTable',
        //     returnObject,
        //     clearBeforeStarting,
        //     intermediateDataStructure,
        //     true,
        //     'geneTableGeneHeaders');

    };








    var displayGenePhenotypeAssociations = function (idForTheTargetDiv, objectContainingRetrievedRecords) {


        displayForGeneTable('table.combinedGeneTableHolder', // which table are we adding to
            'MET', // Which codename from dataAnnotationTypes in geneSignalSummary are we referencing
            'rawGeneAssociationRecords', // name of the persistent field where the data we received is stored
            '', // we may wish to pull out one record for summary purposes
            function(records,tissueTranslations){
                return _.map(_.sortBy(records,['value']),function(tissueRecord){
                    return {  tissueName:  translateATissueName(tissueTranslations,tissueRecord.tissue),
                        tissue: tissueRecord.tissue,
                        value: UTILS.realNumberFormatter(""+tissueRecord.value),
                        numericalValue: tissueRecord.value };
                })
            },
            function(records, // all records
                     recordsCellPresentationString,// record count cell text
                     significanceCellPresentationString,// significance cell text
                     dataAnnotationTypeCode,// driving code
                     significanceValue,
                     gene){ // value of significance for sorting
                return {  numberOfRecords:records.length,
                    cellPresentationStringMap:{ Records:recordsCellPresentationString,
                        Significance:significanceCellPresentationString },
                    tissueCategoryNumber:categorizeTissueNumbers( records.length ),
                    tissuesExist:(records.length)?[1]:[],
                    gene:gene,
                    significanceCategoryNumber:categorizeSignificanceNumbers( records, dataAnnotationTypeCode, significanceValue ),
                    significanceValue:significanceValue,
                    tissues:records
                }
            } );

    };


    var translateATissueName = function(tissueTranslations,tissueKey){
        var returnValue = tissueKey;
        if ( typeof  tissueTranslations !== 'undefined') {
            var translatedTissueName = tissueTranslations[tissueKey];
            if ( typeof  translatedTissueName !== 'undefined'){
                returnValue = translatedTissueName;
            }
        }
        return returnValue
    }




    var displayGeneSkatAssociationsForGeneTable = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        displayForGeneTable('table.combinedGeneTableHolder', // which table are we adding to
            'SKA', // Which codename from dataAnnotationTypes in geneSignalSummary are we referencing
            'rawGeneSkatRecords', // name of the persistent field where the data we received is stored
            'P_MIN_P_SKAT_NS_STRICT_NS_1PCT', // we may wish to pull out one record for summary purposes
            function(records,tissueTranslations){
                return _.map(_.sortBy(_.filter(records,function(t){return t.tissue.includes("SKAT")}),['value']),function(tissueRecord){
                    return {  tissueName:  translateATissueName(tissueTranslations,tissueRecord.tissue),
                        tissue: tissueRecord.tissue,
                        value: UTILS.realNumberFormatter(""+tissueRecord.value),
                        numericalValue: tissueRecord.value };
                })
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
                    tissueCategoryNumber:categorizeTissueNumbers(records.length ),
                    tissuesExist:(records.length)?[1]:[],
                    gene:gene,
                    significanceCategoryNumber:categorizeSignificanceNumbers( records, dataAnnotationTypeCode, significanceValue ),
                    significanceValue:significanceValue,
                    tissues:records
                }
            } );


    };





    var displayGeneFirthAssociationsForGeneTable = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        displayForGeneTable('table.combinedGeneTableHolder', // which table are we adding to
            'FIR', // Which codename from dataAnnotationTypes in geneSignalSummary are we referencing
            'rawGeneFirthRecords', // name of the persistent field where the data we received is stored
            'P_MIN_P_FIRTH_NS_STRICT_NS_1PCT', // we may wish to pull out one record for summary purposes
            function(records,tissueTranslations){
                return _.map(_.sortBy(_.filter(records,function(t){return t.tissue.includes("FIRTH")}),['value']),function(tissueRecord){
                    return {  tissueName:  translateATissueName(tissueTranslations,tissueRecord.tissue),
                        tissue: tissueRecord.tissue,
                        value: UTILS.realNumberFormatter(""+tissueRecord.value),
                        numericalValue: tissueRecord.value };
                })
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
                    tissueCategoryNumber:categorizeTissueNumbers( records.length ),
                        tissuesExist:(records.length)?[1]:[],
                    gene:gene,
                    significanceCategoryNumber:categorizeSignificanceNumbers( records, dataAnnotationTypeCode, significanceValue ),
                    significanceValue:significanceValue,
                    tissues:records
                }
            }
        );
    };






    var displayForGeneTable = function (idForTheTargetDiv, // which table are we adding to
                                        dataAnnotationTypeCode, // Which codename from dataAnnotationTypes in geneSignalSummary are we referencing
                                        nameOfAccumulatorField, // name of the persistent field where the data we received is stored
                                        preferredSummaryKey, // we may wish to pull out one record for summary purposes
                                        mapSortAndFilterFunction,
                                        placeDataIntoRenderForm ) { // sort and filter the records we will use.  Resulting array must have fields tissue, value, and numericalValue

        var dataAnnotationType= getDatatypeInformation(dataAnnotationTypeCode);
        var returnObject = createNewDisplayReturnObject();
        var intermediateDataStructure = new IntermediateDataStructure();

        // for each gene collect up the data we want to display
        returnObject.geneAssociations = getAccumulatorObject(nameOfAccumulatorField);

        // do we have any data at all?  If we do, then make a row
        if (( typeof returnObject.geneAssociations !== 'undefined') && ( returnObject.geneAssociations.length > 0)) {
            addRowHolderToIntermediateDataStructure(dataAnnotationTypeCode,intermediateDataStructure);

            // set up the headers, even though we know we won't use them. Is this step necessary?
            var headerNames = [];
            if (accumulatorObjectFieldEmpty("geneNameArray")) {
                console.log("We always have to have a record of the current gene names in depict display. We have a problem.");
            } else {
                headerNames  = _.map(getAccumulatorObject("geneNameArray"),'name');
                _.forEach(getAccumulatorObject("geneNameArray"), function (oneRecord) {
                    intermediateDataStructure.rowsToAdd[0].columnCells.push(new IntermediateStructureDataCell(oneRecord.name,
                        {},"header",'EMC'));
                });
            }


            // set up the headers, and give us an empty row of column cells


            // fill in all of the column cells
            _.forEach(returnObject.geneAssociations, function (recordsPerGene) {
                var indexOfColumn = _.indexOf(headerNames, recordsPerGene.gene);
                if (indexOfColumn === -1) {
                    console.log("Did not find index of recordsPerGene.geneName.  Shouldn't we?")
                } else {
                    if ((recordsPerGene.tissues.length === 0)) {
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.gene,
                            {}, "tissue specific",'EMC');
                    } else {
                        var tissueTranslations = recordsPerGene["TISSUE_TRANSLATIONS"]; // if no translations are provided, it is fine to leave this value as undefined
                        var tissueRecords = mapSortAndFilterFunction (recordsPerGene.tissues,tissueTranslations);

                        var recordsCellPresentationString = Mustache.render($('#'+dataAnnotationType.dataAnnotation.numberRecordsCellPresentationStringWriter)[0].innerHTML, {
                            numberRecords:tissueRecords.length
                        });
                        var significanceCellPresentationString = "0";
                        var significanceValue = 0;
                        if (( typeof recordsPerGene.tissues !== 'undefined')&&
                            (recordsPerGene.tissues.length>0)){
                            var mostSignificantRecord;
                            if (( typeof preferredSummaryKey !== 'undefined') && (preferredSummaryKey.length>0)){ // we have a key telling us which record to pick
                                mostSignificantRecord=_.find(recordsPerGene.tissues,function(t){return t.tissue.includes(preferredSummaryKey)});
                            }else{// no specific key, but we have sorted the keys in ascending order by value, so we can just pick the first one
                                mostSignificantRecord=recordsPerGene.tissues[0];
                             }
                            significanceValue = mostSignificantRecord.value;
                            significanceCellPresentationString = Mustache.render($('#'+dataAnnotationType.dataAnnotation.significanceCellPresentationStringWriter)[0].innerHTML,
                                {significanceValue:significanceValue,
                                    significanceValueAsString:UTILS.realNumberFormatter(""+significanceValue),
                                    recordDescription:translateATissueName(tissueTranslations,mostSignificantRecord.tissue)});

                        }
                        //  this is the information we carry around each cell and that we will later use to display it
                        var renderData = placeDataIntoRenderForm(   tissueRecords,
                                                                    recordsCellPresentationString,
                                                                    significanceCellPresentationString,
                                                                    dataAnnotationTypeCode,
                                                                    significanceValue,
                                                                    recordsPerGene.gene );
                        recordsPerGene["numberOfRecords"] = recordsPerGene.tissues.length;//not sure if this is used
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.gene,
                            renderData,"tissue specific",dataAnnotationTypeCode );
                    }

                }
            });
            intermediateDataStructure.tableToUpdate = idForTheTargetDiv;
        }


        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
            '#dynamicAbcGeneTable',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'geneTableGeneHeaders');



    };










    var displayTissuesFromAbc = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
    };


    var displayPhenotypesFromColocalization = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var returnObject = createNewDisplayReturnObject();

        _.forEach(_.groupBy(getAccumulatorObject("rawColocalizationInfo"), 'phenotype'), function (value, phenotypeName) {
            var phenotypeObject = {phenotypeName: phenotypeName};
            phenotypeObject['tissues'] = _.map(_.uniqBy(value, 'tissue'), function (o) {
                return o.tissue
            }).sort();
            phenotypeObject['genes'] = _.map(_.uniqBy(value, 'gene'), function (o) {
                return o.gene
            }).sort();
            phenotypeObject['varId'] = _.map(_.uniqBy(value, 'var_id'), function (o) {
                return o.var_id
            }).sort();
            returnObject.phenotypesByColocalization.push(phenotypeObject);
            returnObject.uniquePhenotypes.push({phenotypeName: phenotypeName});
        });

        returnObject['phenotypeColocsExist'] = function () {
            return (this.phenotypesByColocalization.length > 0) ? [1] : [];
        };
        returnObject['numberOfTissues'] = function () {
            return (this.tissues.length);
        };
        returnObject['numberOfGenes'] = function () {
            return (this.genes.length);
        };
        returnObject['numberOfVariants'] = function () {
            return (this.varId.length);
        };


        addAdditionalResultsObject({phenotypesFromColocalizatio: returnObject});
        prepareToPresentToTheScreen(idForTheTargetDiv, '#dynamicColocalizationPhenotypeTable', returnObject, clearBeforeStarting);
        // $("#dynamicPhenotypeHolder div.dynamicUiHolder").empty().append(Mustache.render($('#dynamicColocalizationPhenotypeTable')[0].innerHTML,
        //     returnObject
        // ));


    };


    var displayTissuesFromColocalization = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var returnObject = createNewDisplayReturnObject();

        _.forEach(_.groupBy(getAccumulatorObject("rawColocalizationInfo"), 'tissue'), function (value, tissueName) {
            var tissueObject = {tissueName: tissueName};
            tissueObject['phenotypes'] = _.map(_.uniqBy(value, 'phenotype'), function (o) {
                return o.phenotype
            }).sort();
            tissueObject['genes'] = _.map(_.uniqBy(value, 'gene'), function (o) {
                return o.gene
            }).sort();
            tissueObject['varId'] = _.map(_.uniqBy(value, 'var_id'), function (o) {
                return o.var_id
            }).sort();
            returnObject.phenotypesByColocalization.push(tissueObject);
            returnObject.uniqueTissues.push({tissueName: tissueName});
        });
        returnObject['colocsTissuesExist'] = function () {
            return (this.phenotypesByColocalization.length > 0) ? [1] : [];
        };

        returnObject['phenotypeColocsExist'] = function () {
            return (this.phenotypesByColocalization.length > 0) ? [1] : [];
        };
        returnObject['numberOfTissues'] = function () {
            return (this.tissues.length);
        };
        returnObject['numberOfPhenotypes'] = function () {
            return (this.phenotypes.length);
        };
        returnObject['numberOfGenes'] = function () {
            return (this.genes.length);
        };
        returnObject['numberOfVariants'] = function () {
            return (this.varId.length);
        };

        addAdditionalResultsObject({tissuesFromColocalization: returnObject});
        prepareToPresentToTheScreen("#dynamicTissueHolder div.dynamicUiHolder", '#dynamicColocalizationTissueTable', returnObject, clearBeforeStarting);
        // $("#dynamicTissueHolder div.dynamicUiHolder").empty().append(Mustache.render($('#dynamicColocalizationTissueTable')[0].innerHTML,
        //     returnObject
        // ));


    };


    var displayGenesFromECaviar = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var dataAnnotationTypeCode = 'ECA';
        var returnObject = createNewDisplayReturnObject();
        var eCaviarInfo = getAccumulatorObject('eCaviarInfo');
        _.forEach(_.groupBy(getAccumulatorObject("rawColocalizationInfo"), 'gene'), function (value, geneName) {
            var geneObject = {gene: geneName};
            geneObject['phenotypes'] = _.map(_.uniqBy(value, 'phenotype'), function (o) {
                return o.phenotype
            }).sort();
            geneObject['tissues'] = _.map(_.uniqBy(value, 'tissue'), function (o) {
                return o.tissue
            }).sort();
            geneObject['varId'] = _.map(_.uniqBy(value, 'var_id'), function (o) {
                return o.var_id
            }).sort();
            geneObject['colocTissuesVector'] = function () {
                return geneObject['tissue'];
            };
            geneObject['sourceByTissue'] = function () {
                return _.groupBy(value, 'tissue');
            };
            geneObject['data'] = value;
            eCaviarInfo.push(geneObject);
        });


        var intermediateDataStructure = new IntermediateDataStructure();

        if (( typeof eCaviarInfo !== 'undefined') && ( eCaviarInfo.length > 0)) {
            addRowHolderToIntermediateDataStructure(dataAnnotationTypeCode,intermediateDataStructure);

            // set up the headers, and give us an empty row of column cells
            var headerNames = [];
            if (accumulatorObjectFieldEmpty("geneNameArray")) {
                console.log("We always have to have a record of the current gene names in depict gene set display. We have a problem.");
            } else {
                headerNames  = _.map(getAccumulatorObject("geneNameArray"),'name');
                _.forEach(getAccumulatorObject("geneNameArray"), function (oneRecord) {
                    intermediateDataStructure.rowsToAdd[0].columnCells.push(new IntermediateStructureDataCell(oneRecord.name,
                        {},"header",'EMC'));
                });
            }


            // set up the headers, and give us an empty row of column cells


            // fill in all of the column cells
            _.forEach(eCaviarInfo, function (recordsPerGene) {
                var indexOfColumn = _.indexOf(headerNames, recordsPerGene.gene);
                recordsPerGene["recordsExist"] =  [];
                if (indexOfColumn === -1) {
                    console.log("Did not find index of gene name="+recordsPerGene.gene+" for eCaviar.  Shouldn't we?")
                } else {
                    var validRecords = _.filter(recordsPerGene.data,function(o){return (o.clpp!==0)});
                    recordsPerGene["numberOfRecords"] =  validRecords.length;
                    if ((validRecords.length === 0)) {
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                            {}, "tissue specific",'EMC');
                    } else {
                        var records =  _.map(_.orderBy(validRecords,["clpp"],["desc"]),function(tissueRecord){
                            return {  tissueName: tissueRecord.tissue,
                                clpp: UTILS.realNumberFormatter(""+tissueRecord.clpp),
                                prob_in_causal_set: UTILS.realNumberFormatter(""+tissueRecord.prob_in_causal_set),
                                gwas_z_score: UTILS.realNumberFormatter(""+tissueRecord.gwas_z_score),
                                eqtl_z_score: UTILS.realNumberFormatter(""+tissueRecord.eqtl_z_score),
                                var_id:tissueRecord.var_id,
                                numericalValue: tissueRecord.clpp
                            }});
                        var recordsCellPresentationString = "records="+validRecords.length;
                        var significanceCellPresentationString = "CLPP="+records[0].clpp+" ("+records[0].tissueName+")";
                        var significanceValue = 0;
                         if (( typeof records !== 'undefined')&&
                             (records.length>0)){
                             significanceValue = records[0].clpp;
                             significanceCellPresentationString = "CLPP="+records[0].clpp+" ("+records[0].tissueName+")";
                         }

                        var renderData = {
                            cellPresentationStringMap:{ Records:recordsCellPresentationString,
                                Significance:significanceCellPresentationString },
                            numberOfRecords:validRecords.length,
                            tissueCategoryNumber:categorizeTissueNumbers( validRecords.length ),
                            significanceCategoryNumber:categorizeSignificanceNumbers( records, "ECA" ),
                            recordsExist:(validRecords.length)?[1]:[],
                            gene:recordsPerGene.gene,
                            significanceValue:significanceValue,
                            records:records
                        };
                         intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                            renderData,"tissue specific", dataAnnotationTypeCode);
                    }

                }
            });
            intermediateDataStructure.tableToUpdate = "table.combinedGeneTableHolder";
        }


        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
            '#dynamicAbcGeneTable',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'geneTableGeneHeaders');
        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder", '#dynamicColocalizationGeneTable', returnObject, clearBeforeStarting);


    };







    var displayGenesFromColoc = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var dataAnnotationTypeCode = 'COL';
        var returnObject = createNewDisplayReturnObject();
        var eColocInfo = getAccumulatorObject('eColocInfo');
        _.forEach(_.groupBy(getAccumulatorObject("rawColoInfo"), 'gene'), function (value, geneName) {
            var geneObject = {gene: geneName};
            geneObject['phenotypes'] = _.map(_.uniqBy(value, 'phenotype'), function (o) {
                return o.phenotype
            }).sort();
            geneObject['tissues'] = _.map(_.uniqBy(value, 'tissue'), function (o) {
                return o.tissue
            }).sort();
            geneObject['varId'] = _.map(_.uniqBy(value, 'var_id'), function (o) {
                return o.var_id
            }).sort();
            geneObject['colocTissuesVector'] = function () {
                return geneObject['tissue'];
            };
            geneObject['sourceByTissue'] = function () {
                return _.groupBy(value, 'tissue');
            };
            geneObject['data'] = value;
            eColocInfo.push(geneObject);
        });


        var intermediateDataStructure = new IntermediateDataStructure();

        if (( typeof eColocInfo !== 'undefined') && ( eColocInfo.length > 0)) {
            addRowHolderToIntermediateDataStructure(dataAnnotationTypeCode,intermediateDataStructure);

            // set up the headers, and give us an empty row of column cells
            var headerNames = [];
            if (accumulatorObjectFieldEmpty("geneNameArray")) {
                console.log("We always have to have a record of the current gene names in depict gene set display. We have a problem.");
            } else {
                headerNames  = _.map(getAccumulatorObject("geneNameArray"),'name');
                _.forEach(getAccumulatorObject("geneNameArray"), function (oneRecord) {
                    intermediateDataStructure.rowsToAdd[0].columnCells.push(new IntermediateStructureDataCell(oneRecord.name,
                        {},"header",'EMC'));
                });
            }


            // set up the headers, and give us an empty row of column cells


            // fill in all of the column cells
            _.forEach(eColocInfo, function (recordsPerGene) {
                var indexOfColumn = _.indexOf(headerNames, recordsPerGene.gene);
                recordsPerGene["recordsExist"] =  [];
                if (indexOfColumn === -1) {
                    console.log("Did not find index of gene name="+recordsPerGene.gene+" for eColocInfo.  Shouldn't we?")
                } else {
                    var validRecords = _.filter(recordsPerGene.data,function(o){return true});
                    recordsPerGene["numberOfRecords"] =  validRecords.length;
                    if ((validRecords.length === 0)) {
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                            {}, "tissue specific",'EMC');
                    } else {
                        var records =  _.map(_.orderBy(validRecords,["prob_exists_coloc"],["desc"]),function(tissueRecord){
                            return {  tissue: tissueRecord.tissue,
                                conditional_prob_snp_coloc: UTILS.realNumberFormatter(""+tissueRecord.conditional_prob_snp_coloc),
                                unconditional_prob_snp_coloc: UTILS.realNumberFormatter(""+tissueRecord.unconditional_prob_snp_coloc),
                                prob_exists_coloc: UTILS.realNumberFormatter(""+tissueRecord.prob_exists_coloc),
                                var_id: tissueRecord.var_id,
                                numericalValue: tissueRecord.prob_exists_coloc
                            }});
                        var recordsCellPresentationString = "records="+validRecords.length;
                        var significanceCellPresentationString = 0;
                        var significanceValue = 0;
                        if (( typeof records !== 'undefined')&&
                            (records.length>0)){
                            significanceValue = records[0].prob_exists_coloc;
                            significanceCellPresentationString = "CLPP="+records[0].prob_exists_coloc+" ("+records[0].tissue+")";
                        }

                        var renderData = {
                            cellPresentationStringMap:{ Records:recordsCellPresentationString,
                                Significance:significanceCellPresentationString },
                            numberOfRecords:validRecords.length,
                            tissueCategoryNumber:categorizeTissueNumbers( validRecords.length ),
                            significanceCategoryNumber:categorizeSignificanceNumbers( records, "COL" ),
                            recordsExist:(validRecords.length)?[1]:[],
                            gene:recordsPerGene.gene,
                            significanceValue:significanceValue,
                            records:records
                        };
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                            renderData,"tissue specific", dataAnnotationTypeCode);
                    }

                }
            });
            intermediateDataStructure.tableToUpdate = "table.combinedGeneTableHolder";
        }


        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
            '#dynamicAbcGeneTable',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'geneTableGeneHeaders');
        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder", '#dynamicColocalizationGeneTable', returnObject, clearBeforeStarting);


    };







    var processEqtlRecordsFromVariantBasedRequest = function (data) {

        var tempHolder = []
        // basic data aggregation
        _.forEach(data, function (oneRec) {
            var existingRecord = _.find(tempHolder, {variant: oneRec.var_id});
            if (typeof existingRecord === 'undefined') {
                tempHolder.push({
                    variant: oneRec.var_id,
                    genes: [],
                    uniqueGeneNames: [],
                    tissues: [],
                    uniqueTissueNames: []
                });
                existingRecord = _.find(tempHolder, {variant: oneRec.var_id});
            }
            var existingGeneRecord = _.find(existingRecord.genes, {geneName: oneRec.gene, tissueName: oneRec.tissue});
            if (typeof existingGeneRecord === 'undefined') {
                existingRecord.genes.push({
                    geneName: oneRec.gene,
                    value: oneRec.value,
                    tissueName: oneRec.tissue
                });
                ;
            } else {
                console.log('should I be worried? EQTL record matches gene (' + oneRec.gene + ') tissue (' + oneRec.tissue + ') for variant=' + oneRec.var_id + '.');
            }
            var existingTissueRecord = _.find(existingRecord.tissues, {
                geneName: oneRec.gene,
                tissueName: oneRec.tissue
            });
            if (typeof existingTissueRecord === 'undefined') {
                existingRecord.tissues.push({
                    geneName: oneRec.gene,
                    value: oneRec.value,
                    tissueName: oneRec.tissue
                });
                ;
            } else {
                console.log('should I be worried? EQTL record matches gene (' + oneRec.gene + ') tissue (' + oneRec.tissue + ') for variant=' + oneRec.var_id + '.');
            }

        });
        // extract a few summaries
        var uniqueVariants = _.map(tempHolder, function (o) {
            return o.variant
        });
        var existingRecord;
        _.forEach(uniqueVariants, function (varId) {
            existingRecord = _.find(tempHolder, {variant: varId});
            existingRecord.uniqueGeneNames = _.uniq(_.map(existingRecord.genes, function (o) {
                return o.geneName
            }));
            existingRecord.uniqueTissueNames = _.uniq(_.map(existingRecord.tissues, function (o) {
                return o.tissueName
            }));
        });
        setAccumulatorObject("eqtlsAggregatedPerVariant", tempHolder);
        return {};
    };


    var processAbcRecordsFromVariantBasedRequest = function (data) {

        var tempHolder = []
        // basic data aggregation
        _.forEach(data, function (oneRec) {
            var existingRecord = _.find(tempHolder, {variant: oneRec.VAR_ID});
            if (typeof existingRecord === 'undefined') {
                tempHolder.push({
                    variant: oneRec.VAR_ID,
                    genes: [],
                    uniqueGeneNames: [],
                    tissues: [],
                    uniqueTissueNames: []
                });
                existingRecord = _.find(tempHolder, {variant: oneRec.VAR_ID});
            }
            var existingGeneRecord = _.find(existingRecord.genes, {geneName: oneRec.GENE, tissueName: oneRec.SOURCE});
            if (typeof existingGeneRecord === 'undefined') {
                existingRecord.genes.push({
                    geneName: oneRec.GENE,
                    value: oneRec.VALUE,
                    tissueName: oneRec.SOURCE
                });
                ;
            } else {
                console.log('should I be worried? EQTL record matches gene (' + oneRec.GENE + ') tissue (' + oneRec.SOURCE + ') for variant=' + oneRec.var_id + '.');
            }
            var existingTissueRecord = _.find(existingRecord.tissues, {
                geneName: oneRec.GENE,
                tissueName: oneRec.SOURCE
            });
            if (typeof existingTissueRecord === 'undefined') {
                existingRecord.tissues.push({
                    geneName: oneRec.GENE,
                    value: oneRec.VALUE,
                    tissueName: oneRec.SOURCE
                });
                ;
            } else {
                console.log('should I be worried? ABC record matches gene (' + oneRec.GENE + ') tissue (' + oneRec.SOURCE + ') for variant=' + oneRec.var_id + '.');
            }

        });
        // extract a few summaries
        var uniqueVariants = _.map(tempHolder, function (o) {
            return o.variant
        });
        var existingRecord;
        _.forEach(uniqueVariants, function (varId) {
            existingRecord = _.find(tempHolder, {variant: varId});
            existingRecord.uniqueGeneNames = _.uniq(_.map(existingRecord.genes, function (o) {
                return o.geneName
            }));
            existingRecord.uniqueTissueNames = _.uniq(_.map(existingRecord.tissues, function (o) {
                return o.tissueName
            }));
        });
        setAccumulatorObject("abcAggregatedPerVariant", tempHolder);
        return {};
    };


    var processDnaseRecordsFromVariantBasedRequest = function (data) {

        var tempHolder = [];
        var quantileArray = mpgSoftware.regionInfo.createQuantilesArray(1);
        // basic data aggregation
        _.forEach(data, function (oneRec) {
            var existingRecord = _.find(tempHolder, {variant: oneRec.VAR_ID});
            if (typeof existingRecord === 'undefined') {
                tempHolder.push({
                    variant: oneRec.VAR_ID,
                    tissues: [],
                    uniqueTissueNames: [],
                    maximumValue: undefined
                });
                existingRecord = _.find(tempHolder, {variant: oneRec.VAR_ID});
            }
            var existingTissueRecord = _.find(existingRecord.tissues, {tissueName: oneRec.SOURCE});
            if (typeof existingTissueRecord === 'undefined') {
                existingRecord.tissues.push({
                    value: UTILS.realNumberFormatter("" + oneRec.VALUE),
                    tissueName: oneRec.SOURCE,
                    quantileIndicator: 'matchingRegion2_' + mpgSoftware.regionInfo.determineColorIndex(oneRec.VALUE, quantileArray)
                });
            } else {
                console.log('should I be worried? Dnase record matches tissue (' + oneRec.SOURCE + ') for variant=' + oneRec.VAR_ID + '.');
            }

        });
        // extract a few summaries
        var uniqueVariants = _.map(tempHolder, function (o) {
            return o.variant
        });
        var existingRecord;
        _.forEach(uniqueVariants, function (varId) {
            existingRecord = _.find(tempHolder, {variant: varId});
            existingRecord.uniqueTissueNames = _.uniq(_.map(existingRecord.tissues, function (o) {
                return o.tissueName
            }));
        });
        setAccumulatorObject("dnaseAggregatedPerVariant", tempHolder);
        return {};
    };


    var processH3k27acRecordsFromVariantBasedRequest = function (data) {

        var tempHolder = [];
        var quantileArray = mpgSoftware.regionInfo.createQuantilesArray(2);
        // basic data aggregation
        _.forEach(data, function (oneRec) {
            var existingRecord = _.find(tempHolder, {variant: oneRec.VAR_ID});
            if (typeof existingRecord === 'undefined') {
                tempHolder.push({
                    variant: oneRec.VAR_ID,
                    tissues: [],
                    uniqueTissueNames: [],
                    maximumValue: undefined
                });
                existingRecord = _.find(tempHolder, {variant: oneRec.VAR_ID});
            }
            var existingTissueRecord = _.find(existingRecord.tissues, {tissueName: oneRec.SOURCE});
            if (typeof existingTissueRecord === 'undefined') {
                existingRecord.tissues.push({
                    value: UTILS.realNumberFormatter("" + oneRec.VALUE),
                    tissueName: oneRec.SOURCE,
                    quantileIndicator: 'matchingRegion1_' + mpgSoftware.regionInfo.determineColorIndex(oneRec.VALUE, quantileArray)
                });
                ;
            } else {
                console.log('should I be worried? H3k27ac record matches tissue (' + oneRec.SOURCE + ') for variant=' + oneRec.VAR_ID + '.');
            }

        });
        // extract a few summaries
        var uniqueVariants = _.map(tempHolder, function (o) {
            return o.variant
        });
        var existingRecord;
        _.forEach(uniqueVariants, function (varId) {
            existingRecord = _.find(tempHolder, {variant: varId});
            existingRecord.uniqueTissueNames = _.uniq(_.map(existingRecord.tissues, function (o) {
                return o.tissueName
            }));
        });
        setAccumulatorObject("h3k27acAggregatedPerVariant", tempHolder);
        return {};
    };




    /***
     * gene eQTL search
     * @param data
     * @returns {{rawData: Array, uniqueGenes: Array, uniqueTissues: Array, chromosome: undefined, startPos: undefined, endPos: undefined}}
     */
    var processRecordsFromEqtls = function (data) {
        // build up an object to describe this
        var returnObject = {
            rawData: [],
            uniqueGenes: [],
            uniqueTissues: [],
            chromosome: undefined,
            startPos: undefined,
            endPos: undefined
        };
        _.forEach(data, function (oneRec) {
            returnObject.rawData.push(oneRec);
            if (typeof returnObject.startPos === 'undefined') {
                returnObject.startPos = oneRec.start_position;
            } else if (returnObject.startPos > oneRec.start_position) {
                returnObject.startPos = oneRec.start_position;
            }
            if (typeof returnObject.endPos === 'undefined') {
                returnObject.endPos = oneRec.end_position;
            } else if (returnObject.endPos < oneRec.end_position) {
                returnObject.endPos = oneRec.end_position;
            }
            if (typeof returnObject.chromosome === 'undefined') {
                returnObject.chromosome = oneRec.chromosome;
            }
            if (!returnObject.uniqueGenes.includes(oneRec.gene)) {
                returnObject.uniqueGenes.push(oneRec.gene);
            }
            ;
            if (!returnObject.uniqueTissues.includes(oneRec.tissue)) {
                returnObject.uniqueTissues.push(oneRec.tissue);
            }
            ;

            var geneIndex = _.findIndex(getAccumulatorObject("tissuesForEveryGene"), {geneName: oneRec.gene});
            if (geneIndex < 0) {
                var accumulatorArray = getAccumulatorObject("tissuesForEveryGene");
                //accumulatorArray.push({geneName: oneRec.gene, tissues: [oneRec.tissue]});
                accumulatorArray.push({geneName: oneRec.gene, tissues: [{tissue:oneRec.tissue,value:oneRec.value}]});
                setAccumulatorObject("tissuesForEveryGene", accumulatorArray);
            } else {
                var accumulatorElement = getAccumulatorObject("tissuesForEveryGene")[geneIndex];
                // if (!accumulatorElement.tissues.includes(oneRec.tissue)) {
                //     accumulatorElement.tissues.push(oneRec.tissue);
                // }
                if (_.findIndex(accumulatorElement.tissues, {'tissue':oneRec.tissue})===-1) {
                    accumulatorElement.tissues.push({tissue:oneRec.tissue,value:oneRec.value});
                }
            }

            var tissueIndex = _.findIndex(getAccumulatorObject("genesForEveryTissue"), {tissueName: oneRec.tissue});
            if (tissueIndex < 0) {
                var accumulatorArray = getAccumulatorObject("genesForEveryTissue");
                accumulatorArray.push({tissueName: oneRec.tissue, genes: [oneRec.gene]});
                setAccumulatorObject("genesForEveryTissue", accumulatorArray);
            } else {
                var accumulatorElement = getAccumulatorObject("genesForEveryTissue")[tissueIndex];
                if (!accumulatorElement.genes.includes(oneRec.gene)) {
                    accumulatorElement.genes.push(oneRec.gene);
                }
            }


        });

        return returnObject;
    };





    var displayTissuesPerGeneFromEqtl = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var dataAnnotationTypeCode = 'EQT';
        var returnObject = createNewDisplayReturnObject();
        _.forEach(getAccumulatorObject("tissuesForEveryGene"), function (eachGene) {
            returnObject.uniqueGenes.push({name: eachGene.geneName});

            var recordToDisplay = {
                tissues: [],
                numberOfTissues: eachGene.tissues.length,
                geneName: eachGene.geneName
            };
            _.forEach(eachGene.tissues, function (eachTissue) {
                recordToDisplay.tissues.push({tissueName: eachTissue.tissue,value:eachTissue.value})
            });
            returnObject.uniqueEqtlGenes.push(recordToDisplay);
        });
        addAdditionalResultsObject({tissuesPerGeneFromEqtl: returnObject});

        var intermediateDataStructure = new IntermediateDataStructure();
        if (( typeof returnObject.eqtlTissuesExist !== 'undefined') && ( returnObject.eqtlTissuesExist())) {
            addRowHolderToIntermediateDataStructure(dataAnnotationTypeCode,intermediateDataStructure);

             //set up the headers, and give us an empty row of column cells
            var headerNames = [];
            if (accumulatorObjectFieldEmpty("geneNameArray")) {
                console.log("We always have to have a record of the current gene names in eqtl display. We have a problem.");
            } else {
                headerNames  = _.map(getAccumulatorObject("geneNameArray"),'name');
                _.forEach(getAccumulatorObject("geneNameArray"), function (oneRecord) {
                    intermediateDataStructure.rowsToAdd[0].columnCells.push(new IntermediateStructureDataCell('eQTL',
                        {},'eQTL for genes','EMC'));
                });
            }

            // fill in all of the column cells
            _.forEach(returnObject.uniqueEqtlGenes, function (recordsPerGene) {
                var indexOfColumn = _.indexOf(headerNames, recordsPerGene.geneName);
                if (indexOfColumn === -1) {
                    console.log("Did not find index of recordsPerGene.geneName.  Shouldn't we?")
                } else {
                    if ((recordsPerGene.tissues.length === 0)) {
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell(recordsPerGene.geneName,
                            {}, "tissue specific",'EMC');
                    } else {
                        var tissueRecords = _.map(_.sortBy(recordsPerGene.tissues,['value']),function(tissueRecord){
                            return {  tissueName: tissueRecord.tissueName,
                                value: UTILS.realNumberFormatter(""+tissueRecord.value),
                                numericalValue: tissueRecord.value };
                        });

                        var recordsCellPresentationString  = "records="+recordsPerGene.data.length;
                        var significanceCellPresentationString = 0;
                        var significanceValue = 0;
                        if (( typeof tissueRecords !== 'undefined')&&
                            (tissueRecords.length>0)){
                            significanceValue = tissueRecords[0].numericalValue,
                            significanceCellPresentationString = "p="+tissueRecords[0].value+" ("+tissueRecords[0].tissueName+")";
                        }

                        var renderData = {  numberOfTissues:recordsPerGene.tissues.length,
                            cellPresentationStringMap:{ Records:recordsCellPresentationString,
                                Significance:significanceCellPresentationString },
                            tissueCategoryNumber:categorizeTissueNumbers( recordsPerGene.tissues.length ),
                            tissuesExist:(recordsPerGene.tissues.length)?[1]:[],
                            geneName:recordsPerGene.geneName,
                            significanceCategoryNumber:categorizeSignificanceNumbers( tissueRecords, "EQT" ),
                            significanceValue:significanceValue,
                            tissues:tissueRecords
                        };
                        intermediateDataStructure.rowsToAdd[0].columnCells[indexOfColumn] = new IntermediateStructureDataCell('eQTL',
                            renderData,'tisseRecord', dataAnnotationTypeCode);
                    };

                }
            });
            intermediateDataStructure.tableToUpdate = "table.combinedGeneTableHolder";


        }


        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
            '#dynamicGeneTable',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'geneTableGeneHeaders');
    };
    var displayGenesPerTissueFromEqtl = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        var returnObject = createNewDisplayReturnObject();
        _.forEach(getAccumulatorObject("genesForEveryTissue"), function (eachTissue) {
            returnObject.uniqueTissues.push({name: eachTissue.tissueName});

            var recordToDisplay = {genes: []};
            _.forEach(eachTissue.genes, function (eachGene) {
                recordToDisplay.genes.push({geneName: eachGene})
            });
            if (!returnObject.geneTissueEqtls.includes(recordToDisplay)) {
                returnObject.geneTissueEqtls.push(recordToDisplay);
            }

        });
        addAdditionalResultsObject({genesPerTissueFromEqtl: returnObject});
        prepareToPresentToTheScreen("#dynamicTissueHolder div.dynamicUiHolder",
            '#dynamicTissueTable',
            returnObject,
            clearBeforeStarting, null,
            true,
            'geneTableGeneHeaders');

    };

    /***
     * Gene proximity search
     * @param data
     * @returns {{rawData: Array, uniqueGenes: Array, uniqueTissues: Array}}
     */
    var processRecordsFromProximitySearch = function (data) {
        var returnObject = {
            rawData: [],
            uniqueGenes: [],
            genePositions: [],
            uniqueTissues: [],
            genesPositionsExist: function () {
                return (this.genePositions.length > 0) ? [1] : [];
            },
            genesExist: function () {
                return (this.uniqueGenes.length > 0) ? [1] : [];
            }
        };
        var geneInfoArray = [];
        if (( typeof data !== 'undefined') &&
            ( data !== null ) &&
            (data.is_error === false ) &&
            ( typeof data.listOfGenes !== 'undefined')) {
            if (data.listOfGenes.length === 0) {
                alert(' No genes in the specified region')
            } else {
                _.forEach(data.listOfGenes, function (geneRec) {
                    returnObject.rawData.push(geneRec);
                    if (!returnObject.uniqueGenes.includes(geneRec.name2)) {
                        returnObject.uniqueGenes.push({name: geneRec.name2});
                        returnObject.genePositions.push({name: geneRec.chromosome + ":" + geneRec.addrStart + "-" + geneRec.addrEnd});
                        var chromosomeString = _.includes(geneRec.chromosome, "chr") ? geneRec.chromosome.substr(3) : geneRec.chromosome;
                        geneInfoArray.push({
                                chromosome: chromosomeString,
                                startPos: geneRec.addrStart,
                                endPos: geneRec.addrEnd,
                                name: geneRec.name2,
                                id: geneRec.id
                            }
                        );
                    }
                    ;
                });
            }
        }
        // we have a list of all the genes in the range.  Let's remember that information.
        setAccumulatorObject("geneNameArray", returnObject.uniqueGenes);
        setAccumulatorObject("geneInfoArray", geneInfoArray);
        return returnObject;
    };
    var displayRefinedGenesInARange = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var selectorForIidForTheTargetDiv = idForTheTargetDiv;
        $(selectorForIidForTheTargetDiv).empty();

        addAdditionalResultsObject({refinedGenesInARange: objectContainingRetrievedRecords});


        var intermediateDataStructure = new IntermediateDataStructure();

        if (typeof objectContainingRetrievedRecords.rawData !== 'undefined') {
            // set up the headers, and give us an empty row of column cells
            _.forEach(objectContainingRetrievedRecords.rawData, function (oneRecord,index) {
                intermediateDataStructure.headerNames.push(oneRecord.name1);
                intermediateDataStructure.headerContents.push(Mustache.render($("#dynamicGeneTableHeaderV2")[0].innerHTML, oneRecord));
                // alert('needs to be fixed 1');
                intermediateDataStructure.headers.push(new IntermediateStructureDataCell(oneRecord.name1,
                    Mustache.render($("#dynamicGeneTableHeaderV2")[0].innerHTML, oneRecord),"geneHeader asc ",'LIT'));
            });

            intermediateDataStructure.tableToUpdate = "table.combinedGeneTableHolder";
        }


        prepareToPresentToTheScreen("#dynamicGeneHolder div.dynamicUiHolder",
            '#dynamicGeneTable',
            objectContainingRetrievedRecords,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'geneTableGeneHeaders');

    };


    var processRecordsFromVariantQtlSearch = function (data) {
        var returnObject = {
            rawData: [],
            uniqueGenes: [],
            uniquePhenotypes: [],
            uniqueVarIds: []
        };
        if (( typeof data !== 'undefined') &&
            ( typeof data.data !== 'undefined') &&
            ( typeof data.header !== 'undefined') &&
            ( data.header.length > 0 )) {
            var varIdIndex = _.indexOf(data.header, 'VAR_ID');
            var geneIndex = _.indexOf(data.header, 'GENE');
            var phenotypeIndex = _.indexOf(data.header, 'PHENOTYPE');
            var positionIndex = _.indexOf(data.header, 'POS');
            var numberOfElements = data.data[0].length;
            for (var variant = 0; variant < numberOfElements; variant++) {
                var varId = data.data[varIdIndex][variant];
                var gene = data.data[geneIndex][variant];
                var phenotype = data.data[phenotypeIndex][variant];
                var position = data.data[positionIndex][variant];
                if (!returnObject.uniqueGenes.includes(gene)) {
                    returnObject.uniqueGenes.push(gene);
                }
                ;
                if (!returnObject.uniquePhenotypes.includes(phenotype)) {
                    returnObject.uniquePhenotypes.push(phenotype);
                }
                ;
                if (!returnObject.uniqueVarIds.includes(varId)) {
                    returnObject.uniqueVarIds.push(varId);
                }
                ;

                var variantIndex = _.findIndex(getAccumulatorObject("phenotypesForEveryVariant"), {variantName: varId});
                if (variantIndex < 0) {
                    var accumulatorArray = getAccumulatorObject("phenotypesForEveryVariant");
                    accumulatorArray.push({
                        variantName: varId,
                        phenotypes: [phenotype],
                        position: position
                    });
                    setAccumulatorObject("phenotypesForEveryVariant", accumulatorArray);
                } else {
                    var accumulatorElement = getAccumulatorObject("phenotypesForEveryVariant")[variantIndex];
                    if (!accumulatorElement.phenotypes.includes(phenotype)) {
                        accumulatorElement.phenotypes.push(phenotype);
                    }
                }

                var phenotIndex = _.findIndex(getAccumulatorObject("variantsForEveryPhenotype"), {phenotypeName: phenotype});
                if (phenotIndex < 0) {
                    var accumulatorArray = getAccumulatorObject("variantsForEveryPhenotype");
                    accumulatorArray.push({phenotypeName: phenotype, variants: [varId]});
                    setAccumulatorObject("variantsForEveryPhenotype", accumulatorArray);
                } else {
                    var accumulatorElement = getAccumulatorObject("variantsForEveryPhenotype")[phenotIndex];
                    if (!accumulatorElement.variants.includes(phenotype)) {
                        accumulatorElement.variants.push(phenotype);
                    }
                }


                returnObject.rawData.push({varId: varId, gene: gene, phenotype: phenotype});
            }
        } else {
            alert('API call return to unexpected result. Is the KB fully functional?');
        }
        returnObject.uniqueGenes = returnObject.uniqueGenes.sort();
        returnObject.uniquePhenotypes = returnObject.uniquePhenotypes.sort();
        returnObject.uniqueVarIds = returnObject.uniqueVarIds.sort();
        return returnObject;
    };
    var displayVariantRecordsFromVariantQtlSearch = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        $(idForTheTargetDiv).empty();
        // _.forEach(objectContainingRetrievedRecords.uniqueVarIds,function(oneTissue) {
        //     $(idForTheTargetDiv).append('<div class="resultElementPerLine">'+oneTissue+'</div>');
        // });

        var returnObject = createNewDisplayReturnObject();
        var selectorForIidForTheTargetDiv = idForTheTargetDiv;
        $(selectorForIidForTheTargetDiv).empty();
        _.forEach(_.sortBy(getAccumulatorObject("phenotypesForEveryVariant"), ['position']), function (variantWithPhenotypes) {
            returnObject.uniqueVariants.push({variantName: variantWithPhenotypes.variantName});

            var recordToDisplay = {phenotypes: []};
            _.forEach(variantWithPhenotypes.phenotypes, function (eachPhenotype) {
                recordToDisplay.phenotypes.push({phenotypeName: eachPhenotype})
            });
            returnObject.variantPhenotypeQtl.push(recordToDisplay);

        });
        addAdditionalResultsObject({variantRecordsFromVariantQtlSearch: returnObject});


        prepareToPresentToTheScreen(idForTheTargetDiv,
            '#dynamicPhenotypeTable',
            returnObject,
            clearBeforeStarting, null,
            true,
            'variantTableVariantHeaders');


    };
    var displayPhenotypeRecordsFromVariantQtlSearch = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        $(idForTheTargetDiv).empty();
        // _.forEach(objectContainingRetrievedRecords.uniquePhenotypes,function(onePhenotype) {
        //     $(idForTheTargetDiv).append('<div class="resultElementPerLine">'+onePhenotype+'</div>');
        // });

        var returnObject = createNewDisplayReturnObject();
        var selectorForIidForTheTargetDiv = idForTheTargetDiv;
        $(selectorForIidForTheTargetDiv).empty();
        _.forEach(_.sortBy(getAccumulatorObject("variantsForEveryPhenotype"), ['phenotypeName']), function (phenotypesWithVariants) {
            returnObject.uniquePhenotypes.push({phenotypeName: phenotypesWithVariants.phenotypeName});

            var recordToDisplay = {variants: []};
            _.forEach(phenotypesWithVariants.variants, function (eachVariant) {
                recordToDisplay.variants.push({variantName: eachVariant})
            });
            returnObject.phenotypeVariantQtl.push(recordToDisplay);

        });
        addAdditionalResultsObject({phenotypeRecordsFromVariantQtlSearch: returnObject});
        prepareToPresentToTheScreen(idForTheTargetDiv, '#dynamicPhenotypeTable', returnObject, clearBeforeStarting);
        // $(idForTheTargetDiv).empty().append(Mustache.render($('#dynamicPhenotypeTable')[0].innerHTML,
        //     returnObject
        // ));

    };

    var displayContext = function (idForTheTargetDiv, objectContainingRetrievedRecords) {
        var contextDescr = objectContainingRetrievedRecords;
        // Do we actually use this routine?
        $(idForTheTargetDiv).empty().append(Mustache.render($('#contextDescriptionSection')[0].innerHTML,
            contextDescr
        ));
    };


    /***
     * constructor we need when inverting an array to figure out what which sells we need to display
     * @param useGenes
     * @param useTissues
     * @param usePhenotypes
     * @returns {{}}
     * @constructor
     */
    var InversionArray = function (useGenes,useTissues,usePhenotypes){
        var returnObject = {};
        if (useGenes){
            returnObject['genes'] = [];
        }
        if (useTissues){
            returnObject['tissues'] = [];
        }
        if (usePhenotypes){
            returnObject['phenotypes'] = [];
        }
        return returnObject;
    };



    var displayEqtlsGivenVariantList = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        displayVariantDataWithHiddenTissuesAndSummaryLines(idForTheTargetDiv,"eqtlsAggregatedPerVariant",'eQTL','eQTL',
            "noRecordTemplate","undefinedTissueRecord","#dynamicEqtlVariantTableBody",
            "#dynamicEqtlVariantTableBodySummaryRecord", "table.combinedVariantTableHolder",'variantTableVariantHeaders',
            undefined, 0.05,
        true, true);


    };

    var displayAbcGivenVariantList = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        displayVariantDataWithHiddenTissuesAndSummaryLines(idForTheTargetDiv,"abcAggregatedPerVariant",'ABC','ABC',
            "noRecordTemplate","undefinedTissueRecord","#dynamicEqtlVariantTableBody",
            "#dynamicEqtlVariantTableBodySummaryRecord", "table.combinedVariantTableHolder",'variantTableVariantHeaders',
            undefined, undefined,
        true, true);

    }


    var displayDnaseGivenVariantList = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        displayVariantDataWithHiddenTissuesAndSummaryLines(idForTheTargetDiv,"dnaseAggregatedPerVariant",'DNase','DNase',
            "noRecordTemplate","undefinedTissueRecord","#dynamicDnaseVariantTableBody",
            "#dynamicDnaseVariantTableBodySummaryRecord", "table.combinedVariantTableHolder",'variantTableVariantHeaders',
            undefined, undefined,
        false, true);
    };


    var displayH3k27acGivenVariantList = function (idForTheTargetDiv, objectContainingRetrievedRecords) {

        displayVariantDataWithHiddenTissuesAndSummaryLines(idForTheTargetDiv,"h3k27acAggregatedPerVariant",'H3k27ac','H3k27ac',
            "noRecordTemplate","undefinedTissueRecord","#dynamicH3k27acVariantTableBody",
            "#dynamicH3k27acVariantTableBodySummaryRecord", "table.combinedVariantTableHolder",'variantTableVariantHeaders',
            undefined, undefined,
        false, true);
    };


    /***
     * This complicated routine serves as a general-purpose display IF:
     *      we are considering a variant based table
     *      Results are to be separated by tissue, but aggregated by Gene
     * The challenge we try to address here is that we have a long linear list of records, and we need to
     * convert that list into an array where each cell contains only data that is relevant to its
     * specific row and column.  Furthermore we may wish to filter out some records based on their
     * numerical value
     *
     * @param idForTheTargetDiv
     * @param nameOfAccumulatorObject
     * @param category
     * @param displayCategory
     * @param noRecordTemplate
     * @param undefinedTissueRecord
     * @param cellBodyRecord
     * @param cellBodySummaryRecord
     * @param tableToUpdate
     * @param typeOfTable
     * @param minimumValue
     * @param maximumValue
     * @param matchOnGene
     * @param matchOnTissue
     */
    var displayVariantDataWithHiddenTissuesAndSummaryLines = function(  idForTheTargetDiv,nameOfAccumulatorObject,category,displayCategory,
                                                                        noRecordTemplate,undefinedTissueRecord,cellBodyRecord,
                                                                        cellBodySummaryRecord,tableToUpdate, typeOfTable,
                                                                        minimumValue,maximumValue,
                                                                        matchOnGene,matchOnTissue){
        var returnObject = createNewDisplayReturnObject();

        var intermediateDataStructure = new IntermediateDataStructure();
        var recordsAggregatedPerVariant = getAccumulatorObject(nameOfAccumulatorObject);
        if (( typeof recordsAggregatedPerVariant !== 'undefined') && ( recordsAggregatedPerVariant.length > 0)) {

            // fill in all of the column cells
            var variantNameArray = getAccumulatorObject("variantNameArray");
            var allArraysOfTissueNames = _.map(recordsAggregatedPerVariant, function (o) {
                return o.uniqueTissueNames
            });
            var everyTissueToDisplay = _.uniq(_.flatten(_.union(allArraysOfTissueNames))).sort();
            _.forEach(everyTissueToDisplay, function (aTissue) {
                var tissueRow = {
                    category: category,
                    displayCategory: displayCategory,
                    subcategory: "tissueRecord "+aTissue+" "+category,
                    displaySubcategory: aTissue,
                    columnCells: [],
                    sortField: "summary "+category+"x"
                };
                var dataWorthDisplayingExists = false;
                alert('needs to be fixed 2');
                _.forEach(variantNameArray, function (aVariant, indexOfColumn) {
                    var recordsPerVariant = _.find(recordsAggregatedPerVariant, {variant: aVariant});
                    if (typeof  recordsPerVariant === 'undefined') {
                        tissueRow.columnCells[indexOfColumn] = new IntermediateStructureDataCell(aTissue,
                            "<div class='noDataHere" + tissueRow.category + "' sortField=0></div>", "tissueRecord");
                    } else {
                        var perTissuePerVariant = _.merge(_.filter(recordsPerVariant.tissues, {tissueName: aTissue}), {category: tissueRow.category});
                        if ((typeof perTissuePerVariant === 'undefined')||
                            ((typeof minimumValue !== 'undefined')&&(perTissuePerVariant[0].value<minimumValue))||
                            ((typeof maximumValue !== 'undefined')&&(perTissuePerVariant[0].value>maximumValue))){
                            tissueRow.columnCells[indexOfColumn] = new IntermediateStructureDataCell(aTissue,
                                "<div class='noDataHere " + tissueRow.category + "' sortField=0></div>", "tissueRecord");
                        } else {
                            tissueRow.columnCells[indexOfColumn] = new IntermediateStructureDataCell(aTissue,
                                Mustache.render($(cellBodyRecord)[0].innerHTML, perTissuePerVariant), "tissueRecord");
                            dataWorthDisplayingExists = true;
                        }
                    }

                });
                if (dataWorthDisplayingExists){
                    intermediateDataStructure.rowsToAdd.push(tissueRow);
                }

            });

            // I might need to create a summary line
            if (intermediateDataStructure.rowsToAdd.length > 0) {
                var invertedArray = [];
                var rememberCategoryFromOneLine = "none";
                _.map(intermediateDataStructure.rowsToAdd, function (oneRow) {
                    if (invertedArray.length === 0) {
                        invertedArray = new Array(oneRow.columnCells.length);
                        rememberCategoryFromOneLine = oneRow.category;
                    }
                    _.forEach(oneRow.columnCells, function (cell, index) {
                        var domVersionOfCell = $(cell.content);
                        if (domVersionOfCell.hasClass("variantRecordExists")) {
                            if (typeof invertedArray[index] === 'undefined') {
                                invertedArray[index] = new InversionArray(matchOnGene,matchOnTissue,false);
                            }
                            var geneName = domVersionOfCell.attr('geneName');
                            if ((matchOnGene) && (!invertedArray[index].genes.includes(geneName))) {
                                invertedArray[index].genes.push(geneName);
                            }
                            if ((matchOnTissue) && (!invertedArray[index].tissues.includes(oneRow.subcategory))) {
                                invertedArray[index].tissues.push(oneRow.subcategory);
                            }
                        }
                    });
                });
                var summaryRow = {
                    displayCategory: '<button type="button" class="btn btn-info shower ' + rememberCategoryFromOneLine + '" ' +
                    'onclick="mpgSoftware.dynamicUi.displayTissuesForAnnotation(\'' + rememberCategoryFromOneLine + '\',\''+nameOfAccumulatorObject+'\',\''+tableToUpdate+'\')">display tissues</button>' +
                    '<button type="button" class="btn btn-info hider ' + rememberCategoryFromOneLine + '" ' +
                    'onclick="mpgSoftware.dynamicUi.hideTissuesForAnnotation(\'' + rememberCategoryFromOneLine + '\',\''+nameOfAccumulatorObject+'\',\''+tableToUpdate+'\')"  style="display: none">hide tissues</button>',
                    category: rememberCategoryFromOneLine,
                    sortField: "summary "+rememberCategoryFromOneLine,
                    subcategory: rememberCategoryFromOneLine,
                    displaySubcategory: rememberCategoryFromOneLine,
                    columnCells: []
                };
                _.forEach(invertedArray, function (summaryColumn, index) {
                    if (typeof summaryColumn === 'undefined') {
                        summaryRow.columnCells.push(new IntermediateStructureDataCell(rememberCategoryFromOneLine,
                            Mustache.render($('#emptySummaryVariantAnnotationRecord')[0].innerHTML), "zzzsummary"));
                    } else {

                        if (summaryColumn.tissues.length === 0) {
                            summaryRow.columnCells.push(new IntermediateStructureDataCell(rememberCategoryFromOneLine,
                                Mustache.render($('#emptySummaryVariantAnnotationRecord')[0].innerHTML), "zzzsummary"));
                        } else {
                            var argumentForMustache = {category: rememberCategoryFromOneLine};
                            if (matchOnGene){
                                argumentForMustache["geneNumber"]=  summaryColumn.genes.length;
                            }
                            if (matchOnTissue){
                                argumentForMustache["tissueNumber"]=  summaryColumn.tissues.length;
                            }
                            summaryRow.columnCells.push(new IntermediateStructureDataCell(rememberCategoryFromOneLine,
                                Mustache.render($(cellBodySummaryRecord)[0].innerHTML, argumentForMustache
                                ), "zzzsummary")
                            );
                        }

                    }
                });
                intermediateDataStructure.rowsToAdd.push(summaryRow);
            }

            intermediateDataStructure.tableToUpdate = tableToUpdate;
        }

        prepareToPresentToTheScreen(idForTheTargetDiv,
            '#unused',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            typeOfTable);
    }



    var displayVariantsForAPhenotype = function  (idForTheTargetDiv,objectContainingRetrievedRecords) {

        var variantAnnotationAppearance = function(annotationName,recordsPerVariant,indexOfColumn,intermediateDataStructure,numberOfVariants,
                                                   testToRun,category){
            alert('needs to be fixed 3');
            var row = _.find(intermediateDataStructure.rowsToAdd,{'subcategory':annotationName});
            if ( typeof row === 'undefined'){
                var colCells = [];
                for (var i=0;i<numberOfVariants;i++){
                    colCells.push(new IntermediateStructureDataCell(annotationName,
                        Mustache.render($("#dynamicVariantCellAssociations")[0].innerHTML,{"variantAnnotationIsPresent":false}),category));
                }
                intermediateDataStructure.rowsToAdd.push ({ category: category,
                    displayCategory:category,
                    subcategory: annotationName,
                    displaySubcategory: annotationName,
                    columnCells:  colCells});
                row = _.find(intermediateDataStructure.rowsToAdd,{'subcategory':annotationName});
            }
            if (category ==='annotation'){
                var present = testToRun(recordsPerVariant)?[1]:[];
                row.columnCells[indexOfColumn] = new IntermediateStructureDataCell(annotationName,
                    Mustache.render($("#dynamicVariantCellAssociations")[0].innerHTML,{"variantAnnotationIsPresent":present}),category);
            }else if (category ==='association'){
                var valueToDisplay = testToRun(recordsPerVariant);
                row.columnCells[indexOfColumn] = new IntermediateStructureDataCell(annotationName,
                        Mustache.render($("#dynamicVariantCellAssociations")[0].innerHTML,{"valueToDisplay":valueToDisplay}),category);
            } else {
                alert('foo!');
            }

        };

        $(idForTheTargetDiv).empty();

        var returnObject = createNewDisplayReturnObject();
        returnObject.variantsToAnnotate = objectContainingRetrievedRecords;

        addAdditionalResultsObject({variantRecordsForOnePhenotypeQtlSearch:returnObject});







        var intermediateDataStructure = new IntermediateDataStructure();
        // variants that we will want to annotate in the variant table
        if (( typeof returnObject.variantsToAnnotate !== 'undefined') && (!$.isEmptyObject(returnObject.variantsToAnnotate))){
            // set up the headers, and give us an empty row of column cells
            _.forEach(returnObject.variantsToAnnotate.variants, function (oneRecord, index){
                if( typeof oneRecord !== 'undefined'){
                    intermediateDataStructure.headers.push(new IntermediateStructureDataCell(oneRecord.VAR_ID,
                        Mustache.render($("#dynamicVariantHeader")[0].innerHTML,{variantName:oneRecord.VAR_ID, index: index+2}),"variantHeader") );
                    //  intermediateDataStructure.columnCells.push ("");
                }
            });
            setAccumulatorObject("variantNameArray", _.map(intermediateDataStructure.headers, function (headerRec){return headerRec.title}));
            intermediateDataStructure.rowsToAdd = [];
            var numberOfVariants = returnObject.variantsToAnnotate.variants.length;
            // fill in all of the column cells covering each of our annotations
            if ( typeof returnObject.variantsToAnnotate.variants !== 'undefined'){
                _.forEach(returnObject.variantsToAnnotate.variants, function (recordsPerVariant){
                    var headerNames = _.map(intermediateDataStructure.headers, function (headerRecord){
                        return headerRecord.title
                    });
                    var indexOfColumn = _.indexOf(headerNames,recordsPerVariant.VAR_ID);
                    if (indexOfColumn===-1){
                        console.log("Did not find index of recordsPerVariant.VAR_ID.  Shouldn't we?")
                    }else {
                        _.forEach([ 'Coding',
                            'Splice site',
                            'UTR',
                            'Promoter',
                            'P-value'], function (eachAnnotation){
                            switch (eachAnnotation){
                                case 'Coding':
                                    variantAnnotationAppearance('Coding',recordsPerVariant,indexOfColumn,intermediateDataStructure,numberOfVariants,
                                        function(v){return ((v.MOST_DEL_SCORE > 0)&&(v.MOST_DEL_SCORE < 4))},'annotation');
                                    break;
                                case 'Splice site':
                                    variantAnnotationAppearance('Splice_site',recordsPerVariant,indexOfColumn,intermediateDataStructure,numberOfVariants,
                                        function(v){return (v.Consequence.indexOf('splice')>-1)},'annotation');
                                    break;
                                case 'UTR':
                                    variantAnnotationAppearance('UTR',recordsPerVariant,indexOfColumn,intermediateDataStructure,numberOfVariants,
                                        function(v){return (v.Consequence.indexOf('UTR')>-1)},'annotation');
                                    break;
                                case 'Promoter':
                                    variantAnnotationAppearance('Promoter',recordsPerVariant,indexOfColumn,intermediateDataStructure,numberOfVariants,
                                        function(v){return (v.Consequence.indexOf('promoter')>-1)},'annotation');
                                    break;
                                case 'P-value':
                                    variantAnnotationAppearance('P-value',recordsPerVariant,indexOfColumn,intermediateDataStructure,numberOfVariants,
                                        function(v){return UTILS.realNumberFormatter(""+v.P_VALUE)},'association');
                                    break;
                                default: break;
                            }
                        });
                    }
                });

            }
            intermediateDataStructure.tableToUpdate = "table.combinedVariantTableHolder";

        }









        prepareToPresentToTheScreen(idForTheTargetDiv,
            '#dynamicVariantTable',
            returnObject,
            clearBeforeStarting,
            intermediateDataStructure,
            true,
            'variantTableVariantHeaders');

    };




    var retrieveRemotedContextInformation=function(collectionOfRemoteCallingParameters){

        var objectContainingRetrievedRecords = [];
        var promiseArray = [];



        _.forEach(collectionOfRemoteCallingParameters.multiples,function(eachRemoteCallingParameter){
            var rememberUrl = eachRemoteCallingParameter.retrieveDataUrl;
            var rememberData = eachRemoteCallingParameter.dataForCall;
            promiseArray.push(
                $.ajax({
                    cache: false,
                    type: "post",
                    url: eachRemoteCallingParameter.retrieveDataUrl,
                    data: eachRemoteCallingParameter.dataForCall,
                    async: true
                }).done(function (data, textStatus, jqXHR) {

                    var accumulatorObject;
                    if ( typeof collectionOfRemoteCallingParameters.nameOfAccumulatorField  !== 'undefined'){
                        accumulatorObject =  getAccumulatorObject(collectionOfRemoteCallingParameters.nameOfAccumulatorField);
                    }
                    objectContainingRetrievedRecords = eachRemoteCallingParameter.processEachRecord( data, accumulatorObject);

                }).fail(function (jqXHR, textStatus, errorThrown) {
                    loading.hide();
                    alert("Ajax call failed, url="+rememberUrl+", data="+rememberData+".");
                    core.errorReporter(jqXHR, errorThrown)
                })
            );
        });


        $.when.apply($, promiseArray).then(function(allCalls) {

            if (( typeof collectionOfRemoteCallingParameters.displayRefinedContextFunction !== 'undefined') &&
                ( collectionOfRemoteCallingParameters.displayRefinedContextFunction !== null ) ) {

                collectionOfRemoteCallingParameters.displayRefinedContextFunction(   collectionOfRemoteCallingParameters.placeToDisplayData,
                    objectContainingRetrievedRecords );

            } else if  ( typeof collectionOfRemoteCallingParameters.actionId !== 'undefined')  {

                var actionToUndertake = actionContainer( collectionOfRemoteCallingParameters.actionId, actionDefaultFollowUp(collectionOfRemoteCallingParameters.actionId) );
                actionToUndertake();

            } else {

                alert("we had no follow-up action.  That's okay, right?");

            }


        }, function(e) {
            alert("Ajax call failed.");
        });

    };


    var buildRemoteContextArray = function(startingMaterials){
        var returnValue = {multiples:[]};
        if(( typeof startingMaterials !== 'undefined') &&
            ( typeof startingMaterials.retrieveDataUrl !== 'undefined') &&
            ( typeof startingMaterials.dataForCall !== 'undefined') &&
            ( typeof startingMaterials.processEachRecord !== 'undefined') &&
            ( !Array.isArray(startingMaterials.displayRefinedContextFunction) ) &&
            ( !Array.isArray(startingMaterials.placeToDisplayData) ) ){
                var retrieveDataUrlMultiple = (Array.isArray(startingMaterials.retrieveDataUrl))?
                    startingMaterials.retrieveDataUrl:[startingMaterials.retrieveDataUrl];
                var dataForCallMultiple = (Array.isArray(startingMaterials.dataForCall))?
                    startingMaterials.dataForCall:[startingMaterials.dataForCall];
                var processEachRecordMultiple = (Array.isArray(startingMaterials.processEachRecord))?
                    startingMaterials.processEachRecord:[startingMaterials.processEachRecord];
                _.forEach(retrieveDataUrlMultiple,function(eachRetrieveDataUrl){
                    _.forEach(dataForCallMultiple,function(eachDataForCall){
                        _.forEach(processEachRecordMultiple,function(eachprocessEachRecord){
                            returnValue.multiples.push({ retrieveDataUrl:eachRetrieveDataUrl,
                                                        dataForCall: eachDataForCall,
                                                        processEachRecord:eachprocessEachRecord });
                        });
                    });
                });
                returnValue["displayRefinedContextFunction"] = startingMaterials.displayRefinedContextFunction;
                returnValue["placeToDisplayData"] = startingMaterials.placeToDisplayData;
                returnValue["actionId"] = startingMaterials.actionId;
                returnValue["nameOfAccumulatorField"] = startingMaterials.nameOfAccumulatorField;
        } else {
                console.log("Serious error: incorrect fields in startingMaterials = "+startingMaterials.name+".")
            };
        return returnValue;
    };



    var installDirectorButtonsOnTabs =  function ( additionalParameters) {
        /***
         * The area above the tabs with a button connected to an input box
         * @type {{directorButtons: *[]}}
         */
        var objectDescribingDirectorButtons = {
            directorButtons: [{buttonId: 'topLevelContextOfTheDynamicUiButton', buttonName: 'Reset context',
                description: 'Change the locus under consideration',
                inputBoxId:'inputBoxForDynamicContextId', reference: 'none?' }]
        };
        $("#contextControllersInDynamicUi").empty().append(Mustache.render($('#contextControllerDescriptionSection')[0].innerHTML,
            objectDescribingDirectorButtons
        ));

        /***
         * gene tab
         * @type {{directorButtons: *[]}}
         */
        objectDescribingDirectorButtons = {
            directorButtons: [
                //{buttonId: 'getTissuesFromProximityForLocusContext', buttonName: 'proximity',
                //    description: 'present all genes overlapping  the specified region',
                //    outputBoxId:'#dynamicGeneHolder div.dynamicUiHolder', reference: '#' },
                //{buttonId: 'getTissuesFromEqtlsForGenesTable', buttonName: 'eQTL',
                //    description: 'present all genes overlapping  the specified region for which some eQTL relationship exists',
                //    outputBoxId:'#dynamicGeneHolder div.dynamicUiHolder',
                //    reference: 'https://www.genome.gov/27543767/genotypetissue-expression-project-gtex'},
                //{buttonId: 'modAnnotationButtonId', buttonName: 'MOD',
                //    description: 'list mouse knockout annotations  for all genes overlapping the specified region',
                //    outputBoxId:'#dynamicGeneHolder div.dynamicUiHolder',
                //    reference: 'http://www.informatics.jax.org/phenotypes.shtml'},
                //{buttonId: 'getTissuesFromAbcForGenesTable', buttonName: 'ABC',
                //    description: 'get a list of regions associated with a gene via ABC test',
                //    outputBoxId:'#dynamicGeneHolder div.dynamicUiHolder',
                //    reference: 'http://science.sciencemag.org/content/354/6313/769'},
                //{buttonId: 'getRecordsFromECaviarForGeneTable', buttonName: 'eCaviar',
                //    description: 'find all genes for which co-localized variants exist',
                //    outputBoxId:'#dynamicGeneHolder div.dynamicUiHolder',
                //    reference: 'https://www.ncbi.nlm.nih.gov/pubmed/27866706'},
                {buttonId: 'retrieveMultipleRecordsTest', buttonName: 'redraw',
                    description: 'redraw table',
                    outputBoxId:'#dynamicGeneHolder div.dynamicUiHolder',
                    reference: 'https://www.ncbi.nlm.nih.gov/pubmed/27866706'}
            ]
        };
        $("#dynamicGeneHolder div.directorButtonHolder").empty().append(Mustache.render($('#templateForDirectorButtonsOnATab')[0].innerHTML,
            objectDescribingDirectorButtons
        ));
        //$("#dynamicGeneHolder div.directorButtonHolder").style('display','none');

        /***
         * variant tab
         * @type {{directorButtons: {buttonId: string, buttonName: string, description: string}[]}}
         */
        objectDescribingDirectorButtons = {
            directorButtons: [
                {buttonId: 'getVariantsFromQtlAndThenRetrieveEpigeneticData', buttonName: 'multi',
                    description: 'build a variant based table with a collection of epigenetic data',
                    outputBoxId:'#dynamicVariantHolder div.dynamicUiHolder',
                    reference: 'https://s3.amazonaws.com/broad-portal-resources/tutorials/Genetic_association_primer.pdf'}
            ]
        };
        $("#dynamicVariantHolder div.directorButtonHolder").empty().append(Mustache.render($('#templateForDirectorButtonsOnATab')[0].innerHTML,
            objectDescribingDirectorButtons
        ));
        //$("#dynamicVariantHolder div.directorButtonHolder").style('display','none');

        /***
         * tissue tab
         * @type {{directorButtons: {buttonId: string, buttonName: string, description: string}[]}}
         */
        objectDescribingDirectorButtons = {
            directorButtons: [
                {buttonId: 'getTissuesFromEqtlsForTissuesTable', buttonName: 'eQTL',
                    description: 'find all tissues for which eQTLs exist foraging in the specified range',
                    outputBoxId:'#dynamicTissueHolder div.dynamicUiHolder',
                    reference: 'https://www.genome.gov/27543767/genotypetissue-expression-project-gtex'},
                {buttonId: 'getPhenotypesFromECaviarForTissueTable', buttonName: 'eCaviar',
                    description: 'find all tissues for which co-localized variants exist',
                    outputBoxId:'#dynamicTissueHolder div.dynamicUiHolder',
                    reference: 'https://www.ncbi.nlm.nih.gov/pubmed/27866706'},
                {buttonId: 'getRecordsFromAbcForTissueTable', buttonName: 'ABC',
                    description: 'find all tissues identified in the ABC gene-enhancer screen',
                    outputBoxId:'#dynamicTissueHolder div.dynamicUiHolder',
                    reference: 'http://science.sciencemag.org/content/354/6313/769'}
                ]
        };
        $("#dynamicTissueHolder div.directorButtonHolder").empty().append(Mustache.render($('#templateForDirectorButtonsOnATab')[0].innerHTML,
            objectDescribingDirectorButtons
        ));

        /***
         * phenotype tab
         * @type {{directorButtons: *[]}}
         */
        objectDescribingDirectorButtons = {
            directorButtons: [{buttonId: 'getPhenotypesFromQtlForPhenotypeTable', buttonName: 'QTL',
                description: 'find all phenotypes for which QTLs exist in the above',
                outputBoxId:'#dynamicGeneHolder div.dynamicUiHolder',
                reference: 'https://s3.amazonaws.com/broad-portal-resources/tutorials/Genetic_association_primer.pdf'},
                {buttonId: 'getPhenotypesFromECaviarForPhenotypeTable', buttonName: 'eCAVIAR',
                    description: 'find all variants which co-localize with eQTLs',
                    outputBoxId:'#dynamicGeneHolder div.dynamicUiHolder',
                    reference: 'https://www.ncbi.nlm.nih.gov/pubmed/27866706'}]
        };
        $("#dynamicPhenotypeHolder div.directorButtonHolder").empty().append(Mustache.render($('#templateForDirectorButtonsOnATab')[0].innerHTML,
            objectDescribingDirectorButtons
        ));

    };





    var modifyScreenFields = function (data, additionalParameters) {

        setDyanamicUiVariables(additionalParameters);

        $('#inputBoxForDynamicContextId').typeahead({
            source: function (query, process) {
                $.get(additionalParameters.generalizedTypeaheadUrl, {query: query}, function (data) {
                    process(data, additionalParameters);
                })
            },
            afterSelect: function(selection) {
                //alert('not sure if we want a default behavior here?');;
            }
        });


        // manually set the range
        $('#topLevelContextOfTheDynamicUiButton').on('click', function () {

            var actionToUndertake = actionContainer("replaceGeneContext", actionDefaultFollowUp("replaceGeneContext"));
            actionToUndertake();
        });

        // pull back mouse annotations
        $('#modAnnotationButtonId').on('click', function () {
      //      resetAccumulatorObject("modNameArray");

            var actionToUndertake = actionContainer('getAnnotationsFromModForGenesTable', actionDefaultFollowUp("getAnnotationsFromModForGenesTable"));
            actionToUndertake();


        });

        // perform an eQTL based lookup
        $('#getTissuesFromEqtlsForGenesTable').on('click', function () {

            var actionToUndertake = actionContainer('getTissuesFromEqtlsForGenesTable', actionDefaultFollowUp("getTissuesFromEqtlsForGenesTable"));
            actionToUndertake();
        });



        $('#getTissuesFromAbcForGenesTable').on('click', function () {

            var actionToUndertake = actionContainer("getTissuesFromAbcForGenesTable", actionDefaultFollowUp("getTissuesFromAbcForGenesTable"));
            actionToUndertake();

        });



        // assign the correct response to the proximity range go button
        $('#getTissuesFromProximityForLocusContext').on('click', function () {

            var actionToUndertake = actionContainer("getTissuesFromProximityForLocusContext", actionDefaultFollowUp("getTissuesFromProximityForLocusContext"));
            actionToUndertake();

        });


        $('#getVariantsFromQtlForContextDescription').on('click', function () {

            var actionToUndertake = actionContainer("getVariantsFromQtlForContextDescription", actionDefaultFollowUp("getVariantsFromQtlForContextDescription"));
            actionToUndertake();

        });


        $('#getTissuesFromEqtlsForTissuesTable').on('click', function () {

            var actionToUndertake = actionContainer("getTissuesFromEqtlsForTissuesTable", actionDefaultFollowUp("getTissuesFromEqtlsForTissuesTable"));
            actionToUndertake();

        });


        $('#getPhenotypesFromQtlForPhenotypeTable').on('click', function () {

            var actionToUndertake = actionContainer("getPhenotypesFromQtlForPhenotypeTable", actionDefaultFollowUp("getPhenotypesFromQtlForPhenotypeTable"));
            actionToUndertake();

        });



        $('#getPhenotypesFromECaviarForPhenotypeTable').on('click', function () {

            var actionToUndertake = actionContainer("getPhenotypesFromECaviarForPhenotypeTable", actionDefaultFollowUp("getPhenotypesFromECaviarForPhenotypeTable"));
            actionToUndertake();

        });

        $('#getPhenotypesFromECaviarForTissueTable').on('click', function () {
            var actionToUndertake = actionContainer("getPhenotypesFromECaviarForTissueTable", actionDefaultFollowUp("getPhenotypesFromECaviarForTissueTable"));
            actionToUndertake();
        });



        $('#getRecordsFromECaviarForGeneTable').on('click', function () {
            var actionToUndertake = actionContainer("getRecordsFromECaviarForGeneTable", actionDefaultFollowUp("getRecordsFromECaviarForGeneTable"));
            actionToUndertake();
        });



        $('#getRecordsFromAbcForTissueTable').on('click', function () {
            var actionToUndertake = actionContainer("getRecordsFromAbcForTissueTable", actionDefaultFollowUp("getRecordsFromAbcForTissueTable"));
            actionToUndertake();
        });


        // Everything that happens on the gene table
        $('#retrieveMultipleRecordsTest').on('click', function () {
            var arrayOfRoutinesToUndertake = [];

            resetAccumulatorObject("geneNameArray");
            resetAccumulatorObject("geneInfoArray");
//
            resetAccumulatorObject("tissuesForEveryGene");
            resetAccumulatorObject("genesForEveryTissue");
//
            resetAccumulatorObject("rawDepictInfo");
//
            resetAccumulatorObject("abcAggregatedPerVariant");
            resetAccumulatorObject("sharedTable_table.combinedGeneTableHolder");

            resetAccumulatorObject("modNameArray");


            destroySharedTable('table.combinedGeneTableHolder');

            arrayOfRoutinesToUndertake.push( actionContainer("getTissuesFromProximityForLocusContext",
                actionDefaultFollowUp("getTissuesFromProximityForLocusContext")));

            // arrayOfRoutinesToUndertake.push( actionContainer("getTissuesFromAbcForGenesTable",
            //    actionDefaultFollowUp("getTissuesFromAbcForGenesTable")));

            // arrayOfRoutinesToUndertake.push( actionContainer('getTissuesFromEqtlsForGenesTable',
            //    actionDefaultFollowUp("getTissuesFromEqtlsForGenesTable")));

            arrayOfRoutinesToUndertake.push( actionContainer('getGeneAssociationsForGenesTable',
                actionDefaultFollowUp("getGeneAssociationsForGenesTable")));

            arrayOfRoutinesToUndertake.push( actionContainer('getInformationFromDepictForGenesTable',
                actionDefaultFollowUp("getInformationFromDepictForGenesTable")));

            arrayOfRoutinesToUndertake.push( actionContainer('getAnnotationsFromModForGenesTable',
                 actionDefaultFollowUp("getAnnotationsFromModForGenesTable")));



            arrayOfRoutinesToUndertake.push( actionContainer('getDepictGeneSetForGenesTable',
                actionDefaultFollowUp("getDepictGeneSetForGenesTable")));

            arrayOfRoutinesToUndertake.push( actionContainer('getRecordsFromECaviarForGeneTable',
                actionDefaultFollowUp("getRecordsFromECaviarForGeneTable")));

            arrayOfRoutinesToUndertake.push( actionContainer('getRecordsFromColocForGeneTable',
                actionDefaultFollowUp("getRecordsFromColocForGeneTable")));

            arrayOfRoutinesToUndertake.push( actionContainer('getSkatGeneAssociationsForGeneTable',
                actionDefaultFollowUp("getSkatGeneAssociationsForGeneTable")));

            arrayOfRoutinesToUndertake.push( actionContainer('getFirthGeneAssociationsForGeneTable',
                actionDefaultFollowUp("getFirthGeneAssociationsForGeneTable")));


            _.forEach(arrayOfRoutinesToUndertake, function(oneFunction){oneFunction()});


        });


        // Everything that happens on the variant table
        $('#getVariantsFromQtlAndThenRetrieveEpigeneticData').on('click', function () {

            resetAccumulatorObject("sharedTable_table.combinedVariantTableHolder");
            destroySharedTable('table.combinedVariantTableHolder');
            var arrayOfRoutinesToUndertake = [];

            arrayOfRoutinesToUndertake.push( actionContainer('getVariantsWeWillUseToBuildTheVariantTable',
                actionDefaultFollowUp("getVariantsWeWillUseToBuildTheVariantTable")));

            arrayOfRoutinesToUndertake.push( actionContainer('getEqtlsGivenVariantList',
                actionDefaultFollowUp("getEqtlsGivenVariantList")));


            arrayOfRoutinesToUndertake.push( actionContainer('getABCGivenVariantList',
                actionDefaultFollowUp("getABCGivenVariantList")));

            arrayOfRoutinesToUndertake.push( actionContainer('getDnaseGivenVariantList',
                actionDefaultFollowUp("getDnaseGivenVariantList")));

            arrayOfRoutinesToUndertake.push( actionContainer('getH3k27acGivenVariantList',
                actionDefaultFollowUp("getH3k27acGivenVariantList")));


            _.forEach(arrayOfRoutinesToUndertake, function(oneFunction){oneFunction()});


        });




        resetAccumulatorObject();


        //displayContext('#contextDescription',getAccumulatorObject());

        if (additionalParameters.exposeDynamicUi === "1"){
            $('#retrieveMultipleRecordsTest').click();
        }


    };



    var adjustExtentHolders = function(storageField,spanClass,basesToShift){
        var extentBegin = parseInt( getAccumulatorObject(storageField) );
        if ((extentBegin+basesToShift)>0){
            extentBegin += basesToShift;
        } else {
            extentBegin = 0;
        }
        setAccumulatorObject(storageField,extentBegin);
        $(spanClass).html(""+extentBegin);
        resetAccumulatorObject("geneNameArray");
        resetAccumulatorObject("geneInfoArray");
        resetAccumulatorObject("tissueNameArray");
    };

    var adjustLowerExtent = function(basesToShift){
        if (basesToShift>0){
            if ( ( parseInt(getAccumulatorObject("extentBegin") )+basesToShift ) > //
                 ( parseInt(getAccumulatorObject("extentEnd") ) ) ){
                return;
            }
        }
        adjustExtentHolders("extentBegin","span.dynamicUiGeneExtentBegin",basesToShift);
    };

    var adjustUpperExtent = function(basesToShift){
        if (basesToShift<0){
            if ( ( parseInt(getAccumulatorObject("extentEnd") )+basesToShift ) < //
                 ( parseInt(getAccumulatorObject("extentBegin") ) ) ){
                return;
            }
        }
        adjustExtentHolders("extentEnd","span.dynamicUiGeneExtentEnd",basesToShift);
    };


    var buildMultiTissueDisplay  = function(     allUniqueElementNames,
                                                allUniqueTissueNames,
                                                dataMatrix,
                                                additionalParams,
                                                 tooltipLocation,
                                                cssSelector ){
        var correlationMatrix = dataMatrix;
        var xlabels = additionalParams.stateColorBy;
        var ylabels = allUniqueTissueNames;
        var margin = {top: 50, right: 50, bottom: 100, left: 250},
            width = 750 - margin.left - margin.right,
            height = 800 - margin.top - margin.bottom;
        var varsImpacter = baget.varsImpacter()
            .height(height)
            .width(width)
            .margin(margin)
            .renderCellText(1)
            .xlabelsData(xlabels)
            .ylabelsData(ylabels)
            .startColor('#ffffff')
            .endColor('#3498db')
            .endRegion(additionalParams.regionEnd)
            .startRegion(additionalParams.regionStart)
            .xAxisLabel('genomic position')
            .mappingInfo(additionalParams.mappingInformation)
            .colorByValue(1)
            .tooltipLocation(tooltipLocation)
            .dataHanger(cssSelector, correlationMatrix);
        d3.select(cssSelector).call(varsImpacter.render);
    };


    /***
     * Default constructor of the SharedTableObject
     * @param additionalParameters
     * @returns {{extentBegin: (*|jQuery), extentEnd: (*|jQuery), chromosome: string, originalGeneName: *, geneNameArray: Array, tissueNameArray: Array, modNameArray: Array, mods: Array, contextDescr: {chromosome: string, extentBegin: (*|jQuery), extentEnd: (*|jQuery), moreContext: Array}}}
     */
    var SharedTableObject = function (annotation,numberOfColumn,numberOfRows){
        return {
            originalForm: annotation,
            currentForm: annotation,
            numberOfColumns: numberOfColumn,
            numberOfRows: numberOfRows,
            mostRecentHeaders : [],
            dataCells: new Array()
        };
    };
    var TempSharedTableObject = function (numberOfRows,numberOfColumn,dataCells){
        return {
            numberOfColumns: numberOfColumn,
            numberOfRows: numberOfRows,
            dataCells: dataCells
        };
    };
    var SharedTableDataCell = function (title,renderData,annotation, ascensionNumber, dataAnnotationTypeCode){
        renderData["ascensionNumber"] = ascensionNumber;
        return renderData;
        // return {
        //     title: title,
        //     renderData: renderData,
        //     annotation: annotation,
        //     ascensionNumber:ascensionNumber,
        //     dataAnnotationTypeCode:dataAnnotationTypeCode
        // };
    };
    var IntermediateStructureDataCell = function (name,renderData, annotation, dataAnnotationTypeCode){
        return {
            dataAnnotationTypeCode:dataAnnotationTypeCode,
            renderData:renderData,
            title: name,
            annotation:  annotation
        };
    };


    var storeCellInMemoryRepresentationOfSharedTable = function (   whichTable,
                                                                    cell,
                                                                    annotation,
                                                                    rowIndex,
                                                                    columnIndex,
                                                                    numberOfColumns ){
        var indexInOneDimensionalArray = (rowIndex*numberOfColumns)+columnIndex;
        var sharedTable = getAccumulatorObject("sharedTable_"+whichTable);
        if (($.isArray(sharedTable)) && (sharedTable.length === 0)){
            // data structure is empty.  Let us give it the correct form, and then store it
            sharedTable = new SharedTableObject(annotation,numberOfColumns,rowIndex);
            setAccumulatorObject("sharedTable_"+whichTable,sharedTable);
        }
        if (indexInOneDimensionalArray > sharedTable.length){
            // we must be on a new row. We know that rows are added sequentially
            sharedTable.dataCells.push.apply(sharedTable.dataCells, new Array(numberOfColumns));
        }
        sharedTable.dataCells [indexInOneDimensionalArray] = new SharedTableDataCell(   cell.title,
                                                                                        cell,
                                                                                        cell.annotation,
                                                                                        indexInOneDimensionalArray,
                                                                                        cell.dataAnnotationTypeCode
            );
        // update the row count
        var maximumLinearDataLength = sharedTable.dataCells.length;
        sharedTable.numberOfRows = Math.floor(maximumLinearDataLength/numberOfColumns);
    }



        var generalPurposeSort  = function(a, b, direction, currentSort, sortTermOverride ){

            var defaultSearchField = 'sortField';
            switch (currentSort){
                // case 'geneMethods':
                //     var textA = $(a).attr(defaultSearchField).toUpperCase();
                //     var textB = $(b).attr(defaultSearchField).toUpperCase();
                //     return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                //     break;
                case 'variantAnnotationCategory':
                case 'methods':
                    var textA = $(a).attr(defaultSearchField).toUpperCase();
                    var textB = $(b).attr(defaultSearchField).toUpperCase();
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                    break;
                case 'geneMethods':
                case 'H3k27ac':
                case 'DNase':
                //case 'ABC':
                //case 'eQTL':
                case 'variantHeader':
                    var x = parseInt($(a).attr(defaultSearchField));
                    var y = parseInt($(b).attr(defaultSearchField));
                    if ( (-1===x) && (-1===y) ) {
                        return 0;
                    }
                    else if (-1===x) {
                        if (direction==='asc') {
                            return -1;
                        } else {
                            return 1;
                        }
                    }else if (-1===y)
                    {
                        if (direction==='asc') {
                            return 1;
                        } else {
                            return -1;
                        }
                    }
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                case 'Promoter':
                case 'Splice_site':
                case 'UTR':
                case 'Coding':
                    var x = parseInt($(a).attr(defaultSearchField));
                    var y = parseInt($(b).attr(defaultSearchField));
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    break;
                case 'P-value':
                    var x = parseFloat($(a).attr(defaultSearchField));
                    var y = parseFloat($(b).attr(defaultSearchField));
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    break;
                case 'eQTL':
                case 'DEPICT':
                case 'MetaXcan':
                case 'ABC':
                case 'MOD':
                case 'eCAVIAR':
                case 'COLOC':
                case 'Firth':
                case 'SKAT':
                    defaultSearchField = sortTermOverride;
                    var x = parseFloat($(a).attr(defaultSearchField));
                    if (isNaN(x)){
                        x = parseInt($(a).attr('subSortField'));
                    }
                    var y = parseFloat($(b).attr(defaultSearchField));
                    if (isNaN(y)){
                        y = parseInt($(b).attr('subSortField'));
                    }
                    if ( (-1===x) && (-1===y) ) {
                        return 0;
                    }
                    else if (-1===x) {
                        if (direction==='asc') {
                            return -1;
                        } else {
                            return 1;
                        }
                    }else if (-1===y)
                    {
                        if (direction==='asc') {
                            return 1;
                        } else {
                            return -1;
                        }
                    }
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    break;
                case 'geneHeader':
                    defaultSearchField = sortTermOverride;
                    var x = parseFloat($(a).attr(defaultSearchField));
                    if (isNaN(x)){
                        x = parseInt($(a).attr('subSortField'));
                    }
                    var y = parseFloat($(b).attr(defaultSearchField));
                    if (isNaN(y)){
                        y = parseInt($(b).attr('subSortField'));
                    }
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    break;
                case  'geneFarLeftCorner':
                    var textA = a.trim().toUpperCase();
                    var textB = b.trim().toUpperCase();
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                    break;
                case 'straightAlphabetic':
                    var textA = a.trim().toUpperCase();
                    var textB = b.trim().toUpperCase();
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                    break;
                case 'straightAlphabeticWithSpacesOnTop':
                    var textA = a.trim().toUpperCase();
                    var textAEmpty = (textA.length===0);
                    var textB = b.trim().toUpperCase();
                    var textBEmpty = (textB.length===0);
                    if ( textAEmpty && textBEmpty ) {
                        return 0;
                    }
                    else if ( textAEmpty ) {
                        if (direction==='asc') {
                            return -1;
                        } else {
                            return 1;
                        }
                    }else if ( textBEmpty )
                    {
                        if (direction==='asc') {
                            return 1;
                        } else {
                            return -1;
                        }
                    }
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                    break;
                default:
                    break;
            }
//            alert('currentSort='+currentSort+'.');
            var x = UTILS.extractAnchorTextAsInteger(a);
            var y = UTILS.extractAnchorTextAsInteger(b);
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        }



        var findCellColoringChoice=function(whereTheTableGoes){
            var sharedTable = getAccumulatorObject("sharedTable_" + whereTheTableGoes);
            if ( typeof sharedTable.cellColoringScheme === 'undefined'){
                sharedTable["cellColoringScheme"] = "Significance";
            }
            return sharedTable.cellColoringScheme;
        }





    var findDesiredSearchTerm=function(){
            var favoredSortField = 'sortField';
            var cellColoringScheme = findCellColoringChoice('table.combinedGeneTableHolder');
            if ( cellColoringScheme === 'Significance'){
                favoredSortField = 'significance_sortfield'
            }
            return favoredSortField;
        }



        jQuery.fn.dataTableExt.oSort['generalSort-asc'] = function (a, b ) {
            var currentSortRequest = getAccumulatorObject("currentSortRequest");

            return generalPurposeSort(a,b,'asc',currentSortRequest.currentSort,findDesiredSearchTerm());
        };

        jQuery.fn.dataTableExt.oSort['generalSort-desc'] = function (a, b) {
            var currentSortRequest = getAccumulatorObject("currentSortRequest");
            if (currentSortRequest.currentSort === "variantAnnotationCategory"){
                return generalPurposeSort(a,b,'desc',currentSortRequest.currentSort,findDesiredSearchTerm());
            } else {
                return generalPurposeSort(b,a,'desc',currentSortRequest.currentSort,findDesiredSearchTerm());
            }
        };



var howToHandleSorting = function(e,callingObject,typeOfHeader,dataTable) {
    var classList = $(callingObject).attr("class").split(/\s+/);
    // we need to find out the index of this column, which is potentially tricky, since after
    //  a transposed sorting the column may have moved. So we pull our unique identifier for every
    //  cell (initialLinearIndex_) out, and then march across every header and compare its unique
    //  number, and when we find a match then we know the index of our column.
    var columnNumberValue = -1;
    var initialLinearIndex = extractClassBasedIndex($(callingObject)[0].innerHTML,"initialLinearIndex_");
    var numberOfHeaders = dataTable.table().columns()[0].length;
    if (initialLinearIndex !== -1){
        _.each(_.range(0,numberOfHeaders),function(index){
            var header=dataTable.table().column(index).header();
            if ( typeof header.children[0] !== 'undefined'){
                var divDom = $(header.children[0].outerHTML);
                if (extractClassBasedIndex(divDom,"initialLinearIndex_")===initialLinearIndex){
                    columnNumberValue = index;
                }
            }
        });
    }
    var sortOrder =  'asc';
    var currentSortRequestObject = {};
    _.forEach(classList, function (oneClass){
        var sortOrderDesignation = "sorting_";
        if ( oneClass.substr(0,sortOrderDesignation.length) === sortOrderDesignation ){
            sortOrder =   oneClass.substr(sortOrderDesignation.length);
        }
        switch (oneClass){
            case 'Firth':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'SKAT':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'eQTL':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'DEPICT':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'MOD':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'MetaXcan':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'ABC':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'geneHeader':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'geneFarLeftCorner':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                //currentSortRequestObject = {
                //    'currentSort':'straightAlphabeticWithSpacesOnTop',
                //    'table':'table.combinedGeneTableHolder'
                //};
                break;
            case 'geneMethods':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'methods':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;

            case 'variantTableVarHeader':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'variantHeader':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'variantAnnotationCategory':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'Coding':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'Splice_site':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'UTR':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'Promoter':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'P-value':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'H3k27ac':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'DNase':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'ABC':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'eQTL':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedVariantTableHolder'
                };
                break;
            case 'eCAVIAR':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;
            case 'COLOC':
                currentSortRequestObject = {
                    'currentSort':oneClass,
                    'table':'table.combinedGeneTableHolder'
                };
                break;

            default:
                break;
        }
    });
    var actualColumnIndex = columnNumberValue;
    currentSortRequestObject['sortOrder'] = (sortOrder === 'asc')?'desc':'asc';
    currentSortRequestObject['columnNumberValue'] = actualColumnIndex;
    var setOfColumnsToSort = [];
    if ((typeOfHeader === "variantTableVariantHeaders")&&
        ( currentSortRequestObject.currentSort !== "variantAnnotationCategory")){
        setOfColumnsToSort.push([0,'asc']);
        if ( currentSortRequestObject.currentSort !== 'methods'){
            setOfColumnsToSort.push([1,'asc']);
        }
    }
    else  if ((typeOfHeader === "geneTableGeneHeaders")&&
        ( currentSortRequestObject.currentSort === "geneHeader")){
       // setOfColumnsToSort.push([0,'desc']);
    }
    setOfColumnsToSort.push([ currentSortRequestObject.columnNumberValue, currentSortRequestObject.sortOrder ]);
    setAccumulatorObject("currentSortRequest", currentSortRequestObject );

    dataTable
        .order( setOfColumnsToSort )
        .draw();
};


    var getDisplayableCellContent  = function (intermediateStructureDataCell,indexInOneDimensionalArray){
        var returnValue = "";
        //var displayDetails = getDatatypeInformation( intermediateStructureDataCell.dataAnnotationTypeCode );
        switch (intermediateStructureDataCell.dataAnnotationTypeCode){
            case 'LIT': // a literal. Used when we recall the headers straight from the table
                returnValue = intermediateStructureDataCell.renderData;
                break;
            case 'EMC':  // an empty cell
                returnValue = Mustache.render($('#dynamicGeneTableEmptyRecord')[0].innerHTML,intermediateStructureDataCell.renderData);
                break;
            case 'EMP':  // the first two columns are always empty, but contains some information in render data
                returnValue = Mustache.render($('#emptyRecord')[0].innerHTML,intermediateStructureDataCell.renderData);
                break;
            case 'GHD':  // the first two columns are always empty, but contains some information in render data
                returnValue = Mustache.render($('#dynamicGeneTableHeaderV2')[0].innerHTML,intermediateStructureDataCell.renderData);
                break;
            // case 'CAT':  // the first two columns on each annotation row
            //     displayDetails["indexInOneDimensionalArray"]=indexInOneDimensionalArray;
            //     var returnValue = Mustache.render($('#'+displayDetails.dataAnnotation.categoryWriter)[0].innerHTML,displayDetails);
            //     break;
            // case 'SUB':
            //     displayDetails["indexInOneDimensionalArray"]=indexInOneDimensionalArray;
            //     var returnValue = Mustache.render($('#'+displayDetails.dataAnnotation.subCategoryWriter)[0].innerHTML,displayDetails);
            //     break;

            default:  //  the standard case, where a cell renders its own data using its chosen mustache template
                var cellColoringScheme ="records";
                intermediateStructureDataCell.renderData["cellPresentationString"] =
                    intermediateStructureDataCell.renderData.cellPresentationStringMap[findCellColoringChoice('table.combinedGeneTableHolder')];
                var displayDetails = getDatatypeInformation(intermediateStructureDataCell.dataAnnotationTypeCode);
                returnValue = Mustache.render($('#'+displayDetails.dataAnnotation.cellBodyWriter)[0].innerHTML,intermediateStructureDataCell.renderData);
                break;

        }
        return returnValue.trim();
    };

    /***
     * Initiate the jQuery data table and build its headers. This routine expects objects
     * inside each element of the array which will have
     * {contents:'whatever HTML you want to display in a cell',
     *  name:'a string which every cell can reference to figure out which column it belongs in'}
     *
     *  If the length is zero then don't make a table.
     *
     *  Return a pointer to the data table
     *
     * @param headerArray
     */
    var buildHeadersForTable = function (   whereTheTableGoes,
                                            headers,// object with title, content, and ascensionNumber (and annotation?)
                                            storeHeadersInDataStructure,
                                            typeOfHeader,
                                            prependColumns,
                                            additionalDetailsForHeaders ){
        if (( typeof headers !== 'undefined') &&
            (headers.length > 0)){
            var datatable;
            if ( ! $.fn.DataTable.isDataTable( whereTheTableGoes ) ) {
                var headerDescriber = {
                   // "aaSorting": [[ 1, "asc" ]],
                    "dom": '<"top">rt<"bottom"iplB>',
                    "buttons": [
                        {extend: "copy", text: "Copy all to clipboard"},
                        {extend: "csv", text: "Copy all to csv"},
                        {extend: "pdf", text: "Copy all to pdf"}
                    ],
                    "aLengthMenu": [
                        [100, 500, -1],
                        [100, 500, "All"]
                    ],
                    "bDestroy": true,
                    "bSort": true,
                    "bAutoWidth": false,
                    "aoColumnDefs": []
                };
                // if we are building the table for the first time *only*, then give it a default ordering
                if (storeHeadersInDataStructure){
                    headerDescriber["aaSorting"] =  [[ 1, "asc" ]];
                }
                var addedColumns = [];
                if (prependColumns){ // we may wish to add in some columns based on metadata about a row.
                                     //  Definitely we don't if we are transposing, however, since we've already built that material
                    var sortability = [];
                    switch(typeOfHeader){
                        case 'geneTableGeneHeaders':
                            addedColumns.push(new IntermediateStructureDataCell('farLeftCorner',
                                {initialLinearIndex:"initialLinearIndex_0"},
                                'geneFarLeftCorner','EMP'));
                            sortability.push(true);
                            addedColumns.push(new IntermediateStructureDataCell('b',
                                {initialLinearIndex:"initialLinearIndex_1"},
                                'geneMethods','EMP'));
                            sortability.push(true);
                            break;
                        case 'variantTableVariantHeaders':
                            addedColumns.push(new IntermediateStructureDataCell('farLeftCorner',
                                {initialLinearIndex:"initialLinearIndex_0"},
                                'variantAnnotationCategory','EMP'));
                            sortability.push(true);
                            addedColumns.push(new IntermediateStructureDataCell('b',
                                {initialLinearIndex:"initialLinearIndex_1"},
                                'methods','EMP'));
                            sortability.push(true);
                            break;
                        case 'variantTableAnnotationHeaders':
                        case 'geneTableAnnotationHeaders':
                        default:
                            break;
                    }
                    _.forEach(addedColumns, function (column, index){
                        var contentOfHeader = getDisplayableCellContent(column);
                        headerDescriber.aoColumnDefs.push({
                            "title": contentOfHeader,
                            "targets": (sortability[index])?[0,index]:'nosort',
                            "name": column.title,
                            "className": column.annotation+" initialLinearIndex_"+index,
                            "sortable": sortability[index],
                            "type": "generalSort"
                        });
                    });

                }



                var numberOfAddedColumns = addedColumns.length;
                 _.forEach(headers, function (header, count) {
                     var classesToPromote = [];
                     // first let us extract any classes that we need to promote to the header
                     var headerContent = getDisplayableCellContent(header);
                     if ((headerContent.length>0)&&
                         ( typeof  $(headerContent).attr("class") !== 'undefined')){
                         var classList = $(headerContent).attr("class").split(/\s+/);
                         var currentSortRequestObject = {};
                         _.forEach(classList, function (oneClass){
                             var sortOrderDesignation = "sorting_";
                             if ( oneClass.substr(0,sortOrderDesignation.length) === sortOrderDesignation ){
                                 classesToPromote.push (oneClass);
                             }
                         });
                     }
                     var contentOfHeader = headerContent;
                     if ((typeOfHeader === 'variantTableAnnotationHeaders')&&
                         (additionalDetailsForHeaders.length > 0)){
                         contentOfHeader += getDisplayableCellContent(additionalDetailsForHeaders[count]);
                     }
                     if ((typeOfHeader === 'geneTableAnnotationHeaders')&&
                         (additionalDetailsForHeaders.length > 0)){
                         contentOfHeader += getDisplayableCellContent(additionalDetailsForHeaders[count]);
                     }

                     var initialLinearIndex = extractClassBasedIndex(headerContent,"initialLinearIndex_");
                     if (initialLinearIndex === -1){
                         var domContent = $(headerContent);
                         domContent.addClass("initialLinearIndex_"+(count+numberOfAddedColumns));
                         contentOfHeader = '';
                         _.forEach(domContent,function(domElement){
                             if ( typeof domElement.outerHTML !== 'undefined'){
                                 contentOfHeader += domElement.outerHTML;
                             }
                         });
                         //contentOfHeader = domContent[0].outerHTML;
                     }


                     //var noSorting = (((count+numberOfAddedColumns)===0)&&(typeOfHeader==='geneTableGeneHeaders'));
                     var noSorting = false;
                     headerDescriber.aoColumnDefs.push({
                        "title": contentOfHeader,
                        "targets": noSorting?'nosort':[count+numberOfAddedColumns],
                        "name": header.title,
                        "className": header.annotation+" "+classesToPromote.join(" "),
                        "sortable": !noSorting,
                        "type": "generalSort"
                    });
                     addedColumns.push(new IntermediateStructureDataCell(header.title,contentOfHeader,header.annotation,'LIT'));
                });
                var headerContents = _.map(headerDescriber.aoColumnDefs,function(o){return
                    o.title
                });
                datatable = $(whereTheTableGoes).DataTable(headerDescriber);


                $(whereTheTableGoes+' th').unbind('click.DT');

                //create your own click handler for the header

                $(whereTheTableGoes+' th').click(function(e){howToHandleSorting(e,this,typeOfHeader,datatable)});


                if (storeHeadersInDataStructure){
                    // do we need to store these headers?
                    var numberOfHeaders = datatable.table().columns().length;
                    _.forEach(datatable.table().columns().header(),function(o,columnIndex){
                        var domElement = $(o);
                        //var contentOfHeader = getDisplayableCellContent(addedColumns[columnIndex]);
                        //var headerName = domElement.text().trim();
                        storeCellInMemoryRepresentationOfSharedTable(whereTheTableGoes,
                            addedColumns[columnIndex],
                            typeOfHeader,
                            0,
                            columnIndex,
                            headerDescriber.aoColumnDefs.length );
                    });
                }
            }
            // update our notion of the header contents
            var sharedTable = getAccumulatorObject("sharedTable_"+whereTheTableGoes);
            sharedTable.mostRecentHeaders  =headerContents;
        }
        return $(whereTheTableGoes).dataTable();

    };


    var refineTableRecords = function (datatable,headerType,adjustVisibilityCategories,headerSpecific){
        if( typeof datatable === 'undefined'){
            console.log(" ERROR: failed to receive a valid datatable parameter");
        } else if (( typeof datatable.DataTable() === 'undefined') ||
            ( typeof datatable.DataTable().columns() === 'undefined') ||
            ( typeof datatable.DataTable().columns().header() === 'undefined') ) {
            console.log(" ERROR: invalid parameter in refineTableRecords");
        } else {
            var whereTheTableGoes = 'table.combinedGeneTableHolder';
            var sharedTable = getAccumulatorObject("sharedTable_" + whereTheTableGoes);

            switch(headerType){
                case 'geneTableGeneHeaders':
                    if (!headerSpecific){
                        $('div.geneAnnotationShifters').hide ();
                        $('div.geneHeaderShifters').show ();

                        if ( typeof sharedTable.cellColoringScheme === 'undefined'){
                            sharedTable["cellColoringScheme"] = "Significance";
                        }
                        if (sharedTable["cellColoringScheme"]==="Records"){
                            $('div.tissueCategory_0').parents('td').css('background',CELL_COLORING_REDDISH_BOTTOM);
                            $('div.tissueCategory_1').parents('td').css('background',CELL_COLORING_REDDISH_TOP);
                            $('div.tissueCategory_2').parents('td').css('background',CELL_COLORING_REDDISH_TOP_MINUS1);
                            $('div.tissueCategory_3').parents('td').css('background',CELL_COLORING_REDDISH_TOP_MINUS2);
                            $('div.tissueCategory_4').parents('td').css('background',CELL_COLORING_REDDISH_TOP_MINUS3);
                            $('div.tissueCategory_5').parents('td').css('background',CELL_COLORING_REDDISH_TOP_MINUS4);
                            $('div.tissueCategory_6').parents('td').css('background',CELL_COLORING_UNUSED);

                        } else if (sharedTable["cellColoringScheme"]==="Significance"){
                            $('div.significanceCategory_0').parents('td').css('background',CELL_COLORING_BLUISH_BOTTOM);
                            $('div.significanceCategory_1').parents('td').css('background',CELL_COLORING_BLUISH_TOP_MINUS1);
                            $('div.significanceCategory_2').parents('td').css('background',CELL_COLORING_BLUISH_TOP_MINUS2);
                            $('div.significanceCategory_3').parents('td').css('background',CELL_COLORING_BLUISH_TOP_MINUS3);
                            $('div.significanceCategory_4').parents('td').css('background',CELL_COLORING_BLUISH_TOP_MINUS4);
                            $('div.significanceCategory_5').parents('td').css('background',CELL_COLORING_BLUISH_BOTTOM);
                            $('div.significanceCategory_6').parents('td').css('background',CELL_COLORING_UNUSED);
                        }
                        $('div.subcategory').css('font-weight','normal');
                    }
                    break;
                case 'geneTableAnnotationHeaders':
                    if (!headerSpecific){
                        $('div.geneAnnotationShifters').show ();
                        $('div.geneHeaderShifters').hide ();

                        if ( typeof sharedTable.cellColoringScheme === 'undefined'){
                            sharedTable["cellColoringScheme"] = "Significance";
                        }
                        if (sharedTable["cellColoringScheme"]==="Records"){
                            $('div.tissueCategory_0').parents('td').css('background',CELL_COLORING_REDDISH_BOTTOM);
                            $('div.tissueCategory_1').parents('td').css('background',CELL_COLORING_REDDISH_TOP);
                            $('div.tissueCategory_2').parents('td').css('background',CELL_COLORING_REDDISH_TOP_MINUS1);
                            $('div.tissueCategory_3').parents('td').css('background',CELL_COLORING_REDDISH_TOP_MINUS2);
                            $('div.tissueCategory_4').parents('td').css('background',CELL_COLORING_REDDISH_TOP_MINUS3);
                            $('div.tissueCategory_5').parents('td').css('background',CELL_COLORING_REDDISH_TOP_MINUS4);
                            $('div.tissueCategory_6').parents('td').css('background',CELL_COLORING_UNUSED);

                        } else if (sharedTable["cellColoringScheme"]==="Significance"){
                           $('div.significanceCategory_0').parents('td').css('background',CELL_COLORING_BLUISH_BOTTOM);
                            $('div.significanceCategory_1').parents('td').css('background',CELL_COLORING_BLUISH_TOP_MINUS1);
                            $('div.significanceCategory_2').parents('td').css('background',CELL_COLORING_BLUISH_TOP_MINUS2);
                            $('div.significanceCategory_3').parents('td').css('background',CELL_COLORING_BLUISH_TOP_MINUS3);
                            $('div.significanceCategory_4').parents('td').css('background',CELL_COLORING_BLUISH_TOP_MINUS4);
                            $('div.significanceCategory_5').parents('td').css('background',CELL_COLORING_BLUISH_BOTTOM);
                            $('div.significanceCategory_6').parents('td').css('background',CELL_COLORING_UNUSED);
                        }
                        $('div.subcategory').css('font-weight','bold');
                    }
                  break;
                case 'variantTableVariantHeaders':
                    if (headerSpecific) {
                        _.forEach(datatable.DataTable().columns().header(),function(o,columnIndex){ //  make nice headers out of VAR_IDs
                            var domElement = $(o);
                            var headerName = domElement.text().trim();
                            if ((headerName.length >  5) &&
                                (headerName.split('_').length === 4)){
                                var partsOfId = headerName.split('_');
                                domElement.addClass("niceHeadersThatAreLinks");
                                domElement.addClass("headersWithVarIds");
                                domElement.attr("defrefa",partsOfId[2]);
                                domElement.attr("defeffa",partsOfId[3]);
                                domElement.attr("chrom",partsOfId[0]);
                                domElement.attr("position",partsOfId[1]);
                                domElement.attr("varid",partsOfId[0]+":"+partsOfId[1]+"_"+
                                    partsOfId[2]+"/"+partsOfId[3]);
                                domElement.attr("data-toggle","popover");
                            }


                        });
                    } else { // adjust the coloration of selected squares
                        if (( typeof adjustVisibilityCategories !== 'undefined') &&
                            (adjustVisibilityCategories.length > 0)){
                            if (adjustVisibilityCategories[0] === "H3k27ac"){
                                for( var i = 0 ; i < 5 ; i++ ){
                                    $('td:has(div.tissueTable.matchingRegion1_'+i+')').addClass('tissueTable matchingRegion1_'+i);
                                }
                            } else if (adjustVisibilityCategories[0] === "DNase"){
                                for( var i = 0 ; i < 5 ; i++ ){
                                    $('td:has(div.tissueTable.matchingRegion2_'+i+')').addClass('tissueTable matchingRegion2_'+i);
                                }
                            }
                            _.forEach(adjustVisibilityCategories,function(adjustVisibilityCategory){
                                if (($.isArray(adjustVisibilityCategory))&&(adjustVisibilityCategory.length>0)){
                                    var elementsToHide = $('div.noDataHere.'+adjustVisibilityCategory);
                                    if (elementsToHide.length>0){
                                        elementsToHide.parent().parent().hide();
                                    }
                                    elementsToHide = $('div.variantRecordExists.'+adjustVisibilityCategory);
                                    if (elementsToHide.length>0){
                                        elementsToHide.parent().parent().hide();
                                    }
                                }

                            });
                            _.forEach($('div.tissueRecord'),function(oneRecord){
                                $(oneRecord).parent().parent().hide();
                            });

                        }

                    }
                    break;
                case 'variantTableAnnotationHeaders':
                    if (headerSpecific) {
                        ;
                    } else { // turn off the visibility of tissue specific
                        var tissueColumnsToHide = $('th.tissueRecord');
                        _.forEach(tissueColumnsToHide,function(oneColumn){
                            var classListForColumn = $(oneColumn).attr("class").split(/\s+/);
                            if (_.includes(classListForColumn,'tissueRecord')){
                                var buildSelector = 'th.'+classListForColumn.join('.');
                                datatable.DataTable().column(buildSelector).visible(false);
                            }

                        });
                    }

                     break;

                default:
                    break;
            }
        }
    };




    var extractClassBasedIndex = function (domString,classNameToExtract) {
        var numberToExtract = -1;
        var classes = $(domString).attr("class");
        if ( typeof classes !== 'undefined'){
            var classList = classes.split(/\s+/);
            _.forEach(classList, function (oneClass) {
                if (oneClass.substr(0, classNameToExtract.length) === classNameToExtract) {
                    numberToExtract = parseInt(oneClass.substr(classNameToExtract.length));
                }
            });
        }
        return numberToExtract;
    }

    var displayCategoryHtml = function (dataAnnotationCode,indexInOneDimensionalArray){
        var displayDetails = getDatatypeInformation( dataAnnotationCode );
        displayDetails["indexInOneDimensionalArray"]=indexInOneDimensionalArray;
        var returnValue = Mustache.render($('#'+displayDetails.dataAnnotation.categoryWriter)[0].innerHTML,displayDetails);
        return returnValue;
    }
    var displaySubcategoryHtml = function (dataAnnotationCode,indexInOneDimensionalArray){
        var displayDetails = getDatatypeInformation( dataAnnotationCode );
        displayDetails["indexInOneDimensionalArray"]=indexInOneDimensionalArray;
        var returnValue = Mustache.render($('#'+displayDetails.dataAnnotation.subCategoryWriter)[0].innerHTML,displayDetails);
        return returnValue;
    }



    var addContentToTable = function (  whereTheTableGoes,
                                        rowsToAdd,
                                        storeRecordsInDataStructure,
                                        typeOfRecord,
                                        prependColumns){
        var rememberCategories = [];
        _.forEach(rowsToAdd, function (row,newRowCount) {
            if ( !_.includes (rememberCategories,row.category)) {
                rememberCategories.push(row.category);
            } else if ( !_.includes (rememberCategories,row.subcategory)) {
                rememberCategories.push(row.subcategory);
            }

            var numberOfExistingRows = $(whereTheTableGoes).dataTable().DataTable().rows()[0].length+1;
            var sharedTable = getAccumulatorObject("sharedTable_"+whereTheTableGoes);
            var numberOfColumns  = sharedTable.numberOfColumns;
            var rowDescriber = [];
            var numberOfColumnsAdded = 0;
            var indexInOneDimensionalArray;
            if (prependColumns){
                 switch (typeOfRecord) {
                    case 'geneTableGeneHeaders':
                        indexInOneDimensionalArray = (numberOfExistingRows*numberOfColumns);
                        rowDescriber.push( new IntermediateStructureDataCell(row.category,
                            displayCategoryHtml(row.code,indexInOneDimensionalArray),
                            //getDisplayableCellContent(new IntermediateStructureDataCell (row.category,{},row.category,'CAT')),
                            row.subcategory,"LIT")) ;
                        indexInOneDimensionalArray++;
                        rowDescriber.push( new IntermediateStructureDataCell(row.subcategory,
                            displaySubcategoryHtml(row.code,indexInOneDimensionalArray),
                            //getDisplayableCellContent(new IntermediateStructureDataCell (row.subcategory,{},row.subcategory,'SUB')),
                            "insertedColumn2","LIT"));
                        numberOfColumnsAdded += rowDescriber.length;
                        break;
                    case 'variantTableVariantHeaders':
                        indexInOneDimensionalArray = (numberOfExistingRows*numberOfColumns);
                        var primarySortField =  ( typeof row.sortField === 'undefined') ? row.category : row.sortField;
                        rowDescriber.push( new IntermediateStructureDataCell(row.category,
                            getDisplayableCellContent(new IntermediateStructureDataCell (row.category,{},row.category,'CAT')),
                                               // "<div class='"+row.subcategory+
                                               // " initialLinearIndex_"+indexInOneDimensionalArray+" variantRow' sortField='"+primarySortField+"'>"+
                                                row.displayCategory+"</div>" ,
                                                row.subcategory)) ;
                        indexInOneDimensionalArray++;
                        rowDescriber.push( new IntermediateStructureDataCell(row.subcategory,
                                                // "<div class='subcategory "+
                                                // " initialLinearIndex_"+indexInOneDimensionalArray+" variantRow' sortField='"+row.subcategory+"'>"+
                                                // row.displaySubcategory+"</div>" ,
                            getDisplayableCellContent(new IntermediateStructureDataCell (row.subcategory,{},row.subcategory,'SUB')),
                                                "insertedColumn2"));
                        numberOfColumnsAdded += rowDescriber.length;
                        break;
                    case 'geneTableAnnotationHeaders':
                        break;
                    default:
                        break;
                }

                _.forEach(rowDescriber, function(oneRow,columnIndex){
                    if (storeRecordsInDataStructure) {
                        storeCellInMemoryRepresentationOfSharedTable(whereTheTableGoes,
                            oneRow,
                            'content',
                            numberOfExistingRows,
                            columnIndex,
                            numberOfColumns);
                    }
                });



            }
            _.forEach(rowDescriber, function(oneRow,columnIndex){
                if ( !_.includes (rememberCategories,oneRow.title)) {
                    rememberCategories.push(oneRow.title);
                }
            });


            _.forEach(row.columnCells, function (val, index) {
                // if (( typeof val !== 'undefined') &&
                //     ( typeof val.content !== 'undefined')){
                    var valContent =  getDisplayableCellContent(val);
                    var initialLinearIndex = extractClassBasedIndex(valContent,"initialLinearIndex_");
                    if (initialLinearIndex === -1){
                        var domContent = $(valContent);
                        indexInOneDimensionalArray = (numberOfExistingRows*numberOfColumns)+index + numberOfColumnsAdded;
                        val.renderData['initialLinearIndex'] = "initialLinearIndex_"+indexInOneDimensionalArray;
                        //domContent.addClass("initialLinearIndex_"+indexInOneDimensionalArray);
                        //valContent = domContent[0].outerHTML;
                    }
                    rowDescriber.push(val);
                    if (storeRecordsInDataStructure){
                        storeCellInMemoryRepresentationOfSharedTable(whereTheTableGoes,
                            val,
                            'content',
                            numberOfExistingRows,
                            index + numberOfColumnsAdded,
                            numberOfColumns);
                    }

                // }
            });

            $(whereTheTableGoes).dataTable().fnAddData(_.map(rowDescriber,function(o){return getDisplayableCellContent(o)}));

        });
        return rememberCategories;
    }




    var buildOrExtendDynamicTable = function (whereTheTableGoes,intermediateStructure,
                                              storeRecords,typeOfRecord) {
        var datatable;

        if (( typeof intermediateStructure !== 'undefined') &&
            ( typeof intermediateStructure.headers !== 'undefined') &&
            (intermediateStructure.headers.length > 0)){
                datatable = buildHeadersForTable(whereTheTableGoes,intermediateStructure.headers,
                    storeRecords,typeOfRecord, true, []);
                refineTableRecords(datatable,typeOfRecord,[], true);
        }


        if (( typeof intermediateStructure.rowsToAdd !== 'undefined') &&
            (intermediateStructure.rowsToAdd.length > 0)){
            datatable =  $(whereTheTableGoes).dataTable();
            var rememberCategories = addContentToTable(whereTheTableGoes,intermediateStructure.rowsToAdd,
                                                    storeRecords,typeOfRecord, true);
            refineTableRecords(datatable,typeOfRecord,rememberCategories, false);
        }


    };


 var formConversionOfATranspose = function (originalForm){
     var currentForm = "";
     switch (originalForm){
         case 'geneTableGeneHeaders':
             currentForm = 'geneTableAnnotationHeaders';
             break;
         case 'variantTableVariantHeaders':
             currentForm = 'variantTableAnnotationHeaders';
             break;
         case 'geneTableAnnotationHeaders':
             currentForm = 'geneTableGeneHeaders';
             break;
         case 'variantTableAnnotationHeaders':
             currentForm = 'variantTableVariantHeaders';
             break;
         default:
             console.log("CRITICAL ERROR: unrecognized table form = "+ originalForm +"." );

     }
     return currentForm;
 }


    /***
     * This operation can extract everything that's in the table in the form of HTML.  However we store a little additional information
     * about each cell as well, and this is particularly useful when a cell becomes a header upon transposition. Can we put an index
     * on every cell that would allow us to match it up with the original information that we store?
     *
     * @param whereTheTableGoes
     * @returns {Array}
     */
    var extractSortedDataFromTable = function (whereTheTableGoes,numberOfRows,numberOfColumns,tableAndOrientation) {
        var fullDataVector = [];
        var dataTable = $(whereTheTableGoes).dataTable().DataTable();
        var numberOfHeaders = dataTable.table().columns()[0].length;
        _.each(_.range(0,numberOfHeaders),function(index){
            var header=dataTable.table().column(index).header();
            var divContents;
            if ( typeof header.children[0] === 'undefined'){
                // I'm completely unclear about why this special case is required.  It seems as if the first header in
                // the gene table has no div.  But why?  All the other headers have DIVs.  Here's a workaround until I can figure it out.
                divContents = '<div class="initialLinearIndex_0 geneFarLeftCorner"></div>'
            } else {
                divContents = header.children[0].outerHTML;
            }
            fullDataVector.push(divContents);
        });
        if (tableAndOrientation ==='variantTableAnnotationHeaders'){// in this case we collapse the first row into the header, so we now need to re-extract it into data
            _.each(_.range(0,numberOfHeaders),function(index){
                var header=dataTable.table().column(index).header();
                fullDataVector.push(header.children[1].outerHTML);
            });
        }
        if (tableAndOrientation ==='geneTableAnnotationHeaders'){// in this case we collapse the first row into the header, so we now need to re-extract it into data
           _.each(_.range(0,numberOfHeaders),function(index){
               var header=dataTable.table().column(index).header();
               fullDataVector.push(header.children[1].outerHTML);
           });
        }
         var dataFromTable = dataTable.rows().data();
        _.forEach(dataFromTable, function (row, rowIndex) {
            _.forEach(row, function (cell, columnIndex) {
                fullDataVector.push(cell);
            });
        });
        var sharedTable = getAccumulatorObject("sharedTable_"+whereTheTableGoes);
        var returnValue = [];
        _.forEach(fullDataVector,function(oneCell){
            var initialLinearIndex = extractClassBasedIndex(oneCell,"initialLinearIndex_");
            var associatedData = _.find(sharedTable.dataCells,{ascensionNumber:initialLinearIndex})
            returnValue.push(associatedData);
        });
        return returnValue;
    }


    var linearDataTransposor = function (linearArray,numberOfRows,numberOfColumns,mapper){
        var temporaryArray = [];
        _.forEach(linearArray, function (oneCell, linearIndex){
            var xIndex = linearIndex%numberOfColumns;
            //var yIndex = linearIndex%numberOfRows;
            var yIndex = Math.floor(linearIndex/numberOfRows);
            var newIndex = mapper(xIndex,yIndex,numberOfRows,numberOfColumns);//(yIndex*numberOfRows)+xIndex;
            temporaryArray.push({newIndex:newIndex,cell: oneCell});
        });
        var nowTransposed = _.sortBy(temporaryArray,['newIndex']);
        return _.map(nowTransposed,'cell');
    }


    // var matrixMultiply


    /***
     *   Give this function a table, and it will transpose it.  The basic parts of this routine are:
     *     Look at the current form, and decide whether we need to switch the number of cols and rows
     *     Once we know, then pull all the data (including headers) out of the Jquery datatable. This gives us the cells and their sorted order
     *     Use the sorted cell information to retrieve the original data in each cell from a place where we stored it. (extractSortedDataFromTable)
     *     Destroy the old table
     *     Now we have the data from the original table data. Transpose it using linearDataTransposor
     *     Build the new table
     *
     * @param whereTheTableGoes
     */
    var transposeThisTable = function (whereTheTableGoes) {
        var sharedTable = getAccumulatorObject("sharedTable_" + whereTheTableGoes);
        var numberOfColumns;
        var numberOfRows;
        if ((sharedTable.currentForm === 'geneTableGeneHeaders') || (sharedTable.currentForm === 'variantTableVariantHeaders')) {
            numberOfColumns = sharedTable.numberOfColumns;
            numberOfRows = sharedTable.dataCells.length / numberOfColumns;
        } else {
            numberOfColumns = sharedTable.numberOfRows;
            numberOfRows = sharedTable.dataCells.length / numberOfColumns;
        }
        var sortedData = extractSortedDataFromTable(whereTheTableGoes, numberOfRows, numberOfColumns, sharedTable.currentForm);

        destroySharedTable(whereTheTableGoes);


        if (( typeof sharedTable !== 'undefined') &&
            ( typeof sortedData !== 'undefined') &&
            (sortedData.length > 0)) {

            if ((sortedData.length % numberOfColumns) !== 0) {  // sanity check 1
                console.log(" CRITICAL ERROR in TRANSPOSITION.  Consistency check (sortedData.length % numberOfColumns) === 0) has failed.")
            }
            if ((sortedData.length % numberOfRows) !== 0) {  // sanity check 2
                console.log(" CRITICAL ERROR in TRANSPOSITION.  Consistency check (sortedData.length % numberOfRows) === 0) has failed.")
            }

            var arrayIndex = 0;
            var transposedTableDescription = {};
            sharedTable.currentForm = formConversionOfATranspose(sharedTable.currentForm);
            transposedTableDescription = new TempSharedTableObject(numberOfColumns, numberOfRows, new Array(numberOfColumns * numberOfRows));
            transposedTableDescription.dataCells = linearDataTransposor(sortedData, numberOfRows, numberOfColumns, function (x, y, rows, cols) {
                return (x * cols) + y
            });


            //  Now we should be all done fiddling with the data order.
            var additionalDetailsForHeaders = [];
            var currentLocationInArray = 0;
            var headers = _.slice(transposedTableDescription.dataCells, currentLocationInArray, transposedTableDescription.numberOfColumns);
            currentLocationInArray += transposedTableDescription.numberOfColumns;
            if (sharedTable.currentForm === 'variantTableAnnotationHeaders') { // collapse the first row into the header
                additionalDetailsForHeaders = _.slice(transposedTableDescription.dataCells, currentLocationInArray,
                    (currentLocationInArray + transposedTableDescription.numberOfColumns));
                currentLocationInArray += transposedTableDescription.numberOfColumns;
            }
            if (sharedTable.currentForm === 'geneTableAnnotationHeaders') { // collapse the first row into the header
               additionalDetailsForHeaders = _.slice(transposedTableDescription.dataCells, currentLocationInArray,
                   (currentLocationInArray + transposedTableDescription.numberOfColumns));
               currentLocationInArray += transposedTableDescription.numberOfColumns;
            }
            var datatable = buildHeadersForTable(whereTheTableGoes, headers, false,
                sharedTable.currentForm, false, additionalDetailsForHeaders);
            refineTableRecords(datatable, sharedTable.currentForm, [], true);

            // build the body
            var rowsToAdd = [];
            var content = _.slice(transposedTableDescription.dataCells, currentLocationInArray);

            _.forEach(content, function (datacell, index) {
                var modulus = index % transposedTableDescription.numberOfColumns;
                if (modulus === 0) {
                    rowsToAdd.push({category: datacell.title, columnCells: new Array()});
                }
                var lastRow = rowsToAdd[rowsToAdd.length - 1];
                return lastRow.columnCells.push(datacell);
            });
            datatable = $(whereTheTableGoes).dataTable();
            var rememberCategories = addContentToTable(whereTheTableGoes, rowsToAdd, false, sharedTable.currentForm, false);
            refineTableRecords(datatable, sharedTable.currentForm, rememberCategories, false);

        }

    };



var  dataTableZoomSet =    function (TGWRAPPER,TGZOOM) {

        $(TGWRAPPER).find(".dataTables_wrapper").removeClass("dk-zoom-0 dk-zoom-1 dk-zoom-2 dk-zoom-3").addClass("dk-zoom-"+TGZOOM);

}
    var  dataTableZoomDynaSet =    function (zoomWrapper,getBigger) {
        if (typeof $(zoomWrapper).data("zoomParmHolder") === 'undefined') {
            $(zoomWrapper).data("zoomParmHolder",1);
        }
        var currentSize = $(zoomWrapper).data("zoomParmHolder");
        if (getBigger) {
            if (currentSize > 0){
                currentSize--;
            }
        } else {
            if (currentSize < 3){
                currentSize++;
            }
        }
        $(zoomWrapper).data("zoomParmHolder",currentSize);

        $(zoomWrapper).find(".dataTables_wrapper").removeClass("dk-zoom-0 dk-zoom-1 dk-zoom-2 dk-zoom-3").addClass("dk-zoom-"+currentSize);

    }



var destroySharedTable = function (whereTheTableGoes) {
    if ( $.fn.DataTable.isDataTable( whereTheTableGoes ) ) {
        var datatable = $(whereTheTableGoes).dataTable();
        try{
            datatable.fnDestroy(false);
        } catch (e){
            // this routine throws a JavaScript error, but doesn't seem to indicate any trouble
        }
        $(whereTheTableGoes).empty()
    }
}


        var addToCombinedTable = function (variantAndDsAjaxUrl, variantInfoUrl,
                                       whereTheTableGoes) {
        // var proposedVariant = $('#proposedVariant').val();
        // var metadata = getStoredSampleMetadata();
        var rememberVariantInfoUrl = variantInfoUrl;
        // if (proposedVariant.length < 1) {
        //     proposedVariant = $('#proposedMultiVariant').val();
        // }
        // var allVariants = proposedVariant.split(",");
        // if (allVariants.length < 2) {
        //     allVariants = proposedVariant.split('\n');
        // }
        var datatable = $(whereTheTableGoes).DataTable();
        var deferreds = [];
        var unrecognizedVariants = [];
        var duplicateVariants = [];
        // var datasetFilter = $('#datasetFilter').val();
        // var dataSet = metadata.conversion[datasetFilter];
        _.forEach(allVariants, function (oneVariantRaw) {
            var oneVariant = oneVariantRaw.trim();
            if (oneVariant.length > 0) {
                var oneCall = function (curVariant, unrecognized, duplicate) {
                    var d = $.Deferred();
                    var promise = $.ajax({
                        cache: false,
                        type: "get",
                        url: ( variantAndDsAjaxUrl + "?varid=" + curVariant + "&dataSet=" + dataSet),
                        async: true
                    });
                    promise.done(
                        function (data) {
                            if ((typeof data !== 'undefined') &&
                                (data) &&
                                (data.variant) &&
                                (!(data.variant.is_error))) {
                                if (data.variant.numRecords > 0) {
                                    var args = _.flatten([{}, data.variant.variants[0]]);
                                    var variantObject = _.merge.apply(_, args);
                                    var mac = '';
                                    var macObject = variantObject['MAC'];
                                    if (typeof macObject !== 'undefined') {
                                        _.forEach(macObject, function (v, k) {
                                            mac = v;
                                        })
                                    }
                                    if (_.findIndex(datatable.rows().data(), function (oneRow) {
                                        return oneRow[0] === variantObject.VAR_ID;
                                    }) > -1) {
                                        duplicate.push(curVariant);
                                    } else {
                                        datatable.row.add([variantObject.VAR_ID,
                                            '<a href="' + rememberVariantInfoUrl + '/' + variantObject.VAR_ID + '" class="boldItlink">' +
                                            variantObject.CHROM + ':' + variantObject.POS + '</a>',
                                            variantObject.DBSNP_ID,
                                            variantObject.CHROM,
                                            variantObject.POS,
                                            mac,
                                            variantObject.PolyPhen_PRED,
                                            variantObject.SIFT_PRED,
                                            variantObject.Protein_change,
                                            variantObject.Consequence
                                        ]).draw(false);
                                    }

                                } else {
                                    unrecognized.push(curVariant);
                                }

                            }
                            d.resolve(data);
                        }
                    );
                    promise.fail(d.reject);
                    return d.promise();
                };
                deferreds.push(oneCall(oneVariant, unrecognizedVariants, duplicateVariants));
            }
        });
        $.when.apply($, deferreds).then(function () {
            $('#rSpinner').hide();
            var reportError = "";
            if (unrecognizedVariants.length > 0) {
                if (unrecognizedVariants.length > 1) {
                    reportError += ('The following variants were unrecognized: ' + unrecognizedVariants.join(", "));
                } else {
                    reportError += ('Variant ' + unrecognizedVariants[0] + ' unrecognized.');
                }
            }
            if (duplicateVariants.length > 0) {
                if (reportError.length > 0) {
                    reportError += '\n\n';
                }
                if (duplicateVariants.length > 1) {
                    reportError += ('The following variants were already in the table: ' + duplicateVariants.join(", "));
                } else {
                    reportError += ('Variant ' + duplicateVariants[0] + ' already in the table.');
                }
            }
            if (reportError.length > 0) {
                alert(reportError);
            }
        });
    };

    var displayTissuesForAnnotation = function (annotationId,nameOfAccumulatorObject,tableToUpdate){
        var recordsAggregatedPerVariant = getAccumulatorObject("sharedTable_"+tableToUpdate);
        if (recordsAggregatedPerVariant.currentForm==="variantTableVariantHeaders"){
            $('div.noDataHere.'+annotationId).parent().parent().show();
            $('div.variantRecordExists.'+annotationId).parent().parent().show();
        } else {
            var dataTable = $(tableToUpdate).DataTable();
            var tissueColumnsToDisplay = [];
            var totalNumberOfColumns = $(tableToUpdate).DataTable().columns()[0].length;
            for ( var i = 0 ; i < totalNumberOfColumns ; i++ ){
                var classListForColumn = $($(tableToUpdate).DataTable().columns(i).header()[0]).attr('class').split(/\s+/);
                if (_.includes(classListForColumn,annotationId)){
                    var buildSelector = 'th.'+classListForColumn.join('.');
                    dataTable.column(buildSelector).visible(true);
                }

            }
        }
        $('button.shower.'+annotationId).hide();
        $('button.hider.'+annotationId).show();

    };
    var hideTissuesForAnnotation = function (annotationId,nameOfAccumulatorObject,tableToUpdate){
        var recordsAggregatedPerVariant = getAccumulatorObject("sharedTable_"+tableToUpdate);
        if (recordsAggregatedPerVariant.currentForm==="variantTableVariantHeaders") {
            $('div.noDataHere.' + annotationId).parent().parent().hide();
            $('div.variantRecordExists.' + annotationId).parent().parent().hide();
        } else {
            var dataTable = $(tableToUpdate).DataTable();
            var tissueColumnsToHide = $('th.tissueRecord.'+annotationId);
            _.forEach(tissueColumnsToHide,function(oneColumn){
                var classListForColumn = $(oneColumn).attr("class").split(/\s+/);
                if (_.includes(classListForColumn,'tissueRecord')){
                    var buildSelector = 'th.'+classListForColumn.join('.');
                    dataTable.column(buildSelector).visible(false);
                }
            });

    }


        $('button.shower.'+annotationId).show();
        $('button.hider.'+annotationId).hide();
    };


    /***
     * helper function for showAttachedData.  This one creates a nice big D3 graphic.  I built it for ABC data, but it should work
     * equally well whenever you have multiple regions that influence the expression of a gene
     *
     * @param event
     * @returns {string}
     */
    var createOutOfRegionGraphic = function (event){
        var dataTarget = $(event.target).attr('data-target').substring(1).trim();
        if (dataTarget.indexOf("tissues_")>=0){
            var geneName = dataTarget.substring("tissues_".length);
            var uniqueId  = dataTarget+'_uniquifier';
            buildRegionGraphic('#'+uniqueId,'#'+uniqueId,'#tissues_'+geneName);
        }
        return "";
    };

    /***
     * helper function for showAttachedData
     *
     * @param event
     * @returns {*|jQuery}
     */
    var extractStraightFromTarget = function (event){
        var dataTarget = $(event.target).attr('data-target').substring(1).trim();
        return $("#"+dataTarget).html();
    };

    /***
     * click handler for the cells in the dynamic UI tables.  Note that I pass in a function as an argument to help showAttachedData
     * to provide exactly the sort of drill down display we need
     *
     * @param event
     * @param title
     * @param functionToGenerateContents
     */
    var showAttachedData = function( event, title, functionToGenerateContents) {
        var dataTarget = $(event.target).attr('data-target').substring(1).trim();
        var uniqueId  = dataTarget+'_uniquifier';


        if($(".dk-new-ui-data-wrapper.wrapper-"+dataTarget).length) { // if we already have a window then get rid of it.
            $(".dk-new-ui-data-wrapper.wrapper-"+dataTarget).remove();
        } else {
            var dataWrapper = '<div class="dk-new-ui-data-wrapper wrapper-'+dataTarget+'"><div class="closer-wrapper" style="text-align: center;"><spna style="">'+title+
                '</spna><span style="float:right; font-size: 12px; color: #888;" onclick="mpgSoftware.dynamicUi.removeWrapper(event);" class="glyphicon glyphicon-remove" aria-hidden="true">\n' +
                '</span></div><div class="content-wrapper" id="'+uniqueId+'"></div></div>';
            $('body').append(dataWrapper);  // add the div to the DOM
            var dataTargetContent = functionToGenerateContents(event);  // either gather data, and append it, or else insert it right into the div.
            $('#'+uniqueId).append(dataTargetContent);

            // we have two kinds of drill down graphics at this point, one of which is a table and one of which is a D3 graphic.  Let's look for
            //  the table, and if it doesn't exist then extract the size from the presumed SVG element
            var holderElement = $(".dk-new-ui-data-wrapper.wrapper-"+dataTarget);
            var contentWidth = 0;
            var contentHeight = 0;
            if (holderElement.find("table").length>0){
                contentWidth = holderElement.find("table").width();
                contentHeight = holderElement.find("table").height();
                contentWidth = (contentWidth > 350)? 350 : contentWidth + 25;
                contentHeight = (contentHeight > 300)? 300 : contentHeight + 25;
            } else {
                contentWidth = holderElement.find("svg").width()+25;
                contentHeight = holderElement.find("svg").height()+95;
            }

            var divTop = $(event.target).offset().top;
            var divLeft = $(event.target).offset().left + $(event.target).width();

            $(".dk-new-ui-data-wrapper.wrapper-"+dataTarget).find(".content-wrapper").css({"width":contentWidth, "height":contentHeight});
            $(".dk-new-ui-data-wrapper.wrapper-"+dataTarget).css({"top":divTop,"left":divLeft});

            $(".dk-new-ui-data-wrapper").draggable({ handle:".closer-wrapper"});
            $(".dk-new-ui-data-wrapper").resizable();
        }


    };


    var removeWrapper = function ( event ) {
        $(event.target).parent().parent().remove();
    };


    var setColorButtonActive = function(event,DEACTIVATE,whereTheTableGoes) {
        var sharedTable = getAccumulatorObject("sharedTable_" + whereTheTableGoes);
        sharedTable["cellColoringScheme"] = event.target.textContent.trim();
        if ($(event.target).hasClass("active")) {
            $(event.target).removeClass("active");
        } else {
            $(event.target).addClass("active");
        }

        $.each(DEACTIVATE, function(index,value) {
            var className = "." + value;
            var idName = "#" + value;

            if ($(className).length) { $("button"+className).removeClass("active") }
            if ($(idName).length) { $("button"+className).removeClass("active") }
        });
        redrawTableOnClick('table.combinedGeneTableHolder',-1,-1);
        refineTableRecords($(whereTheTableGoes).dataTable(),'geneTableGeneHeaders',[],false);
    }




    var redrawTableOnClick = function (whereTheTableGoes,swapColA,swapColB) {
        var sharedTable = getAccumulatorObject("sharedTable_" + whereTheTableGoes);
        var numberOfColumns;
        var numberOfRows;
        var transposeNec = false;
        numberOfColumns = sharedTable.numberOfColumns;
        numberOfRows = sharedTable.dataCells.length / numberOfColumns;
        if ((sharedTable.currentForm === 'geneTableGeneHeaders') || (sharedTable.currentForm === 'variantTableVariantHeaders')) {
             numberOfColumns = sharedTable.numberOfColumns;
             numberOfRows = sharedTable.dataCells.length / numberOfColumns;
        } else {
            numberOfColumns = sharedTable.numberOfRows;
            numberOfRows = sharedTable.dataCells.length / numberOfColumns;
            transposeNec = true;
        }

        var sortedData = extractSortedDataFromTable(whereTheTableGoes, numberOfRows, numberOfColumns, sharedTable.currentForm);
        if ((swapColA !== -1) && (swapColB !== -1)){
            sortedData=matrixMath.swapColumnsInDataStructure(sortedData,numberOfRows,numberOfColumns,swapColA,swapColB);
        }



        destroySharedTable(whereTheTableGoes);


        if (( typeof sharedTable !== 'undefined') &&
            ( typeof sortedData !== 'undefined') &&
            (sortedData.length > 0)) {

            if ((sortedData.length % numberOfColumns) !== 0) {  // sanity check 1
                console.log(" CRITICAL ERROR in TRANSPOSITION.  Consistency check (sortedData.length % numberOfColumns) === 0) has failed.")
            }
            if ((sortedData.length % numberOfRows) !== 0) {  // sanity check 2
                console.log(" CRITICAL ERROR in TRANSPOSITION.  Consistency check (sortedData.length % numberOfRows) === 0) has failed.")
            }

            var transposedTableDescription = new TempSharedTableObject( numberOfRows, numberOfColumns,new Array(numberOfColumns * numberOfRows));

            transposedTableDescription.dataCells = sortedData;

            //  Now we should be all done fiddling with the data order.
            var additionalDetailsForHeaders = [];
            var currentLocationInArray = 0;
            var headers = [];
            if (sharedTable.currentForm === 'variantTableAnnotationHeaders') { // collapse the first row into the header
                transposedTableDescription.dataCells = linearDataTransposor(sortedData, numberOfRows, numberOfColumns, function (x, y, rows, cols) {
                    return (x * cols) + y
                });
                headers = _.slice(transposedTableDescription.dataCells, currentLocationInArray, transposedTableDescription.numberOfColumns);
                additionalDetailsForHeaders = _.slice(transposedTableDescription.dataCells, currentLocationInArray,
                    (currentLocationInArray + transposedTableDescription.numberOfColumns));
                currentLocationInArray += transposedTableDescription.numberOfRows;
            }
            else if (sharedTable.currentForm === 'geneTableAnnotationHeaders') { // collapse the first row into the header
                transposedTableDescription.dataCells = linearDataTransposor(sortedData, numberOfRows, numberOfColumns, function (x, y, rows, cols) {
                    return (x * cols) + y
                });
                // We just transposed the data, so now the number of columns is defined by what was the number of rows
                var revisedNumberOfColumns = transposedTableDescription.numberOfRows;
                headers = _.slice(transposedTableDescription.dataCells, currentLocationInArray, revisedNumberOfColumns);
                additionalDetailsForHeaders = _.slice(transposedTableDescription.dataCells, currentLocationInArray,
                   (currentLocationInArray + revisedNumberOfColumns));
               currentLocationInArray += transposedTableDescription.numberOfRows;
            } else {
                headers = _.slice(transposedTableDescription.dataCells, currentLocationInArray, transposedTableDescription.numberOfColumns);
                currentLocationInArray += transposedTableDescription.numberOfColumns;
            }
            var datatable = buildHeadersForTable(whereTheTableGoes, headers, false,
                'geneTableGeneHeaders', false, additionalDetailsForHeaders);
            refineTableRecords(datatable, 'geneTableGeneHeaders', [], true);

            // build the body
            var rowsToAdd = [];
            var content = _.slice(transposedTableDescription.dataCells, currentLocationInArray);

            _.forEach(content, function (datacell, index) {
                var modulus = index % currentLocationInArray;
                if (modulus === 0) {
                    rowsToAdd.push({category: datacell.title, columnCells: new Array()});
                }
                var lastRow = rowsToAdd[rowsToAdd.length - 1];
                return lastRow.columnCells.push(datacell);
            });
            datatable = $(whereTheTableGoes).dataTable();
            var rememberCategories = addContentToTable(whereTheTableGoes, rowsToAdd, false, sharedTable.currentForm, false);
            refineTableRecords(datatable, sharedTable.currentForm, rememberCategories, false);

            sharedTable.currentForm = 'geneTableGeneHeaders';

            if (transposeNec){transposeThisTable(whereTheTableGoes)}

        }

    };






    /***
     * provide a category number which we will use to decide what class will use for coloring.  In this case
     * we are coloring by the number of tissues.
     *
     * @param numberOfTissues
     * @returns {number}
     */
    var categorizeTissueNumbers = function ( numberOfTissues ) {
        var returnValue = 0;
        if ((numberOfTissues>0) &&(numberOfTissues<=2)) {
            returnValue = 1;
        } else if ((numberOfTissues>2) &&(numberOfTissues<=8)) {
            returnValue = 2;
        } else if ((numberOfTissues>8) &&(numberOfTissues<=25)) {
            returnValue = 3;
        } else if ((numberOfTissues>25) &&(numberOfTissues<=100)) {
            returnValue = 4;
        } else if (numberOfTissues>100) {
            returnValue = 5;
        }
        return returnValue;
    };




    var categorizeSignificanceNumbers = function ( significance, datatype, overrideValue ) {
        var returnValue = 0;
        if ( ( typeof significance !== 'undefined') &&
             ( $.isArray(significance) ) &&
            ( significance.length>0 ) ){
            var recordToAssess = significance[0];
            switch (datatype){
                case "MOD": // significance is not a meaningful concept
                    returnValue = 6;
                    break;
                case "ABC": // activity by contact predictions -- higher numbers are good
                    var valueToAssess = significance[0].value;
                    if ((valueToAssess>0) &&(valueToAssess<=0.2)) {
                        returnValue = 5;
                    } else if ((valueToAssess>0.2) &&(valueToAssess<=0.4)) {
                        returnValue = 4;
                    } else if ((valueToAssess>0.4) &&(valueToAssess<=0.6)) {
                        returnValue = 3;
                    } else if ((valueToAssess>0.6) &&(valueToAssess<=0.8)) {
                        returnValue = 2;
                    } else if (valueToAssess>0.9) {
                        returnValue = 1;
                    }
                    break
                //pvalues -- lower numbers are good
                case "ECA":
                    var valueToAssess = significance[0].clpp;
                    if ((valueToAssess>0) &&(valueToAssess<=0.2)) {
                        returnValue = 5;
                    } else if ((valueToAssess>0.2) &&(valueToAssess<=0.4)) {
                        returnValue = 4;
                    } else if ((valueToAssess>0.4) &&(valueToAssess<=0.6)) {
                        returnValue = 3;
                    } else if ((valueToAssess>0.6) &&(valueToAssess<=0.8)) {
                        returnValue = 2;
                    } else if (valueToAssess>0.9) {
                        returnValue = 1;
                    }
                    break;
                case "COL":
                    var valueToAssess = significance[0].prob_exists_coloc;
                    if ((valueToAssess>0) &&(valueToAssess<=0.2)) {
                        returnValue = 5;
                    } else if ((valueToAssess>0.2) &&(valueToAssess<=0.4)) {
                        returnValue = 4;
                    } else if ((valueToAssess>0.4) &&(valueToAssess<=0.6)) {
                        returnValue = 3;
                    } else if ((valueToAssess>0.6) &&(valueToAssess<=0.8)) {
                        returnValue = 2;
                    } else if (valueToAssess>0.9) {
                        returnValue = 1;
                    }
                    break;
                case "DEG":
                    var valueToAssess = significance[0].pvalue;
                    if ((valueToAssess>0) &&(valueToAssess<=0.5E-8)) {
                        returnValue = 1;
                    } else if ((valueToAssess>0.5E-8) &&(valueToAssess<=0.5E-4)) {
                        returnValue = 2;
                    } else if ((valueToAssess>0.5E-4) &&(valueToAssess<=0.05)) {
                        returnValue = 3;
                    } else if ((valueToAssess>0.05) &&(valueToAssess<=0.4)) {
                        returnValue = 4;
                    } else if (valueToAssess>0.4) {
                        returnValue = 5;
                    }
                    break;

                case "DEP":
                case "MET":
                case "EQT":
                case "FIR":
                case "SKA":
                    var valueToAssess;
                    if ( typeof  overrideValue !== 'undefined') {
                        valueToAssess = overrideValue
                    } else {
                        valueToAssess = significance[0].numericalValue;
                    }
                    if (valueToAssess===0)  {
                        returnValue = 6;
                    } else if ((valueToAssess>0) &&(valueToAssess<=0.5E-8)) {
                        returnValue = 1;
                    } else if ((valueToAssess>0.5E-8) &&(valueToAssess<=0.5E-4)) {
                        returnValue = 2;
                    } else if ((valueToAssess>0.5E-4) &&(valueToAssess<=0.05)) {
                        returnValue = 3;
                    } else if ((valueToAssess>0.05) &&(valueToAssess<=0.4)) {
                        returnValue = 4;
                    } else if (valueToAssess>0.4) {
                        returnValue = 5;
                    }
                    break;
                default:
                    break;
            }

        }

        return returnValue;
    };

    var shiftColumnsByOne = function ( event, offeredThis, direction, whereTheTableGoes) {
        event.stopPropagation();
        var sharedTable = getAccumulatorObject("sharedTable_" + whereTheTableGoes);
        var identifyingNode = $(offeredThis).parent().parent().parent();
        var initialLinearIndex = extractClassBasedIndex(identifyingNode[0].innerHTML,"initialLinearIndex_");
        var dataTable = $(whereTheTableGoes).dataTable().DataTable();
        var numberOfHeaders = dataTable.table().columns()[0].length;
        var indexOfClickedColumn = -1;
        _.each(_.range(0,numberOfHeaders),function(index) {
            var header = dataTable.table().column(index).header();
            var headerLinearIndex = extractClassBasedIndex($(header)[0].innerHTML,"initialLinearIndex_");
            if (headerLinearIndex ===initialLinearIndex){
                indexOfClickedColumn = index;
            }
        });
        var leftBackstop;
        if ((sharedTable.currentForm === 'geneTableGeneHeaders') || (sharedTable.currentForm === 'variantTableVariantHeaders')){
            leftBackstop = 1;
        } else {
            leftBackstop = 0;
        }
        if (direction==="forward"){
            if ((indexOfClickedColumn>leftBackstop) &&(indexOfClickedColumn<(numberOfHeaders-1))){
                redrawTableOnClick('table.combinedGeneTableHolder',indexOfClickedColumn,indexOfClickedColumn+1);
            }
        }else if (direction==="backward") {
            if ((indexOfClickedColumn>(leftBackstop+1)) &&(indexOfClickedColumn<(numberOfHeaders))){
                redrawTableOnClick('table.combinedGeneTableHolder',indexOfClickedColumn,indexOfClickedColumn-1);
            }
        }

    }


// public routines are declared below
    return {
        shiftColumnsByOne:shiftColumnsByOne,
        extractStraightFromTarget:extractStraightFromTarget,
        showAttachedData:showAttachedData,
        setColorButtonActive: setColorButtonActive,
        removeWrapper:removeWrapper,
        createOutOfRegionGraphic:createOutOfRegionGraphic,
        transposeThisTable:transposeThisTable,
        dataTableZoomSet:dataTableZoomSet,
        dataTableZoomDynaSet:dataTableZoomDynaSet,
        displayTissuesForAnnotation:displayTissuesForAnnotation,
        hideTissuesForAnnotation:hideTissuesForAnnotation,
        installDirectorButtonsOnTabs: installDirectorButtonsOnTabs,
        modifyScreenFields: modifyScreenFields,
        adjustLowerExtent: adjustLowerExtent,
        adjustUpperExtent: adjustUpperExtent
    }
}());


