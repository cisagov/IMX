import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddComponentComponent } from './add-component/add-component.component';
import { AuthGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { BundleComponent } from './bundle/bundle.component';
import { QueryStixComponent } from './query-stix/query-stix.component';
import { ReportingComponent } from './reporting/reporting.component';
import { StixViewerComponent } from './stix-viewer/stix-viewer.component';
import { CustomObjectComponent } from './custom-objects/custom-object.component';
import { IncidentCoreExtensionComponent } from './incident-core-extension/incident-core-extension.component';
import { IncidentCoreObjectComponent } from './incident-core-extension/incident-core-object.component';
import { MalwareBehaviourObjectComponent } from './malware-behaviour-extension/malware-behaviour-object.component';
import { AdminMainComponent } from './admin-main/admin-main.component';
import { GuidedComponent } from './guided/guided.component';
import { ConfigComponent } from './config/config.component';
import { UserDataComponent } from './user-data/user-data.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SigninCallbackComponent } from './auth/oidc-service/signin-callback.component';
import { TaxiiSearchComponent } from './taxii-search/taxii-search.component';

const auth: any = AuthGuard;

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: DashboardComponent, canActivate: [auth] },
    { path: 'bundle', component: BundleComponent, canActivate: [auth] },
    { path: 'add-component/:component-id', component: AddComponentComponent, canActivate: [auth] },
    { path: 'custom-object', component: CustomObjectComponent, canActivate: [auth] },
    { path: 'incident-core', component: IncidentCoreExtensionComponent, canActivate: [auth] },
    { path: 'incident-obj', component: IncidentCoreObjectComponent, canActivate: [auth] },
    { path: 'malware-obj', component: MalwareBehaviourObjectComponent, canActivate: [auth] },
    { path: 'query-stix', component: QueryStixComponent, canActivate: [auth] },
    { path: 'taxii-search', component: TaxiiSearchComponent, canActivate: [auth] },
    { path: 'reporting', component: ReportingComponent, canActivate: [auth] },
    { path: 'login', component: LoginComponent },
    { path: 'sign-up', component: SignUpComponent },
    { path: 'stix-viewer', component: StixViewerComponent },
    { path: '404', redirectTo: '/home', pathMatch: 'full' },
    { path: 'admin-main', component: AdminMainComponent, pathMatch: 'full', canActivate: [auth], data: { path: '/admin-main' } },
    { path: 'config', component: ConfigComponent, pathMatch: 'full', canActivate: [auth] },
    { path: 'my-profile', component: UserDataComponent, pathMatch: 'full', canActivate: [auth] },
    { path: 'guided', component: GuidedComponent, pathMatch: 'full', canActivate: [auth] },
    { path: 'signin-callback', component: SigninCallbackComponent },
    { path: '**', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
