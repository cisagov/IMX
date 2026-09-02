import { NgModule, inject, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// Reactive Forms
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// MatDialog
import { MatDialogModule } from '@angular/material/dialog';

import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// App Components
import { HomeComponent } from './home/home.component';
import { BundleComponent } from './bundle/bundle.component';
import { DynamicFormQuestionComponent } from './dynamic-form-component/app-question/app-question.component';
import { DynamicFormComponent } from './dynamic-form-component/dynamic-form/dynamic-form.component';
import { AddComponentComponent } from './add-component/add-component.component';
import { CustomObjectComponent } from './custom-objects/custom-object.component';
import { GranularMarkingsComponent } from './granular-markings/granular-markings.component';
import { ExtensionsComponent } from './extensions/extensions.component';
import { ToplevelPropertyComponent } from './toplevel-property/toplevel-property.component';
import { IncidentCoreExtensionComponent } from './incident-core-extension/incident-core-extension.component';
import { IncidentCoreObjectComponent } from './incident-core-extension/incident-core-object.component';
import { MalwareCorpusComponent } from './malware-behaviour-extension/malware-corpus.component';
import { MalwareBehaviourObjectComponent } from './malware-behaviour-extension/malware-behaviour-object.component';
import { NoteDialogComponent } from './add-component/note-dialog-component/note-dialog-component.component';
import { DeleteDialogComponent } from './add-component/delete-dialog-component/delete-dialog-component.component';
import { RemoveObjectComponent } from './remove-object/remove-object.component';

// NGX Bootstrap
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ImxHttpInterceptor } from './auth/imx.http.interceptor';

import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';

// Bundle Type Filter
import { BundleTypeFilter } from './bundle-type-filter.pipe';
import { ExternalReferencesComponent } from './external-references/external-references.component';
import { StringArrayComponent } from './string-array/string-array.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LoginComponent } from './auth/login/login.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { ReportingComponent } from './reporting/reporting.component';
import { QueryStixComponent } from './query-stix/query-stix.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ContentsComponent } from './contents/contents.component';
import { MessagesComponent } from './query-stix/messages/messages.component';
import { AdditionalFiltersComponent } from './query-stix/additional-filters/additional-filters.component';
import { StixViewerComponent } from './stix-viewer/stix-viewer.component';
import { ContentsDialogComponent } from './dialogs/contents-dialog/contents-dialog.component';
import { CustomizeColumnsComponent } from './dialogs/customize-columns/customize-columns.component';
import { RelationshipDialogComponent } from './query-stix/relationship-dialog/relationship-dialog/relationship-dialog.component';

// Admin
import { AdminMainComponent } from './admin-main/admin-main.component';
import { AdminCollectionComponent } from './admin-collection/admin-collection.component';
import { AdminUserComponent } from './admin-user/admin-user.component';
import { MessageDialogComponent } from './dialogs/message-dialog/message-dialog.component';
import { AdminApiRootComponent } from './admin-api-root/admin-api-root.component';
import { AdminRwComponent } from './dialogs/admin-rw/admin-rw.component';
import { GuidedComponent } from './guided/guided.component';
import { GuidedMenuComponent } from './guided-menu/guided-menu.component';
import { HelpDialogComponent } from './dialogs/help-dialog/help-dialog.component';
import { TaxiiSettingsComponent } from './taxii-settings/taxii-settings.component';
import { EnabledTaxiiComponent } from './taxii-settings/enabled-taxii/enabled-taxii.component';
import { DisabledTaxiiComponent } from './taxii-settings/disabled-taxii/disabled-taxii.component';
import { TaxiiSettingsDialogComponent } from './taxii-settings/taxii-settings-dialog/taxii-settings-dialog.component';

import { UiSwitchModule } from 'ngx-ui-switch';

// Env
import { EnvService, initializeApp } from './env-service/env.service';

import { Analyst1DialogComponent } from './dialogs/analyst1-dialog/analyst1-dialog.component';
import { AcsDialogComponent } from './dialogs/acs-dialog/acs-dialog.component';
import { ConfigComponent } from './config/config.component';
import { GranularMarkingsDialogComponent } from './granular-markings/granular-markings-dialog/granular-markings-dialog.component';
import { ExternalReferencesDialogComponent } from './external-references/external-references-dialog/external-references-dialog.component';
import { StringArrayDialogComponent } from './string-array/string-array-dialog/string-array-dialog.component';
import { ExtensionsDialogComponent } from './extensions/extensions-dialog/extensions-dialog.component';
import { AdminRoleComponent } from './admin-role/admin-role.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { UserDataComponent } from './user-data/user-data.component';
import { SavedBundlesTableComponent } from './saved-bundles/saved-bundles-table/saved-bundles-table.component';
import { SavedBundlesDialogComponent } from './saved-bundles/saved-bundles-dialog/saved-bundles-dialog.component';
import { ReportTypeComponent } from './guided-report/report-type/report-type.component';
import { ThreatActorComponent } from './guided-report/threat-actor/threat-actor.component';
import { ObjectAdditionComponent } from './guided-report/object-addition/object-addition.component';
import { AddIndicatorToBundleComponent } from './guided-components/add-indicator-to-bundle/add-indicator-to-bundle.component';
import { WhoIndividualComponent } from './guided-components/who-individual/who-individual.component';
import { HowTtpComponent } from './guided-components/how-ttp/how-ttp.component';
import { HowPatternBuilderComponent } from './guided-components/how-pattern-builder/how-pattern-builder.component';
import { HowObservableComponent } from './guided-components/how-observable/how-observable.component';
import { PatternBuilderComponent } from './dialogs/pattern-builder/pattern-builder.component';
import { MultipartDialogComponent } from './dialogs/multipart-dialog/multipart-dialog.component';
import { IdentityExtensionDialogComponent } from './dialogs/identity-extension-dialog/identity-extension-dialog.component';
import { WindowsValueDialogComponent } from './dialogs/windows-value-dialog/windows-value-dialog.component';
import { HowEventDetectionComponent } from './guided-components/how-event-detection/how-event-detection.component';
import { WhenSightingComponent } from './guided-components/when-sighting/when-sighting.component';
import { HowEventComponent } from './guided-components/how-event/how-event.component';
import { HowCweComponent } from './guided-components/how-cwe/how-cwe.component';
import { WhyCommonBehaviorsComponent } from './guided-components/why-common-behaviors/why-common-behaviors.component';
import { WhyAttackerComponent } from './guided-components/why-attacker/why-attacker.component';
import { WhatImpactComponent } from './guided-components/what-impact/what-impact.component';
import { CopyPasteDialogComponent } from './dialogs/copy-paste-dialog/copy-paste-dialog.component';
import { VtDialogComponent } from './dialogs/vt-dialog/vt-dialog.component';
import { ReportAssessmentComponent } from './guided-components/report-assessment/report-assessment.component';
import { GuidedCartComponent } from './guided-components/guided-cart/guided-cart.component';
import { WhenEventComponent } from './guided-components/when-event/when-event.component';
import { WhereLocationComponent } from './guided-components/where-location/where-location.component';
import { GuidedCartModalComponent } from './guided-components/guided-cart/guided-cart-modal/guided-cart-modal.component';
import { TotalGuidedCartComponent } from './guided-components/total-guided-cart/total-guided-cart.component';
import { ObjectsViewerComponent } from './objects-viewer/objects-viewer.component';
import { CustomTaxiiComponent } from './config/custom-taxii/custom-taxii.component';
import { AlertTabComponent } from './user-data/alert-tab/alert-tab.component';
import { AlertSubscriptionsComponent } from './user-data/alert-tab/alert-subscriptions/alert-subscriptions.component';
import { AlertHistoryComponent } from './user-data/alert-tab/alert-history/alert-history.component';
import { AlertSubDialogueComponent } from './user-data/alert-tab/alert-subscriptions/alert-sub-dialogue/alert-sub-dialogue.component';

//Incident Core Extension
import { AttackerActivityDialogComponent } from './incident-core-extension/attacker-activity/attacker-activity-dialog.component';
import { ObjectEntryDialogComponent } from './incident-core-extension/object-entry/object-entry-dialog.component';
import { ChangedObjectDialogComponent } from './incident-core-extension/changed-object/changed-object-dialog.component';
import { DetectionRuleDialogComponent } from './malware-behaviour-extension/detection-rule/detection-rule-dialog.component';
import { SnippetDialogComponent } from './malware-behaviour-extension/snippet/snippet-dialog.component';
import { ImpactExtensionsDialogComponent } from './incident-core-extension/impact-extensions/impact-extensions-dialog.component';

//Dashboard
import { DashboardComponent } from './dashboard/dashboard.component';
import { SubmissionComponentComponent } from './dashboard/dashboard-components/submission-component/submission-component.component';
import { provideCharts, withDefaultRegisterables, BaseChartDirective } from 'ng2-charts';
import { BundleComponentComponent } from './dashboard/dashboard-components/bundle-component/bundle-component.component';
import { ObjectsModalComponent } from './bundle/objects-modal/objects-modal.component';
import { JsonModalComponent } from './bundle/json-modal/json-modal.component';
import { MonacoEditorModule, provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { ReportModalComponent } from './bundle/report-modal/report-modal.component';
import { VisualizerModalComponent } from './bundle/visualizer-modal/visualizer-modal.component';
import { IdentityComponent } from './identity/identity.component';
import { UserCertComponent } from './user-cert/user-cert.component';
import { TaxiiSyncComponent } from './taxii-sync/taxii-sync.component';

//MISP
import { MispSubmissionComponent } from './misp-submission/misp-submission.component';
import { JsonViewComponent } from './misp-submission/json-view/json-view.component';
import { AdminMarkingGroupComponent } from './admin-marking-group/admin-marking-group.component';
import { MispDialogComponent } from './misp-dialog/misp-dialog.component';
import { TextFieldModule } from '@angular/cdk/text-field';
import { AdminUsersPageComponent } from './admin-users-page/admin-users-page.component';
import { MispResultComponent } from './misp-dialog/misp-result/misp-result.component';
import { LoadingModalComponent } from './loading-modal/loading-modal.component';
import { TaxiiSearchComponent } from './taxii-search/taxii-search.component';
import { TaxiiQueryComponent } from './taxii-search/taxii-query/taxii-query.component';
import { TaxiiInfoComponent } from './taxii-search/taxii-info/taxii-info.component';
import { TaxiiSubmissionsComponent } from './taxii-search/taxii-submissions/taxii-submissions.component';
import { TaxiiSearchBarComponent } from './taxii-search/taxii-search-bar/taxii-search-bar.component';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        BundleComponent,
        ObjectsModalComponent,
        JsonModalComponent,
        ReportModalComponent,
        VisualizerModalComponent,
        DynamicFormQuestionComponent,
        DynamicFormComponent,
        AddComponentComponent,
        CustomObjectComponent,
        GranularMarkingsComponent,
        ExtensionsComponent,
        ToplevelPropertyComponent,
        IncidentCoreExtensionComponent,
        IncidentCoreObjectComponent,
        MalwareCorpusComponent,
        MalwareBehaviourObjectComponent,
        IdentityComponent,
        NoteDialogComponent,
        DeleteDialogComponent,
        BundleTypeFilter,
        ExternalReferencesComponent,
        StringArrayComponent,
        LoginComponent,
        SignUpComponent,
        QueryStixComponent,
        ReportingComponent,
        ContentsComponent,
        MessagesComponent,
        AdditionalFiltersComponent,
        StixViewerComponent,
        ContentsDialogComponent,
        CustomizeColumnsComponent,
        AdminMainComponent,
        AdminCollectionComponent,
        AdminUserComponent,
        MessageDialogComponent,
        AdminApiRootComponent,
        AdminRwComponent,
        RelationshipDialogComponent,
        GuidedComponent,
        GuidedMenuComponent,
        HelpDialogComponent,
        Analyst1DialogComponent,
        AcsDialogComponent,
        ConfigComponent,
        GranularMarkingsDialogComponent,
        ExternalReferencesDialogComponent,
        StringArrayDialogComponent,
        ExtensionsDialogComponent,
        AttackerActivityDialogComponent,
        ObjectEntryDialogComponent,
        ChangedObjectDialogComponent,
        DetectionRuleDialogComponent,
        SnippetDialogComponent,
        ImpactExtensionsDialogComponent,
        AdminRoleComponent,
        UserDataComponent,
        SavedBundlesTableComponent,
        SavedBundlesDialogComponent,
        ReportTypeComponent,
        ThreatActorComponent,
        ObjectAdditionComponent,
        AddIndicatorToBundleComponent,
        WhoIndividualComponent,
        HowTtpComponent,
        HowPatternBuilderComponent,
        HowObservableComponent,
        PatternBuilderComponent,
        MultipartDialogComponent,
        IdentityExtensionDialogComponent,
        WindowsValueDialogComponent,
        HowEventDetectionComponent,
        WhenSightingComponent,
        HowEventComponent,
        HowCweComponent,
        CopyPasteDialogComponent,
        ReportAssessmentComponent,
        WhyCommonBehaviorsComponent,
        WhyAttackerComponent,
        WhatImpactComponent,
        CopyPasteDialogComponent,
        GuidedCartComponent,
        WhenEventComponent,
        WhereLocationComponent,
        GuidedCartModalComponent,
        TotalGuidedCartComponent,
        ObjectsViewerComponent,
        CustomTaxiiComponent,
        AlertSubscriptionsComponent,
        AlertTabComponent,
        AlertHistoryComponent,
        AlertSubDialogueComponent,
        DashboardComponent,
        SubmissionComponentComponent,
        BundleComponentComponent,
        TaxiiSettingsComponent,
        EnabledTaxiiComponent,
        DisabledTaxiiComponent,
        TaxiiSettingsDialogComponent,
        UserCertComponent,
        MispSubmissionComponent,
        JsonViewComponent,
        TaxiiSyncComponent,
        AdminMarkingGroupComponent,
        AdminUsersPageComponent,
        MispDialogComponent,
        MispResultComponent,
        RemoveObjectComponent,
        TaxiiSearchComponent,
        TaxiiQueryComponent,
        TaxiiInfoComponent,
        TaxiiSubmissionsComponent,
        TaxiiSearchBarComponent,
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgbModule,
        ReactiveFormsModule,
        MatDialogModule,
        BrowserAnimationsModule,
        BsDropdownModule.forRoot(),
        FormsModule,
        AccordionModule.forRoot(),
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
        FontAwesomeModule,
        UiSwitchModule,
        NgxPaginationModule,
        MatAutocompleteModule,
        BaseChartDirective,
        MonacoEditorModule.forRoot(),
        TextFieldModule,
        VtDialogComponent,
        LoadingModalComponent,
    ],
    providers: [
        provideAppInitializer(() => {
            const initializerFn = initializeApp(inject(EnvService));
            return initializerFn();
        }),
        provideHttpClient(withInterceptorsFromDi()),
        { provide: HTTP_INTERCEPTORS, useClass: ImxHttpInterceptor, multi: true },
        provideCharts(withDefaultRegisterables()),
        provideMonacoEditor({ baseUrl: window.location.origin + '/assets/monaco/min/vs' }),
    ],
})
export class AppModule {}
