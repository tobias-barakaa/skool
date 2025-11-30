'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">skool documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AcademicModule.html" data-type="entity-link" >AcademicModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AcademicModule-09e650a7c92a3ee806c726fd13c078dda79135e3c9bf218a3e2a676e2b14724303ab40c78ed3938e0e6873d651ddfd511250446a159bcdb1555e9c367a8fc6ff"' : 'data-bs-target="#xs-injectables-links-module-AcademicModule-09e650a7c92a3ee806c726fd13c078dda79135e3c9bf218a3e2a676e2b14724303ab40c78ed3938e0e6873d651ddfd511250446a159bcdb1555e9c367a8fc6ff"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AcademicModule-09e650a7c92a3ee806c726fd13c078dda79135e3c9bf218a3e2a676e2b14724303ab40c78ed3938e0e6873d651ddfd511250446a159bcdb1555e9c367a8fc6ff"' :
                                        'id="xs-injectables-links-module-AcademicModule-09e650a7c92a3ee806c726fd13c078dda79135e3c9bf218a3e2a676e2b14724303ab40c78ed3938e0e6873d651ddfd511250446a159bcdb1555e9c367a8fc6ff"' }>
                                        <li class="link">
                                            <a href="injectables/AcademicYearService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AcademicYearService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TermService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TermService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AdminModule.html" data-type="entity-link" >AdminModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-8795ef169588458b9554cbb8763f2e714c43937306f23ca6f22a546b01dd6168603696f35e9f374badc4424a1e76c1d1881a7b869d609f8f8ebfcd00ba3938ea"' : 'data-bs-target="#xs-controllers-links-module-AppModule-8795ef169588458b9554cbb8763f2e714c43937306f23ca6f22a546b01dd6168603696f35e9f374badc4424a1e76c1d1881a7b869d609f8f8ebfcd00ba3938ea"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-8795ef169588458b9554cbb8763f2e714c43937306f23ca6f22a546b01dd6168603696f35e9f374badc4424a1e76c1d1881a7b869d609f8f8ebfcd00ba3938ea"' :
                                            'id="xs-controllers-links-module-AppModule-8795ef169588458b9554cbb8763f2e714c43937306f23ca6f22a546b01dd6168603696f35e9f374badc4424a1e76c1d1881a7b869d609f8f8ebfcd00ba3938ea"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-8795ef169588458b9554cbb8763f2e714c43937306f23ca6f22a546b01dd6168603696f35e9f374badc4424a1e76c1d1881a7b869d609f8f8ebfcd00ba3938ea"' : 'data-bs-target="#xs-injectables-links-module-AppModule-8795ef169588458b9554cbb8763f2e714c43937306f23ca6f22a546b01dd6168603696f35e9f374badc4424a1e76c1d1881a7b869d609f8f8ebfcd00ba3938ea"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-8795ef169588458b9554cbb8763f2e714c43937306f23ca6f22a546b01dd6168603696f35e9f374badc4424a1e76c1d1881a7b869d609f8f8ebfcd00ba3938ea"' :
                                        'id="xs-injectables-links-module-AppModule-8795ef169588458b9554cbb8763f2e714c43937306f23ca6f22a546b01dd6168603696f35e9f374badc4424a1e76c1d1881a7b869d609f8f8ebfcd00ba3938ea"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AssessmentModule.html" data-type="entity-link" >AssessmentModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AssessmentModule-37fc98d1031e2e7eff5b557baa675a0fb29bc32bea9cb563310b831e81ed43305d16444169af0b1b97cf47cfc306742b7d4fae1daeb721310ddb51b99e1b0c41"' : 'data-bs-target="#xs-injectables-links-module-AssessmentModule-37fc98d1031e2e7eff5b557baa675a0fb29bc32bea9cb563310b831e81ed43305d16444169af0b1b97cf47cfc306742b7d4fae1daeb721310ddb51b99e1b0c41"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AssessmentModule-37fc98d1031e2e7eff5b557baa675a0fb29bc32bea9cb563310b831e81ed43305d16444169af0b1b97cf47cfc306742b7d4fae1daeb721310ddb51b99e1b0c41"' :
                                        'id="xs-injectables-links-module-AssessmentModule-37fc98d1031e2e7eff5b557baa675a0fb29bc32bea9cb563310b831e81ed43305d16444169af0b1b97cf47cfc306742b7d4fae1daeb721310ddb51b99e1b0c41"' }>
                                        <li class="link">
                                            <a href="injectables/AssessmentCacheProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssessmentCacheProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AssessmentCreateProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssessmentCreateProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AssessmentReadProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssessmentReadProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AssessmentService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssessmentService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TenantValidationServiceProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TenantValidationServiceProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AssignmentModule.html" data-type="entity-link" >AssignmentModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AssignmentModule-1ad1d59e5d764a30b9da18446c2009b5b001a8c00f5fa97733ac24b4a4ae5d2074143db5205705394a281d176dfcd584649ca11228345acda40b2b6a346bf2f4"' : 'data-bs-target="#xs-injectables-links-module-AssignmentModule-1ad1d59e5d764a30b9da18446c2009b5b001a8c00f5fa97733ac24b4a4ae5d2074143db5205705394a281d176dfcd584649ca11228345acda40b2b6a346bf2f4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AssignmentModule-1ad1d59e5d764a30b9da18446c2009b5b001a8c00f5fa97733ac24b4a4ae5d2074143db5205705394a281d176dfcd584649ca11228345acda40b2b6a346bf2f4"' :
                                        'id="xs-injectables-links-module-AssignmentModule-1ad1d59e5d764a30b9da18446c2009b5b001a8c00f5fa97733ac24b4a4ae5d2074143db5205705394a281d176dfcd584649ca11228345acda40b2b6a346bf2f4"' }>
                                        <li class="link">
                                            <a href="injectables/StudentTestProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentTestProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AttendanceModule.html" data-type="entity-link" >AttendanceModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AttendanceModule-1faa8c7788363bf85cf4628eff0c8939259a13ca480aaa588d9f646c95f339a52f3da77ddccaaefa331cb9ace634c1958335d2058d5ee3b22c074b1fd14d7a58"' : 'data-bs-target="#xs-injectables-links-module-AttendanceModule-1faa8c7788363bf85cf4628eff0c8939259a13ca480aaa588d9f646c95f339a52f3da77ddccaaefa331cb9ace634c1958335d2058d5ee3b22c074b1fd14d7a58"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AttendanceModule-1faa8c7788363bf85cf4628eff0c8939259a13ca480aaa588d9f646c95f339a52f3da77ddccaaefa331cb9ace634c1958335d2058d5ee3b22c074b1fd14d7a58"' :
                                        'id="xs-injectables-links-module-AttendanceModule-1faa8c7788363bf85cf4628eff0c8939259a13ca480aaa588d9f646c95f339a52f3da77ddccaaefa331cb9ace634c1958335d2058d5ee3b22c074b1fd14d7a58"' }>
                                        <li class="link">
                                            <a href="injectables/AttendanceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AttendanceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-e337eade1197bb25d304116a22d963226946896cd15c49afd3d8207a56418d04282e1431da70ba3264e8494089985113e415c693edc6628bee442ce2e3f6e9f1"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-e337eade1197bb25d304116a22d963226946896cd15c49afd3d8207a56418d04282e1431da70ba3264e8494089985113e415c693edc6628bee442ce2e3f6e9f1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-e337eade1197bb25d304116a22d963226946896cd15c49afd3d8207a56418d04282e1431da70ba3264e8494089985113e415c693edc6628bee442ce2e3f6e9f1"' :
                                        'id="xs-injectables-links-module-AuthModule-e337eade1197bb25d304116a22d963226946896cd15c49afd3d8207a56418d04282e1431da70ba3264e8494089985113e415c693edc6628bee442ce2e3f6e9f1"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BcryptProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BcryptProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ChangePasswordProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChangePasswordProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ForgotPasswordProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ForgotPasswordProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GenerateTokenProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GenerateTokenProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RefreshTokensProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RefreshTokensProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SignInProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignInProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TenantValidationProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TenantValidationProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TokenProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TokenProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CommonModule.html" data-type="entity-link" >CommonModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CommonModule-524dcee66f82789835e1ad9d3443520c578ff95bc0016cbc3a11b37db53be8554ec3e5e9a1c6149dd02e6a9796862afbcb1ebca12f6bcba87a990d10833b96d8"' : 'data-bs-target="#xs-injectables-links-module-CommonModule-524dcee66f82789835e1ad9d3443520c578ff95bc0016cbc3a11b37db53be8554ec3e5e9a1c6149dd02e6a9796862afbcb1ebca12f6bcba87a990d10833b96d8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CommonModule-524dcee66f82789835e1ad9d3443520c578ff95bc0016cbc3a11b37db53be8554ec3e5e9a1c6149dd02e6a9796862afbcb1ebca12f6bcba87a990d10833b96d8"' :
                                        'id="xs-injectables-links-module-CommonModule-524dcee66f82789835e1ad9d3443520c578ff95bc0016cbc3a11b37db53be8554ec3e5e9a1c6149dd02e6a9796862afbcb1ebca12f6bcba87a990d10833b96d8"' }>
                                        <li class="link">
                                            <a href="injectables/CacheProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CacheProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CurriculumModule.html" data-type="entity-link" >CurriculumModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CurriculumModule-a6b4cf2accefee2adf73003a4de98182f81958641daba497354fb942b9578f7cd621277dc866860f7f3c31b371294961aaa7b9bcff56e2e9d3b89c481fd8b513"' : 'data-bs-target="#xs-injectables-links-module-CurriculumModule-a6b4cf2accefee2adf73003a4de98182f81958641daba497354fb942b9578f7cd621277dc866860f7f3c31b371294961aaa7b9bcff56e2e9d3b89c481fd8b513"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CurriculumModule-a6b4cf2accefee2adf73003a4de98182f81958641daba497354fb942b9578f7cd621277dc866860f7f3c31b371294961aaa7b9bcff56e2e9d3b89c481fd8b513"' :
                                        'id="xs-injectables-links-module-CurriculumModule-a6b4cf2accefee2adf73003a4de98182f81958641daba497354fb942b9578f7cd621277dc866860f7f3c31b371294961aaa7b9bcff56e2e9d3b89c481fd8b513"' }>
                                        <li class="link">
                                            <a href="injectables/CurriculumService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CurriculumService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/EmailModule.html" data-type="entity-link" >EmailModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-EmailModule-3f26c69e42b6688937a4ade241ed14e86b12d33e50d9f9746f44b45aac604e82dc23dbcb22aa406e4446500adbbf9437b5572f27f3c62b38517ddaae82417f79"' : 'data-bs-target="#xs-injectables-links-module-EmailModule-3f26c69e42b6688937a4ade241ed14e86b12d33e50d9f9746f44b45aac604e82dc23dbcb22aa406e4446500adbbf9437b5572f27f3c62b38517ddaae82417f79"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-EmailModule-3f26c69e42b6688937a4ade241ed14e86b12d33e50d9f9746f44b45aac604e82dc23dbcb22aa406e4446500adbbf9437b5572f27f3c62b38517ddaae82417f79"' :
                                        'id="xs-injectables-links-module-EmailModule-3f26c69e42b6688937a4ade241ed14e86b12d33e50d9f9746f44b45aac604e82dc23dbcb22aa406e4446500adbbf9437b5572f27f3c62b38517ddaae82417f79"' }>
                                        <li class="link">
                                            <a href="injectables/EmailService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FeeManagementModule.html" data-type="entity-link" >FeeManagementModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FeeManagementModule-fe327121c89374364b93e8d434c849d3446e9bb1d95f14baa98f2ac319670f37c91a4dc77030bbba5768d3a3f264a59e39ccb957791361b9f74dfa6760b4f96c"' : 'data-bs-target="#xs-injectables-links-module-FeeManagementModule-fe327121c89374364b93e8d434c849d3446e9bb1d95f14baa98f2ac319670f37c91a4dc77030bbba5768d3a3f264a59e39ccb957791361b9f74dfa6760b4f96c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FeeManagementModule-fe327121c89374364b93e8d434c849d3446e9bb1d95f14baa98f2ac319670f37c91a4dc77030bbba5768d3a3f264a59e39ccb957791361b9f74dfa6760b4f96c"' :
                                        'id="xs-injectables-links-module-FeeManagementModule-fe327121c89374364b93e8d434c849d3446e9bb1d95f14baa98f2ac319670f37c91a4dc77030bbba5768d3a3f264a59e39ccb957791361b9f74dfa6760b4f96c"' }>
                                        <li class="link">
                                            <a href="injectables/FeeAssignmentService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeeAssignmentService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeeBucketService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeeBucketService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeeStructureItemService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeeStructureItemService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeeStructureService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeeStructureService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeeStructureSummaryService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeeStructureSummaryService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/InvoiceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InvoiceService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LedgerService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LedgerService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PaymentService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaymentService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ReceiptService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReceiptService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/GradeModule.html" data-type="entity-link" >GradeModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/HostelModule.html" data-type="entity-link" >HostelModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-HostelModule-3bbf6dea3df23f4725d1bd8f6961aa1b71a5f603b922a77322a323330689ef0af82c31110e50de5e554b3f8af2d7cd578375012fef55e8cecffa667b72ce22d7"' : 'data-bs-target="#xs-injectables-links-module-HostelModule-3bbf6dea3df23f4725d1bd8f6961aa1b71a5f603b922a77322a323330689ef0af82c31110e50de5e554b3f8af2d7cd578375012fef55e8cecffa667b72ce22d7"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-HostelModule-3bbf6dea3df23f4725d1bd8f6961aa1b71a5f603b922a77322a323330689ef0af82c31110e50de5e554b3f8af2d7cd578375012fef55e8cecffa667b72ce22d7"' :
                                        'id="xs-injectables-links-module-HostelModule-3bbf6dea3df23f4725d1bd8f6961aa1b71a5f603b922a77322a323330689ef0af82c31110e50de5e554b3f8af2d7cd578375012fef55e8cecffa667b72ce22d7"' }>
                                        <li class="link">
                                            <a href="injectables/HostelService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HostelService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/IamModule.html" data-type="entity-link" >IamModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/InvitationModule.html" data-type="entity-link" >InvitationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-InvitationModule-37411ca2d6cddedd61cded7695b6108b1da2ad7fb7e31a1bafb56f5551733edc40ce2d1eb36aae6c1da48e647a294c72140b679eca9fdc3b3594361c853871e1"' : 'data-bs-target="#xs-injectables-links-module-InvitationModule-37411ca2d6cddedd61cded7695b6108b1da2ad7fb7e31a1bafb56f5551733edc40ce2d1eb36aae6c1da48e647a294c72140b679eca9fdc3b3594361c853871e1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-InvitationModule-37411ca2d6cddedd61cded7695b6108b1da2ad7fb7e31a1bafb56f5551733edc40ce2d1eb36aae6c1da48e647a294c72140b679eca9fdc3b3594361c853871e1"' :
                                        'id="xs-injectables-links-module-InvitationModule-37411ca2d6cddedd61cded7695b6108b1da2ad7fb7e31a1bafb56f5551733edc40ce2d1eb36aae6c1da48e647a294c72140b679eca9fdc3b3594361c853871e1"' }>
                                        <li class="link">
                                            <a href="injectables/AcceptInvitationProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AcceptInvitationProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GenericDeleteProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GenericDeleteProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GenericInviterProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GenericInviterProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GenericPendingProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GenericPendingProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/InvitationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InvitationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LevelModule.html" data-type="entity-link" >LevelModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LevelModule-7d26add38ed5b1ec29b3237effd4725d51911e9a0bbb89592af5e754dbd6d015a21d23e8ca45df616569e888deb7fd565b8eb2d32e3f48f8a74ccb47408a6277"' : 'data-bs-target="#xs-injectables-links-module-LevelModule-7d26add38ed5b1ec29b3237effd4725d51911e9a0bbb89592af5e754dbd6d015a21d23e8ca45df616569e888deb7fd565b8eb2d32e3f48f8a74ccb47408a6277"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LevelModule-7d26add38ed5b1ec29b3237effd4725d51911e9a0bbb89592af5e754dbd6d015a21d23e8ca45df616569e888deb7fd565b8eb2d32e3f48f8a74ccb47408a6277"' :
                                        'id="xs-injectables-links-module-LevelModule-7d26add38ed5b1ec29b3237effd4725d51911e9a0bbb89592af5e754dbd6d015a21d23e8ca45df616569e888deb7fd565b8eb2d32e3f48f8a74ccb47408a6277"' }>
                                        <li class="link">
                                            <a href="injectables/CreateTenantGradeLevelProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateTenantGradeLevelProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CreateTenantGradeLevelService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateTenantGradeLevelService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LevelService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LevelService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MarksheetModule.html" data-type="entity-link" >MarksheetModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MarksheetModule-32919a2fce58cca6d64a8252ff0cbbdbda6e4f772dcaa4e6a3af37ca240cfd4f14830c4a94eb60a18aa4290ee4da6e50402fa58e4593d97ef7035c3ca3987973"' : 'data-bs-target="#xs-injectables-links-module-MarksheetModule-32919a2fce58cca6d64a8252ff0cbbdbda6e4f772dcaa4e6a3af37ca240cfd4f14830c4a94eb60a18aa4290ee4da6e50402fa58e4593d97ef7035c3ca3987973"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MarksheetModule-32919a2fce58cca6d64a8252ff0cbbdbda6e4f772dcaa4e6a3af37ca240cfd4f14830c4a94eb60a18aa4290ee4da6e50402fa58e4593d97ef7035c3ca3987973"' :
                                        'id="xs-injectables-links-module-MarksheetModule-32919a2fce58cca6d64a8252ff0cbbdbda6e4f772dcaa4e6a3af37ca240cfd4f14830c4a94eb60a18aa4290ee4da6e50402fa58e4593d97ef7035c3ca3987973"' }>
                                        <li class="link">
                                            <a href="injectables/MarkProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MarkProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/MarkService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MarkService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MessagingModule.html" data-type="entity-link" >MessagingModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MessagingModule-f701e8fc8dc473140637ebcb698301953e693a36b4674f047e79832547e7d222b31dd31f82f03a9d3c989c8ea53ef6ab38f8f350b9cc6bfcd1db7125c26053c3"' : 'data-bs-target="#xs-injectables-links-module-MessagingModule-f701e8fc8dc473140637ebcb698301953e693a36b4674f047e79832547e7d222b31dd31f82f03a9d3c989c8ea53ef6ab38f8f350b9cc6bfcd1db7125c26053c3"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MessagingModule-f701e8fc8dc473140637ebcb698301953e693a36b4674f047e79832547e7d222b31dd31f82f03a9d3c989c8ea53ef6ab38f8f350b9cc6bfcd1db7125c26053c3"' :
                                        'id="xs-injectables-links-module-MessagingModule-f701e8fc8dc473140637ebcb698301953e693a36b4674f047e79832547e7d222b31dd31f82f03a9d3c989c8ea53ef6ab38f8f350b9cc6bfcd1db7125c26053c3"' }>
                                        <li class="link">
                                            <a href="injectables/ChatService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChatService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RedisChatProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RedisChatProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SocketTestService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SocketTestService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OrganizationsModule.html" data-type="entity-link" >OrganizationsModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/OrganizationsModule.html" data-type="entity-link" >OrganizationsModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ParentModule.html" data-type="entity-link" >ParentModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ParentModule-6fe4f1dad67354815ec7f65c1d496a859c21cf564a719bd82a7b06575751e30708131fe66a1310907f9eb2936d024d2c71edc45185fe08244d85c2a259a62d83"' : 'data-bs-target="#xs-injectables-links-module-ParentModule-6fe4f1dad67354815ec7f65c1d496a859c21cf564a719bd82a7b06575751e30708131fe66a1310907f9eb2936d024d2c71edc45185fe08244d85c2a259a62d83"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ParentModule-6fe4f1dad67354815ec7f65c1d496a859c21cf564a719bd82a7b06575751e30708131fe66a1310907f9eb2936d024d2c71edc45185fe08244d85c2a259a62d83"' :
                                        'id="xs-injectables-links-module-ParentModule-6fe4f1dad67354815ec7f65c1d496a859c21cf564a719bd82a7b06575751e30708131fe66a1310907f9eb2936d024d2c71edc45185fe08244d85c2a259a62d83"' }>
                                        <li class="link">
                                            <a href="injectables/ParentChatService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ParentChatService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ParentPortalService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ParentPortalService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ParentModule.html" data-type="entity-link" >ParentModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ParentModule-74ff2b8800a590ebff68f3e339f2da826773f171a625c630d60770aaea5ee599763e557a432f0c6c5ef5935ef9e984aad1184aecfe89dc016a9959c2ca928286-1"' : 'data-bs-target="#xs-injectables-links-module-ParentModule-74ff2b8800a590ebff68f3e339f2da826773f171a625c630d60770aaea5ee599763e557a432f0c6c5ef5935ef9e984aad1184aecfe89dc016a9959c2ca928286-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ParentModule-74ff2b8800a590ebff68f3e339f2da826773f171a625c630d60770aaea5ee599763e557a432f0c6c5ef5935ef9e984aad1184aecfe89dc016a9959c2ca928286-1"' :
                                        'id="xs-injectables-links-module-ParentModule-74ff2b8800a590ebff68f3e339f2da826773f171a625c630d60770aaea5ee599763e557a432f0c6c5ef5935ef9e984aad1184aecfe89dc016a9959c2ca928286-1"' }>
                                        <li class="link">
                                            <a href="injectables/ParentService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ParentService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PubSubModule.html" data-type="entity-link" >PubSubModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/RedisModule.html" data-type="entity-link" >RedisModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RedisModule-36c3d711a2dd3096ffa29b8fd0a8eca3c4e6e6526d0610bce9c779d2e14f6b18b8a3c820adf3526e7ee9173d2aa5555268c0f22810da775fdb4c30f686783b6f"' : 'data-bs-target="#xs-injectables-links-module-RedisModule-36c3d711a2dd3096ffa29b8fd0a8eca3c4e6e6526d0610bce9c779d2e14f6b18b8a3c820adf3526e7ee9173d2aa5555268c0f22810da775fdb4c30f686783b6f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RedisModule-36c3d711a2dd3096ffa29b8fd0a8eca3c4e6e6526d0610bce9c779d2e14f6b18b8a3c820adf3526e7ee9173d2aa5555268c0f22810da775fdb4c30f686783b6f"' :
                                        'id="xs-injectables-links-module-RedisModule-36c3d711a2dd3096ffa29b8fd0a8eca3c4e6e6526d0610bce9c779d2e14f6b18b8a3c820adf3526e7ee9173d2aa5555268c0f22810da775fdb4c30f686783b6f"' }>
                                        <li class="link">
                                            <a href="injectables/RedisService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RedisService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ScholarshipsModule.html" data-type="entity-link" >ScholarshipsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ScholarshipsModule-9ceb4ad34c74a1c3c8ce831f86a64935977819b91b176a91ad5b685e2cfa8ea66472a4f518cd8784d27fbce6b2736f75fceea04c5776f77f227ef905b15cfd67"' : 'data-bs-target="#xs-injectables-links-module-ScholarshipsModule-9ceb4ad34c74a1c3c8ce831f86a64935977819b91b176a91ad5b685e2cfa8ea66472a4f518cd8784d27fbce6b2736f75fceea04c5776f77f227ef905b15cfd67"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ScholarshipsModule-9ceb4ad34c74a1c3c8ce831f86a64935977819b91b176a91ad5b685e2cfa8ea66472a4f518cd8784d27fbce6b2736f75fceea04c5776f77f227ef905b15cfd67"' :
                                        'id="xs-injectables-links-module-ScholarshipsModule-9ceb4ad34c74a1c3c8ce831f86a64935977819b91b176a91ad5b685e2cfa8ea66472a4f518cd8784d27fbce6b2736f75fceea04c5776f77f227ef905b15cfd67"' }>
                                        <li class="link">
                                            <a href="injectables/ScholarshipsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ScholarshipsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SchoolConfigModule.html" data-type="entity-link" >SchoolConfigModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SchoolConfigModule-b1b8c84dd4330dd4ab6f3c94ef48a20fe6c27f2639a87254821d11b5935d4671dfa15d6fe39340948acec4f2dc45ce94240e5c5404607a7be3a5a83ae73b32ab"' : 'data-bs-target="#xs-injectables-links-module-SchoolConfigModule-b1b8c84dd4330dd4ab6f3c94ef48a20fe6c27f2639a87254821d11b5935d4671dfa15d6fe39340948acec4f2dc45ce94240e5c5404607a7be3a5a83ae73b32ab"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SchoolConfigModule-b1b8c84dd4330dd4ab6f3c94ef48a20fe6c27f2639a87254821d11b5935d4671dfa15d6fe39340948acec4f2dc45ce94240e5c5404607a7be3a5a83ae73b32ab"' :
                                        'id="xs-injectables-links-module-SchoolConfigModule-b1b8c84dd4330dd4ab6f3c94ef48a20fe6c27f2639a87254821d11b5935d4671dfa15d6fe39340948acec4f2dc45ce94240e5c5404607a7be3a5a83ae73b32ab"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolSetupGuardService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolSetupGuardService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SchoolLevelSettingModule.html" data-type="entity-link" >SchoolLevelSettingModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SchoolLevelSettingModule-90b664d31ce3843c7df8a3ba3d3ff3f86ae2ff68ea09d5817a94a25dfb98574d6266d8fc28a49bbbb3499f0c0fb7835b5d2553aa1589da74377a69c1c12c413b"' : 'data-bs-target="#xs-injectables-links-module-SchoolLevelSettingModule-90b664d31ce3843c7df8a3ba3d3ff3f86ae2ff68ea09d5817a94a25dfb98574d6266d8fc28a49bbbb3499f0c0fb7835b5d2553aa1589da74377a69c1c12c413b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SchoolLevelSettingModule-90b664d31ce3843c7df8a3ba3d3ff3f86ae2ff68ea09d5817a94a25dfb98574d6266d8fc28a49bbbb3499f0c0fb7835b5d2553aa1589da74377a69c1c12c413b"' :
                                        'id="xs-injectables-links-module-SchoolLevelSettingModule-90b664d31ce3843c7df8a3ba3d3ff3f86ae2ff68ea09d5817a94a25dfb98574d6266d8fc28a49bbbb3499f0c0fb7835b5d2553aa1589da74377a69c1c12c413b"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolLevelSettingService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolLevelSettingService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SchoolsModule.html" data-type="entity-link" >SchoolsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SchoolsModule-6a5a755de437c4e4c1cfbede2b9ea8caad4a65bf63b4f6b09391e6db98919dc37b12dccbf76a58c37649dc041e2bc258017dcbf703ec0b94317e41d10c0ad35d"' : 'data-bs-target="#xs-injectables-links-module-SchoolsModule-6a5a755de437c4e4c1cfbede2b9ea8caad4a65bf63b4f6b09391e6db98919dc37b12dccbf76a58c37649dc041e2bc258017dcbf703ec0b94317e41d10c0ad35d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SchoolsModule-6a5a755de437c4e4c1cfbede2b9ea8caad4a65bf63b4f6b09391e6db98919dc37b12dccbf76a58c37649dc041e2bc258017dcbf703ec0b94317e41d10c0ad35d"' :
                                        'id="xs-injectables-links-module-SchoolsModule-6a5a755de437c4e4c1cfbede2b9ea8caad4a65bf63b4f6b09391e6db98919dc37b12dccbf76a58c37649dc041e2bc258017dcbf703ec0b94317e41d10c0ad35d"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolCreateProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolCreateProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SchoolTypeModule.html" data-type="entity-link" >SchoolTypeModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SchoolTypeModule-bd656c3ea427e8d013680abc4cf4701837b23ac7fec1a99b4e200e4f189eda42b1ec9ad85acb04b7d5f889053e74211b9f5590bea44eb43be379651edfa7594b"' : 'data-bs-target="#xs-injectables-links-module-SchoolTypeModule-bd656c3ea427e8d013680abc4cf4701837b23ac7fec1a99b4e200e4f189eda42b1ec9ad85acb04b7d5f889053e74211b9f5590bea44eb43be379651edfa7594b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SchoolTypeModule-bd656c3ea427e8d013680abc4cf4701837b23ac7fec1a99b4e200e4f189eda42b1ec9ad85acb04b7d5f889053e74211b9f5590bea44eb43be379651edfa7594b"' :
                                        'id="xs-injectables-links-module-SchoolTypeModule-bd656c3ea427e8d013680abc4cf4701837b23ac7fec1a99b4e200e4f189eda42b1ec9ad85acb04b7d5f889053e74211b9f5590bea44eb43be379651edfa7594b"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolConfigProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolConfigProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolConfigService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolConfigService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SearchModule.html" data-type="entity-link" >SearchModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SearchModule-84775e528f3adcb75e024421113b7087d286587415a094186968e195213f3c56dee4faab62b262e1512cc344de66c5752dd13ce076e19244a669da9487100ae8"' : 'data-bs-target="#xs-injectables-links-module-SearchModule-84775e528f3adcb75e024421113b7087d286587415a094186968e195213f3c56dee4faab62b262e1512cc344de66c5752dd13ce076e19244a669da9487100ae8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SearchModule-84775e528f3adcb75e024421113b7087d286587415a094186968e195213f3c56dee4faab62b262e1512cc344de66c5752dd13ce076e19244a669da9487100ae8"' :
                                        'id="xs-injectables-links-module-SearchModule-84775e528f3adcb75e024421113b7087d286587415a094186968e195213f3c56dee4faab62b262e1512cc344de66c5752dd13ce076e19244a669da9487100ae8"' }>
                                        <li class="link">
                                            <a href="injectables/SearchProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SearchProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SearchService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SearchService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SeederModule.html" data-type="entity-link" >SeederModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SeederModule-771b3db8a28fa1687bc1de8327648e14b4f85f3ff45099b65e099557ac9340b0856b8169b84a71c424eb58ed6840fad5a7466f05fc7793b53fccc123fd7c5900"' : 'data-bs-target="#xs-injectables-links-module-SeederModule-771b3db8a28fa1687bc1de8327648e14b4f85f3ff45099b65e099557ac9340b0856b8169b84a71c424eb58ed6840fad5a7466f05fc7793b53fccc123fd7c5900"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SeederModule-771b3db8a28fa1687bc1de8327648e14b4f85f3ff45099b65e099557ac9340b0856b8169b84a71c424eb58ed6840fad5a7466f05fc7793b53fccc123fd7c5900"' :
                                        'id="xs-injectables-links-module-SeederModule-771b3db8a28fa1687bc1de8327648e14b4f85f3ff45099b65e099557ac9340b0856b8169b84a71c424eb58ed6840fad5a7466f05fc7793b53fccc123fd7c5900"' }>
                                        <li class="link">
                                            <a href="injectables/SeedingService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SeedingService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StaffModule.html" data-type="entity-link" >StaffModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StaffModule-43a4c1491e3bc72d7729fe8ed568886c3efda2130bd484c43e6e7d2a6af119805dcdd556cb83b0169161ac745ea54f80fffcf8c7402286cb12c80d4da839b70f"' : 'data-bs-target="#xs-injectables-links-module-StaffModule-43a4c1491e3bc72d7729fe8ed568886c3efda2130bd484c43e6e7d2a6af119805dcdd556cb83b0169161ac745ea54f80fffcf8c7402286cb12c80d4da839b70f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StaffModule-43a4c1491e3bc72d7729fe8ed568886c3efda2130bd484c43e6e7d2a6af119805dcdd556cb83b0169161ac745ea54f80fffcf8c7402286cb12c80d4da839b70f"' :
                                        'id="xs-injectables-links-module-StaffModule-43a4c1491e3bc72d7729fe8ed568886c3efda2130bd484c43e6e7d2a6af119805dcdd556cb83b0169161ac745ea54f80fffcf8c7402286cb12c80d4da839b70f"' }>
                                        <li class="link">
                                            <a href="injectables/StaffService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StaffService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StorageModule.html" data-type="entity-link" >StorageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-StorageModule-ca4713e9a79cb5a2ac6b682a17b1c664df5a8d88bacf7a7f15f4e458721afe4ded76a75e2102db746f80e38231f123c2a13b430d77e7156baa76df417492ab5d"' : 'data-bs-target="#xs-controllers-links-module-StorageModule-ca4713e9a79cb5a2ac6b682a17b1c664df5a8d88bacf7a7f15f4e458721afe4ded76a75e2102db746f80e38231f123c2a13b430d77e7156baa76df417492ab5d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-StorageModule-ca4713e9a79cb5a2ac6b682a17b1c664df5a8d88bacf7a7f15f4e458721afe4ded76a75e2102db746f80e38231f123c2a13b430d77e7156baa76df417492ab5d"' :
                                            'id="xs-controllers-links-module-StorageModule-ca4713e9a79cb5a2ac6b682a17b1c664df5a8d88bacf7a7f15f4e458721afe4ded76a75e2102db746f80e38231f123c2a13b430d77e7156baa76df417492ab5d"' }>
                                            <li class="link">
                                                <a href="controllers/StorageController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StorageController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StorageModule-ca4713e9a79cb5a2ac6b682a17b1c664df5a8d88bacf7a7f15f4e458721afe4ded76a75e2102db746f80e38231f123c2a13b430d77e7156baa76df417492ab5d"' : 'data-bs-target="#xs-injectables-links-module-StorageModule-ca4713e9a79cb5a2ac6b682a17b1c664df5a8d88bacf7a7f15f4e458721afe4ded76a75e2102db746f80e38231f123c2a13b430d77e7156baa76df417492ab5d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StorageModule-ca4713e9a79cb5a2ac6b682a17b1c664df5a8d88bacf7a7f15f4e458721afe4ded76a75e2102db746f80e38231f123c2a13b430d77e7156baa76df417492ab5d"' :
                                        'id="xs-injectables-links-module-StorageModule-ca4713e9a79cb5a2ac6b682a17b1c664df5a8d88bacf7a7f15f4e458721afe4ded76a75e2102db746f80e38231f123c2a13b430d77e7156baa76df417492ab5d"' }>
                                        <li class="link">
                                            <a href="injectables/BackblazeService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BackblazeService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StreamsModule.html" data-type="entity-link" >StreamsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StreamsModule-326cd418a02280a6f2187828641ec1015a4120f091edbc7f50c2f0215ff9cc11287343c2884d07a677f1593ba64d5c33604b7c2204b7e2889cf4cc2d59472d38"' : 'data-bs-target="#xs-injectables-links-module-StreamsModule-326cd418a02280a6f2187828641ec1015a4120f091edbc7f50c2f0215ff9cc11287343c2884d07a677f1593ba64d5c33604b7c2204b7e2889cf4cc2d59472d38"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StreamsModule-326cd418a02280a6f2187828641ec1015a4120f091edbc7f50c2f0215ff9cc11287343c2884d07a677f1593ba64d5c33604b7c2204b7e2889cf4cc2d59472d38"' :
                                        'id="xs-injectables-links-module-StreamsModule-326cd418a02280a6f2187828641ec1015a4120f091edbc7f50c2f0215ff9cc11287343c2884d07a677f1593ba64d5c33604b7c2204b7e2889cf4cc2d59472d38"' }>
                                        <li class="link">
                                            <a href="injectables/CreateStreamProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateStreamProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CreateTenantStreamProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateTenantStreamProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CreateTenantStreamService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateTenantStreamService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DeleteStreamProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeleteStreamProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/StreamsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StreamsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UpdateStreamProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UpdateStreamProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StudentAttendanceModule.html" data-type="entity-link" >StudentAttendanceModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StudentAttendanceModule-cf1c5d9f491ef8bc875580282307ad4de6a22e47ea2d347dcd92a0eef6e1d0c6bdddabe4d2733f742fd2b6bfb79c8d266604bc7a5694455e5ea301f2fe18c4c2"' : 'data-bs-target="#xs-injectables-links-module-StudentAttendanceModule-cf1c5d9f491ef8bc875580282307ad4de6a22e47ea2d347dcd92a0eef6e1d0c6bdddabe4d2733f742fd2b6bfb79c8d266604bc7a5694455e5ea301f2fe18c4c2"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StudentAttendanceModule-cf1c5d9f491ef8bc875580282307ad4de6a22e47ea2d347dcd92a0eef6e1d0c6bdddabe4d2733f742fd2b6bfb79c8d266604bc7a5694455e5ea301f2fe18c4c2"' :
                                        'id="xs-injectables-links-module-StudentAttendanceModule-cf1c5d9f491ef8bc875580282307ad4de6a22e47ea2d347dcd92a0eef6e1d0c6bdddabe4d2733f742fd2b6bfb79c8d266604bc7a5694455e5ea301f2fe18c4c2"' }>
                                        <li class="link">
                                            <a href="injectables/StudentAttendanceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentAttendanceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StudentMarksheetModule.html" data-type="entity-link" >StudentMarksheetModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StudentMarksheetModule-9402694ff6e48c4cb0c44630942588554e248f5144a7e0c47bcfecfd85a62de69465414b1c47b0e7f2c24cc22f90ab0a5fc6eccf5dec043444d1fe580cc76a58"' : 'data-bs-target="#xs-injectables-links-module-StudentMarksheetModule-9402694ff6e48c4cb0c44630942588554e248f5144a7e0c47bcfecfd85a62de69465414b1c47b0e7f2c24cc22f90ab0a5fc6eccf5dec043444d1fe580cc76a58"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StudentMarksheetModule-9402694ff6e48c4cb0c44630942588554e248f5144a7e0c47bcfecfd85a62de69465414b1c47b0e7f2c24cc22f90ab0a5fc6eccf5dec043444d1fe580cc76a58"' :
                                        'id="xs-injectables-links-module-StudentMarksheetModule-9402694ff6e48c4cb0c44630942588554e248f5144a7e0c47bcfecfd85a62de69465414b1c47b0e7f2c24cc22f90ab0a5fc6eccf5dec043444d1fe580cc76a58"' }>
                                        <li class="link">
                                            <a href="injectables/StudentMarksheetService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentMarksheetService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StudentModule.html" data-type="entity-link" >StudentModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StudentModule-1cb32aff4551c8b637038b27a1dad2021b64d94326ab1223dbd63e6cf0cd48efd2173746c59e825065cfdcf252611cb72ff8a9f497881631b54e76fcee93b397"' : 'data-bs-target="#xs-injectables-links-module-StudentModule-1cb32aff4551c8b637038b27a1dad2021b64d94326ab1223dbd63e6cf0cd48efd2173746c59e825065cfdcf252611cb72ff8a9f497881631b54e76fcee93b397"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StudentModule-1cb32aff4551c8b637038b27a1dad2021b64d94326ab1223dbd63e6cf0cd48efd2173746c59e825065cfdcf252611cb72ff8a9f497881631b54e76fcee93b397"' :
                                        'id="xs-injectables-links-module-StudentModule-1cb32aff4551c8b637038b27a1dad2021b64d94326ab1223dbd63e6cf0cd48efd2173746c59e825065cfdcf252611cb72ff8a9f497881631b54e76fcee93b397"' }>
                                        <li class="link">
                                            <a href="injectables/StudentQueryProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentQueryProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/StudentSummaryService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentSummaryService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/StudentsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersCreateStudentProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersCreateStudentProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StudentNotesModule.html" data-type="entity-link" >StudentNotesModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StudentNotesModule-2143701249d39840cb0a721ea3a5123bcbcad86e8ea9de965e559a9dd6ea5abed3a6d3b36efb56d9e911f359171a00844974cdd24cebfa5335cf6ffde07038d3"' : 'data-bs-target="#xs-injectables-links-module-StudentNotesModule-2143701249d39840cb0a721ea3a5123bcbcad86e8ea9de965e559a9dd6ea5abed3a6d3b36efb56d9e911f359171a00844974cdd24cebfa5335cf6ffde07038d3"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StudentNotesModule-2143701249d39840cb0a721ea3a5123bcbcad86e8ea9de965e559a9dd6ea5abed3a6d3b36efb56d9e911f359171a00844974cdd24cebfa5335cf6ffde07038d3"' :
                                        'id="xs-injectables-links-module-StudentNotesModule-2143701249d39840cb0a721ea3a5123bcbcad86e8ea9de965e559a9dd6ea5abed3a6d3b36efb56d9e911f359171a00844974cdd24cebfa5335cf6ffde07038d3"' }>
                                        <li class="link">
                                            <a href="injectables/StudentNotesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentNotesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StudentPortalModule.html" data-type="entity-link" >StudentPortalModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StudentPortalModule-d1aaa5b5e1d0d4c731a27fbb444a7f35f883cac288dcda96c58dbcfb2ed3da55e66c6f88828530d8e6a42e0a1c824ec45d02bf38527ddc081941b9d6fb2b25c5"' : 'data-bs-target="#xs-injectables-links-module-StudentPortalModule-d1aaa5b5e1d0d4c731a27fbb444a7f35f883cac288dcda96c58dbcfb2ed3da55e66c6f88828530d8e6a42e0a1c824ec45d02bf38527ddc081941b9d6fb2b25c5"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StudentPortalModule-d1aaa5b5e1d0d4c731a27fbb444a7f35f883cac288dcda96c58dbcfb2ed3da55e66c6f88828530d8e6a42e0a1c824ec45d02bf38527ddc081941b9d6fb2b25c5"' :
                                        'id="xs-injectables-links-module-StudentPortalModule-d1aaa5b5e1d0d4c731a27fbb444a7f35f883cac288dcda96c58dbcfb2ed3da55e66c6f88828530d8e6a42e0a1c824ec45d02bf38527ddc081941b9d6fb2b25c5"' }>
                                        <li class="link">
                                            <a href="injectables/StudentChatService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentChatService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/StudentSummaryModule.html" data-type="entity-link" >StudentSummaryModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-StudentSummaryModule-7a492b59ed0b473f82651623faa1722386c920e909b351fc25621fd1b3552ac67aaf02515d0fa137d276aee8258c7ed7fb6d251a38ca743445c63b74ffcab6cd"' : 'data-bs-target="#xs-injectables-links-module-StudentSummaryModule-7a492b59ed0b473f82651623faa1722386c920e909b351fc25621fd1b3552ac67aaf02515d0fa137d276aee8258c7ed7fb6d251a38ca743445c63b74ffcab6cd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-StudentSummaryModule-7a492b59ed0b473f82651623faa1722386c920e909b351fc25621fd1b3552ac67aaf02515d0fa137d276aee8258c7ed7fb6d251a38ca743445c63b74ffcab6cd"' :
                                        'id="xs-injectables-links-module-StudentSummaryModule-7a492b59ed0b473f82651623faa1722386c920e909b351fc25621fd1b3552ac67aaf02515d0fa137d276aee8258c7ed7fb6d251a38ca743445c63b74ffcab6cd"' }>
                                        <li class="link">
                                            <a href="injectables/StudentProfileService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StudentProfileService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SubjectModule.html" data-type="entity-link" >SubjectModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SubjectModule-0e9b9aa11d0fe8eb7d62f37e10e6868bbd892de1cb9b314498e44d1c38c5dfe2abdd8d951db0c146883251bf6ad54c43ab43abdf3009ed0751d8cae46a1f4a9c"' : 'data-bs-target="#xs-injectables-links-module-SubjectModule-0e9b9aa11d0fe8eb7d62f37e10e6868bbd892de1cb9b314498e44d1c38c5dfe2abdd8d951db0c146883251bf6ad54c43ab43abdf3009ed0751d8cae46a1f4a9c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SubjectModule-0e9b9aa11d0fe8eb7d62f37e10e6868bbd892de1cb9b314498e44d1c38c5dfe2abdd8d951db0c146883251bf6ad54c43ab43abdf3009ed0751d8cae46a1f4a9c"' :
                                        'id="xs-injectables-links-module-SubjectModule-0e9b9aa11d0fe8eb7d62f37e10e6868bbd892de1cb9b314498e44d1c38c5dfe2abdd8d951db0c146883251bf6ad54c43ab43abdf3009ed0751d8cae46a1f4a9c"' }>
                                        <li class="link">
                                            <a href="injectables/CreateTenantSubjectProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateTenantSubjectProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CreateTenantSubjectService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateTenantSubjectService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SuperAdminModule.html" data-type="entity-link" >SuperAdminModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SuperAdminModule-ab7c5dd2365a645c2519a6400dd069056cdfdcdadcf228e569122cd6dd139f76f921266d2573fbf7ce83baf048d99868be52c20409e201fff7532c6a6defb5f8"' : 'data-bs-target="#xs-injectables-links-module-SuperAdminModule-ab7c5dd2365a645c2519a6400dd069056cdfdcdadcf228e569122cd6dd139f76f921266d2573fbf7ce83baf048d99868be52c20409e201fff7532c6a6defb5f8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SuperAdminModule-ab7c5dd2365a645c2519a6400dd069056cdfdcdadcf228e569122cd6dd139f76f921266d2573fbf7ce83baf048d99868be52c20409e201fff7532c6a6defb5f8"' :
                                        'id="xs-injectables-links-module-SuperAdminModule-ab7c5dd2365a645c2519a6400dd069056cdfdcdadcf228e569122cd6dd139f76f921266d2573fbf7ce83baf048d99868be52c20409e201fff7532c6a6defb5f8"' }>
                                        <li class="link">
                                            <a href="injectables/SuperAdminAuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SuperAdminAuthService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TeacherModule.html" data-type="entity-link" >TeacherModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TeacherModule.html" data-type="entity-link" >TeacherModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TeacherModule-2976f1fa6e8d04b966b5c0fe30d4216a2e27a6f93d07fd467be22932f69ce53eedc159eafc7d29292616671249af1c045eba812ed5d3586f7c02ad95b30772e3-1"' : 'data-bs-target="#xs-injectables-links-module-TeacherModule-2976f1fa6e8d04b966b5c0fe30d4216a2e27a6f93d07fd467be22932f69ce53eedc159eafc7d29292616671249af1c045eba812ed5d3586f7c02ad95b30772e3-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TeacherModule-2976f1fa6e8d04b966b5c0fe30d4216a2e27a6f93d07fd467be22932f69ce53eedc159eafc7d29292616671249af1c045eba812ed5d3586f7c02ad95b30772e3-1"' :
                                        'id="xs-injectables-links-module-TeacherModule-2976f1fa6e8d04b966b5c0fe30d4216a2e27a6f93d07fd467be22932f69ce53eedc159eafc7d29292616671249af1c045eba812ed5d3586f7c02ad95b30772e3-1"' }>
                                        <li class="link">
                                            <a href="injectables/ClassTeacherProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ClassTeacherProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeacherService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeacherService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TeacherNotesModule.html" data-type="entity-link" >TeacherNotesModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TeacherNotesModule-9b1a82a8ff28f3495e3f1bafcd4b0b1b0eea6ca5ee0ac760e7a49604e3bc27daa07dbf4f7313bd3bf4aae9b1d542a73661eec9b88f39b9c5cea3f45db4a97ebf"' : 'data-bs-target="#xs-injectables-links-module-TeacherNotesModule-9b1a82a8ff28f3495e3f1bafcd4b0b1b0eea6ca5ee0ac760e7a49604e3bc27daa07dbf4f7313bd3bf4aae9b1d542a73661eec9b88f39b9c5cea3f45db4a97ebf"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TeacherNotesModule-9b1a82a8ff28f3495e3f1bafcd4b0b1b0eea6ca5ee0ac760e7a49604e3bc27daa07dbf4f7313bd3bf4aae9b1d542a73661eec9b88f39b9c5cea3f45db4a97ebf"' :
                                        'id="xs-injectables-links-module-TeacherNotesModule-9b1a82a8ff28f3495e3f1bafcd4b0b1b0eea6ca5ee0ac760e7a49604e3bc27daa07dbf4f7313bd3bf4aae9b1d542a73661eec9b88f39b9c5cea3f45db4a97ebf"' }>
                                        <li class="link">
                                            <a href="injectables/TeacherNotesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeacherNotesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TeacherParentsModule.html" data-type="entity-link" >TeacherParentsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TeacherParentsModule-f40f8e9ffc784090b0c34a80b9f92d7d3fa0bc275985abcb34ee2123ac5ca0d31897e548d85beb209fbf264c14ef755de515c0ef591e794e294703c57f6e4621"' : 'data-bs-target="#xs-injectables-links-module-TeacherParentsModule-f40f8e9ffc784090b0c34a80b9f92d7d3fa0bc275985abcb34ee2123ac5ca0d31897e548d85beb209fbf264c14ef755de515c0ef591e794e294703c57f6e4621"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TeacherParentsModule-f40f8e9ffc784090b0c34a80b9f92d7d3fa0bc275985abcb34ee2123ac5ca0d31897e548d85beb209fbf264c14ef755de515c0ef591e794e294703c57f6e4621"' :
                                        'id="xs-injectables-links-module-TeacherParentsModule-f40f8e9ffc784090b0c34a80b9f92d7d3fa0bc275985abcb34ee2123ac5ca0d31897e548d85beb209fbf264c14ef755de515c0ef591e794e294703c57f6e4621"' }>
                                        <li class="link">
                                            <a href="injectables/TeacherParentsProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeacherParentsProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeacherParentsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeacherParentsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TeacherProfilesModule.html" data-type="entity-link" >TeacherProfilesModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TeacherStudentsModule.html" data-type="entity-link" >TeacherStudentsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TeacherStudentsModule-12de7fe7c9f4ed1d7bc00575019bb18600a1c0607486b4583ec113270ec6484b4ba4b0c748262c8318d9893bd2460df6dd979c95bedfa8527decbde59c328123"' : 'data-bs-target="#xs-injectables-links-module-TeacherStudentsModule-12de7fe7c9f4ed1d7bc00575019bb18600a1c0607486b4583ec113270ec6484b4ba4b0c748262c8318d9893bd2460df6dd979c95bedfa8527decbde59c328123"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TeacherStudentsModule-12de7fe7c9f4ed1d7bc00575019bb18600a1c0607486b4583ec113270ec6484b4ba4b0c748262c8318d9893bd2460df6dd979c95bedfa8527decbde59c328123"' :
                                        'id="xs-injectables-links-module-TeacherStudentsModule-12de7fe7c9f4ed1d7bc00575019bb18600a1c0607486b4583ec113270ec6484b4ba4b0c748262c8318d9893bd2460df6dd979c95bedfa8527decbde59c328123"' }>
                                        <li class="link">
                                            <a href="injectables/TeacherStudentsProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeacherStudentsProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeacherStudentsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeacherStudentsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TenantsModule.html" data-type="entity-link" >TenantsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TenantsModule-83365ad71abf2d76763b69e97d273deb62b401a89044a99293537f350863185a293f5041c00d77d6a51ac1d9c088518c5761f3f8cbb312af74ccd135d6d4811f"' : 'data-bs-target="#xs-injectables-links-module-TenantsModule-83365ad71abf2d76763b69e97d273deb62b401a89044a99293537f350863185a293f5041c00d77d6a51ac1d9c088518c5761f3f8cbb312af74ccd135d6d4811f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TenantsModule-83365ad71abf2d76763b69e97d273deb62b401a89044a99293537f350863185a293f5041c00d77d6a51ac1d9c088518c5761f3f8cbb312af74ccd135d6d4811f"' :
                                        'id="xs-injectables-links-module-TenantsModule-83365ad71abf2d76763b69e97d273deb62b401a89044a99293537f350863185a293f5041c00d77d6a51ac1d9c088518c5761f3f8cbb312af74ccd135d6d4811f"' }>
                                        <li class="link">
                                            <a href="injectables/TenantService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TenantService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TestModule.html" data-type="entity-link" >TestModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TestModule-52dba73eb94b203eb4885bfdf600383568dc25d90b45fbe6f8f3afdadd19ea3f506d1edd65b1a408305f84f467fd9a1bc73dbe9167e467ad35097cf2ab7c8a13"' : 'data-bs-target="#xs-injectables-links-module-TestModule-52dba73eb94b203eb4885bfdf600383568dc25d90b45fbe6f8f3afdadd19ea3f506d1edd65b1a408305f84f467fd9a1bc73dbe9167e467ad35097cf2ab7c8a13"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TestModule-52dba73eb94b203eb4885bfdf600383568dc25d90b45fbe6f8f3afdadd19ea3f506d1edd65b1a408305f84f467fd9a1bc73dbe9167e467ad35097cf2ab7c8a13"' :
                                        'id="xs-injectables-links-module-TestModule-52dba73eb94b203eb4885bfdf600383568dc25d90b45fbe6f8f3afdadd19ea3f506d1edd65b1a408305f84f467fd9a1bc73dbe9167e467ad35097cf2ab7c8a13"' }>
                                        <li class="link">
                                            <a href="injectables/CreateTestProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CreateTestProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FindTestsProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FindTestsProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GenerateQuestionsProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GenerateQuestionsProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TestService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TestService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UpdateTestProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UpdateTestProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TimetableModule.html" data-type="entity-link" >TimetableModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TimetableModule-066917537bb3c7d72a459978361b480de25c13d3c333d2ea69431f7671c7f6836a8a58647b7ebbcc5726eb0a2415b238a040f0a4b19255ac44a3180f64cff183"' : 'data-bs-target="#xs-injectables-links-module-TimetableModule-066917537bb3c7d72a459978361b480de25c13d3c333d2ea69431f7671c7f6836a8a58647b7ebbcc5726eb0a2415b238a040f0a4b19255ac44a3180f64cff183"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TimetableModule-066917537bb3c7d72a459978361b480de25c13d3c333d2ea69431f7671c7f6836a8a58647b7ebbcc5726eb0a2415b238a040f0a4b19255ac44a3180f64cff183"' :
                                        'id="xs-injectables-links-module-TimetableModule-066917537bb3c7d72a459978361b480de25c13d3c333d2ea69431f7671c7f6836a8a58647b7ebbcc5726eb0a2415b238a040f0a4b19255ac44a3180f64cff183"' }>
                                        <li class="link">
                                            <a href="injectables/TimetableService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TimetableService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TransportModule.html" data-type="entity-link" >TransportModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TransportModule-bf54f0a837c7f2a687da93450cbde8412776dabfdc413fbe88dfe1e423fd6b2a49dddf35eee9f6be3657bd1231ee368a69a7b5e9e396a40f406f62cd7405cc67"' : 'data-bs-target="#xs-injectables-links-module-TransportModule-bf54f0a837c7f2a687da93450cbde8412776dabfdc413fbe88dfe1e423fd6b2a49dddf35eee9f6be3657bd1231ee368a69a7b5e9e396a40f406f62cd7405cc67"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TransportModule-bf54f0a837c7f2a687da93450cbde8412776dabfdc413fbe88dfe1e423fd6b2a49dddf35eee9f6be3657bd1231ee368a69a7b5e9e396a40f406f62cd7405cc67"' :
                                        'id="xs-injectables-links-module-TransportModule-bf54f0a837c7f2a687da93450cbde8412776dabfdc413fbe88dfe1e423fd6b2a49dddf35eee9f6be3657bd1231ee368a69a7b5e9e396a40f406f62cd7405cc67"' }>
                                        <li class="link">
                                            <a href="injectables/TransportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TransportService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserModule.html" data-type="entity-link" >UserModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserModule-d345d3f623b26464fc95d8fddf2c88ff07546046e06df1614d424e287a3f3f2e77c056b0154d9fb45312394b93c5abd19db258425614e42586cb661e038aea66"' : 'data-bs-target="#xs-injectables-links-module-UserModule-d345d3f623b26464fc95d8fddf2c88ff07546046e06df1614d424e287a3f3f2e77c056b0154d9fb45312394b93c5abd19db258425614e42586cb661e038aea66"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserModule-d345d3f623b26464fc95d8fddf2c88ff07546046e06df1614d424e287a3f3f2e77c056b0154d9fb45312394b93c5abd19db258425614e42586cb661e038aea66"' :
                                        'id="xs-injectables-links-module-UserModule-d345d3f623b26464fc95d8fddf2c88ff07546046e06df1614d424e287a3f3f2e77c056b0154d9fb45312394b93c5abd19db258425614e42586cb661e038aea66"' }>
                                        <li class="link">
                                            <a href="injectables/UsersCreateProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersCreateProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserTenantMembershipModule.html" data-type="entity-link" >UserTenantMembershipModule</a>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#entities-links"' :
                                'data-bs-target="#xs-entities-links"' }>
                                <span class="icon ion-ios-apps"></span>
                                <span>Entities</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="entities-links"' : 'id="xs-entities-links"' }>
                                <li class="link">
                                    <a href="entities/AcademicYear.html" data-type="entity-link" >AcademicYear</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Assessment.html" data-type="entity-link" >Assessment</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AssessmentMark.html" data-type="entity-link" >AssessmentMark</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Attendance.html" data-type="entity-link" >Attendance</a>
                                </li>
                                <li class="link">
                                    <a href="entities/BreakSchedule.html" data-type="entity-link" >BreakSchedule</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ChatMessage.html" data-type="entity-link" >ChatMessage</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ChatRoom.html" data-type="entity-link" >ChatRoom</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ClassTeacherAssignment.html" data-type="entity-link" >ClassTeacherAssignment</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Curriculum.html" data-type="entity-link" >Curriculum</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CurriculumSubject.html" data-type="entity-link" >CurriculumSubject</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CustomSubject.html" data-type="entity-link" >CustomSubject</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FeeAssignment.html" data-type="entity-link" >FeeAssignment</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FeeAssignmentGradeLevel.html" data-type="entity-link" >FeeAssignmentGradeLevel</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FeeBucket.html" data-type="entity-link" >FeeBucket</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FeeStructure.html" data-type="entity-link" >FeeStructure</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FeeStructureItem.html" data-type="entity-link" >FeeStructureItem</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Grade.html" data-type="entity-link" >Grade</a>
                                </li>
                                <li class="link">
                                    <a href="entities/GradeLevel.html" data-type="entity-link" >GradeLevel</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Hostel.html" data-type="entity-link" >Hostel</a>
                                </li>
                                <li class="link">
                                    <a href="entities/HostelAssignment.html" data-type="entity-link" >HostelAssignment</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Invoice.html" data-type="entity-link" >Invoice</a>
                                </li>
                                <li class="link">
                                    <a href="entities/InvoiceItem.html" data-type="entity-link" >InvoiceItem</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Level.html" data-type="entity-link" >Level</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Mark.html" data-type="entity-link" >Mark</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Option.html" data-type="entity-link" >Option</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Organization.html" data-type="entity-link" >Organization</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Parent.html" data-type="entity-link" >Parent</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ParentStudent.html" data-type="entity-link" >ParentStudent</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Payment.html" data-type="entity-link" >Payment</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Question.html" data-type="entity-link" >Question</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Receipt.html" data-type="entity-link" >Receipt</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ReferenceMaterial.html" data-type="entity-link" >ReferenceMaterial</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Scholarship.html" data-type="entity-link" >Scholarship</a>
                                </li>
                                <li class="link">
                                    <a href="entities/School.html" data-type="entity-link" >School</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolConfig.html" data-type="entity-link" >SchoolConfig</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolConfigCurriculum.html" data-type="entity-link" >SchoolConfigCurriculum</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolConfigGradeLevel.html" data-type="entity-link" >SchoolConfigGradeLevel</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolConfigLevel.html" data-type="entity-link" >SchoolConfigLevel</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolConfigSubject.html" data-type="entity-link" >SchoolConfigSubject</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolLevel.html" data-type="entity-link" >SchoolLevel</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolLevelSetting.html" data-type="entity-link" >SchoolLevelSetting</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolType.html" data-type="entity-link" >SchoolType</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SelectedSchoolStructure.html" data-type="entity-link" >SelectedSchoolStructure</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Staff.html" data-type="entity-link" >Staff</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Stream.html" data-type="entity-link" >Stream</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Student.html" data-type="entity-link" >Student</a>
                                </li>
                                <li class="link">
                                    <a href="entities/StudentFeeAssignment.html" data-type="entity-link" >StudentFeeAssignment</a>
                                </li>
                                <li class="link">
                                    <a href="entities/StudentFeeItem.html" data-type="entity-link" >StudentFeeItem</a>
                                </li>
                                <li class="link">
                                    <a href="entities/StudentScholarship.html" data-type="entity-link" >StudentScholarship</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Subject.html" data-type="entity-link" >Subject</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Teacher.html" data-type="entity-link" >Teacher</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TeacherNote.html" data-type="entity-link" >TeacherNote</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TeacherProfile.html" data-type="entity-link" >TeacherProfile</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Tenant.html" data-type="entity-link" >Tenant</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TenantGradeLevel.html" data-type="entity-link" >TenantGradeLevel</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TenantStream.html" data-type="entity-link" >TenantStream</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TenantSubject.html" data-type="entity-link" >TenantSubject</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Term.html" data-type="entity-link" >Term</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Test.html" data-type="entity-link" >Test</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TimeSlot.html" data-type="entity-link" >TimeSlot</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TimetableBreak.html" data-type="entity-link" >TimetableBreak</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TimetableEntry.html" data-type="entity-link" >TimetableEntry</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TransportAssignment.html" data-type="entity-link" >TransportAssignment</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TransportRoute.html" data-type="entity-link" >TransportRoute</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TransportRoute-1.html" data-type="entity-link" >TransportRoute</a>
                                </li>
                                <li class="link">
                                    <a href="entities/User.html" data-type="entity-link" >User</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserInvitation.html" data-type="entity-link" >UserInvitation</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserSchoolSelection.html" data-type="entity-link" >UserSchoolSelection</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserSubjectSelection.html" data-type="entity-link" >UserSubjectSelection</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserTenantMembership.html" data-type="entity-link" >UserTenantMembership</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AcademicSummary.html" data-type="entity-link" >AcademicSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcademicYear.html" data-type="entity-link" >AcademicYear</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcademicYearFinancialSummary.html" data-type="entity-link" >AcademicYearFinancialSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcademicYearResolver.html" data-type="entity-link" >AcademicYearResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcceptInvitationInput.html" data-type="entity-link" >AcceptInvitationInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcceptInvitationResponse.html" data-type="entity-link" >AcceptInvitationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcceptParentInvitationInput.html" data-type="entity-link" >AcceptParentInvitationInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcceptParentInvitationResponse.html" data-type="entity-link" >AcceptParentInvitationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcceptStaffInvitationInput.html" data-type="entity-link" >AcceptStaffInvitationInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcceptStaffInvitationResponse.html" data-type="entity-link" >AcceptStaffInvitationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddStudentsToParentResponse.html" data-type="entity-link" >AddStudentsToParentResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Assessment.html" data-type="entity-link" >Assessment</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssessmentFilterInput.html" data-type="entity-link" >AssessmentFilterInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssessmentGroups.html" data-type="entity-link" >AssessmentGroups</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssessmentMark.html" data-type="entity-link" >AssessmentMark</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssessmentOutput.html" data-type="entity-link" >AssessmentOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssessmentResolver.html" data-type="entity-link" >AssessmentResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignGradeLevelClassTeacherInput.html" data-type="entity-link" >AssignGradeLevelClassTeacherInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/Assignment.html" data-type="entity-link" >Assignment</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignmentsResponse.html" data-type="entity-link" >AssignmentsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignmentSubject.html" data-type="entity-link" >AssignmentSubject</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignmentSubmission.html" data-type="entity-link" >AssignmentSubmission</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignmentTeacher.html" data-type="entity-link" >AssignmentTeacher</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignScholarshipInput.html" data-type="entity-link" >AssignScholarshipInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignStreamClassTeacherInput.html" data-type="entity-link" >AssignStreamClassTeacherInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/AssignTransportInput.html" data-type="entity-link" >AssignTransportInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/Attendance.html" data-type="entity-link" >Attendance</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttendanceDetailDto.html" data-type="entity-link" >AttendanceDetailDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttendanceInput.html" data-type="entity-link" >AttendanceInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttendanceRecordSummary.html" data-type="entity-link" >AttendanceRecordSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttendanceResolver.html" data-type="entity-link" >AttendanceResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttendanceSummaryDto.html" data-type="entity-link" >AttendanceSummaryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttendanceSummaryResponse.html" data-type="entity-link" >AttendanceSummaryResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthResolver.html" data-type="entity-link" >AuthResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthResponse.html" data-type="entity-link" >AuthResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthResponse-1.html" data-type="entity-link" >AuthResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BreakSchedule.html" data-type="entity-link" >BreakSchedule</a>
                            </li>
                            <li class="link">
                                <a href="classes/BroadcastMessageInput.html" data-type="entity-link" >BroadcastMessageInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/BroadcastToGradeLevelsInput.html" data-type="entity-link" >BroadcastToGradeLevelsInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/BulkCreateTimetableEntryInput.html" data-type="entity-link" >BulkCreateTimetableEntryInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/BulkInvoiceResult.html" data-type="entity-link" >BulkInvoiceResult</a>
                            </li>
                            <li class="link">
                                <a href="classes/BulkRemoveTransportAssignmentInput.html" data-type="entity-link" >BulkRemoveTransportAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/BulkStudentOperationInput.html" data-type="entity-link" >BulkStudentOperationInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/BulkToggleByFeeStructureItemInput.html" data-type="entity-link" >BulkToggleByFeeStructureItemInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/BulkToggleStudentFeeItemsInput.html" data-type="entity-link" >BulkToggleStudentFeeItemsInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/BulkTransportAssignmentInput.html" data-type="entity-link" >BulkTransportAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/BusinessException.html" data-type="entity-link" >BusinessException</a>
                            </li>
                            <li class="link">
                                <a href="classes/BusinessException-1.html" data-type="entity-link" >BusinessException</a>
                            </li>
                            <li class="link">
                                <a href="classes/CBCLevelSelectionDto.html" data-type="entity-link" >CBCLevelSelectionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChangePasswordInput.html" data-type="entity-link" >ChangePasswordInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChatGateway.html" data-type="entity-link" >ChatGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChatMessage.html" data-type="entity-link" >ChatMessage</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChatResolver.html" data-type="entity-link" >ChatResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChatRoom.html" data-type="entity-link" >ChatRoom</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChildProfileDto.html" data-type="entity-link" >ChildProfileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassTeacherAssignment.html" data-type="entity-link" >ClassTeacherAssignment</a>
                            </li>
                            <li class="link">
                                <a href="classes/CombinedSearchResult.html" data-type="entity-link" >CombinedSearchResult</a>
                            </li>
                            <li class="link">
                                <a href="classes/ComprehensiveFeeStructureSummary.html" data-type="entity-link" >ComprehensiveFeeStructureSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAcademicYearInput.html" data-type="entity-link" >CreateAcademicYearInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAssessmentInput.html" data-type="entity-link" >CreateAssessmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAssignmentSubmissionInput.html" data-type="entity-link" >CreateAssignmentSubmissionInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAttendanceInput.html" data-type="entity-link" >CreateAttendanceInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateBulkInvoicesInput.html" data-type="entity-link" >CreateBulkInvoicesInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateChatRoomInput.html" data-type="entity-link" >CreateChatRoomInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateCustomSubjectInput.html" data-type="entity-link" >CreateCustomSubjectInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateFeeAssignmentInput.html" data-type="entity-link" >CreateFeeAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateFeeBucketInput.html" data-type="entity-link" >CreateFeeBucketInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateFeeStructureWithItemsInput.html" data-type="entity-link" >CreateFeeStructureWithItemsInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateHostelAssignmentInput.html" data-type="entity-link" >CreateHostelAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateHostelInput.html" data-type="entity-link" >CreateHostelInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateInvoiceInput.html" data-type="entity-link" >CreateInvoiceInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateInvoiceInput-1.html" data-type="entity-link" >CreateInvoiceInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateOptionInput.html" data-type="entity-link" >CreateOptionInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateParentInvitationDto.html" data-type="entity-link" >CreateParentInvitationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePaymentInput.html" data-type="entity-link" >CreatePaymentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateQuestionInput.html" data-type="entity-link" >CreateQuestionInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateReferenceMaterialInput.html" data-type="entity-link" >CreateReferenceMaterialInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateScholarshipInput.html" data-type="entity-link" >CreateScholarshipInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateSchoolInput.html" data-type="entity-link" >CreateSchoolInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateSchoolSetupDto.html" data-type="entity-link" >CreateSchoolSetupDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateStaffInvitationDto.html" data-type="entity-link" >CreateStaffInvitationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateStreamInput.html" data-type="entity-link" >CreateStreamInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateStudentInput.html" data-type="entity-link" >CreateStudentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateStudentResponse.html" data-type="entity-link" >CreateStudentResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTeacherInvitationDto.html" data-type="entity-link" >CreateTeacherInvitationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTeacherNoteDto.html" data-type="entity-link" >CreateTeacherNoteDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTenantStreamInput.html" data-type="entity-link" >CreateTenantStreamInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTenantSubjectInput.html" data-type="entity-link" >CreateTenantSubjectInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTermInput.html" data-type="entity-link" >CreateTermInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTestInput.html" data-type="entity-link" >CreateTestInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTimeSlotInput.html" data-type="entity-link" >CreateTimeSlotInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTimetableBreakInput.html" data-type="entity-link" >CreateTimetableBreakInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTimetableEntryInput.html" data-type="entity-link" >CreateTimetableEntryInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTransportAssignmentInput.html" data-type="entity-link" >CreateTransportAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTransportRouteInput.html" data-type="entity-link" >CreateTransportRouteInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserInput.html" data-type="entity-link" >CreateUserInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserResponse.html" data-type="entity-link" >CreateUserResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Curriculum.html" data-type="entity-link" >Curriculum</a>
                            </li>
                            <li class="link">
                                <a href="classes/CurriculumInfo.html" data-type="entity-link" >CurriculumInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/CurriculumSubject.html" data-type="entity-link" >CurriculumSubject</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomSubject.html" data-type="entity-link" >CustomSubject</a>
                            </li>
                            <li class="link">
                                <a href="classes/DateRangeInput.html" data-type="entity-link" >DateRangeInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/EmailSendFailedException.html" data-type="entity-link" >EmailSendFailedException</a>
                            </li>
                            <li class="link">
                                <a href="classes/EnterStudentMarksInput.html" data-type="entity-link" >EnterStudentMarksInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/EntityNotFoundFilter.html" data-type="entity-link" >EntityNotFoundFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeAssignment.html" data-type="entity-link" >FeeAssignment</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeAssignmentGradeLevel.html" data-type="entity-link" >FeeAssignmentGradeLevel</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeAssignmentResolver.html" data-type="entity-link" >FeeAssignmentResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeAssignmentWithStudents.html" data-type="entity-link" >FeeAssignmentWithStudents</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeBalanceDto.html" data-type="entity-link" >FeeBalanceDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeBucket.html" data-type="entity-link" >FeeBucket</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeBucketResolver.html" data-type="entity-link" >FeeBucketResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeItemBreakdownDto.html" data-type="entity-link" >FeeItemBreakdownDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeItemSummary.html" data-type="entity-link" >FeeItemSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructure.html" data-type="entity-link" >FeeStructure</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureItem.html" data-type="entity-link" >FeeStructureItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureItemInput.html" data-type="entity-link" >FeeStructureItemInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureItemResolver.html" data-type="entity-link" >FeeStructureItemResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureResolver.html" data-type="entity-link" >FeeStructureResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureSummaryByAcademicYear.html" data-type="entity-link" >FeeStructureSummaryByAcademicYear</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureSummaryByFeeBucket.html" data-type="entity-link" >FeeStructureSummaryByFeeBucket</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureSummaryByGradeLevel.html" data-type="entity-link" >FeeStructureSummaryByGradeLevel</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureSummaryByTenant.html" data-type="entity-link" >FeeStructureSummaryByTenant</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeeStructureSummaryResolver.html" data-type="entity-link" >FeeStructureSummaryResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileUploadDto.html" data-type="entity-link" >FileUploadDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilteredResult.html" data-type="entity-link" >FilteredResult</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterInput.html" data-type="entity-link" >FilterInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterTeacherNotesDto.html" data-type="entity-link" >FilterTeacherNotesDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FindTestQuery.html" data-type="entity-link" >FindTestQuery</a>
                            </li>
                            <li class="link">
                                <a href="classes/ForgotPasswordInput.html" data-type="entity-link" >ForgotPasswordInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GeneratedOptionOutput.html" data-type="entity-link" >GeneratedOptionOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GeneratedQuestionOutput.html" data-type="entity-link" >GeneratedQuestionOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GenerateQuestionsInput.html" data-type="entity-link" >GenerateQuestionsInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetAssignmentsArgs.html" data-type="entity-link" >GetAssignmentsArgs</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetAttendanceInput.html" data-type="entity-link" >GetAttendanceInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetFeeAssignmentsByGradeLevelsInput.html" data-type="entity-link" >GetFeeAssignmentsByGradeLevelsInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetPerformanceInput.html" data-type="entity-link" >GetPerformanceInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetReportCardInput.html" data-type="entity-link" >GetReportCardInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetStudentMarksFilterDto.html" data-type="entity-link" >GetStudentMarksFilterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetTransportAssignmentsInput.html" data-type="entity-link" >GetTransportAssignmentsInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/Grade.html" data-type="entity-link" >Grade</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeInfo.html" data-type="entity-link" >GradeInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevel.html" data-type="entity-link" >GradeLevel</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevelInfo.html" data-type="entity-link" >GradeLevelInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevelNotFoundException.html" data-type="entity-link" >GradeLevelNotFoundException</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevelOutput.html" data-type="entity-link" >GradeLevelOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevelReadDto.html" data-type="entity-link" >GradeLevelReadDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevelReadResponseGQL.html" data-type="entity-link" >GradeLevelReadResponseGQL</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevelResponse.html" data-type="entity-link" >GradeLevelResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevelStudentsSummary.html" data-type="entity-link" >GradeLevelStudentsSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeLevelWithStreamsOutput.html" data-type="entity-link" >GradeLevelWithStreamsOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/GradeTimetableResponse.html" data-type="entity-link" >GradeTimetableResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/GraphQLExceptionsFilter.html" data-type="entity-link" >GraphQLExceptionsFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/Hostel.html" data-type="entity-link" >Hostel</a>
                            </li>
                            <li class="link">
                                <a href="classes/HostelAssignment.html" data-type="entity-link" >HostelAssignment</a>
                            </li>
                            <li class="link">
                                <a href="classes/HostelResolver.html" data-type="entity-link" >HostelResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/HostelService.html" data-type="entity-link" >HostelService</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvalidLevelsException.html" data-type="entity-link" >InvalidLevelsException</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvitationInfo.html" data-type="entity-link" >InvitationInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvitationSignupInput.html" data-type="entity-link" >InvitationSignupInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvitationValidationResponse.html" data-type="entity-link" >InvitationValidationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/InviteParentRespons.html" data-type="entity-link" >InviteParentRespons</a>
                            </li>
                            <li class="link">
                                <a href="classes/InviteParentResponse.html" data-type="entity-link" >InviteParentResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/InviteStaffResponse.html" data-type="entity-link" >InviteStaffResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/InviteTeacherResponse.html" data-type="entity-link" >InviteTeacherResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Invoice.html" data-type="entity-link" >Invoice</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvoiceItem.html" data-type="entity-link" >InvoiceItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvoiceResolver.html" data-type="entity-link" >InvoiceResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/IsAfter.html" data-type="entity-link" >IsAfter</a>
                            </li>
                            <li class="link">
                                <a href="classes/LedgerEntry.html" data-type="entity-link" >LedgerEntry</a>
                            </li>
                            <li class="link">
                                <a href="classes/LedgerResolver.html" data-type="entity-link" >LedgerResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/LedgerSummary.html" data-type="entity-link" >LedgerSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/Level.html" data-type="entity-link" >Level</a>
                            </li>
                            <li class="link">
                                <a href="classes/LevelReadDto.html" data-type="entity-link" >LevelReadDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LevelWithSubjects.html" data-type="entity-link" >LevelWithSubjects</a>
                            </li>
                            <li class="link">
                                <a href="classes/Mark.html" data-type="entity-link" >Mark</a>
                            </li>
                            <li class="link">
                                <a href="classes/MarkInput.html" data-type="entity-link" >MarkInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/MarkResolver.html" data-type="entity-link" >MarkResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/MarksheetEntry.html" data-type="entity-link" >MarksheetEntry</a>
                            </li>
                            <li class="link">
                                <a href="classes/MarksheetResponse.html" data-type="entity-link" >MarksheetResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/MarksheetStats.html" data-type="entity-link" >MarksheetStats</a>
                            </li>
                            <li class="link">
                                <a href="classes/MarksStatsDto.html" data-type="entity-link" >MarksStatsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/MixedSchoolTypesException.html" data-type="entity-link" >MixedSchoolTypesException</a>
                            </li>
                            <li class="link">
                                <a href="classes/MyChildDto.html" data-type="entity-link" >MyChildDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Option.html" data-type="entity-link" >Option</a>
                            </li>
                            <li class="link">
                                <a href="classes/Organization.html" data-type="entity-link" >Organization</a>
                            </li>
                            <li class="link">
                                <a href="classes/Parent.html" data-type="entity-link" >Parent</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParentChatResolver.html" data-type="entity-link" >ParentChatResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParentDto.html" data-type="entity-link" >ParentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParentInfo.html" data-type="entity-link" >ParentInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParentOutput.html" data-type="entity-link" >ParentOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParentPortalResolver.html" data-type="entity-link" >ParentPortalResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParentResolver.html" data-type="entity-link" >ParentResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParentStudent.html" data-type="entity-link" >ParentStudent</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParentWithStudents.html" data-type="entity-link" >ParentWithStudents</a>
                            </li>
                            <li class="link">
                                <a href="classes/PasswordResetResponse.html" data-type="entity-link" >PasswordResetResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Payment.html" data-type="entity-link" >Payment</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentFilters.html" data-type="entity-link" >PaymentFilters</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentHistoryDto.html" data-type="entity-link" >PaymentHistoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaymentResolver.html" data-type="entity-link" >PaymentResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/PendingInvitation.html" data-type="entity-link" >PendingInvitation</a>
                            </li>
                            <li class="link">
                                <a href="classes/PendingInvitationResponse.html" data-type="entity-link" >PendingInvitationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/PerformanceMarkDto.html" data-type="entity-link" >PerformanceMarkDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Question.html" data-type="entity-link" >Question</a>
                            </li>
                            <li class="link">
                                <a href="classes/Receipt.html" data-type="entity-link" >Receipt</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReceiptResolver.html" data-type="entity-link" >ReceiptResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/RecentlyAddedTeacher.html" data-type="entity-link" >RecentlyAddedTeacher</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReferenceMaterial.html" data-type="entity-link" >ReferenceMaterial</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReferenceMaterialOutput.html" data-type="entity-link" >ReferenceMaterialOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/RefreshTokenDto.html" data-type="entity-link" >RefreshTokenDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoveTransportAssignmentInput.html" data-type="entity-link" >RemoveTransportAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReportCardDto.html" data-type="entity-link" >ReportCardDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReportCardStudentInfoDto.html" data-type="entity-link" >ReportCardStudentInfoDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReportCardSubjectDto.html" data-type="entity-link" >ReportCardSubjectDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReportCardSubjectScoreDto.html" data-type="entity-link" >ReportCardSubjectScoreDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResetPasswordInput.html" data-type="entity-link" >ResetPasswordInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/RevokeInvitationResponse.html" data-type="entity-link" >RevokeInvitationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Scholarship.html" data-type="entity-link" >Scholarship</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScholarshipService.html" data-type="entity-link" >ScholarshipService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScholarshipsResolver.html" data-type="entity-link" >ScholarshipsResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/School.html" data-type="entity-link" >School</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolAlreadyConfiguredException.html" data-type="entity-link" >SchoolAlreadyConfiguredException</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolAlreadyExistsException.html" data-type="entity-link" >SchoolAlreadyExistsException</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolConfig.html" data-type="entity-link" >SchoolConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolConfigLevel.html" data-type="entity-link" >SchoolConfigLevel</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolConfigResolver.html" data-type="entity-link" >SchoolConfigResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolConfigurationReadResponse.html" data-type="entity-link" >SchoolConfigurationReadResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolConfigurationReadResponseGQL.html" data-type="entity-link" >SchoolConfigurationReadResponseGQL</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolConfigurationResponse.html" data-type="entity-link" >SchoolConfigurationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolConfigurationResponse-1.html" data-type="entity-link" >SchoolConfigurationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolFinancialSummary.html" data-type="entity-link" >SchoolFinancialSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolLevel.html" data-type="entity-link" >SchoolLevel</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolLevelSetting.html" data-type="entity-link" >SchoolLevelSetting</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolType.html" data-type="entity-link" >SchoolType</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolTypeConfig.html" data-type="entity-link" >SchoolTypeConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolTypeGrade.html" data-type="entity-link" >SchoolTypeGrade</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolTypeLevel.html" data-type="entity-link" >SchoolTypeLevel</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolTypeResponse.html" data-type="entity-link" >SchoolTypeResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SearchResolver.html" data-type="entity-link" >SearchResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/SearchStudentInput.html" data-type="entity-link" >SearchStudentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SearchStudentResult.html" data-type="entity-link" >SearchStudentResult</a>
                            </li>
                            <li class="link">
                                <a href="classes/SearchTeacherResult.html" data-type="entity-link" >SearchTeacherResult</a>
                            </li>
                            <li class="link">
                                <a href="classes/SelectedLevel.html" data-type="entity-link" >SelectedLevel</a>
                            </li>
                            <li class="link">
                                <a href="classes/SelectedLevelReadResponseGQL.html" data-type="entity-link" >SelectedLevelReadResponseGQL</a>
                            </li>
                            <li class="link">
                                <a href="classes/SelectedLevelResponse.html" data-type="entity-link" >SelectedLevelResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendInvitationInput.html" data-type="entity-link" >SendInvitationInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendMessageFromParentInput.html" data-type="entity-link" >SendMessageFromParentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendMessageFromParentToTeacherInput.html" data-type="entity-link" >SendMessageFromParentToTeacherInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendMessageFromStudentToTeacherInput.html" data-type="entity-link" >SendMessageFromStudentToTeacherInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendMessageFromTeacherToParentInput.html" data-type="entity-link" >SendMessageFromTeacherToParentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendMessageInput.html" data-type="entity-link" >SendMessageInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SignInInput.html" data-type="entity-link" >SignInInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SignupInput.html" data-type="entity-link" >SignupInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SingleEntryInput.html" data-type="entity-link" >SingleEntryInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SocketTestResolver.html" data-type="entity-link" >SocketTestResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/Staff.html" data-type="entity-link" >Staff</a>
                            </li>
                            <li class="link">
                                <a href="classes/StaffDto.html" data-type="entity-link" >StaffDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/StaffInfo.html" data-type="entity-link" >StaffInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/StaffResolver.html" data-type="entity-link" >StaffResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/Stream.html" data-type="entity-link" >Stream</a>
                            </li>
                            <li class="link">
                                <a href="classes/StreamDto.html" data-type="entity-link" >StreamDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/StreamInfo.html" data-type="entity-link" >StreamInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/StreamOutput.html" data-type="entity-link" >StreamOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/StreamReadResponseGQL.html" data-type="entity-link" >StreamReadResponseGQL</a>
                            </li>
                            <li class="link">
                                <a href="classes/StreamsResolver.html" data-type="entity-link" >StreamsResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StreamType.html" data-type="entity-link" >StreamType</a>
                            </li>
                            <li class="link">
                                <a href="classes/Student.html" data-type="entity-link" >Student</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentAcademicProfile.html" data-type="entity-link" >StudentAcademicProfile</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentAlreadyAssignedToRouteException.html" data-type="entity-link" >StudentAlreadyAssignedToRouteException</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentAttendanceResolver.html" data-type="entity-link" >StudentAttendanceResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentChatResolver.html" data-type="entity-link" >StudentChatResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentFeeAssignment.html" data-type="entity-link" >StudentFeeAssignment</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentFeeItem.html" data-type="entity-link" >StudentFeeItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentFeeItemSummary.html" data-type="entity-link" >StudentFeeItemSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentFeeSummary.html" data-type="entity-link" >StudentFeeSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentFeeSummarys.html" data-type="entity-link" >StudentFeeSummarys</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentForParentDto.html" data-type="entity-link" >StudentForParentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentInfo.html" data-type="entity-link" >StudentInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentLedger.html" data-type="entity-link" >StudentLedger</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentLoginInfo.html" data-type="entity-link" >StudentLoginInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentMarkDetail.html" data-type="entity-link" >StudentMarkDetail</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentMarkInput.html" data-type="entity-link" >StudentMarkInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentMarksheetResolver.html" data-type="entity-link" >StudentMarksheetResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentNotesResolver.html" data-type="entity-link" >StudentNotesResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentProfileResolver.html" data-type="entity-link" >StudentProfileResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentRanking.html" data-type="entity-link" >StudentRanking</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentReportCard.html" data-type="entity-link" >StudentReportCard</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentScholarship.html" data-type="entity-link" >StudentScholarship</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentSearchResponse.html" data-type="entity-link" >StudentSearchResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentServices.html" data-type="entity-link" >StudentServices</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentServicesProfile.html" data-type="entity-link" >StudentServicesProfile</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentsResolver.html" data-type="entity-link" >StudentsResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentSummary.html" data-type="entity-link" >StudentSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentSummaryDto.html" data-type="entity-link" >StudentSummaryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentSummaryResolver.html" data-type="entity-link" >StudentSummaryResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentTestResolver.html" data-type="entity-link" >StudentTestResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentWithParentsType.html" data-type="entity-link" >StudentWithParentsType</a>
                            </li>
                            <li class="link">
                                <a href="classes/StudentWithTenant.html" data-type="entity-link" >StudentWithTenant</a>
                            </li>
                            <li class="link">
                                <a href="classes/Subject.html" data-type="entity-link" >Subject</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectByCategoryDto.html" data-type="entity-link" >SubjectByCategoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectDto.html" data-type="entity-link" >SubjectDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectDto-1.html" data-type="entity-link" >SubjectDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectInfo.html" data-type="entity-link" >SubjectInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectOutput.html" data-type="entity-link" >SubjectOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectPerformance.html" data-type="entity-link" >SubjectPerformance</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectPerformanceDto.html" data-type="entity-link" >SubjectPerformanceDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectReadResponseGQL.html" data-type="entity-link" >SubjectReadResponseGQL</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubjectResponse.html" data-type="entity-link" >SubjectResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SuperAdminAuthResolver.html" data-type="entity-link" >SuperAdminAuthResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/SuperAdminAuthResponse.html" data-type="entity-link" >SuperAdminAuthResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SuperAdminSignupInput.html" data-type="entity-link" >SuperAdminSignupInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/Teacher.html" data-type="entity-link" >Teacher</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherConflict.html" data-type="entity-link" >TeacherConflict</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherDto.html" data-type="entity-link" >TeacherDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherLoadSummary.html" data-type="entity-link" >TeacherLoadSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherNote.html" data-type="entity-link" >TeacherNote</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherNotesResolver.html" data-type="entity-link" >TeacherNotesResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherOutput.html" data-type="entity-link" >TeacherOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherParentsResolver.html" data-type="entity-link" >TeacherParentsResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherProfile.html" data-type="entity-link" >TeacherProfile</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherResolver.html" data-type="entity-link" >TeacherResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherStatsOutput.html" data-type="entity-link" >TeacherStatsOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherStudentDto.html" data-type="entity-link" >TeacherStudentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherStudentGradeDto.html" data-type="entity-link" >TeacherStudentGradeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherStudentGradeDto-1.html" data-type="entity-link" >TeacherStudentGradeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherStudentResponse.html" data-type="entity-link" >TeacherStudentResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherStudentsResolver.html" data-type="entity-link" >TeacherStudentsResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherStudentStreamDto.html" data-type="entity-link" >TeacherStudentStreamDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherStudentStreamDto-1.html" data-type="entity-link" >TeacherStudentStreamDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherType.html" data-type="entity-link" >TeacherType</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeacherWeeklySummary.html" data-type="entity-link" >TeacherWeeklySummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/Tenant.html" data-type="entity-link" >Tenant</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantError.html" data-type="entity-link" >TenantError</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantFeeAssignmentSummary.html" data-type="entity-link" >TenantFeeAssignmentSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantGradeLevel.html" data-type="entity-link" >TenantGradeLevel</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantGradeLevelOutput.html" data-type="entity-link" >TenantGradeLevelOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantGradeLevelResolver.html" data-type="entity-link" >TenantGradeLevelResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantInfo.html" data-type="entity-link" >TenantInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantNotFoundException.html" data-type="entity-link" >TenantNotFoundException</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantReadDto.html" data-type="entity-link" >TenantReadDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantReadResponseGQL.html" data-type="entity-link" >TenantReadResponseGQL</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantResourceNotFoundException.html" data-type="entity-link" >TenantResourceNotFoundException</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantResponse.html" data-type="entity-link" >TenantResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantSignUPResponse.html" data-type="entity-link" >TenantSignUPResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantStream.html" data-type="entity-link" >TenantStream</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantStreamResolver.html" data-type="entity-link" >TenantStreamResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantSubject.html" data-type="entity-link" >TenantSubject</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantSubjectOutput.html" data-type="entity-link" >TenantSubjectOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantSubjectResolver.html" data-type="entity-link" >TenantSubjectResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TenantUserSummary.html" data-type="entity-link" >TenantUserSummary</a>
                            </li>
                            <li class="link">
                                <a href="classes/Term.html" data-type="entity-link" >Term</a>
                            </li>
                            <li class="link">
                                <a href="classes/TermAssessmentWithStudentsDto.html" data-type="entity-link" >TermAssessmentWithStudentsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TermPerformance.html" data-type="entity-link" >TermPerformance</a>
                            </li>
                            <li class="link">
                                <a href="classes/TermResolver.html" data-type="entity-link" >TermResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/Test.html" data-type="entity-link" >Test</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestCountsOutput.html" data-type="entity-link" >TestCountsOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestOutput.html" data-type="entity-link" >TestOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestResolver.html" data-type="entity-link" >TestResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimeSlot.html" data-type="entity-link" >TimeSlot</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimetableBreak.html" data-type="entity-link" >TimetableBreak</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimetableCell.html" data-type="entity-link" >TimetableCell</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimetableData.html" data-type="entity-link" >TimetableData</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimetableEntry.html" data-type="entity-link" >TimetableEntry</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimetableResolver.html" data-type="entity-link" >TimetableResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimetableResponse.html" data-type="entity-link" >TimetableResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TokenPair.html" data-type="entity-link" >TokenPair</a>
                            </li>
                            <li class="link">
                                <a href="classes/TokenResponse.html" data-type="entity-link" >TokenResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TokensOutput.html" data-type="entity-link" >TokensOutput</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransportAssignment.html" data-type="entity-link" >TransportAssignment</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransportResolver.html" data-type="entity-link" >TransportResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransportRoute.html" data-type="entity-link" >TransportRoute</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransportRoute-1.html" data-type="entity-link" >TransportRoute</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransportService.html" data-type="entity-link" >TransportService</a>
                            </li>
                            <li class="link">
                                <a href="classes/TypingIndicator.html" data-type="entity-link" >TypingIndicator</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnassignClassTeacherInput.html" data-type="entity-link" >UnassignClassTeacherInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateAcademicYearInput.html" data-type="entity-link" >UpdateAcademicYearInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateFeeAssignmentInput.html" data-type="entity-link" >UpdateFeeAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateFeeBucketInput.html" data-type="entity-link" >UpdateFeeBucketInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateFeeStructureInput.html" data-type="entity-link" >UpdateFeeStructureInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateFeeStructureItemInput.html" data-type="entity-link" >UpdateFeeStructureItemInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateHostelAssignmentInput.html" data-type="entity-link" >UpdateHostelAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateHostelInput.html" data-type="entity-link" >UpdateHostelInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePaymentInput.html" data-type="entity-link" >UpdatePaymentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateScholarshipInput.html" data-type="entity-link" >UpdateScholarshipInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateSchoolConfigurationInput.html" data-type="entity-link" >UpdateSchoolConfigurationInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateStaffInput.html" data-type="entity-link" >UpdateStaffInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateStreamInput.html" data-type="entity-link" >UpdateStreamInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateStudentScholarshipInput.html" data-type="entity-link" >UpdateStudentScholarshipInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTeacherNoteDto.html" data-type="entity-link" >UpdateTeacherNoteDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTenantStreamInput.html" data-type="entity-link" >UpdateTenantStreamInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTenantSubjectInput.html" data-type="entity-link" >UpdateTenantSubjectInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTermInput.html" data-type="entity-link" >UpdateTermInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTestInput.html" data-type="entity-link" >UpdateTestInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTimeSlotInput.html" data-type="entity-link" >UpdateTimeSlotInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTimeSlotInput-1.html" data-type="entity-link" >UpdateTimeSlotInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTimeSlotInput-2.html" data-type="entity-link" >UpdateTimeSlotInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTimetableBreakInput.html" data-type="entity-link" >UpdateTimetableBreakInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTransportAssignmentInput.html" data-type="entity-link" >UpdateTransportAssignmentInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateTransportRouteInput.html" data-type="entity-link" >UpdateTransportRouteInput</a>
                            </li>
                            <li class="link">
                                <a href="classes/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserAlreadyExistException.html" data-type="entity-link" >UserAlreadyExistException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserAlreadyExistsException.html" data-type="entity-link" >UserAlreadyExistsException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserInfo.html" data-type="entity-link" >UserInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserInvitation.html" data-type="entity-link" >UserInvitation</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserNotInTenantException.html" data-type="entity-link" >UserNotInTenantException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserResponse.html" data-type="entity-link" >UserResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserSchoolSelectionDto.html" data-type="entity-link" >UserSchoolSelectionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserSelectionDto.html" data-type="entity-link" >UserSelectionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UsersResolver.html" data-type="entity-link" >UsersResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserSubjectSelectionDto.html" data-type="entity-link" >UserSubjectSelectionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserTenantMembership.html" data-type="entity-link" >UserTenantMembership</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AssessmentProviders.html" data-type="entity-link" >AssessmentProviders</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CacheInterceptor.html" data-type="entity-link" >CacheInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CustomLogger.html" data-type="entity-link" >CustomLogger</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DataResponseInterceptor.html" data-type="entity-link" >DataResponseInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FindTestQueryProvider.html" data-type="entity-link" >FindTestQueryProvider</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GqlAuthGuard.html" data-type="entity-link" >GqlAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HashingProvider.html" data-type="entity-link" >HashingProvider</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocalStorageService.html" data-type="entity-link" >LocalStorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SeedingService.html" data-type="entity-link" >SeedingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorageService.html" data-type="entity-link" >StorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TenantMiddleware.html" data-type="entity-link" >TenantMiddleware</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UsersCreateStudentProvider.html" data-type="entity-link" >UsersCreateStudentProvider</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AccessTokenGuard.html" data-type="entity-link" >AccessTokenGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/AccessTokenGuard-1.html" data-type="entity-link" >AccessTokenGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/AuthDiagnosticGuard.html" data-type="entity-link" >AuthDiagnosticGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/AuthenticationGuard.html" data-type="entity-link" >AuthenticationGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/AuthenticationGuard-1.html" data-type="entity-link" >AuthenticationGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/RoleGuard.html" data-type="entity-link" >RoleGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/SchoolConfigGuard.html" data-type="entity-link" >SchoolConfigGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/SchoolConfiguredGuard.html" data-type="entity-link" >SchoolConfiguredGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/SuperAdminGuard.html" data-type="entity-link" >SuperAdminGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/TenantAccessGuard.html" data-type="entity-link" >TenantAccessGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/TenantAccessGuard-1.html" data-type="entity-link" >TenantAccessGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/TenantAccessGuard-2.html" data-type="entity-link" >TenantAccessGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/TenantRoleGuard.html" data-type="entity-link" >TenantRoleGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AcceptInvitationResult.html" data-type="entity-link" >AcceptInvitationResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ActiveUserData.html" data-type="entity-link" >ActiveUserData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Assessment.html" data-type="entity-link" >Assessment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BackblazeConfig.html" data-type="entity-link" >BackblazeConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BaseEmailData.html" data-type="entity-link" >BaseEmailData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateMarkInput.html" data-type="entity-link" >CreateMarkInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateTenantGradeLevelDto.html" data-type="entity-link" >CreateTenantGradeLevelDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateTenantStreamDto.html" data-type="entity-link" >CreateTenantStreamDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateTenantSubjectDto.html" data-type="entity-link" >CreateTenantSubjectDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EmailTemplate.html" data-type="entity-link" >EmailTemplate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EmergencyContact.html" data-type="entity-link" >EmergencyContact</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileUploadDto.html" data-type="entity-link" >FileUploadDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileUploadDto-1.html" data-type="entity-link" >FileUploadDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileUploadDto-2.html" data-type="entity-link" >FileUploadDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileUploadResult.html" data-type="entity-link" >FileUploadResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileUploadResult-1.html" data-type="entity-link" >FileUploadResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileUploadResult-2.html" data-type="entity-link" >FileUploadResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileUploadResult-3.html" data-type="entity-link" >FileUploadResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Mark.html" data-type="entity-link" >Mark</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MarksheetData.html" data-type="entity-link" >MarksheetData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MarksheetEntry.html" data-type="entity-link" >MarksheetEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParentInvitationData.html" data-type="entity-link" >ParentInvitationData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PasswordResetData.html" data-type="entity-link" >PasswordResetData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ScaleConfig.html" data-type="entity-link" >ScaleConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolFinancialSummary.html" data-type="entity-link" >SchoolFinancialSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StaffInvitationData.html" data-type="entity-link" >StaffInvitationData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Student.html" data-type="entity-link" >Student</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TeacherInvitationData.html" data-type="entity-link" >TeacherInvitationData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateMarkInput.html" data-type="entity-link" >UpdateMarkInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateTenantSubjectDto.html" data-type="entity-link" >UpdateTenantSubjectDto</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});