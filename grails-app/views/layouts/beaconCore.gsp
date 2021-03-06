<!DOCTYPE html>
<%@ page import="org.springframework.web.servlet.support.RequestContextUtils" %>
<%@ page import="temporary.BuildInfo" %>
<!--[if lt IE 7 ]> <html lang="en" class="no-js ie6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="en" class="no-js ie7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="en" class="no-js ie8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="en" class="no-js ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html lang="en" class="no-js"><!--<![endif]-->
<html>
<head>
<title><g:message code='site.shared.institution.broad'/> <g:message code='site.shared.phrases.beacon'/></title>

    <r:require modules="core"/>
    <r:layoutResources/>

    <link href='http://fonts.googleapis.com/css?family=Lato:300,400,700,900,300italic,400italic,700italic,900italic' rel='stylesheet' type='text/css'>
    <g:external uri="/images/icons/dna-strands.ico"/>


    <g:layoutHead/>

    <g:applyLayout name="analyticsBeacon"/>

</head>

<body>

<g:javascript src="lib/bootstrap.min.js" />

<g:applyLayout name="errorReporter"/>

<div id="spinner" class="spinner" style="display:none;">
    <img id="img-spinner" src="${resource(dir: 'images', file: 'ajaxLoadingAnimation.gif')}" alt="Loading"/>
</div>
<div id="header">
    <div id="header-top">
        <div class="container">
            <% def locale = RequestContextUtils.getLocale(request) %>
            <g:renderBeaconSection>
                <div id="branding">
                    <g:message code='site.shared.institution.broad'/> <strong><g:message code='site.shared.phrases.beacon'/></strong>
                </div>
            </g:renderBeaconSection>
        </div>
    </div>

    <div id="header-bottom">
        <div class="container">
            <sec:ifLoggedIn>
                <div class="rightlinks">
                    <sec:ifAllGranted roles="ROLE_ADMIN">
                        <g:link controller='admin' action="users" class="mgr"><g:message code='site.layouts.option.manage_users'/></g:link>
                        &middot;
                    </sec:ifAllGranted>
                    <sec:ifAllGranted roles="ROLE_SYSTEM">
                        <g:link controller='system' action="systemManager"><g:message code='site.layouts.option.system_mgr'/></g:link>
                        &middot;
                    </sec:ifAllGranted>
                    <sec:loggedInUserInfo field="username"/>   &middot;
                    <g:link controller='logout'><g:message code="mainpage.log.out"/></g:link>
                </div>
            </sec:ifLoggedIn>
            <sec:ifNotLoggedIn>
                <div class="rightlinks">
<!--                    <g:link controller='login' action='auth'><g:message code="mainpage.log.in"/></g:link> -->
                </div>
            </sec:ifNotLoggedIn>
            <g:renderT2dGenesSection>
                <a href="${createLink(controller:'beacon',action:'beaconDisplay')}"><g:message code="localized.home"/></a> &middot;
                <a href="${createLink(controller:'informational', action:'aboutBeacon')}"><g:message code="localized.aboutTheBeaconData"/></a> &middot;
                <a href="${createLink(controller:'informational', action:'contactBeacon')}"><g:message code="localized.contact"/></a>
             </g:renderT2dGenesSection>
            </div>
        </div>
    </div>

<g:layoutBody/>

<div id="footer">
    <div class="container">
        <div class="separator"></div>
        <div class="row">
            <div class="col-sm-4">
                <div id="helpus"><a href="${createLink(controller:'informational', action:'contactBeacon')}"><g:message code="mainpage.send.beacon.feedback"/></a></div>
            </div>
            <div class="col-sm-4 col-sm-offset-2">
                <a href="http://www.broadinstitute.org">
                    <img class="logoholder" src="${resource(dir: 'images', file: 'BroadInstLogoforDigitalRGB.png')}" width="100%" alt="Broad Institute"/>
                </a>
            </div>
        </div>
    </div>
</div>
<div id="belowfooter">
    <div class="row">
        <div class="footer">
            <div class="col-lg-6"></div>
            <div class="col-lg-6 small-buildinfo">
                <g:message code="buildInfo.shared.build_message" args="${[BuildInfo?.buildHost, BuildInfo?.buildTime]}"/>.  <g:message code='buildInfo.shared.version'/>=${BuildInfo?.appVersion}.${BuildInfo?.buildNumber}
            </div>

        </div>
    </div>
</div>

</body>
</html>