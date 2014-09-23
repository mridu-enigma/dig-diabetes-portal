grails.servlet.version = "3.0" // Change depending on target container compliance (2.5 or 3.0)
grails.project.class.dir = "target/classes"
grails.project.test.class.dir = "target/test-classes"
grails.project.test.reports.dir = "target/test-reports"
grails.project.work.dir = "target"
grails.project.target.level = 1.6
grails.project.source.level = 1.6
//grails.project.war.file = "target/${appName}-${appVersion}.war"

grails.project.fork =
        [
    // configure settings for compilation JVM, note that if you alter the Groovy version forked compilation is required
    //  compile: [maxMemory: 256, minMemory: 64, debug: false, maxPerm: 256, daemon:true],

    // configure settings for the run-war JVM
    war: [maxMemory: 768, minMemory: 64, debug: false, maxPerm: 256, forkReserve:false],
    // configure settings for the Console UI JVM
    console: [maxMemory: 768, minMemory: 64, debug: false, maxPerm: 256]
]

grails.project.dependency.resolver = "maven" // or ivy
grails.project.dependency.resolution = {
    // inherit Grails' default dependencies
    inherits("global") {
        // specify dependency exclusions here; for example, uncomment this to disable ehcache:
        excludes 'ehcache'
    }
    log "error" // log level of Ivy resolver, either 'error', 'warn', 'info', 'debug' or 'verbose'
    checksums true // Whether to verify checksums on resolve
    legacyResolve false // whether to do a secondary resolve on plugin installation, not advised and here for backwards compatibility

    repositories {
        inherits true // Whether to inherit repository definitions from plugins

        grailsPlugins()
        grailsHome()
        mavenLocal()
        grailsCentral()
        mavenCentral()

        mavenRepo 'https://raw.github.com/fernandezpablo85/scribe-java/mvn-repo/'
        mavenRepo "http://repo.desirableobjects.co.uk/"
        // uncomment these (or add new ones) to enable remote dependency resolution from public Maven repositories
        //mavenRepo "http://repository.codehaus.org"
        //mavenRepo "http://download.java.net/maven/2/"
        //mavenRepo "http://repository.jboss.com/maven2/"
    }

    dependencies {
        // specify dependencies here under either 'build', 'compile', 'runtime', 'test' or 'provided' scopes e.g.
        runtime 'mysql:mysql-connector-java:5.1.29'
        // runtime 'org.postgresql:postgresql:9.3-1101-jdbc41'
        test "org.grails:grails-datastore-test-support:1.0-grails-2.4"
    }

    plugins {
        // all lifted from Bard
//        build(":tomcat:$grailsVersion",
//                ":release:2.0.3",
//                ":rest-client-builder:1.0.2") {
//            export = false
//        }
//        test(":spock:0.7") {
//            exclude "spock-grails-support"
//        }
//        test ":codenarc:0.18.1"
//        compile ":clover:3.1.10.1"
//        compile ":cache:1.0.1"

        // plugins for the build system only
        build (":tomcat:7.0.54",
                ":rest-client-builder:2.0.3") {
            export = false
        }

        // plugins for the compile step

//        compile ":spring-security-oauth:2.1.0-RC4"
      //  compile ":spring-security-oauth-google:0.3.1"

        // …
        // last stable version is 2.0.2
        //compile ':spring-security-oauth:2.0.2'
        // 2.1 is under development
        // compile ':spring-security-oauth:2.1.0-SNAPSHOT'
       // compile ':spring-security-oauth-facebook:0.1'
        // …
        compile ":scaffolding:2.1.2"
        compile ':cache:1.1.7'
        compile ":asset-pipeline:1.8.11"
        compile ':resources:1.2.8'
        compile ':rest-client-builder:2.0.3'
        compile ":cache:1.0.1"
        compile ":mail:1.0.7"
        compile ":font-awesome-resources:4.2.0.0"
//        compile 'org.objenesis:objenesis:1.4'
//        compile "cglib:cglib:2.2"

        // plugins needed at runtime but not for compilation
//        runtime ":hibernate4:4.3.5.4" // or ":hibernate:3.6.10.16"
        runtime ":hibernate:3.6.10.16"
        //runtime ":database-migration:1.4.0"
        runtime ":jquery:1.11.1"
        runtime ':resources:1.2.8'

        compile ":spring-security-core:2.0-RC4"

        test ":codenarc:0.18.1"

        //compile ":clover:3.1.10.1"


        // Uncomment these to enable additional asset-pipeline capabilities
        //compile ":sass-asset-pipeline:1.7.4"
        //compile ":less-asset-pipeline:1.7.0"
        //compile ":coffee-asset-pipeline:1.7.0"
        //compile ":handlebars-asset-pipeline:1.3.0.3"
    }
}
