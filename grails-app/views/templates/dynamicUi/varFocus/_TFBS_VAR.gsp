<script id="tfbsVariantTableNumberRecordsCellPresentationString"  type="x-tmpl-mustache">
records={{numberRecords}}
</script>

<script id="tfbsVariantTableTissueHeaderLabel"  type="x-tmpl-mustache">
<div class="varEpigeneticsLabel varAllEpigenetics varTfbsEpigenetics variantEpigenetics initialLinearIndex_{{indexInOneDimensionalArray}}">Epigenetics</div>
</script>

<script id="tfbsVariantTableTissueRowLabel"  type="x-tmpl-mustache">
<div class="varAllEpigenetics varTfbsEpigenetics  staticMethodLabels methodName_SPP  initialLinearIndex_{{indexInOneDimensionalArray}}">
tfbs&nbsp;<g:helpText title="tissueTable.DEPICT.help.header" placement="bottom" body="tissueTable.DEPICT.help.text"/></div>
</script>

<script id="tfbsVariantTableTissueHeader"  type="x-tmpl-mustache">
<div class="varAllEpigenetics varTfbsEpigenetics  initialLinearIndex_{{initialLinearIndex}}">{{tissueName}}</div>
</script>

<script id="tfbsVariantTableIndividualAnnotationLabel"  type="x-tmpl-mustache">
<div class="varAllEpigenetics varTfbsEpigenetics staticMethodLabels annotationName_{{annotationName}} methodName_SPP initialLinearIndex_{{indexInOneDimensionalArray}} varAnnotation {{isBlank}}"
  sortField='TFBS{{annotationName}}'>
<div style="font-weight: bold">TFBS</div>
{{annotationName}}</div>
</script>

<script id="tfbsVariantTableSignificanceCellPresentationString"  type="x-tmpl-mustache">
{{significanceValueAsString}}No div!
</script>


<script id="tfbsVariantTableTissueSpecificHeaderLabel"  type="x-tmpl-mustache">
<div class="varEpigeneticsLabel varTissueEpigenetics varAllEpigenetics varAbcEpigenetics variantEpigenetics initialLinearIndex_{{indexInOneDimensionalArray}}"></div>
</script>


<script id="tfbsVariantTableTissueSpecificRowLabel"  type="x-tmpl-mustache">
<div class="varAllEpigenetics varAbcEpigenetics staticMethodLabels annotationName_{{annotation}} methodName_SPP tissueId_{{safeTissueId}} {{isBlank}} initialLinearIndex_{{indexInOneDimensionalArray}} varAnnotation"
 sortField='{{tissue_name}}'>
{{tissue_name}}</div>
</script>


<script id="tfbsVariantTableBody"  type="x-tmpl-mustache">
             <div significance_sortField="{{significanceValue}}" sortField="{{significanceValue}}"
             class="multiRecordCell varAllEpigenetics varTfbsEpigenetics tissueCategory_{{tissueCategoryNumber}} significanceCategory_{{significanceCategoryNumber}} {{initialLinearIndex}} annotationName_{{annotationName}} methodName_SPP tissueId_{{safeTissueId}} ">

                    {{#recordsExist}}

                     {{/recordsExist}}
                         {{#tissueRecords}}
 <div class="epigeneticCellElement tissueId_{{safeTissueId}} methodName_SPP annotationName_{{annotation}}">
                               {{tissue_name}}
                            </div>
                          {{/tissueRecords}}
                      {{#recordsExist}}

                    {{/recordsExist}}
                    {{#recordsExist}}
                    {{/recordsExist}}
                    {{^recordsExist}}
                       No predicted connections
                    {{/recordsExist}}
               </div>
            </div>
</script>


<script id="tfbsVariantTableBodyTissueSpecific"  type="x-tmpl-mustache">
             <div significance_sortField="{{significanceValue}}" sortField="{{significanceValue}}"
             class="multiRecordCell varAllEpigenetics varTfbsEpigenetics tissueCategory_{{tissueCategoryNumber}} significanceCategory_{{significanceCategoryNumber}} {{initialLinearIndex}} annotationName_{{annotationName}} methodName_SPP tissueId_{{safeTissueId}} ">

                    {{#recordsExist}}

                     {{/recordsExist}}
                         {{#tissueRecords}}
 <div class="tissueDominantCell epigeneticCellElement tissueId_{{safeTissueId}} methodName_SPP annotationName_{{annotation}}">
                               Transcription factor binding site
                            </div>
                          {{/tissueRecords}}
                      {{#recordsExist}}

                    {{/recordsExist}}
                    {{#recordsExist}}
                    {{/recordsExist}}
                    {{^recordsExist}}
                       No predicted connections
                    {{/recordsExist}}
               </div>
            </div>
</script>