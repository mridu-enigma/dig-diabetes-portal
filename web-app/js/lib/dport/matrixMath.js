var mpgSoftware = mpgSoftware || {};

mpgSoftware.matrixMath = (function(){

    /***
     * Our constructor, which pretends to turn a one dimensional array into a two-dimensional array,
     * but really only sets the stage for further calculations
     *
     * @param dataArray
     * @param numberOfRows
     * @param numberOfColumns
     * @returns {{dataArray: *, numberOfRows: *, numberOfColumns: *}}
     * @constructor
     */
    var Matrix = function(dataArray,numberOfRows,numberOfColumns){
        if (( typeof dataArray === 'undefined') ||
            (!$.isArray(dataArray))){
            alert(" No data array to work with")
        } else if ((dataArray.length>0)&&(numberOfColumns>0)&&
                   ((dataArray.length % numberOfColumns) !== 0) ){  // sanity check 1
            alert(" CRITICAL ERROR in matrix constructor.  Consistency check (dataArray.length % numberOfColumns) === 0) has failed.")
        } else if ((dataArray.length>0)&&(numberOfRows>0)&&((dataArray.length % numberOfRows) !== 0)) {  // sanity check 2
            console.log(" CRITICAL ERROR in matrix constructor.  Consistency check (dataArray.length % numberOfRows) === 0) has failed.")
        }
        return {
            dataArray:dataArray,
            numberOfRows:numberOfRows,
            numberOfColumns:numberOfColumns
        }
    };

    /***
     * get an element from her simulated two-dimensional array
     * @param matrix
     * @param row
     * @param column
     * @returns {*}
     */
    var getElement = function(matrix,row,column){
        return matrix.dataArray[(row*matrix.numberOfColumns)+column];
    };

    /***
     * set the value of an element in the array
     * @param matrix
     * @param row
     * @param column
     * @param element
     */
    var setElement = function(matrix,row,column,element){
        matrix.dataArray[(row*matrix.numberOfColumns)+column]=element;
    };

    /***
     * useful for building the identity matrix
     * @param numberOfRows
     * @param numberOfColumns
     * @returns {{dataArray: *, numberOfRows: *, numberOfColumns: *}}
     */
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


    /***
     * building identity matrix, except move the colSource column to the location of the old location
     * of the colTarget column, and shift the other columns around as necessary.
     * Here's the approach: march along each column, and add the identity element until we encounter
     * the source _xor_ the target. Once we do, then we need to shift all the other columns that
     * we run into.  Once we have hit both the source _and_ the target, then we go back to writing identity
     * elements.
     * @param matrix
     * @param colSource
     * @param colTarget
     * @returns {*}
     */
    var buildMatrixToMoveOneColumn  = function(matrix,colSource,colTarget){
        if ((colSource>=matrix.numberOfColumns) || (colTarget>=matrix.numberOfColumns)){
            alert("buildMatrixToMoveOneColumn problem with number of columns requested.")
        }
        var shifter = 0;
        var hitTheSource = false;
        var hitTheTarget = false;
        var directionToShift = 0;
        if (colSource < colTarget) {// we are moving a column to the right
            directionToShift=1;
        } else if (colSource > colTarget) {// we are moving a column to the left
            directionToShift=-1;
        }
        _.times(matrix.numberOfColumns,function(column){
            if (column===colSource) {
                hitTheSource = true;
                shifter = directionToShift;
                setElement(matrix, column + shifter, column, 1);
                if (hitTheTarget) {
                    shifter = 0;
                }
            } else if (column===colTarget) {
                hitTheTarget = true;
                shifter = directionToShift;
                setElement (matrix,colSource,column,1);
                if (hitTheSource) {
                    shifter = 0;
                }
            } else {
                setElement (matrix,column+shifter,column,1);
            }
        });
        return matrix;
    };



    var buildMatrixToDeleteColumns  = function(matrix,columnsToDelete){
        _.forEach(columnsToDelete, function(columnIndex){
            if (
                //(columnIndex>matrix.numberOfColumns) ||
                (columnIndex < 0)){
                alert("buildMatrixToDeleteColumns problem with number of columns requested.")
            }
        });
        var columnsFilledIn = 0;
        _.times(matrix.numberOfColumns+columnsToDelete.length,function(counter){

            if (!_.includes(columnsToDelete, counter )){
                setElement (matrix,counter,columnsFilledIn,1);
                columnsFilledIn++;
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
        return multiplyMatrices(matrixToManipulate,multiplierMatrix);
    };

    var moveColumnsInDataStructure = function(dataArray,numberOfRows,numberOfColumns,colSource,colTarget){
        var matrixToManipulate = new Matrix(dataArray,numberOfRows,numberOfColumns);
        var multiplierMatrix = buildMatrixToMoveOneColumn (buildArrayOfZeros(numberOfColumns,numberOfColumns),colSource,colTarget);
        return multiplyMatrices(matrixToManipulate,multiplierMatrix);
    };


    var deleteColumnsInDataStructure = function(dataArray,numberOfRows,numberOfColumns,columnListToDelelete){
        var revisedNumberOfColumns = numberOfColumns-columnListToDelelete.length;
        var matrixToManipulate = new Matrix(dataArray,numberOfRows,numberOfColumns);
        var multiplierMatrix = buildMatrixToDeleteColumns (buildArrayOfZeros(numberOfColumns,revisedNumberOfColumns),columnListToDelelete);
        return multiplyMatrices(matrixToManipulate,multiplierMatrix);
    };

    var getColumnHeaders = function(matrixToWorkWith){
        return getRowFromMatrix(matrixToWorkWith,0);
    };

    var getRowHeaders = function(matrixToWorkWith){
        return getColumnFromMatrix(matrixToWorkWith,0);
    };



    var doNothing = function(dataArray,numberOfRows,numberOfColumns){
        return new  Matrix(dataArray,numberOfRows,numberOfColumns);
    }

    return {
        getColumnHeaders:getColumnHeaders,
        getRowHeaders:getRowHeaders,
        swapColumnsInDataStructure:swapColumnsInDataStructure,
        moveColumnsInDataStructure:moveColumnsInDataStructure,
        deleteColumnsInDataStructure:deleteColumnsInDataStructure,
        doNothing:doNothing,
        Matrix:Matrix
    }
}());
