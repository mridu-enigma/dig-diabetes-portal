<%--
  Created by IntelliJ IDEA.
  User: psingh
  Date: 5/21/19
  Time: 1:44 AM
--%>

<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="t2dGenesCore"/>
    <r:require modules="core"/>
    <r:require modules="datatables"/>
    <r:require modules="gaitInfo"/>
    <r:require modules="geneInfo"/>
    <r:require modules="burdenTest"/>
    <r:layoutResources/>


    <link type="application/font-woff">
    <link type="application/vnd.ms-fontobject">
    <link type="application/x-font-ttf">
    <link type="font/opentype">

</head>

<body>

<div id="rSpinner" class="dk-loading-wheel center-block" style="display:none">
    <img src="${resource(dir: 'images', file: 'ajax-loader.gif')}" alt="Loading"/>
</div>
<script>

    $( document ).ready(function() {
        "use strict";

        var drivingVariables = {
            geneName: "${geneName}",
            variantIdentifier: "${variantIdentifier}",
            allowExperimentChoice:"${allowExperimentChoice}",
            allowPhenotypeChoice:"${allowPhenotypeChoice}",
            allowStratificationChoice:"${allowStratificationChoice}"

        };

        mpgSoftware.gaitInfo.setGaitInfoData(drivingVariables);
        mpgSoftware.gaitInfo.buildGaitDisplay();


        var pageTitle = $(".accordion-toggle").find("h2").text();
        var textUnderTitle = $(".accordion-inner").find("h5").text();
        $(".accordion-toggle").remove();
        $(".accordion-inner").find("h5").remove();

        var PageTitleDiv = '<div class="row">\n'+
            '<div class="col-md-12">\n'+
            '<h1 class="dk-page-title">' + pageTitle + '</h1>\n'+
            '<div class="col-md-12">\n'+
            '<h5 class="dk-under-header">' + textUnderTitle + '</h5>\n'+
            '</div></div>';

        $(PageTitleDiv).insertBefore(".gene-info-container");
        $(".user-interaction").addClass("col-md-12");


        /* end of DK's script */

    });



</script>

<style>
ul.nav-tabs > li > a { background: none !important; }
ul.nav-tabs > li.active > a { background-color: #fff !important; }
#modeledPhenotypeTabs li.active > a { background-color: #9fd3df !important; }
</style>

<div id="main">

    <div class="container">

        <div class="gene-info-container row">

            <em style="font-weight: 900;"><%=geneName%></em>


            <em style="font-weight: 900;"><%=variantIdentifier%></em>


            %{--If its gene Gait page then allowExperimentChoice = 0 and 'geneName':'geneName'--}%
            %{--<g:if test="${geneName?.equals('')}">--}%

                %{--<g:render template="/templates/burdenTestSharedTemplate" model="['variantIdentifier': variantIdentifier, 'accordionHeaderClass': 'accordion-heading']" />--}%

                %{--<g:render template="/widgets/burdenTestShared" model="['variantIdentifier': variantIdentifier,--}%
                                                                       %{--'accordionHeaderClass': 'accordion-heading',--}%
                                                                       %{--'modifiedTitle': 'Variant Interactive burden test',--}%
                                                                       %{--'modifiedGaitSummary': 'The Genetic Association Interactive Tool (GAIT) allows you to compute the disease or phenotype burden for this gene, using custom sets of variants, samples, and covariates. In order to protect patient privacy, GAIT will only allow visualization or analysis of data from more than 100 individuals.',--}%
                                                                       %{--'allowExperimentChoice': 1,--}%
                                                                       %{--'allowPhenotypeChoice': 1,--}%
                                                                       %{--'allowStratificationChoice': 0,--}%
                                                                       %{--'grsVariantSet':'',--}%
                                                                       %{--'geneName':'']"/>--}%
            %{--</g:if>--}%

            %{--<g:else>--}%
                %{--<g:render template="/templates/burdenTestSharedTemplate" model="['variantIdentifier': '', 'accordionHeaderClass': 'accordion-heading']" />--}%

                %{--<g:render template="/widgets/burdenTestShared" model="['variantIdentifier': '',--}%
                                                                       %{--'accordionHeaderClass': 'accordion-heading',--}%
                                                                       %{--'modifiedTitle': 'Gene Interactive burden test',--}%
                                                                       %{--'modifiedGaitSummary': 'The Genetic Association Interactive Tool (GAIT) allows you to compute the disease or phenotype burden for this gene, using custom sets of variants, samples, and covariates. In order to protect patient privacy, GAIT will only allow visualization or analysis of data from more than 100 individuals.',--}%
                                                                       %{--'allowExperimentChoice': 1,--}%
                                                                       %{--'allowPhenotypeChoice': 1,--}%
                                                                       %{--'allowStratificationChoice': 1,--}%
                                                                       %{--'grsVariantSet':'',--}%
                                                                       %{--'geneName':geneName]"/>--}%

            %{--</g:else>--}%


            <g:render template="/templates/burdenTestSharedTemplate" model="['variantIdentifier': variantIdentifier, 'accordionHeaderClass': 'accordion-heading']" />



            %{--If its gene Gait page then allowExperimentChoice = 0 and 'geneName':'geneName'--}%
            <g:render template="/widgets/burdenTestShared" model="['variantIdentifier': '',
                                                                   'accordionHeaderClass': 'accordion-heading',
                                                                   'modifiedTitle': 'Genetic Association Interactive Tool',
                                                                   'modifiedGaitSummary': 'The Genetic Association Interactive Tool (GAIT) allows you to compute the disease or phenotype burden for this gene, using custom sets of variants, samples, and covariates. In order to protect patient privacy, GAIT will only allow visualization or analysis of data from more than 100 individuals.',
                                                                   'allowExperimentChoice': allowExperimentChoice,
                                                                   'allowPhenotypeChoice': allowPhenotypeChoice,
                                                                   'allowStratificationChoice': allowStratificationChoice,
                                                                   'grsVariantSet':'',
                                                                   'geneName':geneName]"/>







        </div>
    </div>

</div>

</body>
</html>

