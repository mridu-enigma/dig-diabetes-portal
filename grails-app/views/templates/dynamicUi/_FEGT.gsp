
<script id="dynamicFullEffectorGeneTableHeader"  type="x-tmpl-mustache">
        <div sortStrategy="alphabetical" sortField="-1"  sortTerm="{{name1}}"
        class="geneName groupNum{{groupNum}} withinGroupNum{{withinGroupNum}} text-center initialLinearIndex_{{initialLinearIndex}}">
           <div class="geneHeaderShifters text-center">
               <span class="glyphicon glyphicon-step-backward" aria-hidden="true" onclick="mpgSoftware.dynamicUi.shiftColumnsByOne(event,this,'backward','table.combinedGeneTableHolder')"></span>
               <span class="glyphicon glyphicon-step-forward" aria-hidden="true" onclick="mpgSoftware.dynamicUi.shiftColumnsByOne(event,this,'forward','table.combinedGeneTableHolder')"></span>
           </div>
           <div class="pull-right fegtHeaderStyling">
               <span class="glyphicon glyphicon-resize-full" aria-hidden="true" title="View collapsed columns"
               onclick="mpgSoftware.dynamicUi.expandColumns(event,this,'forward','table.fullEffectorGeneTableHolder');"></span>
               <span class="glyphicon glyphicon-resize-small" aria-hidden="true" title="Collapse columns"
               onclick="mpgSoftware.dynamicUi.contractColumns(event,this,'forward','table.fullEffectorGeneTableHolder');"></span>
               <span class="glyphicon glyphicon-remove" aria-hidden="true"
               onclick="mpgSoftware.dynamicUi.removeColumn(event,this,'forward','table.fullEffectorGeneTableHolder')" style="padding: 0 8px 0 0"></span>
           </div>
           <span class="displayMethodName" methodKey="{{name}}">{{name}}</span>
        </div>
</script>

<script id="fegtCellBody"  type="x-tmpl-mustache">
<div class="initialLinearIndex_{{initialLinearIndex}}">
{{#Combined_category}}
 <div>
    {{textToDisplay}}
        </div>
{{/Combined_category}}
{{#Genetic_combined}}
 <div>
    {{textToDisplay}}
    </div>
{{/Genetic_combined}}
{{#Genomic_combined}}
<div>
    {{textToDisplay}}
    </div>
{{/Genomic_combined}}
{{#Perturbation_combined}}
 <div>
    {{textToDisplay}}
        </div>
{{/Perturbation_combined}}
{{#external_evidence}}
 <div>
    {{textToDisplay}}
        </div>
{{/external_evidence}}
{{#homologous_gene}}
 <div>
    {{textToDisplay}}
        </div>
{{/homologous_gene}}
{{#additional_reference}}
 <div>
    {{textToDisplay}}
        </div>
{{/additional_reference}}
</div>
</script>

<script id="effectorGeneTableSignificanceCellPresentationString"  type="x-tmpl-mustache">
{{Combined_category}}
</script>

<script id="dynamicGeneTableEffectorGeneSubCategory"  type="x-tmpl-mustache">
     <div significance_sortfield='{{index}}' class='subcategory initialLinearIndex_{{indexInOneDimensionalArray}}'
      sortField='{{index}}' subSortField='-1'>
     {{#dataAnnotation}}
          {{displaySubcategory}}
          <g:helpText title="gene.COLOC.help.header" placement="bottom" body="gene.COLOC.help.text"/>
     {{/dataAnnotation}}
     </div>
</script>


<script id="dynamicGeneTableEffectorGeneBody"  type="x-tmpl-mustache">
             <div significance_sortField="{{significanceValue}}" sortField={{numberOfRecords}}
             class="tissueCategory_{{tissueCategoryNumber}}   significanceCategory_{{significanceCategoryNumber}} {{initialLinearIndex}}">
               <a onclick="mpgSoftware.dynamicUi.showAttachedData(event,'effector gene records {{gene}}',mpgSoftware.dynamicUi.extractStraightFromTarget)" class="cellExpander"
               data-target="#effector_gene_{{gene}}" style="color:black">
               {{#data}}
               {{value.Combined_category}}
               {{/data}}
               </a>
               <div  class="collapse openEffectorGeneInformationInGeneTable" id="effector_gene_{{gene}}">
                    {{#data}}
                    <table class="expandableDrillDownTable openEffectorGeneInformationInGeneTable">
                     <thead>
                      <tr role="row">
                        <th class="text-center leftMostCol">category</th>
                        <th class="text-center otherCols">value</th>
                      </tr>
                     </thead>
                     <tbody>
                      <tr role="row">
                           <td class="leftMostCol">Genetic combined</td>
                           <td class="otherCols">{{value.Genetic_combined}}</td>
                       </tr>
                       <tr role="row">
                           <td class="leftMostCol">Genomic combined</td>
                           <td class="otherCols">{{value.Genomic_combined}}</td>
                       </tr>
                       <tr role="row">
                           <td class="leftMostCol">Perturbation combined</td>
                           <td class="otherCols">{{value.Perturbation_combined}}</td>
                       </tr>
                     </tbody>
                    </table>
                    {{/data}}
               </div>
            </div>
</script>
