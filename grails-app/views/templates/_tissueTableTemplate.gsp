<g:render template="/templates/dynamicUi/EFF" />

<script id="mainTissueTableOrganizer"  type="x-tmpl-mustache">
    <div class="container">
        <div class="row">
            <div class="text-center">
                <h1 class="dk-page-title">Tissue table for <span class="phenotypeSpecifier">{{phenotype}}</span></h1>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-12">
                <div class="datatable-control-box">
                    <div class="datatable-transpose-control">
                        <div class="tool-label">Transpose table&nbsp;&nbsp;<a style="padding:0; text-decoration:none; color:inherit" class="glyphicon glyphicon-question-sign pop-bottom" data-toggle="popover" role="button" data-trigger="focus" tabindex="0" animation="true" data-container="body" data-placement="bottom" title="" data-html="true" data-content="Click to pivot the table so that rows become columns and columns become rows." data-original-title="Transpose table"></a></div>
                        <button class="btn btn-secondary btn-default transpose" type="button" title="click to transpose table" onclick="mpgSoftware.dynamicUi.transposeThisTable('#mainTissueDiv table.tissueTableHolder')">
                            Transpose
                        </button>
                    </div>

                    <div class="datatable-zoom-control">
                        <div class="tool-label">Zoom</div>
                        <button type="button" class="btn btn-default btn-secondary" aria-label="Zoom out" title="click to zoom out" onclick="mpgSoftware.dynamicUi.dataTableZoomDynaSet('#mainTissueDiv',false)">
                            <span class="glyphicon glyphicon-minus" aria-hidden="true" onclick="mpgSoftware.dynamicUi.dataTableZoomDynaSet('#dynamicGeneHolder',false)"></span>
                        </button>
                        <button type="button" class="btn btn-default btn-secondary" aria-label="Zoom in" title="click to zoom in" onclick="mpgSoftware.dynamicUi.dataTableZoomDynaSet('#mainTissueDiv',true)">
                            <span class="glyphicon glyphicon-plus" aria-hidden="true" onclick="mpgSoftware.dynamicUi.dataTableZoomDynaSet('#dynamicGeneHolder',true)"></span>
                        </button>

                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <div class="row">
                    <div class="col-md-12">
                        <label for="annotationPicker">choose phenotypes</label>
                        <select id="tissueToPhenotypePicker" class="phenotypePicker" onchange="mpgSoftware.tissueTable.refreshTableForPhenotype(this)">
                        </select>
                    </div>
                    <div class="annotationPickerHolder col-md-7" style="display: none">
                        <label for="annotationPicker">add/remove annotations</label>
                        <select id="annotationPicker" class="annotationPicker"  multiple="multiple" onchange="mpgSoftware.tissueTable.refreshTableForAnnotations(this)">
                        </select>
                    </div>
                </div>
            </div>
            <div class="col-md-12">
                <div id="tissueTableHolder" class="mainEffectorDiv">
                    <table class="tissueTableHolder">
                    </table>
                </div>
            </div>
        </div>
    </div>
</script>