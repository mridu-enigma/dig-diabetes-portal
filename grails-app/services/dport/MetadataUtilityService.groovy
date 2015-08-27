package dport

import grails.transaction.Transactional
import org.apache.juli.logging.LogFactory
import org.broadinstitute.mpg.diabetes.metadata.PhenotypeBean
import org.broadinstitute.mpg.diabetes.metadata.Property
import org.broadinstitute.mpg.diabetes.metadata.PropertyBean
import org.broadinstitute.mpg.diabetes.metadata.SampleGroupBean

@Transactional
class MetadataUtilityService {

    private static final log = LogFactory.getLog(this)

    /***
     *   Take a list of Properties (as generated by getAllPropertiesWithNameForExperimentOfVersion and turn them into a, separated list of
     *   sample groups referencing individual phenotypes. This is the format that we need to pass to the REST API in order to ask for
     *   all of the phenotype values of a particular property.
     * @param propertyList
     * @return
     */
    public String createPhenotypePropertyFieldRequester(List<Property>  propertyList) {
        String returnValue = ""
        if (propertyList){
            // we will mostly iterate over this parent list
            List<PhenotypeBean> phenotypeBeanList = propertyList.collect{PropertyBean pb->return pb.parent}
            // create a list of sample groups associated with our property
            List <String> sampleGroupNames =  phenotypeBeanList.collect{PhenotypeBean pheno->return pheno.parent}.systemId?.sort()?.unique()
            List<String> eachSampleGroupsString = []
            for (String sampleGroupName in sampleGroupNames){
                List <String> phenotypeNames = phenotypeBeanList.findAll{PhenotypeBean phenotype->return phenotype.parent.systemId==sampleGroupName}.name
                eachSampleGroupsString << "\"$sampleGroupName\": [${phenotypeNames.collect {return "\"$it\""}.join(",")}]"
            }
            returnValue = eachSampleGroupsString.join(",")
        }
        return returnValue
    }




    public LinkedHashMap<String,List> createPhenotypeSampleNameMapper(List<Property>  propertyList) {
        LinkedHashMap<String,List> returnValue = [:]
        if (propertyList){
            // we will mostly iterate over this parent list
            List<PhenotypeBean> phenotypeBeanList = propertyList.collect{PropertyBean pb->return pb.parent}
            // create a list of sample groups associated with our property
            List <String> sampleNames =  phenotypeBeanList.collect{PhenotypeBean pheno->return pheno.parent}.name?.sort()?.unique()
            for (String sampleName in sampleNames){
                List <String> phenotypeNames = phenotypeBeanList.findAll{org.broadinstitute.mpg.diabetes.metadata.PhenotypeBean phenotype->return phenotype.parent.name==sampleName}.name
                returnValue[sampleName] = phenotypeNames
            }
        }
        return returnValue
    }




    /***
     *   Take a list of Properties (as generated by getAllPropertiesWithNameForExperimentOfVersion and turn them into a, separated list of
     *   sample groups. This is the format that we need to pass to the REST API in order to ask for properties at the label of a
     *   data set
     *
     * @param propertyList
     * @return
     */
    public String createSampleGroupPropertyFieldRequester(List<Property>  propertyList) {
        String returnValue = ""
        if (propertyList){

            // create a list of sample groups associated with our property
            List <String> sampleGroupNames =  createSampleGroupPropertyList(propertyList)

            returnValue = sampleGroupNames.collect {return "\"$it\""}.join(",")
        }
        return returnValue
    }


    public List <String> createSampleGroupPropertyList(List<Property>  propertyList) {
        List <String> returnValue = []
        if (propertyList){
            // we will mostly iterate over this parent list
            List<PropertyBean> propertyBeanList = propertyList.collect{PropertyBean pb->return pb.parent}
            // create a list of sample groups associated with our property
            List <String> sampleGroupNames =  propertyBeanList?.systemId?.sort()?.unique()

            returnValue = sampleGroupNames
        }
        return returnValue
    }




    public LinkedHashMap<String,String> createPhenotypeSampleGroupMap(List<Property>  propertyList) {
        LinkedHashMap<String,String>  returnValue = [:]
        if (propertyList){
            // we will mostly iterate over this parent list
            List<PhenotypeBean> phenotypeBeanList = propertyList.collect{PropertyBean pb->return pb.parent}
            // create a list of sample groups associated with our property
            for (PhenotypeBean phenotypeBean in phenotypeBeanList){
                if (!returnValue.containsKey(phenotypeBean.name)){
                    returnValue [phenotypeBean.name]  = phenotypeBean?.parent?.systemId
                } else {
                    log.error("NOTE: Phenotype = ${phenotypeBean.name} Unexpectedly found in multiple sample groups: createPhenotypeSampleGroupMap")
                }
            }
        }
        return returnValue
    }




    /***
     * we need one phenotype record to draw from.  If we get two pick one.  If we get zero amounts a problem
     * @param phenotypeList
     * @return
     */
    private PhenotypeBean filterPhenotypeList(List<PhenotypeBean>  phenotypeList) {
        PhenotypeBean  returnValue = []
        if (phenotypeList){
             if (phenotypeList.size()>1){ // if we have multiple phenotype lists, then favor DIAGRAM GWAS
                 List <PhenotypeBean> listHolder = phenotypeList.findAll{it.parent.name== "DIAGRAM"}
                 if (listHolder.size()==1){
                     returnValue = listHolder[0]
                 } else {
                     log.error("Expected to find DIAGRAM as one of the data sets in filterPhenotypeList.  Choosing arbitrarily!")
                     returnValue = phenotypeList[0]
                 }
             }else  if (phenotypeList.size()>0){ // otherwise take whatever we have
                 returnValue = phenotypeList[0]
             }
        }
        return returnValue
    }

    /***
     * Pull out the searchable properties from a phenotype record
     * @param phenotypeList
     * @return
     */
    public List<Property> retrievePhenotypeProperties(List<PhenotypeBean>  phenotypeList) {
        List<PhenotypeBean>  returnValue = []
        PhenotypeBean phenotype = filterPhenotypeList(phenotypeList)
        if (phenotype){
            returnValue = phenotype?.propertyList?.findAll{it.searchable}
        }
        return returnValue
    }

    /***
     * Pull out the sample group from a phenotype
     * @param phenotypeList
     * @return
     */
    public String retrievePhenotypeSampleGroupId(List<PhenotypeBean>  phenotypeList) {
        String  returnValue = ""
        PhenotypeBean phenotype = filterPhenotypeList(phenotypeList)
        if (phenotype){
            returnValue = phenotype?.parent?.systemId
        }
        return returnValue
    }


    /***
     * Order the phenotypes by group.  The first group must be GLYCEMIC.  The others I will order alphabetically
     * @param phenotypeList
     * @return
     */
    public LinkedHashMap<String, List<String>> hierarchicalPhenotypeTree(List<PhenotypeBean>  phenotypeList) {
        LinkedHashMap<String, List<String>>  returnValue = [:]
        if (phenotypeList){
            List<String> phenotypeGroup = phenotypeList.collect{ return it.group }.unique()
            List<String> tempPhenotypeGroup = []
            tempPhenotypeGroup << phenotypeGroup.findAll{it=='GLYCEMIC'}
            tempPhenotypeGroup << phenotypeGroup.findAll{it!='GLYCEMIC'}?.sort()
            List<String> orderedPhenotypeGroup = tempPhenotypeGroup.flatten()
            for (String singlePhenotypeGroup in orderedPhenotypeGroup){
                returnValue[singlePhenotypeGroup] = phenotypeList.findAll{it.group==singlePhenotypeGroup}?.sort{ a, b -> a.sortOrder <=> b.sortOrder }?.name?.unique()
            }
        }
        return returnValue
    }


    /***
     * Given a group of phenotypes, retrieve a list of property names.  Based on the two Booleans you can
     * choose to pull back only D properties, or only P properties, or both. Note that the property retrieval
     * requires a valid sample group name, while P property retrieval requires both a valid phenotype and a valid
     * sample group name.
     *
     * @param phenotypeList
     * @param sampleGroup
     * @param dprops
     * @param pprops
     * @return
     */
    private List<String> propertiesPerSampleGroup(List<PhenotypeBean>  phenotypeList, String sampleGroup, String phenotypeName, Boolean dprops, Boolean pprops) {
        List<String>  returnValue = []
        List <PropertyBean> propertyBeanList = []

        // Consistency check
        if ((dprops) &&
                (!(sampleGroup?.length()>0))) {
            log.error("Failed internal consistency check in propertiesPerSampleGroup.  Looking for a dproperty but without a sample name!")
        }

        if ((pprops) &&
                ((!(sampleGroup?.length()>0))||(!(phenotypeName?.length()>0)))) {
            log.error("Failed internal consistency check in propertiesPerSampleGroup.  Looking for a pproperty but missing either a sample name or a phenotype name!")
        }

        if (dprops){
            propertyBeanList << phenotypeList.findAll{it.parent.systemId==sampleGroup}?.parent?.propertyList[0]?.findAll{it.searchable}
        }
        if (pprops){
            propertyBeanList << phenotypeList.findAll{it.name==phenotypeName}?.findAll{it.parent.systemId==sampleGroup}?.propertyList[0]?.findAll{it.searchable}
        }
        returnValue = propertyBeanList?.flatten()?.sort{ a, b -> a.sortOrder <=> b.sortOrder }?.name

        return returnValue
    }



    /***
     *   Make a map of maps, where phenotypes point to sample groups which point to properties
     * @param phenotypeList
     * @param dprops
     * @param pprops
     * @return
     */
    public LinkedHashMap<String, LinkedHashMap<List<String>>> fullPropertyTree(List<PhenotypeBean>  phenotypeList, Boolean dprops, Boolean pprops) {
        LinkedHashMap<String, List<String>>  returnValue = [:]
        if (phenotypeList){
            List<String> allUniquePhenotypes = phenotypeList.sort{ a, b -> a.sortOrder <=> b.sortOrder }.name.unique()
            for (String phenotype in allUniquePhenotypes) {
                List <PhenotypeBean> phenotypeBeanList = phenotypeList.findAll{it.name==phenotype}.sort{ a, b -> a.sortOrder <=> b.sortOrder }

                returnValue [phenotype] = [:]
                List<String> sampleGroupsPerPhenotype = phenotypeList.findAll{it.name==phenotype}.sort{ a, b -> a.sortOrder <=> b.sortOrder }.parent.systemId.unique()
                for (String sampleGroup in sampleGroupsPerPhenotype){
                    (returnValue [phenotype])[sampleGroup] = propertiesPerSampleGroup(phenotypeBeanList,  sampleGroup,  phenotype, dprops,  pprops)
                }

            }
        }
        return returnValue
    }




    /***
     *   Make a map, where sample groups which point to properties
     * @param phenotypeList
     * @param dprops
     * @param pprops
     * @return
     */
    public LinkedHashMap<String,List<String>> sampleGroupBasedPropertyTree(List<PhenotypeBean>  phenotypeList, Boolean dprops ) {
        LinkedHashMap<String, List<String>>  returnValue = [:]
        List <String> sampleGroupList = phenotypeList.collect{return it.parent}.sort{ a, b -> a.sortOrder <=> b.sortOrder }.systemId.unique()
        if ((phenotypeList) &&
             (sampleGroupList)){
            for (String sampleGroup in sampleGroupList){
                returnValue[sampleGroup] = propertiesPerSampleGroup(phenotypeList,  sampleGroup, "",  dprops,  false)
            }


        }
        return returnValue
    }




    /***
     *   Create a list of properties that match a particular phenotype and sample group name, including D properties and P properties
     * @param phenotypeList
     * @param dprops
     * @param pprops
     * @return
     */
    public List<String> sampleGroupAndPhenotypeBasedPropertyList(List<PhenotypeBean>  phenotypeList,String phenotypeName,String sampleGroupName ) {
        List<String>  returnValue = []
        if ((phenotypeList) &&
                (phenotypeName) &&
                (sampleGroupName)){

            returnValue = propertiesPerSampleGroup(phenotypeList,  sampleGroupName, phenotypeName,  true,  true)
        }
        return returnValue
    }


    /***
     *   Create a list of properties that match a particular phenotype and sample group name, including only P properties
     * @param phenotypeList
     * @param dprops
     * @param pprops
     * @return
     */
    public List<String> phenotypeBasedPropertyList(List<PhenotypeBean>  phenotypeList,String phenotypeName,String sampleGroupName ) {
        List<String>  returnValue = []
        if ((phenotypeList) &&
                (phenotypeName) &&
                (sampleGroupName)){

            returnValue = propertiesPerSampleGroup(phenotypeList,  sampleGroupName, phenotypeName,  false,  true)
        }
        return returnValue
    }



    /***
     *   Create a list of properties that match a  sample group name
     * @param phenotypeList
     * @param dprops
     * @param pprops
     * @return
     */
    public List<String> sampleGroupBasedPropertyList(List<PhenotypeBean>  phenotypeList,String sampleGroupName ) {
        List<String>  returnValue = []
        if ((phenotypeList) &&
                (sampleGroupName)){

            returnValue = propertiesPerSampleGroup(phenotypeList,  sampleGroupName, "",  true,  false)
        }
        return returnValue
    }

    /***
     * First make sure that we are only looking at a single phenotype worth of trees. Then pull back all the properties
     *  for a single sample group. I think this result will often be the same as simply choosing by sample group, but if
     *  a sample group is used in multiple phenotypes then potentially the answers could be different
     * @param phenotypeList
     * @param phenotypeName
     * @param sampleGroupName
     * @return
     */
    public List<String> phenotypeSpecificSampleGroupBasedPropertyList(List<PhenotypeBean>  phenotypeList,String phenotypeName,String sampleGroupName ) {
        List<String>  returnValue = []

        if ((phenotypeList) && (phenotypeName)){
            List <PhenotypeBean> phenotypeBeanList = phenotypeList.findAll{it.name==phenotypeName}.sort{ a, b -> a.sortOrder <=> b.sortOrder }
            returnValue = propertiesPerSampleGroup(phenotypeBeanList,  sampleGroupName, "",  true,  false)
        }

        return returnValue
    }



    public List<String> phenotypeSpecificSampleGroupBasedPropertyList(List<PhenotypeBean>  phenotypeList,String sampleGroupName,List <String> propertyTemplates ) {
        List<String>  returnValue = []
        if ((phenotypeList) && (propertyTemplates) &&  (propertyTemplates.size ()) ){
            // retrieve the filtered property list that we will use for the subsequent searches
            List<String> propertyNameList =   phenotypeList.findAll{it.parent.systemId==sampleGroupName}?.collect{return it.propertyList}?.flatten()?.findAll{it.searchable}?.unique()?.name
            for (String propertyTemplate in propertyTemplates){
                returnValue << propertyNameList.findAll{it =~ propertyTemplate}
            }
        }
        return returnValue.flatten()
    }





}
